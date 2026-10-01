import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ],
      required: true,
    },
    start_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    profile_picture: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    qualifications: {
      type: [String],
      default: [],
    },
    experience_years: {
      type: Number,
      min: 0,
      default: 0,
    },
    professional_description: {
      type: String,
      default: null,
    },
    availability: {
      type: [availabilitySlotSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
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

doctorSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    doctorId: this._id.toString(),
    userId: this.user_id ? this.user_id.toString() : null,
    hospitalId: this.hospital_id ? this.hospital_id.toString() : null,
    departmentId: this.department_id ? this.department_id.toString() : null,
    fullName: this.full_name,
    email: this.email,
    mobile: this.mobile,
    specialization: this.specialization,
    qualifications: this.qualifications || [],
    experienceYears: this.experience_years,
    professionalDescription: this.professional_description,
    profilePicture: this.profile_picture,
    availability: (this.availability || []).map((a) => ({
      day: a.day,
      startTime: a.start_time,
      endTime: a.end_time,
      start_time: a.start_time,
      end_time: a.end_time,
    })),
    status: this.status,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);

export default Doctor;
