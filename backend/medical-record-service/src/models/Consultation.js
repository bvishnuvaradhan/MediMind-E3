import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
    family_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Family member ID is required'],
      index: true,
    },

    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Doctor ID is required'],
      index: true,
    },

    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Appointment ID is required'],
      index: true,
    },

    symptoms: {
      type: String,
      default: null,
      trim: true,
    },

    observations: {
      type: String,
      default: null,
      trim: true,
    },

    clinical_assessment: {
      type: String,
      default: null,
      trim: true,
    },

    treatment_plan: {
      type: String,
      default: null,
      trim: true,
    },

    ai_prediction_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },

    notes: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ['DRAFT', 'FINAL', 'AMENDED'],
      default: 'DRAFT',
      index: true,
    },

    finalized_at: {
      type: Date,
      default: null,
    },

    amendment_of: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

consultationSchema.index({ family_member_id: 1, status: 1 });
consultationSchema.index({ doctor_id: 1, appointment_id: 1 });

consultationSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    familyMemberId: this.family_member_id,
    family_member_id: this.family_member_id,
    doctorId: this.doctor_id,
    doctor_id: this.doctor_id,
    appointmentId: this.appointment_id,
    appointment_id: this.appointment_id,
    symptoms: this.symptoms,
    observations: this.observations,
    clinicalAssessment: this.clinical_assessment,
    clinical_assessment: this.clinical_assessment,
    treatmentPlan: this.treatment_plan,
    treatment_plan: this.treatment_plan,
    aiPredictionIds: this.ai_prediction_ids,
    ai_prediction_ids: this.ai_prediction_ids,
    notes: this.notes,
    status: this.status,
    finalizedAt: this.finalized_at,
    finalized_at: this.finalized_at,
    amendmentOf: this.amendment_of,
    amendment_of: this.amendment_of,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;
