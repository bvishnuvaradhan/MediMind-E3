import fs from 'fs';

const endpoints = [
  { name: 'API Gateway', url: 'http://localhost:5000/api/health', expectedStatus: 200 },
  { name: 'Auth Service', url: 'http://localhost:5001/health', expectedStatus: 200 },
  { name: 'Family Service', url: 'http://localhost:5002/health', expectedStatus: 200 },
  { name: 'Hospital Service', url: 'http://localhost:5003/health', expectedStatus: 200 },
  { name: 'Doctor Service', url: 'http://localhost:5004/health', expectedStatus: 200 },
  { name: 'Appointment Service', url: 'http://localhost:5005/health', expectedStatus: 200 },
  { name: 'Medical Record Service', url: 'http://localhost:5006/health', expectedStatus: 200 },
  { name: 'FastAPI AI Prediction Service', url: 'http://127.0.0.1:5007/health', expectedStatus: 200 },
  { name: 'Knowledge Service', url: 'http://localhost:5008/health', expectedStatus: 200 },
  { name: 'React Frontend', url: 'http://127.0.0.1:5173/', expectedStatus: 200 },
];

async function checkHealth() {
  console.log('========================================================================');
  console.log('PHASE 20: SYSTEM ARCHITECTURE & SERVICE HEALTH VERIFICATION');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { signal: AbortSignal.timeout(6000) });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}

      if (res.status === ep.expectedStatus) {
        console.log(`[UP] ${ep.name} (${ep.url}) -> HTTP ${res.status}`);
        if (json) {
          console.log(`     Details: ${JSON.stringify(json.data || json)}`);
        }
        passed++;
      } else {
        console.error(`[FAIL] ${ep.name} (${ep.url}) -> Expected HTTP ${ep.expectedStatus}, got ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.error(`[DOWN] ${ep.name} (${ep.url}) -> Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nHealth Summary: ${passed} UP, ${failed} DOWN out of ${endpoints.length} components.`);
  if (failed > 0) process.exit(1);
}

checkHealth().catch((err) => {
  console.error('Fatal health check error:', err);
  process.exit(1);
});
