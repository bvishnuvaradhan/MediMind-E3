import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    family_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Family member ID is required'],
      index: true,
    },

    record_type: {
      type: String,
      required: [true, 'Record type is required'],
      enum: [
        'REPORT',
        'TEST',
        'XRAY',
        'SCAN',
        'ECG',
        'PRESCRIPTION_DOCUMENT',
        'OTHER',
      ],
      index: true,
    },

    file_name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },

    file_url: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },

    description: {
      type: String,
      default: null,
      trim: true,
    },

    record_date: {
      type: Date,
      required: [true, 'Record date is required'],
      index: true,
    },

    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Uploaded by user ID is required'],
      index: true,
    },

    source: {
      type: String,
      enum: ['FAMILY', 'DOCTOR'],
      required: [true, 'Source (FAMILY or DOCTOR) is required'],
      index: true,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'DELETED'],
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

medicalRecordSchema.index({ family_member_id: 1, status: 1 });

medicalRecordSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    familyMemberId: this.family_member_id,
    family_member_id: this.family_member_id,
    recordType: this.record_type,
    record_type: this.record_type,
    fileName: this.file_name,
    file_name: this.file_name,
    fileUrl: this.file_url,
    file_url: this.file_url,
    description: this.description,
    recordDate: this.record_date,
    record_date: this.record_date,
    uploadedBy: this.uploaded_by,
    uploaded_by: this.uploaded_by,
    source: this.source,
    status: this.status,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
