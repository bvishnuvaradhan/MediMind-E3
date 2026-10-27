import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
await mongoose.connect(uri, { dbName: process.env.APPOINTMENT_DB_NAME || 'medimind_appointment' });
const db = mongoose.connection.db;

const isRollback = process.argv.includes('--rollback');
const backupDir = path.resolve('backend/scripts/backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (isRollback) {
  console.log('[ROLLBACK] Finding latest backup file...');
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('appointments_noshow_pre_backup_')).sort().reverse();
  if (files.length === 0) {
    console.error('No backup files found!');
    process.exit(1);
  }
  const latestBackup = path.join(backupDir, files[0]);
  console.log(`[ROLLBACK] Restoring from ${latestBackup}...`);
  const docs = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
  for (const d of docs) {
    await db.collection('appointments').updateOne(
      { _id: new mongoose.Types.ObjectId(d._id) },
      {
        $set: { status: d.status },
        $unset: { no_show_reason: '', migration_manifest_id: '' }
      }
    );
  }
  console.log(`[ROLLBACK] Restored ${docs.length} appointments to original statuses.`);
  await mongoose.disconnect();
  process.exit(0);
}

// 1. Find candidates
const harborviewId = new mongoose.Types.ObjectId('6ac85a18074c2bc731a76385');
const aarogyamId = new mongoose.Types.ObjectId('6ac85a18074c2bc731a76381');
const nexoraId = new mongoose.Types.ObjectId('6ac85a18074c2bc731a76383');

// Harborview: 19 past CONFIRMED from September 2026
const hvCandidates = await db.collection('appointments').find({
  hospital_id: harborviewId,
  status: 'CONFIRMED',
  appointment_date: {
    $gte: new Date('2026-09-01T00:00:00Z'),
    $lte: new Date('2026-09-30T23:59:59Z')
  }
}).limit(19).toArray();

// Aarogyam: 9 past CONFIRMED from September 2026
const agCandidates = await db.collection('appointments').find({
  hospital_id: aarogyamId,
  status: 'CONFIRMED',
  appointment_date: {
    $gte: new Date('2026-09-01T00:00:00Z'),
    $lte: new Date('2026-09-30T23:59:59Z')
  }
}).limit(9).toArray();

// Nexora: 4 past RESCHEDULED from early October + 3 past RESCHEDULED from September 2026
const nxOctCandidates = await db.collection('appointments').find({
  hospital_id: nexoraId,
  status: 'RESCHEDULED',
  appointment_date: {
    $gte: new Date('2026-10-01T00:00:00Z'),
    $lte: new Date('2026-10-25T23:59:59Z')
  }
}).limit(4).toArray();

const nxSepCandidates = await db.collection('appointments').find({
  hospital_id: nexoraId,
  status: 'RESCHEDULED',
  appointment_date: {
    $gte: new Date('2026-09-01T00:00:00Z'),
    $lte: new Date('2026-09-30T23:59:59Z')
  }
}).limit(3).toArray();

const nxCandidates = [...nxOctCandidates, ...nxSepCandidates];

console.log(`Found candidates: Harborview=${hvCandidates.length}, Aarogyam=${agCandidates.length}, Nexora=${nxCandidates.length}`);

if (hvCandidates.length !== 19 || agCandidates.length !== 9 || nxCandidates.length !== 7) {
  console.error('Candidate count mismatch! Expected 19 HV, 9 AG, 7 NX.');
  process.exit(1);
}

const allCandidates = [...hvCandidates, ...agCandidates, ...nxCandidates];

// 2. Pre-change snapshot backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const manifestId = `manifest_noshow_rate_reconcile_${timestamp}`;
const backupFile = path.join(backupDir, `appointments_noshow_pre_backup_${timestamp}.json`);

fs.writeFileSync(backupFile, JSON.stringify(allCandidates, null, 2), 'utf8');
console.log(`✓ Pre-change snapshot recorded to: ${backupFile}`);

// 3. Apply status update
let updatedCount = 0;
for (const appt of allCandidates) {
  await db.collection('appointments').updateOne(
    { _id: appt._id },
    {
      $set: {
        status: 'NO_SHOW',
        no_show_reason: 'Demonstration operational record: Patient did not attend scheduled consultation',
        migration_manifest_id: manifestId,
        updated_at: new Date()
      }
    }
  );
  updatedCount++;
}

console.log(`✓ Successfully updated ${updatedCount} appointments to NO_SHOW with manifest ${manifestId}`);

// 4. Verify post-update rates
const hospitals = [
  { id: '6ac85a18074c2bc731a76385', name: 'Harborview' },
  { id: '6ac85a18074c2bc731a76381', name: 'Aarogyam' },
  { id: '6ac85a18074c2bc731a76383', name: 'Nexora' }
];

console.log('\n--- Post-Modification Reconciliation Audit ---');
for (const h of hospitals) {
  const hidObj = new mongoose.Types.ObjectId(h.id);
  const total = await db.collection('appointments').countDocuments({ hospital_id: hidObj });
  const completed = await db.collection('appointments').countDocuments({ hospital_id: hidObj, status: 'COMPLETED' });
  const cancelled = await db.collection('appointments').countDocuments({ hospital_id: hidObj, status: { $in: ['CANCELLED', 'CANCELED'] } });
  const noShow = await db.collection('appointments').countDocuments({ hospital_id: hidObj, status: 'NO_SHOW' });

  const completionRate = total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0.0%';
  const cancellationRate = total > 0 ? `${((cancelled / total) * 100).toFixed(1)}%` : '0.0%';
  const noShowRate = total > 0 ? `${((noShow / total) * 100).toFixed(1)}%` : '0.0%';

  console.log(`Facility: ${h.name}`);
  console.log(`  Total Bookings:         ${total}`);
  console.log(`  Completed Consultations:${completed} (${completionRate})`);
  console.log(`  Cancelled Bookings:     ${cancelled} (${cancellationRate})`);
  console.log(`  No-Show Bookings:       ${noShow} (${noShowRate})`);
}

await mongoose.disconnect();
