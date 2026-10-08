import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password_hash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
      enum: [
        'FAMILY',
        'DOCTOR',
        'DEPARTMENT_HEAD',
        'HOSPITAL_ADMIN',
        'CHAIRMAN',
      ],
    },

    account_type: {
      type: String,
      required: true,
      enum: [
        'FAMILY_ACCOUNT',
        'DOCTOR_ACCOUNT',
        'DEPARTMENT_HEAD_ACCOUNT',
        'HOSPITAL_ADMIN_ACCOUNT',
        'CHAIRMAN_ACCOUNT',
      ],
    },

    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    family_id: {
      type: String,
      default: null,
    },

    doctor_id: {
      type: String,
      default: null,
    },

    department_id: {
      type: String,
      default: null,
    },

    hospital_id: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
      default: 'ACTIVE',
    },

    last_login_at: {
      type: Date,
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

// Method to format public user profile safely
userSchema.methods.toPublicJSON = function () {
  return {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
    accountType: this.account_type,
    referenceId: this.reference_id ? this.reference_id.toString() : this._id.toString(),
    familyId: this.family_id || (this.role === 'FAMILY' ? 'FAM-001' : null),
    doctorId: this.doctor_id || null,
    departmentId: this.department_id || null,
    hospitalId: this.hospital_id || null,
    status: this.status,
    lastLoginAt: this.last_login_at,
  };
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
