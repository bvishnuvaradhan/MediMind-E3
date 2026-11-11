import mongoose from 'mongoose';

async function main() {
  const conn = await mongoose.connect('mongodb://localhost:27017');
  const col = conn.connection.useDb('medimind_appointment').collection('appointments');

  const novStart = new Date('2026-11-01T00:00:00.000Z');
  const novEnd = new Date('2026-12-01T00:00:00.000Z');

  // Let's check status breakdown in November
  const statuses = await col.aggregate([
    { $match: { appointment_date: { $gte: novStart, $lt: novEnd } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).toArray();
  console.log('November statuses:', statuses);

  // Check 348:
  // Is 348 the number of active/confirmed/booked excluding cancelled?
  // 513 - 6 cancelled = 507.
  // What about created_at vs appointment_date?
  // Let's check where 348 was in previous scripts:
  // In previous scripts:
  // "Harborview: 180, Aarogyam: 72, Nexora: 96. Total = 348."
  // Wait! Where did 180, 72, 96 come from?
  // Let's check probe_hospitals_stats.mjs from Phase 13:
  // Harborview 2026-11: Appts=180
  // Aarogyam 2026-11: Appts=72
  // Nexora 2026-11: Appts=96
  // 180 + 72 + 96 = 348!
  // Why did probe_hospitals_stats.mjs show 180, 72, 96 for November?
  // Let's check how probe_hospitals_stats.mjs got those numbers!
  await conn.disconnect();
}

main().catch(console.error);
