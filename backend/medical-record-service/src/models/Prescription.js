import mongoose from 'mongoose';

const medicineItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    instructions: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
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

    consultation_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Consultation ID is required'],
      index: true,
    },

    medicines: {
      type: [medicineItemSchema],
      required: [true, 'At least one medicine is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Prescription must contain at least one medicine',
      },
    },

    general_instructions: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ['DRAFT', 'FINAL', 'CORRECTED'],
      default: 'DRAFT',
      index: true,
    },

    finalized_at: {
      type: Date,
      default: null,
    },

    correction_of: {
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

prescriptionSchema.index({ family_member_id: 1, status: 1 });
prescriptionSchema.index({ doctor_id: 1, consultation_id: 1 });

prescriptionSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    familyMemberId: this.family_member_id,
    family_member_id: this.family_member_id,
    doctorId: this.doctor_id,
    doctor_id: this.doctor_id,
    consultationId: this.consultation_id,
    consultation_id: this.consultation_id,
    medicines: this.medicines,
    generalInstructions: this.general_instructions,
    general_instructions: this.general_instructions,
    status: this.status,
    finalizedAt: this.finalized_at,
    finalized_at: this.finalized_at,
    correctionOf: this.correction_of,
    correction_of: this.correction_of,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
