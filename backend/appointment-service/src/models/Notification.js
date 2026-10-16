import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient_user_id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    family_id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    family_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    family_member_name: {
      type: String,
      default: '',
      trim: true,
    },
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['APPOINTMENT_CANCELLED', 'APPOINTMENT_BOOKED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_COMPLETED'],
      default: 'APPOINTMENT_CANCELLED',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    cancellation_reason: {
      type: String,
      default: null,
      trim: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    doctor_name: {
      type: String,
      default: '',
      trim: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    department_name: {
      type: String,
      default: '',
      trim: true,
    },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    hospital_name: {
      type: String,
      default: '',
      trim: true,
    },
    appointment_date: {
      type: Date,
      default: null,
    },
    start_time: {
      type: String,
      default: '',
      trim: true,
    },
    end_time: {
      type: String,
      default: '',
      trim: true,
    },
    action_type: {
      type: String,
      enum: ['FIND_ALTERNATIVE', 'VIEW_DETAILS', 'NONE'],
      default: 'FIND_ALTERNATIVE',
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    read_at: {
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

notificationSchema.index({ family_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ recipient_user_id: 1, is_read: 1, created_at: -1 });

notificationSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    recipientUserId: this.recipient_user_id,
    familyId: this.family_id,
    familyMemberId: this.family_member_id,
    familyMemberName: this.family_member_name,
    appointmentId: this.appointment_id,
    type: this.type,
    title: this.title,
    message: this.message,
    cancellationReason: this.cancellation_reason,
    doctorId: this.doctor_id,
    doctorName: this.doctor_name,
    departmentId: this.department_id,
    departmentName: this.department_name,
    hospitalId: this.hospital_id,
    hospitalName: this.hospital_name,
    appointmentDate: this.appointment_date,
    startTime: this.start_time,
    endTime: this.end_time,
    actionType: this.action_type,
    isRead: this.is_read,
    readAt: this.read_at,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
