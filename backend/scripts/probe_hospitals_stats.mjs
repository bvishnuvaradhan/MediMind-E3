async function checkHospitals() {
  const authRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'chairman@medimind.org',
      password: 'Chair#2026$01!Dev'
    })
  });
  const { data: { token } } = await authRes.json();

  const hosps = [
    { id: '6ac85a18074c2bc731a76385', name: 'Harborview' },
    { id: '6ac85a18074c2bc731a76381', name: 'Aarogyam' },
    { id: '6ac85a18074c2bc731a76383', name: 'Nexora' }
  ];

  for (const h of hosps) {
    console.log(`\n=================== ${h.name} (${h.id}) ===================`);
    const res = await fetch(`http://localhost:5000/api/appointments/stats?hospitalId=${h.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    const d = json.data;
    console.log('byHospitalRescheduled:', d.byHospitalRescheduled);
    console.log('byHospitalWalkIn:', d.byHospitalWalkIn);
    console.log('Monthly trends count:', d.monthlyTrends?.length);
    d.monthlyTrends?.forEach(m => {
      console.log(` ${m.monthKey} (${m.status}): Appts=${m.appointments} | Intake=${m.intake} | Completed=${m.completed} | Canc=${m.cancelled} | Resched=${m.rescheduled} | WalkIn=${m.walkIns} | AI=${m.aiUsage}`);
    });
  }
}

checkHospitals().catch(console.error);
