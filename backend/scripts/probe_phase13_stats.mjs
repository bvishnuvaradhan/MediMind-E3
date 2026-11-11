async function check() {
  const authRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'chairman@medimind.org',
      password: 'Chair#2026$01!Dev'
    })
  });
  const authJson = await authRes.json();
  const token = authJson.data?.token;

  const res = await fetch('http://localhost:5000/api/appointments/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  const d = json.data;
  console.log('byHospitalRescheduled:', d.byHospitalRescheduled);
  console.log('byHospitalWalkIn:', d.byHospitalWalkIn);
  console.log('byHospitalMonthlyRescheduled count:', d.byHospitalMonthlyRescheduled?.length);
  console.log('byHospitalMonthlyRescheduled sample:', d.byHospitalMonthlyRescheduled?.slice(0, 4));
  console.log('\nMonthly trends count:', d.monthlyTrends?.length);
  console.log('Monthly trends:');
  d.monthlyTrends.forEach(m => console.log(JSON.stringify(m)));
}

check().catch(console.error);
