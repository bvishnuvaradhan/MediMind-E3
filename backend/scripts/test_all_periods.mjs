import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import { getRelativeDateRange, STANDARDIZED_ANALYTICS_PERIODS } from '../../frontend/src/utils/dateUtils.js';

async function testAllPeriods() {
  console.log('========================================================================');
  console.log('AUDITING ALL 8 REPORTING PERIODS VIA API GATEWAY');
  console.log('========================================================================\n');

  // Authenticate as Chairman
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

  for (const period of STANDARDIZED_ANALYTICS_PERIODS) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`PERIOD: ${period}`);
    const range = getRelativeDateRange(period);
    console.log(`Computed Range: startDate=${range.startDate}, endDate=${range.endDate}, label=${range.label}`);

    const query = new URLSearchParams();
    if (range.startDate) query.append('startDate', range.startDate);
    if (range.endDate) query.append('endDate', range.endDate);
    const qs = query.toString() ? `?${query.toString()}` : '';

    const statsRes = await fetch(`http://localhost:5000/api/appointments/stats${qs}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const statsJson = await statsRes.json();
    const stats = statsJson.data;

    console.log(`API Response Summary:`);
    console.log(`  totalIntake: ${stats?.totalIntake || 0}`);
    console.log(`  totalServed: ${stats?.totalCompleted || 0}`);
    console.log(`  byHospitalIntake:`, stats?.byHospitalIntake);
    console.log(`  byHospitalCompleted:`, stats?.byHospitalCompleted);
    console.log(`  byHospitalMonthlyCompleted entries:`, stats?.byHospitalMonthlyCompleted?.length);
    console.log(`  byHospitalMonthlyIntake entries:`, stats?.byHospitalMonthlyIntake?.length);
    console.log(`  byHospitalMonthlyPreds entries:`, stats?.byHospitalMonthlyPreds?.length);
    console.log(`  byHospitalDailyCompleted entries:`, stats?.byHospitalDailyCompleted?.length);
  }
}

testAllPeriods().catch(console.error);
