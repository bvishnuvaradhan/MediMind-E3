import mongoose from 'mongoose';

const hospitalRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: null,
    },
    type: {
      type: String,
      default: 'Tertiary Care Hospital',
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'India',
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactRole: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyPhone: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    requestedDepartments: [
      {
        type: String,
        trim: true,
      },
    ],
    bedCapacity: {
      type: Number,
      default: 0,
    },
    accreditation: {
      type: String,
      default: null,
    },
    facilityLevel: {
      type: String,
      default: null,
    },
    establishedYear: {
      type: Number,
      default: null,
    },
    licenseNumber: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    submittedDate: {
      type: Date,
      default: Date.now,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    decision_by: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    decision_at: {
      type: Date,
      default: null,
    },
    created_hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const HospitalRequest = mongoose.models.HospitalRequest || mongoose.model('HospitalRequest', hospitalRequestSchema);

export default HospitalRequest;
