import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

export async function rollback(snapshotFile) {
  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const backupDir = path.resolve('backend/scripts/backups');

  let fileToRestore = snapshotFile;
  if (!fileToRestore) {
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('pre_modification_414_snapshot_')).sort().reverse();
    if (files.length === 0) {
      throw new Error('No snapshot files found for rollback');
    }
    fileToRestore = path.join(backupDir, files[0]);
  }

  console.log(`[Rollback] Restoring appointments from snapshot: ${fileToRestore}`);
  const records = JSON.parse(fs.readFileSync(fileToRestore, 'utf8'));

  let restored = 0;
  for (const r of records) {
    await connAppt.collection('appointments').updateOne(
      { _id: new mongoose.Types.ObjectId(r._id) },
      {
        $set: {
          status: r.status,
          updated_at: new Date(r.updated_at)
        },
        $unset: {
          migration_manifest_id: ''
        }
      }
    );
    restored++;
  }

  console.log(`[Rollback] Successfully restored ${restored} appointment documents to their exact pre-modification state.`);
  await connAppt.close();
}

if (process.argv[1] && process.argv[1].endsWith('rollback_414_manifest.mjs')) {
  rollback(process.argv[2]).catch(console.error);
}
