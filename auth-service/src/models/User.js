import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password_hash: {
      type: String,
      required: [true, "Password hash is required"],
    },

    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: [
          "FAMILY",
          "DOCTOR",
          "DEPARTMENT_HEAD",
          "HOSPITAL_ADMIN",
          "CHAIRMAN",
        ],
        message: "{VALUE} is not a valid system role",
      },
      default: "FAMILY",
    },

    account_type: {
      type: String,
      required: [true, "Account type is required"],
      enum: {
        values: [
          "FAMILY_ACCOUNT",
          "DOCTOR_ACCOUNT",
          "DEPARTMENT_HEAD_ACCOUNT",
          "HOSPITAL_ADMIN_ACCOUNT",
          "CHAIRMAN_ACCOUNT",
        ],
        message: "{VALUE} is not a valid account type",
      },
      default: "FAMILY_ACCOUNT",
    },

    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Reference ID is required"],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DELETED"],
      default: "ACTIVE",
    },

    last_login_at: {
      type: Date,
      default: null,
    },

    family_member_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

userSchema.methods.toSafeObject = function () {
  return {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
    accountType: this.account_type,
    referenceId: this.reference_id ? this.reference_id.toString() : this._id.toString(),
    family_member_ids: (this.family_member_ids || []).map((id) => id.toString()),
    status: this.status,
    lastLoginAt: this.last_login_at,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
