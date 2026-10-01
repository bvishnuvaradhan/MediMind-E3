import mongoose from 'mongoose';

const familySchema = new mongoose.Schema(
  {
    family_name: {
      type: String,
      required: true,
      trim: true,
    },

    creator_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'DEACTIVATED', 'DELETED'],
      default: 'ACTIVE',
    },

    deactivated_at: {
      type: Date,
      default: null,
    },

    deleted_at: {
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

familySchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    familyId: this._id.toString(),
    familyName: this.family_name,
    creatorUserId: this.creator_user_id ? this.creator_user_id.toString() : null,
    email: this.email,
    mobile: this.mobile,
    status: this.status,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const Family = mongoose.models.Family || mongoose.model('Family', familySchema);

export default Family;
