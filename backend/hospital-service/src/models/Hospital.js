import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    tagline: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: 'Multi-Specialty Hospital',
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: 'India',
      },
      pincode: {
        type: String,
        required: true,
      },
    },
    phone: {
      type: String,
      required: true,
    },
    emergencyPhone: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    adminEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
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
    facilities: [
      {
        type: String,
      },
    ],
    operatingHours: {
      type: String,
      default: '24/7',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'APPROVED'],
      default: 'ACTIVE',
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

export default Hospital;
