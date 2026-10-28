import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
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

    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Hospital ID is required'],
      index: true,
    },

    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Department ID is required'],
      index: true,
    },

    appointment_date: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },

    start_time: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },

    end_time: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },

    reason: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        'BOOKED',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'RESCHEDULED',
        'NO_SHOW',
      ],
      default: 'BOOKED',
      index: true,
    },

    appointment_type: {
      type: String,
      enum: ['BOOKED', 'WALK_IN'],
      default: 'BOOKED',
      index: true,
    },

    ai_prediction_id: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },

    cancelled_at: {
      type: Date,
      default: null,
    },

    cancellation_reason: {
      type: String,
      default: null,
      trim: true,
    },

    cancelled_by: {
      type: String,
      default: null,
    },

    token: {
      type: String,
      default: null,
      trim: true,
    },

    original_appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
      index: true,
    },

    idempotency_key: {
      type: String,
      default: null,
      index: true,
    },

    replacement_appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
      index: true,
    },

    rescheduling_history: [
      {
        previous_appointment_date: { type: Date },
        previous_start_time: { type: String, trim: true },
        previous_end_time: { type: String, trim: true },
        new_appointment_date: { type: Date },
        new_start_time: { type: String, trim: true },
        new_end_time: { type: String, trim: true },
        rescheduled_at: { type: Date, default: Date.now },
        rescheduled_by: { type: String, default: null },
        reason: { type: String, default: null, trim: true },
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Compound unique partial index for slot lookups & race-free active slot conflict prevention
appointmentSchema.index(
  { doctor_id: 1, appointment_date: 1, start_time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          'BOOKED',
          'CONFIRMED',
          'CHECKED_IN',
          'IN_PROGRESS',
          'COMPLETED',
          'RESCHEDULED',
        ],
      },
    },
  }
);
appointmentSchema.index({ hospital_id: 1, department_id: 1 });
appointmentSchema.index({ appointment_date: 1, start_time: 1 });
appointmentSchema.index({ status: 1, appointment_date: 1 });
appointmentSchema.index({ family_member_id: 1, appointment_date: 1 });
appointmentSchema.index({ doctor_id: 1, appointment_date: 1 });

appointmentSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    familyMemberId: this.family_member_id,
    family_member_id: this.family_member_id,
    doctorId: this.doctor_id,
    doctor_id: this.doctor_id,
    hospitalId: this.hospital_id,
    hospital_id: this.hospital_id,
    departmentId: this.department_id,
    department_id: this.department_id,
    appointmentDate: this.appointment_date,
    appointment_date: this.appointment_date,
    startTime: this.start_time,
    start_time: this.start_time,
    endTime: this.end_time,
    end_time: this.end_time,
    reason: this.reason,
    status: this.status,
    appointmentType: this.appointment_type,
    appointment_type: this.appointment_type,
    aiPredictionId: this.ai_prediction_id,
    ai_prediction_id: this.ai_prediction_id,
    cancelledAt: this.cancelled_at,
    cancelled_at: this.cancelled_at,
    cancellationReason: this.cancellation_reason,
    cancellation_reason: this.cancellation_reason,
    cancelledBy: this.cancelled_by,
    cancelled_by: this.cancelled_by,
    token: this.token || `OPD-${this._id.toString().slice(-4).toUpperCase()}`,
    originalAppointmentId: this.original_appointment_id,
    original_appointment_id: this.original_appointment_id,
    replacementAppointmentId: this.replacement_appointment_id,
    replacement_appointment_id: this.replacement_appointment_id,
    idempotencyKey: this.idempotency_key,
    idempotency_key: this.idempotency_key,
    reschedulingHistory: this.rescheduling_history || [],
    rescheduling_history: this.rescheduling_history || [],
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
