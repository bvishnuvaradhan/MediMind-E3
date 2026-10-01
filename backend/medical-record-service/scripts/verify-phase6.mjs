import '../../load-env.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { hashPassword } from '../../auth-service/src/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, '../../auth-service');
const FAMILY_DIR = path.resolve(__dirname, '../../family-service');
const HOSPITAL_DIR = path.resolve(__dirname, '../../hospital-service');
const DOCTOR_DIR = path.resolve(__dirname, '../../doctor-service');
const APPOINTMENT_DIR = path.resolve(__dirname, '../../appointment-service');
const RECORD_DIR = path.resolve(__dirname, '../');
const GATEWAY_DIR = path.resolve(__dirname, '../../api-gateway');

function startProcess(name, dir, port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['server.js'], {
      cwd: dir,
      env: { ...process.env, PORT: port.toString() },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error(`Timeout waiting for ${name} on port ${port}`));
      }
    }, 15000);

    proc.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Running on port') || msg.includes('API Gateway running')) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          resolve(proc);
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const err = data.toString();
      if (!started && err.includes('Error:')) {
        clearTimeout(timeout);
        reject(new Error(`Failed to start ${name}: ${err}`));
      }
    });

    proc.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`${name} exited prematurely with code ${code}`));
      }
    });
  });
}

async function waitForHttp(url, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Service at ${url} not responding`);
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log('PHASE 6 LIVE INTEGRATION VERIFICATION: ALL MICROSERVICES + RECORDS');
  console.log('================================================================');

  let authProc, familyProc, hospitalProc, doctorProc, apptProc, recordProc, gatewayProc;
  let authConn, familyConn, hospitalConn, doctorConn, apptConn, recordConn;

  const timestamp = Date.now();
  const doctorEmail = `dr.records.${timestamp}@medimind.org`;
  const family1Email = `family.records.${timestamp}@medimind.org`;
  const family2Email = `family.alien.${timestamp}@medimind.org`;
  const adminEmail = `admin.records.${timestamp}@medimind.org`;
  const defaultPassword = 'LiveSecurePass!2026';

  let hospitalId, departmentId;
  let doctorId, doctorUserId;
  let family1Id, member1Id, family1UserId;
  let family2Id, member2Id, family2UserId;
  let adminHospitalId, adminUserId;

  let doctorToken, family1Token, family2Token, adminToken;
  let uploadedRecordId, grantedAccessId, consultationId, prescriptionId;

  try {
    console.log('\n1. Starting Microservices (Isolated Node Processes)...');
    authProc = await startProcess('Auth Service', AUTH_DIR, 5001);
    console.log('   ✓ Auth Service running on :5001');

    familyProc = await startProcess('Family Service', FAMILY_DIR, 5002);
    console.log('   ✓ Family Service running on :5002');

    hospitalProc = await startProcess('Hospital Service', HOSPITAL_DIR, 5003);
    console.log('   ✓ Hospital Service running on :5003');

    doctorProc = await startProcess('Doctor Service', DOCTOR_DIR, 5004);
    console.log('   ✓ Doctor Service running on :5004');

    apptProc = await startProcess('Appointment Service', APPOINTMENT_DIR, 5005);
    console.log('   ✓ Appointment Service running on :5005');

    recordProc = await startProcess('Medical Record Service', RECORD_DIR, 5006);
    console.log('   ✓ Medical Record Service running on :5006');

    gatewayProc = await startProcess('API Gateway', GATEWAY_DIR, 5000);
    console.log('   ✓ API Gateway running on :5000');

    console.log('\n2. Verifying Microservices Health...');
    await waitForHttp('http://localhost:5001/health');
    console.log('   ✓ Auth Service healthy');

    await waitForHttp('http://localhost:5002/health');
    console.log('   ✓ Family Service healthy');

    await waitForHttp('http://localhost:5003/health');
    console.log('   ✓ Hospital Service healthy');

    await waitForHttp('http://localhost:5004/health');
    console.log('   ✓ Doctor Service healthy');

    await waitForHttp('http://localhost:5005/health');
    console.log('   ✓ Appointment Service healthy');

    await waitForHttp('http://localhost:5006/health');
    const recH = await (await fetch('http://localhost:5006/health')).json();
    console.log('   ✓ Medical Record Service healthy:', recH.data.status, '| DB:', recH.data.database);

    await waitForHttp('http://localhost:5000/health');
    const gwH = await (await fetch('http://localhost:5000/health')).json();
    console.log('   ✓ API Gateway healthy:', gwH.data.status, '| Request ID:', gwH.data.requestId);

    const gwRecH = await (await fetch('http://localhost:5000/api/records/health')).json();
    console.log('   ✓ Medical Record Service reachable via Gateway:', gwRecH.data.status);

    // Database connections
    const authDbName = process.env.AUTH_DB_NAME || 'medimind_auth';
    const familyDbName = process.env.FAMILY_DB_NAME || 'medimind_family';
    const hospitalDbName = process.env.HOSPITAL_DB_NAME || 'medimind_hospital';
    const doctorDbName = process.env.DOCTOR_DB_NAME || 'medimind_doctor';
    const apptDbName = process.env.APPOINTMENT_DB_NAME || 'medimind_appointment';
    const recordDbName = process.env.RECORD_DB_NAME || 'medimind_records';
    const mongoBase = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

    const connectWithFallback = async (dbName) => {
      try {
        return await mongoose.createConnection(mongoBase, { dbName, serverSelectionTimeoutMS: 2500 }).asPromise();
      } catch (err) {
        if (mongoBase.includes('mongodb+srv') || mongoBase.includes('@')) {
          return await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`, { serverSelectionTimeoutMS: 5000 }).asPromise();
        }
        throw err;
      }
    };

    authConn = await connectWithFallback(authDbName);
    familyConn = await connectWithFallback(familyDbName);
    hospitalConn = await connectWithFallback(hospitalDbName);
    doctorConn = await connectWithFallback(doctorDbName);
    apptConn = await connectWithFallback(apptDbName);
    recordConn = await connectWithFallback(recordDbName);

    console.log('\n3. Seeding Test Entities Across Microservices...');

    // 1. Hospital & Department
    hospitalId = new mongoose.Types.ObjectId();
    departmentId = new mongoose.Types.ObjectId();
    await hospitalConn.collection('hospitals').insertOne({
      _id: hospitalId,
      name: `Apollo Super Specialty ${timestamp}`,
      license_number: `HOSP-REC-${timestamp}`,
      address: { street: '100 Medical Way', city: 'Bangalore', state: 'Karnataka', postal_code: '560001', country: 'India' },
      phone: '+91 9988776655',
      email: `apollo.rec.${timestamp}@medimind.org`,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await hospitalConn.collection('departments').insertOne({
      _id: departmentId,
      hospital_id: hospitalId,
      name: 'Pulmonology',
      description: 'Department of Respiratory & Chest Medicine',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 2. Doctor user & record
    doctorId = new mongoose.Types.ObjectId();
    doctorUserId = new mongoose.Types.ObjectId();

    await authConn.collection('users').insertOne({
      _id: doctorUserId,
      email: doctorEmail,
      password_hash: await hashPassword(defaultPassword),
      role: 'DOCTOR',
      account_type: 'DOCTOR_ACCOUNT',
      reference_id: doctorId,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await doctorConn.collection('doctors').insertOne({
      _id: doctorId,
      user_id: doctorUserId,
      full_name: 'Dr. Aditya Verma',
      email: doctorEmail,
      phone: '+91 9123456780',
      license_number: `DOC-REC-${timestamp}`,
      specialization: 'Pulmonology',
      department_id: departmentId,
      hospital_id: hospitalId,
      experience_years: 12,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 3. Family 1 user & member
    family1Id = new mongoose.Types.ObjectId();
    family1UserId = new mongoose.Types.ObjectId();
    member1Id = new mongoose.Types.ObjectId();
    await familyConn.collection('families').insertOne({
      _id: family1Id,
      name: 'Sharma Family',
      primary_contact_name: 'Rajesh Sharma',
      primary_contact_email: family1Email,
      primary_contact_phone: '+91 9876543210',
      created_by: family1UserId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await familyConn.collection('familymembers').insertOne({
      _id: member1Id,
      family_id: family1Id,
      first_name: 'Aarav',
      last_name: 'Sharma',
      relationship: 'SON',
      date_of_birth: new Date('2015-05-10'),
      gender: 'MALE',
      blood_group: 'O+',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await authConn.collection('users').insertOne({
      _id: family1UserId,
      email: family1Email,
      password_hash: await hashPassword(defaultPassword),
      role: 'FAMILY',
      account_type: 'FAMILY_ACCOUNT',
      reference_id: family1Id,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 4. Family 2 (Alien family for cross-family boundary check)
    family2Id = new mongoose.Types.ObjectId();
    family2UserId = new mongoose.Types.ObjectId();
    member2Id = new mongoose.Types.ObjectId();
    await familyConn.collection('families').insertOne({
      _id: family2Id,
      name: 'Kapoor Family',
      primary_contact_name: 'Sunil Kapoor',
      primary_contact_email: family2Email,
      primary_contact_phone: '+91 9876500000',
      created_by: family2UserId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await familyConn.collection('familymembers').insertOne({
      _id: member2Id,
      family_id: family2Id,
      first_name: 'Rohan',
      last_name: 'Kapoor',
      relationship: 'SON',
      date_of_birth: new Date('2012-08-20'),
      gender: 'MALE',
      blood_group: 'A+',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await authConn.collection('users').insertOne({
      _id: family2UserId,
      email: family2Email,
      password_hash: await hashPassword(defaultPassword),
      role: 'FAMILY',
      account_type: 'FAMILY_ACCOUNT',
      reference_id: family2Id,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 5. Hospital Admin (for administrative boundary check)
    adminHospitalId = hospitalId;
    adminUserId = new mongoose.Types.ObjectId();
    await authConn.collection('users').insertOne({
      _id: adminUserId,
      email: adminEmail,
      password_hash: await hashPassword(defaultPassword),
      role: 'HOSPITAL_ADMIN',
      account_type: 'HOSPITAL_ADMIN_ACCOUNT',
      reference_id: adminHospitalId,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('   ✓ Test data seeded successfully across all databases');

    console.log('\n4. Authenticating Users via API Gateway...');
    // Login Family 1
    const fam1Login = await (await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: family1Email, password: defaultPassword }),
    })).json();
    family1Token = fam1Login.data.token;
    console.log('   ✓ Family 1 logged in');

    // Login Family 2
    const fam2Login = await (await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: family2Email, password: defaultPassword }),
    })).json();
    family2Token = fam2Login.data.token;
    console.log('   ✓ Family 2 logged in');

    // Login Doctor
    const docLogin = await (await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: doctorEmail, password: defaultPassword }),
    })).json();
    doctorToken = docLogin.data.token;
    console.log('   ✓ Doctor logged in');

    // Login Admin
    const adminLogin = await (await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: defaultPassword }),
    })).json();
    adminToken = adminLogin.data.token;
    console.log('   ✓ Hospital Admin logged in');

    console.log('\n5. Booking & Confirming Appointment...');
    const bookRes = await (await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${family1Token}` },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        doctorId: doctorId.toString(),
        hospitalId: hospitalId.toString(),
        departmentId: departmentId.toString(),
        appointmentDate: '2026-10-25',
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Respiratory cough checkup',
      }),
    })).json();
    const appointmentId = bookRes.data.id || bookRes.data._id;
    console.log('   ✓ Appointment booked:', appointmentId);

    await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    console.log('   ✓ Appointment confirmed by Doctor');

    console.log('\n6. CRITICAL RULE VERIFICATION: Doctor Access Without RecordAccess...');
    // Doctor attempts to read member records without RecordAccess
    const blockedRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    console.log(`   Status received: ${blockedRes.status}`);
    if (blockedRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for doctor reading records without RecordAccess, got ${blockedRes.status}`);
    }
    const blockedBody = await blockedRes.json();
    console.log('   ✓ Confirmed: Doctor with confirmed appointment is BLOCKED without active RecordAccess:', blockedBody.message);

    console.log('\n7. Family Uploads Medical Record via Gateway...');
    const uploadRes = await (await fetch('http://localhost:5000/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${family1Token}` },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        recordType: 'XRAY',
        fileName: 'chest_xray_scan.png',
        fileUrl: 'https://cdn.medimind.test/scans/chest_xray_scan.png',
        description: 'Post-viral lung radiograph',
        recordDate: '2026-10-01',
      }),
    })).json();
    uploadedRecordId = uploadRes.data.id || uploadRes.data._id;
    console.log('   ✓ Medical record uploaded successfully:', uploadedRecordId, '| Type:', uploadRes.data.recordType);

    console.log('\n8. Family Grants Doctor Record Access for Member...');
    const grantRes = await (await fetch('http://localhost:5000/api/records/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${family1Token}` },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        doctorId: doctorId.toString(),
      }),
    })).json();
    grantedAccessId = grantRes.data.id || grantRes.data._id;
    console.log('   ✓ Record access granted:', grantedAccessId, '| Status:', grantRes.data.status);

    console.log('\n9. Doctor Reads Patient Records & Access History...');
    const docRecordsRes = await (await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })).json();
    console.log('   ✓ Doctor successfully accessed records. Count:', docRecordsRes.data.length);
    if (!docRecordsRes.data.some((r) => r.id.toString() === uploadedRecordId.toString())) {
      throw new Error('Uploaded record not found in doctor records view');
    }

    const docHistoryRes = await (await fetch('http://localhost:5000/api/records/access/doctor/me', {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })).json();
    console.log('   ✓ Doctor access history contains grants. Count:', docHistoryRes.data.length);

    console.log('\n10. Consultation Lifecycle: DRAFT -> FINAL -> AMENDED...');
    // Create DRAFT
    const createConsultRes = await (await fetch('http://localhost:5000/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        appointmentId: appointmentId.toString(),
        symptoms: 'Dry cough, mild wheezing on exertion',
        observations: 'Rhonchi in bilateral lower lobes',
        clinicalAssessment: 'Mild reactive airway disease',
        treatmentPlan: 'Inhaled bronchodilator and anti-inflammatory syrup',
        notes: 'Follow up in 7 days',
      }),
    })).json();
    consultationId = createConsultRes.data.id || createConsultRes.data._id;
    console.log('   ✓ Consultation created (DRAFT):', consultationId);

    // Update DRAFT
    const updateConsultRes = await (await fetch(`http://localhost:5000/api/consultations/${consultationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        observations: 'Mild bilateral rhonchi, oxygen saturation 98%',
      }),
    })).json();
    console.log('   ✓ DRAFT Consultation updated. Observations:', updateConsultRes.data.observations);

    // Finalize
    const finalizeConsultRes = await (await fetch(`http://localhost:5000/api/consultations/${consultationId}/finalize`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${doctorToken}` },
    })).json();
    console.log('   ✓ Consultation finalized:', finalizeConsultRes.data.status, '| Finalized At:', finalizeConsultRes.data.finalizedAt);

    // Direct edit of finalized consultation must be rejected
    const blockedEditConsult = await fetch(`http://localhost:5000/api/consultations/${consultationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ observations: 'Direct edit' }),
    });
    if (blockedEditConsult.status !== 400) {
      throw new Error(`Expected 400 when editing finalized consultation, got ${blockedEditConsult.status}`);
    }
    console.log('   ✓ Confirmed: Direct edit of finalized consultation BLOCKED (400)');

    // Amend
    const amendConsultRes = await (await fetch(`http://localhost:5000/api/consultations/${consultationId}/amend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        notes: 'Added allergy check: No prior penicillin allergy reported',
      }),
    })).json();
    const amendedConsultId = amendConsultRes.data.id || amendConsultRes.data._id;
    console.log('   ✓ Consultation amended:', amendedConsultId, '| Status:', amendConsultRes.data.status, '| Amendment Of:', amendConsultRes.data.amendmentOf);

    console.log('\n11. Prescription Lifecycle: DRAFT -> FINAL -> CORRECTED...');
    // Create DRAFT
    const createPrescriptionRes = await (await fetch('http://localhost:5000/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        consultationId: consultationId.toString(),
        medicines: [
          {
            name: 'Levocetirizine',
            dosage: '5 mg',
            frequency: 'Once daily at bedtime',
            duration: '5 days',
            instructions: 'After food',
          },
        ],
        generalInstructions: 'Avoid cold beverages',
      }),
    })).json();
    prescriptionId = createPrescriptionRes.data.id || createPrescriptionRes.data._id;
    console.log('   ✓ Prescription created (DRAFT):', prescriptionId);

    // Update DRAFT
    const updatePrescriptionRes = await (await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        generalInstructions: 'Avoid cold beverages and ensure warm hydration',
      }),
    })).json();
    console.log('   ✓ DRAFT Prescription updated. Instructions:', updatePrescriptionRes.data.generalInstructions);

    // Finalize
    const finalizePrescriptionRes = await (await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}/finalize`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${doctorToken}` },
    })).json();
    console.log('   ✓ Prescription finalized:', finalizePrescriptionRes.data.status, '| Finalized At:', finalizePrescriptionRes.data.finalizedAt);

    // Direct edit of finalized prescription must be rejected
    const blockedEditPrescription = await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ generalInstructions: 'Direct change' }),
    });
    if (blockedEditPrescription.status !== 400) {
      throw new Error(`Expected 400 when editing finalized prescription, got ${blockedEditPrescription.status}`);
    }
    console.log('   ✓ Confirmed: Direct edit of finalized prescription BLOCKED (400)');

    // Correct
    const correctPrescriptionRes = await (await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        medicines: [
          {
            name: 'Montelukast + Levocetirizine',
            dosage: '10mg/5mg',
            frequency: 'Once daily at night',
            duration: '10 days',
            instructions: 'After food',
          },
        ],
        generalInstructions: 'Updated therapy for prolonged bronchial sensitivity',
      }),
    })).json();
    const correctedPrescriptionId = correctPrescriptionRes.data.id || correctPrescriptionRes.data._id;
    console.log('   ✓ Prescription corrected:', correctedPrescriptionId, '| Status:', correctPrescriptionRes.data.status, '| Correction Of:', correctPrescriptionRes.data.correctionOf);

    console.log('\n12. Access Revocation Workflow...');
    const revokeRes = await (await fetch(`http://localhost:5000/api/records/access/${grantedAccessId}/revoke`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${family1Token}` },
    })).json();
    console.log('   ✓ Record access revoked by Family:', revokeRes.data.status, '| Revoked At:', revokeRes.data.revokedAt);

    // Doctor is now blocked from records again
    const postRevokeRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    if (postRevokeRes.status !== 403) {
      throw new Error(`Expected 403 for doctor reading records after access revocation, got ${postRevokeRes.status}`);
    }
    console.log('   ✓ Confirmed: Doctor is BLOCKED (403) after RecordAccess is revoked');

    console.log('\n13. Administrative & Cross-Family Privacy Boundaries...');
    // Admin blocked from clinical records
    const adminRecCheck = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminRecCheck.status !== 403) {
      throw new Error(`Expected 403 for Admin reading patient records, got ${adminRecCheck.status}`);
    }
    console.log('   ✓ Confirmed: Hospital Admin is BLOCKED (403) from patient clinical records');

    // Admin blocked from consultations
    const adminConsultCheck = await fetch(`http://localhost:5000/api/consultations/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminConsultCheck.status !== 403) {
      throw new Error(`Expected 403 for Admin reading patient consultations, got ${adminConsultCheck.status}`);
    }
    console.log('   ✓ Confirmed: Hospital Admin is BLOCKED (403) from patient consultations');

    // Admin blocked from prescriptions
    const adminPrescriptionCheck = await fetch(`http://localhost:5000/api/prescriptions/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminPrescriptionCheck.status !== 403) {
      throw new Error(`Expected 403 for Admin reading patient prescriptions, got ${adminPrescriptionCheck.status}`);
    }
    console.log('   ✓ Confirmed: Hospital Admin is BLOCKED (403) from patient prescriptions');

    // Cross-family block: Family 2 attempts to read Family 1 member records
    const crossFamCheck = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${family2Token}` },
    });
    if (crossFamCheck.status !== 403) {
      throw new Error(`Expected 403 for Family 2 reading Family 1 records, got ${crossFamCheck.status}`);
    }
    console.log('   ✓ Confirmed: Cross-family access is BLOCKED (403)');

    console.log('\n================================================================');
    console.log('PHASE 6 LIVE VERIFICATION COMPLETE: ALL 13 TEST CASES PASSED!');
    console.log('================================================================');
  } catch (error) {
    console.error('\n❌ LIVE VERIFICATION FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    console.log('\nCleaning up processes and database connections...');
    if (authConn) await authConn.close();
    if (familyConn) await familyConn.close();
    if (hospitalConn) await hospitalConn.close();
    if (doctorConn) await doctorConn.close();
    if (apptConn) await apptConn.close();
    if (recordConn) await recordConn.close();

    const killProc = (proc) => {
      if (proc) {
        try {
          proc.kill('SIGTERM');
        } catch {
          // ignore
        }
      }
    };

    killProc(authProc, 'Auth');
    killProc(familyProc, 'Family');
    killProc(hospitalProc, 'Hospital');
    killProc(doctorProc, 'Doctor');
    killProc(apptProc, 'Appointment');
    killProc(recordProc, 'Medical Record');
    killProc(gatewayProc, 'Gateway');

    // Give child processes time to exit
    await new Promise((r) => setTimeout(r, 1200));
  }
}

runLiveVerification();
