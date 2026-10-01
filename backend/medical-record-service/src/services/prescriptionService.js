import mongoose from 'mongoose';
import Prescription from '../models/Prescription.js';
import Consultation from '../models/Consultation.js';
import { internalServices } from '../utils/internalServices.js';
import { recordAccessService } from './recordAccessService.js';

export const prescriptionService = {
  /**
   * Create a new prescription in DRAFT status (Doctor only)
   */
  async createPrescription(user, payload) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can create prescriptions');
      err.statusCode = 403;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (!doctorId) {
      const err = new Error('Doctor profile not linked to user account');
      err.statusCode = 403;
      throw err;
    }

    const familyMemberId = payload.familyMemberId || payload.family_member_id;
    const consultationId = payload.consultationId || payload.consultation_id;
    const medicines = payload.medicines;

    if (!familyMemberId || !consultationId) {
      const err = new Error('familyMemberId and consultationId are required');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(familyMemberId)) {
      const err = new Error('Invalid familyMemberId format');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(consultationId)) {
      const err = new Error('Invalid consultationId format');
      err.statusCode = 400;
      throw err;
    }

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      const err = new Error('Prescription must contain at least one medicine');
      err.statusCode = 400;
      throw err;
    }

    for (const med of medicines) {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        const err = new Error('Each medicine must have name, dosage, frequency, and duration');
        err.statusCode = 400;
        throw err;
      }
    }

    // Verify consultation
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      const err = new Error('Consultation not found');
      err.statusCode = 404;
      throw err;
    }

    if (consultation.doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: cannot create prescription for another doctor\'s consultation');
      err.statusCode = 403;
      throw err;
    }

    const prescription = await Prescription.create({
      family_member_id: familyMemberId,
      doctor_id: doctorId,
      consultation_id: consultationId,
      medicines,
      general_instructions: payload.generalInstructions || payload.general_instructions || null,
      status: 'DRAFT',
    });

    return prescription.toPublicJSON();
  },

  /**
   * Retrieve prescriptions for a family member
   */
  async getPrescriptionsByMember(user, memberId) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const err = new Error('Invalid member ID format');
      err.statusCode = 400;
      throw err;
    }

    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId });
      if (!memberCheck.valid) {
        const err = new Error(memberCheck.message || 'Access forbidden: member does not belong to your family');
        err.statusCode = memberCheck.statusCode || 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      const hasAccess = await recordAccessService.hasActiveAccess(doctorId, memberId);
      const hasPrescription = await Prescription.exists({ doctor_id: doctorId, family_member_id: memberId });
      if (!hasAccess && !hasPrescription) {
        const err = new Error('Access forbidden: active doctor record access authorization required');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('Access forbidden: administrative roles cannot access private patient prescriptions');
      err.statusCode = 403;
      throw err;
    }

    const prescriptions = await Prescription.find({
      family_member_id: memberId,
    }).sort({ created_at: -1 });

    return prescriptions.map((p) => p.toPublicJSON());
  },

  /**
   * Retrieve single prescription by ID
   */
  async getPrescriptionById(user, prescriptionId) {
    if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
      const err = new Error('Invalid prescription ID format');
      err.statusCode = 400;
      throw err;
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      const err = new Error('Prescription not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId: prescription.family_member_id });
      if (!memberCheck.valid) {
        const err = new Error('Access forbidden: prescription belongs to a member outside your family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      const isAuthor = prescription.doctor_id.toString() === doctorId.toString();
      const hasAccess = await recordAccessService.hasActiveAccess(doctorId, prescription.family_member_id);
      if (!isAuthor && !hasAccess) {
        const err = new Error('Access forbidden: you are not authorized to view this prescription');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('Access forbidden: administrative roles cannot access private patient prescriptions');
      err.statusCode = 403;
      throw err;
    }

    return prescription.toPublicJSON();
  },

  /**
   * Update DRAFT prescription (Doctor only)
   */
  async updateDraft(user, prescriptionId, payload) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can update prescriptions');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
      const err = new Error('Invalid prescription ID format');
      err.statusCode = 400;
      throw err;
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      const err = new Error('Prescription not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (prescription.doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: only the authoring doctor can update this prescription');
      err.statusCode = 403;
      throw err;
    }

    if (prescription.status !== 'DRAFT') {
      const err = new Error(`Cannot edit a prescription that is ${prescription.status.toLowerCase()}`);
      err.statusCode = 400;
      throw err;
    }

    if (payload.medicines !== undefined) {
      if (!Array.isArray(payload.medicines) || payload.medicines.length === 0) {
        const err = new Error('Prescription must contain at least one medicine');
        err.statusCode = 400;
        throw err;
      }
      for (const med of payload.medicines) {
        if (!med.name || !med.dosage || !med.frequency || !med.duration) {
          const err = new Error('Each medicine must have name, dosage, frequency, and duration');
          err.statusCode = 400;
          throw err;
        }
      }
      prescription.medicines = payload.medicines;
    }

    if (payload.generalInstructions !== undefined || payload.general_instructions !== undefined) {
      prescription.general_instructions = payload.generalInstructions !== undefined ? payload.generalInstructions : payload.general_instructions;
    }

    await prescription.save();
    return prescription.toPublicJSON();
  },

  /**
   * Finalize prescription (DRAFT -> FINAL)
   */
  async finalizePrescription(user, prescriptionId) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can finalize prescriptions');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
      const err = new Error('Invalid prescription ID format');
      err.statusCode = 400;
      throw err;
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      const err = new Error('Prescription not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (prescription.doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: only the authoring doctor can finalize this prescription');
      err.statusCode = 403;
      throw err;
    }

    if (prescription.status !== 'DRAFT') {
      const err = new Error(`Prescription is already ${prescription.status.toLowerCase()}`);
      err.statusCode = 400;
      throw err;
    }

    prescription.status = 'FINAL';
    prescription.finalized_at = new Date();
    await prescription.save();

    return prescription.toPublicJSON();
  },

  /**
   * Correct prescription (Creates new linked prescription with status CORRECTED)
   */
  async correctPrescription(user, prescriptionId, payload = {}) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can correct prescriptions');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
      const err = new Error('Invalid prescription ID format');
      err.statusCode = 400;
      throw err;
    }

    const original = await Prescription.findById(prescriptionId);
    if (!original) {
      const err = new Error('Prescription not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (original.doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: only the authoring doctor can correct this prescription');
      err.statusCode = 403;
      throw err;
    }

    if (original.status === 'DRAFT') {
      const err = new Error('Cannot correct a draft prescription; finalize it first');
      err.statusCode = 400;
      throw err;
    }

    const newMedicines = payload.medicines || original.medicines;
    if (!Array.isArray(newMedicines) || newMedicines.length === 0) {
      const err = new Error('Prescription must contain at least one medicine');
      err.statusCode = 400;
      throw err;
    }

    const correctedPrescription = await Prescription.create({
      family_member_id: original.family_member_id,
      doctor_id: original.doctor_id,
      consultation_id: original.consultation_id,
      medicines: newMedicines,
      general_instructions: payload.generalInstructions !== undefined
        ? payload.generalInstructions
        : (payload.general_instructions !== undefined ? payload.general_instructions : original.general_instructions),
      status: 'CORRECTED',
      finalized_at: new Date(),
      correction_of: original._id,
    });

    return correctedPrescription.toPublicJSON();
  },
};
