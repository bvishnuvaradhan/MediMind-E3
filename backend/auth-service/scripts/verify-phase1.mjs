import mongoose from 'mongoose';
import authApp from '../src/app.js';
import gatewayApp from '../../api-gateway/src/app.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/password.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medimind_auth';

async function runLiveVerification() {
  console.log('================================================================');
  console.log('PHASE 1 LIVE INTEGRATION VERIFICATION: GATEWAY + AUTH SERVICE');
  console.log('================================================================');

  // 1. Connect to MongoDB
  console.log('\n1. Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('   Connected to', MONGO_URI);

  // 2. Seed Test User
  console.log('\n2. Seeding Test User...');
  const testEmail = 'dr.rahul.mehta@medimind.org';
  const testPassword = 'DoctorPassword@2026';
  await User.deleteOne({ email: testEmail });

  const passwordHash = await hashPassword(testPassword);
  const testRefId = new mongoose.Types.ObjectId();

  const user = await User.create({
    email: testEmail,
    password_hash: passwordHash,
    role: 'DOCTOR',
    account_type: 'DOCTOR_ACCOUNT',
    reference_id: testRefId,
    status: 'ACTIVE',
  });
  console.log('   Created User:', user.email, 'Role:', user.role, 'ID:', user._id.toString());

  // 3. Start Auth Service on port 5001
  console.log('\n3. Starting Auth Service on port 5001...');
  const authServer = authApp.listen(5001);
  await new Promise((r) => setTimeout(r, 500));
  console.log('   Auth Service running on http://localhost:5001');

  // 4. Start API Gateway on port 5000
  console.log('\n4. Starting API Gateway on port 5000...');
  const gatewayServer = gatewayApp.listen(5000);
  await new Promise((r) => setTimeout(r, 500));
  console.log('   API Gateway running on http://localhost:5000');

  try {
    // 5. Test Gateway Health
    console.log('\n5. Checking Gateway Health (GET http://localhost:5000/health)...');
    const gwHealthRes = await fetch('http://localhost:5000/health');
    const gwHealth = await gwHealthRes.json();
    console.log('   Status:', gwHealthRes.status, gwHealth.message);
    if (!gwHealth.success || gwHealth.data.status !== 'UP') {
      throw new Error('Gateway health check failed');
    }
    console.log('   ✓ Gateway Health Verified. Request ID:', gwHealth.data.requestId);

    // 6. Test Auth Service Health directly
    console.log('\n6. Checking Auth Service Health (GET http://localhost:5001/health)...');
    const authHealthRes = await fetch('http://localhost:5001/health');
    const authHealth = await authHealthRes.json();
    console.log('   Status:', authHealthRes.status, authHealth.message, 'Database:', authHealth.data.database);
    if (!authHealth.success || authHealth.data.database !== 'connected') {
      throw new Error('Auth Service health check failed');
    }
    console.log('   ✓ Auth Service Health & DB Connection Verified');

    // 7. Login through Gateway
    console.log('\n7. Authenticating via Gateway (POST http://localhost:5000/api/auth/login)...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    console.log('   Login Status:', loginRes.status, loginData.message);
    if (!loginData.success || !loginData.data.token) {
      throw new Error('Login through Gateway failed');
    }
    const token = loginData.data.token;
    console.log('   ✓ Login Successful! Token received:', token.slice(0, 30) + '...');
    console.log('   User profile:', loginData.data.user);

    // 8. Protected GET /api/auth/me through Gateway
    console.log('\n8. Accessing Protected Route (GET http://localhost:5000/api/auth/me)...');
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-user-id': 'spoofed_id_attempt', // Testing anti-spoofing
      },
    });
    const meData = await meRes.json();
    console.log('   Status:', meRes.status);
    if (!meData.success || meData.data.userId !== user._id.toString()) {
      throw new Error('Protected /me call failed or returned spoofed user');
    }
    console.log('   ✓ Identity Verified via Gateway! Authenticated userId:', meData.data.userId);
    console.log('   ✓ Anti-spoofing verified: spoofed_id_attempt was cleanly stripped and replaced.');

    // 9. Protected route without token through Gateway
    console.log('\n9. Testing Protected Route Without Token...');
    const noTokenRes = await fetch('http://localhost:5000/api/auth/me');
    const noTokenData = await noTokenRes.json();
    console.log('   Status:', noTokenRes.status, noTokenData.message);
    if (noTokenRes.status !== 401) {
      throw new Error('Expected 401 for unauthenticated request');
    }
    console.log('   ✓ 401 Unauthorized correctly enforced by Gateway');

    // 10. Logout through Gateway
    console.log('\n10. Testing Logout (POST http://localhost:5000/api/auth/logout)...');
    const logoutRes = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const logoutData = await logoutRes.json();
    console.log('   Status:', logoutRes.status, logoutData.message);
    if (!logoutData.success) {
      throw new Error('Logout failed');
    }
    console.log('   ✓ Logout Successful');

    // 11. Unknown Route through Gateway
    console.log('\n11. Testing Unknown Route (GET http://localhost:5000/api/unknown)...');
    const unknownRes = await fetch('http://localhost:5000/api/unknown-service-path');
    const unknownData = await unknownRes.json();
    console.log('   Status:', unknownRes.status, unknownData.message);
    if (unknownRes.status !== 404) {
      throw new Error('Expected 404 for unknown route');
    }
    console.log('   ✓ 404 Not Found correctly returned by Gateway');

    console.log('\n================================================================');
    console.log('ALL PHASE 1 LIVE VERIFICATION CHECKS PASSED (100% GREEN)');
    console.log('================================================================\n');
  } finally {
    // Cleanup
    await User.deleteOne({ email: testEmail });
    await mongoose.connection.close();
    authServer.close();
    gatewayServer.close();
  }
}

runLiveVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
