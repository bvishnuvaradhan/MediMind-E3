import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Appointment from '../src/models/Appointment.js';
import Notification from '../src/models/Notification.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_appointment_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let doctor1Id, doctor2Id, hospitalId, departmentId;
let family1Id, family2Id;
let family1MemberId, family2MemberId;
let family1UserId, family2UserId;
let doctor1UserId, doctor2UserId;

let family1Token, family2Token;
let doctor1Token, doctor2Token;
let deptHeadToken;
let chairmanToken;

let activeAppt;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Appointment.deleteMany({});
  await Notification.deleteMany({});

  doctor1Id = new mongoose.Types.ObjectId();
  doctor2Id = new mongoose.Types.ObjectId();
  hospitalId = new mongoose.Types.ObjectId();
  departmentId = new mongoose.Types.ObjectId();

  family1Id = new mongoose.Types.ObjectId();
  family2Id = new mongoose.Types.ObjectId();
  family1MemberId = new mongoose.Types.ObjectId();
  family2MemberId = new mongoose.Types.ObjectId();

  family1UserId = new mongoose.Types.ObjectId();
  family2UserId = new mongoose.Types.ObjectId();
  doctor1UserId = new mongoose.Types.ObjectId();
  doctor2UserId = new mongoose.Types.ObjectId();

  family1Token = jwt.sign(
    { userId: family1UserId.toString(), role: 'FAMILY', familyId: family1Id.toString(), referenceId: family1Id.toString() },
    JWT_SECRET
  );

  family2Token = jwt.sign(
    { userId: family2UserId.toString(), role: 'FAMILY', familyId: family2Id.toString(), referenceId: family2Id.toString() },
    JWT_SECRET
  );

  doctor1Token = jwt.sign(
    { userId: doctor1UserId.toString(), role: 'DOCTOR', doctorId: doctor1Id.toString(), referenceId: doctor1Id.toString() },
    JWT_SECRET
  );

  doctor2Token = jwt.sign(
    { userId: doctor2UserId.toString(), role: 'DOCTOR', doctorId: doctor2Id.toString(), referenceId: doctor2Id.toString() },
    JWT_SECRET
  );

  deptHeadToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DEPARTMENT_HEAD', departmentId: departmentId.toString(), hospitalId: hospitalId.toString() },
    JWT_SECRET
  );

  chairmanToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'CHAIRMAN' },
    JWT_SECRET
  );
});

beforeEach(async () => {
  await Appointment.deleteMany({});
  await Notification.deleteMany({});

  activeAppt = await Appointment.create({
    family_member_id: family1MemberId,
    doctor_id: doctor1Id,
    hospital_id: hospitalId,
    department_id: departmentId,
    appointment_date: new Date('2026-10-25'),
    start_time: '10:00',
    end_time: '10:30',
    status: 'CONFIRMED',
    appointment_type: 'BOOKED',
    token: 'OPD-101',
  });
});

afterAll(async () => {
  await Appointment.deleteMany({});
  await Notification.deleteMany({});
  await mongoose.connection.close();
});

describe('Appointment Synchronization, Cancellation Notifications, & Alternative Rebooking Suite', () => {
  test('1. Doctor cancels assigned appointment with reason and persists cancellation metadata (200)', async () => {
    const cancelRes = await request(app)
      .put(`/api/appointments/${activeAppt._id}/cancel`)
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({ reason: 'Emergency orthopedic trauma case' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
    expect(cancelRes.body.data.cancellationReason).toBe('Emergency orthopedic trauma case');
    expect(cancelRes.body.data.cancelledAt).toBeTruthy();

    // Verify persisted in DB
    const persisted = await Appointment.findById(activeAppt._id);
    expect(persisted.status).toBe('CANCELLED');
    expect(persisted.cancellation_reason).toBe('Emergency orthopedic trauma case');
    expect(persisted.cancelled_by).toBe(doctor1UserId.toString());
  });

  test('2. Doctor cancellation generates in-app persistent Notification for affected family', async () => {
    await request(app)
      .put(`/api/appointments/${activeAppt._id}/cancel`)
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({ reason: 'Urgent surgery' });

    const notifications = await Notification.find({ appointment_id: activeAppt._id });
    expect(notifications.length).toBe(1);
    const notif = notifications[0];
    expect(notif.type).toBe('APPOINTMENT_CANCELLED');
    expect(notif.cancellation_reason).toBe('Urgent surgery');
    expect(notif.action_type).toBe('FIND_ALTERNATIVE');
    expect(notif.is_read).toBe(false);
  });

  test('3. Family retrieves cancellation notification and verifies recipient isolation (200 / empty)', async () => {
    // Seed notification for Family 1
    await Notification.create({
      recipient_user_id: family1UserId.toString(),
      family_id: family1Id.toString(),
      family_member_id: family1MemberId,
      family_member_name: 'Priya Kapoor',
      appointment_id: activeAppt._id,
      type: 'APPOINTMENT_CANCELLED',
      title: 'Appointment Cancelled: Dr. Rahul Sharma',
      message: 'Dr. Rahul Sharma cancelled your appointment on 25 Oct 2026 at 10:00.',
      cancellation_reason: 'Urgent medical leave',
      action_type: 'FIND_ALTERNATIVE',
      is_read: false,
    });

    // Family 1 can retrieve it
    const resFam1 = await request(app)
      .get('/api/appointments/notifications')
      .set('Authorization', `Bearer ${family1Token}`);

    expect(resFam1.status).toBe(200);
    expect(resFam1.body.success).toBe(true);
    expect(resFam1.body.data.length).toBe(1);
    expect(resFam1.body.data[0].title).toContain('Dr. Rahul Sharma');
    expect(resFam1.body.data[0].actionType).toBe('FIND_ALTERNATIVE');

    // Family 2 CANNOT see Family 1 notification
    const resFam2 = await request(app)
      .get('/api/appointments/notifications')
      .set('Authorization', `Bearer ${family2Token}`);

    expect(resFam2.status).toBe(200);
    expect(resFam2.body.data.length).toBe(0);
  });

  test('4. Discover alternative doctors and available bookable slots after cancellation (200)', async () => {
    // Cancel first
    await request(app)
      .put(`/api/appointments/${activeAppt._id}/cancel`)
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({ reason: 'Conference leave' });

    const res = await request(app)
      .get(`/api/appointments/${activeAppt._id}/alternatives`)
      .set('Authorization', `Bearer ${family1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasAlternatives).toBe(true);
    expect(res.body.data.recommendedDoctors.length).toBeGreaterThan(0);

    const firstDoc = res.body.data.recommendedDoctors[0];
    expect(firstDoc.doctorId).toBeTruthy();
    expect(firstDoc.availableSlots.length).toBeGreaterThan(0);
    expect(firstDoc.availableSlots[0].startTime).toBeTruthy();
    expect(firstDoc.availableSlots[0].endTime).toBeTruthy();
    expect(firstDoc.availableSlots[0].date).toBeTruthy();
  });

  test('5. Rebook replacement appointment linked to original cancelled appointment (201)', async () => {
    // Cancel original
    await request(app)
      .put(`/api/appointments/${activeAppt._id}/cancel`)
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({ reason: 'Emergency leave' });

    // Rebook with Doctor 2
    const rebookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${family1Token}`)
      .send({
        familyMemberId: family1MemberId,
        doctorId: doctor2Id,
        hospitalId,
        departmentId,
        appointmentDate: '2026-10-26',
        startTime: '11:00',
        endTime: '11:30',
        reason: 'Rebooking follow-up after cancellation',
        originalAppointmentId: activeAppt._id,
      });

    expect(rebookRes.status).toBe(201);
    expect(rebookRes.body.success).toBe(true);
    const newApptId = rebookRes.body.data._id || rebookRes.body.data.id;
    expect(newApptId).toBeTruthy();
    expect(rebookRes.body.data.originalAppointmentId.toString()).toBe(activeAppt._id.toString());

    // Verify linkage in database
    const origUpdated = await Appointment.findById(activeAppt._id);
    expect(origUpdated.status).toBe('CANCELLED');
    expect(origUpdated.replacement_appointment_id.toString()).toBe(newApptId.toString());
  });

  test('6. Rejects rebooking the same cancelled appointment twice (409)', async () => {
    // Cancel original
    await request(app)
      .put(`/api/appointments/${activeAppt._id}/cancel`)
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({ reason: 'Cancelled' });

    // First rebook
    await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${family1Token}`)
      .send({
        familyMemberId: family1MemberId,
        doctorId: doctor2Id,
        hospitalId,
        departmentId,
        appointmentDate: '2026-10-26',
        startTime: '11:00',
        endTime: '11:30',
        originalAppointmentId: activeAppt._id,
      });

    // Duplicate rebook attempt on same cancelled appointment
    const dupRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${family1Token}`)
      .send({
        familyMemberId: family1MemberId,
        doctorId: doctor2Id,
        hospitalId,
        departmentId,
        appointmentDate: '2026-10-26',
        startTime: '14:00',
        endTime: '14:30',
        originalAppointmentId: activeAppt._id,
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.message).toContain('already been rebooked');
  });

  test('7. Unauthorized doctor cannot cancel another doctor appointment (403)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${activeAppt._id}/cancel`)
      .set('Authorization', `Bearer ${doctor2Token}`)
      .send({ reason: 'Malicious cancel' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not the assigned doctor');
  });

  test('8. Department Head schedule is strictly view-only; cannot cancel appointments (403)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${activeAppt._id}/cancel`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ reason: 'Dept head attempt' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('department head schedule is view-only');
  });

  test('9. Mark in-app notification as read (200)', async () => {
    const notif = await Notification.create({
      recipient_user_id: family1UserId.toString(),
      family_id: family1Id.toString(),
      appointment_id: activeAppt._id,
      type: 'APPOINTMENT_CANCELLED',
      title: 'Alert',
      message: 'Test message',
      is_read: false,
    });

    const res = await request(app)
      .put(`/api/appointments/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${family1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);

    const updated = await Notification.findById(notif._id);
    expect(updated.is_read).toBe(true);
    expect(updated.read_at).toBeTruthy();
  });
});
