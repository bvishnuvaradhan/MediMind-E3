async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chairman@medimind.org', password: 'Chair#2026$01!Dev' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  
  const statsRes = await fetch('http://localhost:5000/api/appointments/stats', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const statsData = await statsRes.json();
  console.log('Cancellation events:', statsData.data?.byHospitalMonthlyCancellationEvents);
  console.log('Rescheduling events count:', statsData.data?.byHospitalMonthlyReschedulingEvents?.length);
  console.log('Sample rescheduling events:', statsData.data?.byHospitalMonthlyReschedulingEvents?.slice(0, 5));
}
test().catch(console.error);
