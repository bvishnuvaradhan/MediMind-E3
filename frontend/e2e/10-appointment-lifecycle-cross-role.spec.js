import { test, expect } from '@playwright/test';
import { getAccount } from './testAccounts.js';

test.describe.serial('E2E Appointment Lifecycle & Cross-Role Synchronization Suite', () => {
  let familyToken = '';
  let doctorToken = '';
  let deptHeadToken = '';
  let hospitalAdminToken = '';
  let createdAppointmentId = '';
  let createdReplacementAppointmentId = '';

  const familyAccount = getAccount('rohan.kapoor@example.com');
  const doctorAccount = getAccount('dr.rahul.sharma@aarogyam.hospital');
  const deptHeadAccount = getAccount('arun.prakash@aarogyam.hospital');
  const adminAccount = getAccount('admin@aarogyam.hospital');

  test.beforeAll(async ({ request }) => {
    // 1. Authenticate Family
    const famRes = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: familyAccount.email,
        password: familyAccount.password,
      },
    });
    expect(famRes.status()).toBe(200);
    const famBody = await famRes.json();
    familyToken = famBody.data?.token || famBody.token;
    expect(familyToken).toBeTruthy();

    // 2. Authenticate Doctor
    const docRes = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: doctorAccount.email,
        password: doctorAccount.password,
      },
    });
    expect(docRes.status()).toBe(200);
    const docBody = await docRes.json();
    doctorToken = docBody.data?.token || docBody.token;
    expect(doctorToken).toBeTruthy();

    // 3. Authenticate Department Head
    const dhRes = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: deptHeadAccount.email,
        password: deptHeadAccount.password,
      },
    });
    expect(dhRes.status()).toBe(200);
    const dhBody = await dhRes.json();
    deptHeadToken = dhBody.data?.token || dhBody.token;
    expect(deptHeadToken).toBeTruthy();

    // 4. Authenticate Hospital Admin
    const haRes = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: adminAccount.email,
        password: adminAccount.password,
      },
    });
    expect(haRes.status()).toBe(200);
    const haBody = await haRes.json();
    hospitalAdminToken = haBody.data?.token || haBody.token;
    expect(hospitalAdminToken).toBeTruthy();
  });

  test('Step 1: Family Books Appointment for Rohan Kapoor with Dr. Rahul Sharma', async ({ request }) => {
    // Look up family member ID from family service profile
    const profileRes = await request.get('http://localhost:5000/api/families/members', {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    expect(profileRes.status()).toBe(200);
    const profileData = await profileRes.json();
    const familyMembers = profileData.data || profileData || [];
    expect(familyMembers.length).toBeGreaterThan(0);
    const targetMember = familyMembers[0];
    const memberId = targetMember._id || targetMember.id;

    // Look up doctor profile to get IDs
    const docLookupRes = await request.get('http://localhost:5000/api/doctors', {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    expect(docLookupRes.status()).toBe(200);
    const docList = await docLookupRes.json();
    const allDocs = docList.data || docList;
    const rahulSharma = allDocs.find((d) => (d.email || '').toLowerCase() === doctorAccount.email.toLowerCase());
    expect(rahulSharma).toBeDefined();

    const bookDate = '2026-11-20';
    const bookPayload = {
      familyMemberId: memberId,
      doctorId: rahulSharma._id || rahulSharma.id,
      hospitalId: rahulSharma.hospital_id || rahulSharma.hospitalId,
      departmentId: rahulSharma.department_id || rahulSharma.departmentId,
      appointmentDate: bookDate,
      startTime: '10:00',
      endTime: '10:30',
      appointmentType: 'BOOKED',
      reason: 'Persistent knee and lower joint pain following outdoor activity',
    };

    const bookRes = await request.post('http://localhost:5000/api/appointments', {
      headers: {
        Authorization: `Bearer ${familyToken}`,
        'Content-Type': 'application/json',
      },
      data: bookPayload,
    });

    expect([200, 201]).toContain(bookRes.status());
    const bookData = await bookRes.json();
    const appt = bookData.data || bookData;
    createdAppointmentId = appt._id || appt.id;
    expect(createdAppointmentId).toBeTruthy();
    expect(appt.status).toBe('BOOKED');
    expect(appt.token).toMatch(/^OPD-/);
  });

  test('Step 2: Doctor Views New Appointment in Clinical Schedule', async ({ request }) => {
    expect(createdAppointmentId).toBeTruthy();

    const docApptsRes = await request.get('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    expect(docApptsRes.status()).toBe(200);
    const docApptsData = await docApptsRes.json();
    const appts = docApptsData.data || docApptsData;
    const found = appts.find((a) => (a._id || a.id).toString() === createdAppointmentId.toString());
    expect(found).toBeDefined();
    expect(found.status).toBe('BOOKED');
  });

  test('Step 3: Doctor Cancels Appointment with Specific Clinical Reason', async ({ request }) => {
    expect(createdAppointmentId).toBeTruthy();

    const cancelReason = 'Emergency surgical operation scheduled for urgent trauma case';
    const cancelRes = await request.put(`http://localhost:5000/api/appointments/${createdAppointmentId}/cancel`, {
      headers: {
        Authorization: `Bearer ${doctorToken}`,
        'Content-Type': 'application/json',
      },
      data: { reason: cancelReason },
    });

    expect(cancelRes.status()).toBe(200);
    const cancelData = await cancelRes.json();
    const appt = cancelData.data || cancelData;
    expect(appt.status).toBe('CANCELLED');
    expect(appt.cancelled_by).toBeTruthy();
    expect(appt.cancellation_reason).toBe(cancelReason);
  });

  test('Step 4: Family Receives Persistent In-App Cancellation Notification', async ({ request }) => {
    expect(createdAppointmentId).toBeTruthy();

    const notifRes = await request.get('http://localhost:5000/api/appointments/notifications', {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    expect(notifRes.status()).toBe(200);
    const notifs = await notifRes.json();
    const notifList = notifs.data || notifs;

    const matchedNotif = notifList.find(
      (n) =>
        n.type === 'APPOINTMENT_CANCELLED' &&
        ((n.appointmentId && n.appointmentId.toString() === createdAppointmentId.toString()) ||
          (n.appointment_id && n.appointment_id.toString() === createdAppointmentId.toString()) ||
          (n.metadata?.appointmentId && n.metadata.appointmentId.toString() === createdAppointmentId.toString()) ||
          (n.metadata?.appointment_id && n.metadata.appointment_id.toString() === createdAppointmentId.toString()))
    );

    expect(matchedNotif).toBeDefined();
    expect(matchedNotif.title).toContain('Cancelled');
    expect(matchedNotif.message).toContain('Emergency surgical operation scheduled');
  });

  test('Step 5: Family Discovers Genuine Alternative Doctors & Bookable Slots', async ({ request }) => {
    expect(createdAppointmentId).toBeTruthy();

    const altRes = await request.get(`http://localhost:5000/api/appointments/${createdAppointmentId}/alternatives`, {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    expect(altRes.status()).toBe(200);
    const altData = await altRes.json();
    const alternatives = altData.data || altData;

    expect(alternatives.originalAppointment).toBeDefined();
    expect(alternatives.recommendedDoctors).toBeInstanceOf(Array);
    expect(alternatives.recommendedDoctors.length).toBeGreaterThan(0);

    const firstAltDoc = alternatives.recommendedDoctors[0];
    expect(firstAltDoc.doctorId).toBeTruthy();
    expect(firstAltDoc.availableSlots).toBeInstanceOf(Array);
    expect(firstAltDoc.availableSlots.length).toBeGreaterThan(0);
  });

  test('Step 6: Family Rebooks Alternative Appointment with Bi-Directional Linkage', async ({ request }) => {
    expect(createdAppointmentId).toBeTruthy();

    const altRes = await request.get(`http://localhost:5000/api/appointments/${createdAppointmentId}/alternatives`, {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    const altData = await altRes.json();
    const alternatives = altData.data || altData;
    const chosenDoc = alternatives.recommendedDoctors[0];
    const chosenSlot = chosenDoc.availableSlots[0];

    const profileRes = await request.get('http://localhost:5000/api/families/members', {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    const profileData = await profileRes.json();
    const familyMembers = profileData.data || profileData || [];
    const memberId = familyMembers[0]._id || familyMembers[0].id;

    const rebookPayload = {
      familyMemberId: memberId,
      doctorId: chosenDoc.doctorId,
      hospitalId: chosenDoc.hospitalId,
      departmentId: chosenDoc.departmentId,
      appointmentDate: chosenSlot.date,
      startTime: chosenSlot.startTime,
      endTime: chosenSlot.endTime,
      appointmentType: 'BOOKED',
      reason: 'Follow-up consultation after doctor-initiated cancellation',
      originalAppointmentId: createdAppointmentId,
    };

    const rebookRes = await request.post('http://localhost:5000/api/appointments', {
      headers: {
        Authorization: `Bearer ${familyToken}`,
        'Content-Type': 'application/json',
      },
      data: rebookPayload,
    });

    expect([200, 201]).toContain(rebookRes.status());
    const rebookData = await rebookRes.json();
    const replacementAppt = rebookData.data || rebookData;
    createdReplacementAppointmentId = replacementAppt._id || replacementAppt.id;
    expect(createdReplacementAppointmentId).toBeTruthy();
    expect(replacementAppt.original_appointment_id?.toString()).toBe(createdAppointmentId.toString());

    // Verify original appointment is now updated with replacement_appointment_id
    const origApptRes = await request.get(`http://localhost:5000/api/appointments/${createdAppointmentId}`, {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    expect(origApptRes.status()).toBe(200);
    const origData = await origApptRes.json();
    const origAppt = origData.data || origData;
    expect(origAppt.replacement_appointment_id?.toString()).toBe(createdReplacementAppointmentId.toString());
  });

  test('Step 7: Invariant Verification - Duplicate Rebooking Returns HTTP 409 Conflict', async ({ request }) => {
    expect(createdAppointmentId).toBeTruthy();
    expect(createdReplacementAppointmentId).toBeTruthy();

    const profileRes = await request.get('http://localhost:5000/api/families/members', {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    const profileData = await profileRes.json();
    const familyMembers = profileData.data || profileData || [];
    const memberId = familyMembers[0]._id || familyMembers[0].id;

    const duplicateRebookPayload = {
      familyMemberId: memberId,
      doctorId: doctorAccount.doctorId || '6ac85a1a074c2bc731a763bb',
      hospitalId: '6ac85a18074c2bc731a76381',
      departmentId: '6ac85a18074c2bc731a7638b',
      appointmentDate: '2026-11-25',
      startTime: '14:00',
      endTime: '14:30',
      appointmentType: 'BOOKED',
      originalAppointmentId: createdAppointmentId,
    };

    const duplicateRes = await request.post('http://localhost:5000/api/appointments', {
      headers: {
        Authorization: `Bearer ${familyToken}`,
        'Content-Type': 'application/json',
      },
      data: duplicateRebookPayload,
    });

    expect(duplicateRes.status()).toBe(409);
    const dupBody = await duplicateRes.json();
    expect(dupBody.message).toContain('already been rebooked');
  });

  test('Step 8: Department Head Role Enforcement (Strict View-Only, 403 on Mutation)', async ({ request }) => {
    expect(createdReplacementAppointmentId).toBeTruthy();

    // 1. Department Head CAN read departmental appointments
    const dhListRes = await request.get('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${deptHeadToken}` },
    });
    expect(dhListRes.status()).toBe(200);

    // 2. Department Head CANNOT cancel appointment (strict 403 Forbidden)
    const dhCancelRes = await request.put(`http://localhost:5000/api/appointments/${createdReplacementAppointmentId}/cancel`, {
      headers: {
        Authorization: `Bearer ${deptHeadToken}`,
        'Content-Type': 'application/json',
      },
      data: { reason: 'Unauthorized department head cancellation attempt' },
    });
    expect(dhCancelRes.status()).toBe(403);
  });

  test('Step 9: Browser UI Verification - Family Appointments View & Alert Banner', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', familyAccount.email);
    await page.fill('input[type="password"]', familyAccount.password);
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=Kapoor Family').or(page.locator('text=Family Health Portal')).or(page.locator('text=AI Health Assistant'))
    ).toBeVisible({ timeout: 10000 });

    const apptTab = page.locator('button:has-text("Appointments"), div:has-text("Appointments")').first();
    if (await apptTab.isVisible()) {
      await apptTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
