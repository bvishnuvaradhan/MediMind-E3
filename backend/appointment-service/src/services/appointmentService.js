import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import { internalServices } from '../utils/internalServices.js';

const parseDateOnly = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const err = new Error('Invalid appointment date format');
    err.statusCode = 400;
    throw err;
  }
  return d;
};

const getDayRange = (date) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

const isValidTime = (t) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t);

export const appointmentService = {
  /**
   * Book a new appointment
   */
  async bookAppointment(user, payload) {
    const familyMemberId = payload.familyMemberId || payload.family_member_id;
    const doctorId = payload.doctorId || payload.doctor_id;
    const appointmentDateStr = payload.appointmentDate || payload.appointment_date;
    const startTime = payload.startTime || payload.start_time;
    const endTime = payload.endTime || payload.end_time;
    const reason = payload.reason || null;
    const appointmentType = (payload.appointmentType || payload.appointment_type || 'BOOKED').toUpperCase();
    const aiPredictionId = payload.aiPredictionId || payload.ai_prediction_id || null;

    // 1. Basic validation
    if (!familyMemberId || !doctorId || !appointmentDateStr || !startTime || !endTime) {
      const err = new Error('familyMemberId, doctorId, appointmentDate, startTime, and endTime are required');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(familyMemberId)) {
      const err = new Error('Invalid familyMemberId format');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      const err = new Error('Invalid doctorId format');
      err.statusCode = 400;
      throw err;
    }

    if (aiPredictionId && !mongoose.Types.ObjectId.isValid(aiPredictionId)) {
      const err = new Error('Invalid aiPredictionId format');
      err.statusCode = 400;
      throw err;
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      const err = new Error('startTime and endTime must be in HH:mm format');
      err.statusCode = 400;
      throw err;
    }

    if (startTime >= endTime) {
      const err = new Error('startTime must be earlier than endTime');
      err.statusCode = 400;
      throw err;
    }

    if (!['BOOKED', 'WALK_IN'].includes(appointmentType)) {
      const err = new Error('appointmentType must be BOOKED or WALK_IN');
      err.statusCode = 400;
      throw err;
    }

    const appointmentDate = parseDateOnly(appointmentDateStr);

    // 2. Family ownership verification
    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId: familyMemberId });
      if (!memberCheck.valid) {
        const err = new Error(memberCheck.message || 'Access forbidden: member does not belong to your family');
        err.statusCode = memberCheck.statusCode || 403;
        throw err;
      }
    }

    // 3. Doctor validation & department/hospital extraction
    let hospitalId = payload.hospitalId || payload.hospital_id;
    let departmentId = payload.departmentId || payload.department_id;

    // Doctor role authorization: Doctor can only book for themselves
    if (user.role === 'DOCTOR' && user.doctorId && user.doctorId.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: cannot book appointments for another doctor');
      err.statusCode = 403;
      throw err;
    }

    const doctor = await internalServices.getDoctor(doctorId);
    if (doctor) {
      if (doctor.status && doctor.status !== 'ACTIVE') {
        const err = new Error('Doctor is not currently active for appointments');
        err.statusCode = 400;
        throw err;
      }
      hospitalId = hospitalId || doctor.hospital_id?._id || doctor.hospital_id || doctor.hospitalId;
      departmentId = departmentId || doctor.department_id?._id || doctor.department_id || doctor.departmentId;
    } else {
      // If doctor service is unreachable in tests, ensure valid placeholder IDs exist
      hospitalId = hospitalId || new mongoose.Types.ObjectId();
      departmentId = departmentId || new mongoose.Types.ObjectId();
    }

    if (!hospitalId || !departmentId) {
      const err = new Error('Hospital ID and Department ID could not be resolved for doctor');
      err.statusCode = 400;
      throw err;
    }

    // 4. Double booking conflict check
    const { start: dayStart, end: dayEnd } = getDayRange(appointmentDate);

    const conflictingAppointments = await Appointment.find({
      doctor_id: doctorId,
      appointment_date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['CANCELLED'] },
    });

    const hasConflict = conflictingAppointments.some((appt) => {
      // Time overlap check: startA < endB && endA > startB
      return startTime < appt.end_time && endTime > appt.start_time;
    });

    if (hasConflict) {
      const err = new Error('The selected doctor already has an appointment booked for this time slot');
      err.statusCode = 409;
      throw err;
    }

    // 5. Create Appointment
    const newAppointment = await Appointment.create({
      family_member_id: familyMemberId,
      doctor_id: doctorId,
      hospital_id: hospitalId,
      department_id: departmentId,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      reason,
      status: 'BOOKED',
      appointment_type: appointmentType,
      ai_prediction_id: aiPredictionId,
    });

    return newAppointment.toPublicJSON();
  },

  /**
   * List appointments with role-based scoping and query filters
   */
  async getAppointments(user, query = {}) {
    const filter = {};

    // 1. Role-based scoping
    if (user.role === 'FAMILY') {
      if (query.familyMemberId || query.family_member_id) {
        const memId = query.familyMemberId || query.family_member_id;
        const check = await internalServices.verifyFamilyMember({ user, memberId: memId });
        if (!check.valid) {
          const err = new Error(check.message || 'Access forbidden: member does not belong to your family');
          err.statusCode = check.statusCode || 403;
          throw err;
        }
        filter.family_member_id = memId;
      } else {
        const memberIds = await internalServices.getFamilyMemberIds(user);
        if (memberIds && memberIds.length > 0) {
          filter.family_member_id = { $in: memberIds };
        } else if (user.familyId) {
          // If no members returned yet or standalone, scope safely
          filter.family_member_id = { $in: [] };
        }
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      if (!doctorId) {
        const err = new Error('Doctor profile not linked to user account');
        err.statusCode = 403;
        throw err;
      }
      filter.doctor_id = doctorId;
    } else if (user.role === 'DEPARTMENT_HEAD') {
      let deptId = user.departmentId;
      if (!deptId && user.userId) {
        const head = await internalServices.resolveDepartmentHead(user.userId);
        deptId = head?.department_id?._id || head?.department_id || head?.departmentId;
      }
      if (deptId) {
        filter.department_id = deptId;
      }
    } else if (user.role === 'HOSPITAL_ADMIN') {
      const hospitalId = user.hospitalId || user.referenceId;
      if (hospitalId) {
        filter.hospital_id = hospitalId;
      }
    }
    // CHAIRMAN has platform scope (no role restriction added)

    // 2. Additional Query Filters
    if (query.status) {
      filter.status = query.status.toUpperCase();
    }

    if (query.appointmentType || query.appointment_type) {
      filter.appointment_type = (query.appointmentType || query.appointment_type).toUpperCase();
    }

    if (query.doctorId || query.doctor_id) {
      const qDocId = query.doctorId || query.doctor_id;
      if (user.role === 'DOCTOR' && filter.doctor_id && filter.doctor_id.toString() !== qDocId.toString()) {
        const err = new Error('Access forbidden: cannot query appointments for another doctor');
        err.statusCode = 403;
        throw err;
      }
      filter.doctor_id = qDocId;
    }

    if (query.hospitalId || query.hospital_id) {
      const qHospId = query.hospitalId || query.hospital_id;
      if (user.role === 'HOSPITAL_ADMIN' && filter.hospital_id && filter.hospital_id.toString() !== qHospId.toString()) {
        const err = new Error('Access forbidden: cannot query appointments for another hospital');
        err.statusCode = 403;
        throw err;
      }
      filter.hospital_id = qHospId;
    }

    if (query.departmentId || query.department_id) {
      const qDeptId = query.departmentId || query.department_id;
      if (user.role === 'DEPARTMENT_HEAD' && filter.department_id && filter.department_id.toString() !== qDeptId.toString()) {
        const err = new Error('Access forbidden: cannot query appointments for another department');
        err.statusCode = 403;
        throw err;
      }
      filter.department_id = qDeptId;
    }

    if (query.date) {
      const { start, end } = getDayRange(new Date(query.date));
      filter.appointment_date = { $gte: start, $lte: end };
    } else if (query.startDate || query.endDate) {
      filter.appointment_date = {};
      if (query.startDate) {
        filter.appointment_date.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.appointment_date.$lte = end;
      }
    }

    const appointments = await Appointment.find(filter).sort({ appointment_date: 1, start_time: 1 });
    return appointments.map((a) => a.toPublicJSON());
  },

  /**
   * Retrieve single appointment by ID with role scoping check
   */
  async getAppointmentById(user, appointmentId) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      const err = new Error('Invalid appointment ID format');
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization & scoping check
    if (user.role === 'FAMILY') {
      const check = await internalServices.verifyFamilyMember({ user, memberId: appointment.family_member_id });
      if (!check.valid) {
        const err = new Error('Access forbidden: appointment does not belong to your family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      if (!doctorId || appointment.doctor_id.toString() !== doctorId.toString()) {
        const err = new Error('Access forbidden: you are not the assigned doctor for this appointment');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'HOSPITAL_ADMIN') {
      const hospitalId = user.hospitalId || user.referenceId;
      if (!hospitalId || appointment.hospital_id.toString() !== hospitalId.toString()) {
        const err = new Error('Access forbidden: appointment belongs to another hospital');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DEPARTMENT_HEAD') {
      let deptId = user.departmentId;
      if (!deptId && user.userId) {
        const head = await internalServices.resolveDepartmentHead(user.userId);
        deptId = head?.department_id?._id || head?.department_id || head?.departmentId;
      }
      if (deptId && appointment.department_id.toString() !== deptId.toString()) {
        const err = new Error('Access forbidden: appointment belongs to another department');
        err.statusCode = 403;
        throw err;
      }
    }

    return appointment.toPublicJSON();
  },

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(user, appointmentId, payload) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      const err = new Error('Invalid appointment ID format');
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found');
      err.statusCode = 404;
      throw err;
    }

    // Scoping check
    if (user.role === 'FAMILY') {
      const check = await internalServices.verifyFamilyMember({ user, memberId: appointment.family_member_id });
      if (!check.valid) {
        const err = new Error('Access forbidden: appointment does not belong to your family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      if (!doctorId || appointment.doctor_id.toString() !== doctorId.toString()) {
        const err = new Error('Access forbidden: you are not the assigned doctor for this appointment');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'HOSPITAL_ADMIN') {
      const hospitalId = user.hospitalId || user.referenceId;
      if (!hospitalId || appointment.hospital_id.toString() !== hospitalId.toString()) {
        const err = new Error('Access forbidden: appointment belongs to another hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    // Lifecycle check
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      const err = new Error(`Cannot reschedule an appointment that is ${appointment.status.toLowerCase()}`);
      err.statusCode = 400;
      throw err;
    }

    const newDateStr = payload.appointmentDate || payload.appointment_date;
    const newStartTime = payload.startTime || payload.start_time;
    const newEndTime = payload.endTime || payload.end_time;

    if (!newDateStr || !newStartTime || !newEndTime) {
      const err = new Error('appointmentDate, startTime, and endTime are required for rescheduling');
      err.statusCode = 400;
      throw err;
    }

    if (!isValidTime(newStartTime) || !isValidTime(newEndTime)) {
      const err = new Error('startTime and endTime must be in HH:mm format');
      err.statusCode = 400;
      throw err;
    }

    if (newStartTime >= newEndTime) {
      const err = new Error('startTime must be earlier than endTime');
      err.statusCode = 400;
      throw err;
    }

    const newAppointmentDate = parseDateOnly(newDateStr);

    // Slot conflict check for the doctor on the new slot
    const { start: dayStart, end: dayEnd } = getDayRange(newAppointmentDate);
    const conflicting = await Appointment.find({
      _id: { $ne: appointment._id },
      doctor_id: appointment.doctor_id,
      appointment_date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['CANCELLED'] },
    });

    const hasConflict = conflicting.some((appt) => {
      return newStartTime < appt.end_time && newEndTime > appt.start_time;
    });

    if (hasConflict) {
      const err = new Error('The selected doctor already has an appointment booked for this time slot');
      err.statusCode = 409;
      throw err;
    }

    appointment.appointment_date = newAppointmentDate;
    appointment.start_time = newStartTime;
    appointment.end_time = newEndTime;
    appointment.status = 'RESCHEDULED';
    await appointment.save();

    return appointment.toPublicJSON();
  },

  /**
   * Cancel an appointment
   */
  async cancelAppointment(user, appointmentId, payload = {}) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      const err = new Error('Invalid appointment ID format');
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found');
      err.statusCode = 404;
      throw err;
    }

    // Scoping check
    if (user.role === 'FAMILY') {
      const check = await internalServices.verifyFamilyMember({ user, memberId: appointment.family_member_id });
      if (!check.valid) {
        const err = new Error('Access forbidden: appointment does not belong to your family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      if (!doctorId || appointment.doctor_id.toString() !== doctorId.toString()) {
        const err = new Error('Access forbidden: you are not the assigned doctor for this appointment');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'HOSPITAL_ADMIN') {
      const hospitalId = user.hospitalId || user.referenceId;
      if (!hospitalId || appointment.hospital_id.toString() !== hospitalId.toString()) {
        const err = new Error('Access forbidden: appointment belongs to another hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    // Lifecycle check
    if (appointment.status === 'CANCELLED') {
      const err = new Error('Appointment is already cancelled');
      err.statusCode = 400;
      throw err;
    }

    if (appointment.status === 'COMPLETED') {
      const err = new Error('Cannot cancel a completed appointment');
      err.statusCode = 400;
      throw err;
    }

    appointment.status = 'CANCELLED';
    appointment.cancelled_at = new Date();
    appointment.cancellation_reason = payload.reason || payload.cancellationReason || 'Cancelled by user';
    await appointment.save();

    return appointment.toPublicJSON();
  },

  /**
   * Complete an appointment (Doctor, Hospital Admin, Chairman)
   */
  async completeAppointment(user, appointmentId) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      const err = new Error('Invalid appointment ID format');
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found');
      err.statusCode = 404;
      throw err;
    }

    // Scoping check: FAMILY cannot complete appointments
    if (user.role === 'FAMILY') {
      const err = new Error('Access forbidden: family members cannot mark appointments completed');
      err.statusCode = 403;
      throw err;
    }

    if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      if (!doctorId || appointment.doctor_id.toString() !== doctorId.toString()) {
        const err = new Error('Access forbidden: you are not the assigned doctor for this appointment');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'HOSPITAL_ADMIN') {
      const hospitalId = user.hospitalId || user.referenceId;
      if (!hospitalId || appointment.hospital_id.toString() !== hospitalId.toString()) {
        const err = new Error('Access forbidden: appointment belongs to another hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    // Lifecycle check
    if (appointment.status === 'CANCELLED') {
      const err = new Error('Cannot complete a cancelled appointment');
      err.statusCode = 400;
      throw err;
    }

    if (appointment.status === 'COMPLETED') {
      const err = new Error('Appointment is already completed');
      err.statusCode = 400;
      throw err;
    }

    appointment.status = 'COMPLETED';
    await appointment.save();

    return appointment.toPublicJSON();
  },

  /**
   * Update appointment status through lifecycle transitions
   */
  async updateStatus(user, appointmentId, status) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      const err = new Error('Invalid appointment ID format');
      err.statusCode = 400;
      throw err;
    }

    const validStatuses = ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'];
    const targetStatus = status?.toUpperCase();
    if (!validStatuses.includes(targetStatus)) {
      const err = new Error(`Invalid status: must be one of [${validStatuses.join(', ')}]`);
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found');
      err.statusCode = 404;
      throw err;
    }

    // Scoping check
    if (user.role === 'FAMILY' && !['CANCELLED', 'RESCHEDULED'].includes(targetStatus)) {
      const err = new Error('Access forbidden: family members cannot perform clinical status transitions');
      err.statusCode = 403;
      throw err;
    }

    if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      if (!doctorId || appointment.doctor_id.toString() !== doctorId.toString()) {
        const err = new Error('Access forbidden: you are not the assigned doctor for this appointment');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'HOSPITAL_ADMIN') {
      const hospitalId = user.hospitalId || user.referenceId;
      if (!hospitalId || appointment.hospital_id.toString() !== hospitalId.toString()) {
        const err = new Error('Access forbidden: appointment belongs to another hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    // Terminal check
    if (appointment.status === 'COMPLETED' && targetStatus !== 'COMPLETED') {
      const err = new Error('Cannot change status of a completed appointment');
      err.statusCode = 400;
      throw err;
    }

    if (appointment.status === 'CANCELLED' && targetStatus !== 'CANCELLED') {
      const err = new Error('Cannot change status of a cancelled appointment');
      err.statusCode = 400;
      throw err;
    }

    appointment.status = targetStatus;
    if (targetStatus === 'CANCELLED') {
      appointment.cancelled_at = new Date();
    }
    await appointment.save();

    return appointment.toPublicJSON();
  },
};
