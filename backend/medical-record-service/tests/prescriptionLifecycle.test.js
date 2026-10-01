import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Consultation from '../src/models/Consultation.js';
import Prescription from '../src/models/Prescription.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_records_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let familyMemberId, doctorId, otherDoctorId, consultationId, adminId;
let familyToken, doctorToken, otherDoctorToken, adminToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Consultation.deleteMany({});
  await Prescription.deleteMany({});

  familyMemberId = new mongoose.Types.ObjectId();
  doctorId = new mongoose.Types.ObjectId();
  otherDoctorId = new mongoose.Types.ObjectId();
  adminId = new mongoose.Types.ObjectId();

  familyToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'FAMILY', referenceId: new mongoose.Types.ObjectId().toString() },
    JWT_SECRET
  );

  doctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: doctorId.toString(), doctorId: doctorId.toString() },
    JWT_SECRET
  );

  otherDoctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: otherDoctorId.toString(), doctorId: otherDoctorId.toString() },
    JWT_SECRET
  );

  adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'HOSPITAL_ADMIN', referenceId: adminId.toString(), hospitalId: adminId.toString() },
    JWT_SECRET
  );

  // Seed a consultation for doctor
  const consultation = await Consultation.create({
    family_member_id: familyMemberId,
    doctor_id: doctorId,
    appointment_id: new mongoose.Types.ObjectId(),
    status: 'FINAL',
    finalized_at: new Date(),
  });
  consultationId = consultation._id;
});

afterAll(async () => {
  await Consultation.deleteMany({});
  await Prescription.deleteMany({});
  await mongoose.connection.close();
});

describe('Prescription Lifecycle & Verification Suite', () => {
  let createdPrescriptionId;

  test('1. Non-doctor cannot create prescription (403)', async () => {
    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId,
        consultationId,
        medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'TDS', duration: '3 days' }],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('2. Rejects prescription with empty medicines list (400)', async () => {
    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        familyMemberId,
        consultationId,
        medicines: [],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('3. Doctor successfully creates prescription in DRAFT state (201)', async () => {
    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        familyMemberId,
        consultationId,
        medicines: [
          {
            name: 'Amoxicillin',
            dosage: '500 mg',
            frequency: 'Three times daily',
            duration: '5 days',
            instructions: 'After food',
          },
        ],
        generalInstructions: 'Drink plenty of water and rest well',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.medicines.length).toBe(1);
    expect(res.body.data.finalizedAt).toBeNull();
    createdPrescriptionId = res.body.data.id || res.body.data._id;
  });

  test('4. Doctor updates prescription while in DRAFT status (200)', async () => {
    const res = await request(app)
      .put(`/api/prescriptions/${createdPrescriptionId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        medicines: [
          {
            name: 'Amoxicillin',
            dosage: '500 mg',
            frequency: 'Three times daily',
            duration: '7 days',
            instructions: 'After food with plenty of water',
          },
        ],
        generalInstructions: 'Complete full course of antibiotics',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.medicines[0].duration).toBe('7 days');
  });

  test('5. Other doctor cannot update this DRAFT prescription (403)', async () => {
    const res = await request(app)
      .put(`/api/prescriptions/${createdPrescriptionId}`)
      .set('Authorization', `Bearer ${otherDoctorToken}`)
      .send({
        generalInstructions: 'Unauthorized edit',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('6. Doctor finalizes prescription (DRAFT -> FINAL) (200)', async () => {
    const res = await request(app)
      .put(`/api/prescriptions/${createdPrescriptionId}/finalize`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('FINAL');
    expect(res.body.data.finalizedAt).not.toBeNull();
  });

  test('7. Editing FINAL prescription directly is rejected (400)', async () => {
    const res = await request(app)
      .put(`/api/prescriptions/${createdPrescriptionId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        generalInstructions: 'Direct change to finalized prescription',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Cannot edit a prescription that is final');
  });

  test('8. Doctor corrects prescription (CORRECTED record linked via correction_of) (201)', async () => {
    const res = await request(app)
      .post(`/api/prescriptions/${createdPrescriptionId}/correct`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        medicines: [
          {
            name: 'Azithromycin',
            dosage: '500 mg',
            frequency: 'Once daily',
            duration: '3 days',
            instructions: 'Before food',
          },
        ],
        generalInstructions: 'Replaced Amoxicillin due to reported mild allergy',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CORRECTED');
    expect(res.body.data.correctionOf.toString()).toBe(createdPrescriptionId.toString());
  });

  test('9. Hospital Admin cannot view prescriptions (403)', async () => {
    const res = await request(app)
      .get(`/api/prescriptions/member/${familyMemberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('administrative roles cannot access private patient prescriptions');
  });
});
