import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    specialization: {
      type: String,
      default: null,
    },
    floor: {
      type: String,
      default: null,
    },
    bedCapacity: {
      type: Number,
      default: 0,
    },
    occupiedBeds: {
      type: Number,
      default: 0,
    },
    linkedAi: {
      type: String,
      default: null,
    },
    aiModuleId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

departmentSchema.index({ hospital_id: 1, name: 1 }, { unique: true });

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;
