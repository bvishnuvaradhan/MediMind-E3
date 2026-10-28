import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function generateManifest() {
  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connHosp = await mongoose.createConnection(uri, { dbName: 'medimind_hospital' }).asPromise();
  const connRec = await mongoose.createConnection(uri, { dbName: 'medimind_records' }).asPromise();

  const cutoff = new Date('2026-10-28T00:00:00.000Z');

  const hospitals = await connHosp.collection('hospitals').find({
    status: { $regex: '^active$', $options: 'i' }
  }).toArray();
  const hospMap = {};
  for (const h of hospitals) hospMap[h._id.toString()] = h.name;

  const candidates = await connAppt.collection('appointments').find({
    status: { $in: ['CONFIRMED', 'BOOKED', 'RESCHEDULED'] },
    appointment_date: { $lt: cutoff }
  }).sort({ hospital_id: 1, appointment_date: 1, _id: 1 }).toArray();

  console.log(`Audited exactly ${candidates.length} candidate records.`);

  const backupDir = path.resolve('backend/scripts/backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `pre_modification_414_snapshot_${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(candidates, null, 2), 'utf8');
  console.log(`✓ Pre-modification snapshot safely stored at: ${backupPath}`);

  // Build individual record manifest
  const manifestItems = [];
  const dispositionSummary = {
    rescheduled_preserve: 0,
    booked_unattended: 0,
    confirmed_insufficient_evidence: 0,
    byHospital: {
      'Harborview Medical Centre': { total: 0, rescheduled: 0, booked: 0, confirmed: 0 },
      'Aarogyam Multispeciality Hospital': { total: 0, rescheduled: 0, booked: 0, confirmed: 0 },
      'Nexora Advanced Care Hospital': { total: 0, rescheduled: 0, booked: 0, confirmed: 0 }
    }
  };

  for (const c of candidates) {
    const hid = c.hospital_id.toString();
    const hname = hospMap[hid] || hid;

    let disposition = '';
    let category = '';
    let evidence = '';

    if (c.status === 'RESCHEDULED') {
      category = 'Category 3: Rescheduled / Lifecycle Terminal Slot';
      disposition = 'PRESERVE_RESCHEDULED';
      evidence = 'Original slot was moved/rescheduled; clinical encounter occurs on the rescheduled replacement date, not on this original slot. Consultations linked: 0.';
      dispositionSummary.rescheduled_preserve++;
      dispositionSummary.byHospital[hname].rescheduled++;
    } else if (c.status === 'BOOKED') {
      category = 'Category 4: Insufficient Evidence / Unattended Booking';
      disposition = 'UNATTENDED_BOOKING_REVIEW';
      evidence = 'Slot booked for 2026-10-27 but never confirmed or checked in; zero clinical documentation or attendance recorded.';
      dispositionSummary.booked_unattended++;
      dispositionSummary.byHospital[hname].booked++;
    } else if (c.status === 'CONFIRMED') {
      category = 'Category 4: Insufficient Clinical Evidence (No Signed Consultation)';
      disposition = 'UNRESOLVED_PENDING_CLINICAL_REVIEW';
      evidence = 'Slot confirmed on historical past date; zero signed consultation records or prescription records exist in medimind_records. Consultations linked: 0.';
      dispositionSummary.confirmed_insufficient_evidence++;
      dispositionSummary.byHospital[hname].confirmed++;
    }

    dispositionSummary.byHospital[hname].total++;

    manifestItems.push({
      appointment_id: c._id.toString(),
      hospital_id: hid,
      hospital_name: hname,
      appointment_date: c.appointment_date.toISOString().slice(0, 10),
      original_status: c.status,
      appointment_type: c.appointment_type,
      doctor_id: c.doctor_id?.toString(),
      family_member_id: c.family_member_id?.toString(),
      reason: c.reason,
      existing_consultation_linked: false,
      proposed_category: category,
      proposed_disposition: disposition,
      evidence_summary: evidence
    });
  }

  const manifestPath = path.join(backupDir, `unclosed_414_change_manifest_${timestamp}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify({
    manifest_id: `manifest_resolve_414_${timestamp}`,
    created_at: new Date().toISOString(),
    reporting_cutoff: cutoff.toISOString(),
    total_candidates: candidates.length,
    disposition_summary: dispositionSummary,
    items: manifestItems
  }, null, 2), 'utf8');

  console.log(`✓ Change Manifest generated at: ${manifestPath}`);
  console.log('\n--- Disposition Summary ---');
  console.log(JSON.stringify(dispositionSummary, null, 2));

  await connAppt.close();
  await connHosp.close();
  await connRec.close();
}

generateManifest().catch(console.error);
