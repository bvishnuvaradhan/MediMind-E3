async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aarogyam.hospital', password: 'Admin#2026$01!Dev' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  
  const statsRes = await fetch('http://localhost:5000/api/appointments/stats', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const statsData = await statsRes.json();
  console.log('--- AAROGYAM MONTHLY INTAKE TRENDS ---');
  console.table(statsData.data?.monthlyIntakeTrends);
}
test().catch(console.error);
