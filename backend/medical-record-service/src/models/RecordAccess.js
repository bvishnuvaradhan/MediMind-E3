import mongoose from 'mongoose';

const recordAccessSchema = new mongoose.Schema(
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

    granted_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Granted by user ID is required'],
    },

    granted_at: {
      type: Date,
      default: Date.now,
    },

    revoked_at: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED'],
      default: 'ACTIVE',
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

recordAccessSchema.index({ family_member_id: 1, doctor_id: 1, status: 1 });

recordAccessSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    familyMemberId: this.family_member_id,
    family_member_id: this.family_member_id,
    doctorId: this.doctor_id,
    doctor_id: this.doctor_id,
    grantedBy: this.granted_by,
    granted_by: this.granted_by,
    grantedAt: this.granted_at,
    granted_at: this.granted_at,
    revokedAt: this.revoked_at,
    revoked_at: this.revoked_at,
    status: this.status,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const RecordAccess = mongoose.model('RecordAccess', recordAccessSchema);

export default RecordAccess;
