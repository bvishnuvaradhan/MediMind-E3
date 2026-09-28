import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema(
  {
    family_id: {
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

    date_of_birth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true,
    },

    blood_group: {
      type: String,
      enum: [
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
        null,
      ],
      default: null,
    },

    phone: {
      type: String,
      default: null,
    },

    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      default: null,
    },

    emergency_contact: {
      name: {
        type: String,
        default: null,
      },
      relationship: {
        type: String,
        default: null,
      },
      phone: {
        type: String,
        default: null,
      },
    },

    health_information: {
      type: String,
      default: null,
    },

    medical_conditions: {
      type: [String],
      default: [],
    },

    allergies: {
      type: [String],
      default: [],
    },

    previous_treatments: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'REMOVED'],
      default: 'ACTIVE',
    },

    removed_at: {
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

familyMemberSchema.methods.toPublicJSON = function () {
  return {
    memberId: this._id.toString(),
    familyId: this.family_id ? this.family_id.toString() : null,
    fullName: this.full_name,
    profilePicture: this.profile_picture,
    dateOfBirth: this.date_of_birth,
    gender: this.gender,
    bloodGroup: this.blood_group,
    phone: this.phone,
    email: this.email,
    address: this.address,
    emergencyContact: this.emergency_contact,
    healthInformation: this.health_information,
    medicalConditions: this.medical_conditions,
    allergies: this.allergies,
    previousTreatments: this.previous_treatments,
    status: this.status,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const FamilyMember = mongoose.models.FamilyMember || mongoose.model('FamilyMember', familyMemberSchema);

export default FamilyMember;
