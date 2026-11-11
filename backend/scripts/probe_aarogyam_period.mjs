import { getRelativeDateRange } from '../../frontend/src/utils/dateUtils.js';

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aarogyam.hospital', password: 'Admin#2026$01!Dev' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  
  const { startDate, endDate } = getRelativeDateRange('This Month');
  const query = new URLSearchParams();
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);
  
  const statsRes = await fetch(`http://localhost:5000/api/appointments/stats?${query.toString()}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const statsData = await statsRes.json();
  console.log('Stats status:', statsData.success);
  console.log('monthlyTrends:', statsData.data?.monthlyTrends);
}
test().catch(console.error);
