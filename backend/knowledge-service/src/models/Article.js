import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    author_doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Author Doctor ID is required'],
      index: true,
    },

    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Department ID is required'],
      index: true,
    },

    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    author_name: {
      type: String,
      default: null,
      trim: true,
    },

    department_name: {
      type: String,
      default: null,
      trim: true,
    },

    hospital_name: {
      type: String,
      default: null,
      trim: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
    },

    content: {
      type: String,
      required: [true, 'Content is required'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'CHANGES_REQUESTED',
        'APPROVED',
        'REJECTED',
        'PUBLISHED',
      ],
      default: 'DRAFT',
      index: true,
    },

    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    review_comment: {
      type: String,
      default: null,
      trim: true,
    },

    submitted_at: {
      type: Date,
      default: null,
    },

    reviewed_at: {
      type: Date,
      default: null,
    },

    published_at: {
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

articleSchema.index({ author_doctor_id: 1, status: 1 });
articleSchema.index({ department_id: 1, status: 1 });
articleSchema.index({ hospital_id: 1, status: 1 });
articleSchema.index({ status: 1, published_at: -1 });

articleSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    authorDoctorId: this.author_doctor_id,
    author_doctor_id: this.author_doctor_id,
    authorId: this.author_doctor_id,
    author: this.author_name || null,
    authorName: this.author_name || null,
    departmentId: this.department_id,
    department_id: this.department_id,
    department: this.department_name || null,
    departmentName: this.department_name || null,
    hospitalId: this.hospital_id,
    hospital_id: this.hospital_id,
    hospital: this.hospital_name || null,
    hospitalName: this.hospital_name || null,
    title: this.title,
    summary: this.summary,
    content: this.content,
    category: this.category,
    tags: this.tags,
    status: this.status,
    reviewedBy: this.reviewed_by,
    reviewed_by: this.reviewed_by,
    reviewComment: this.review_comment,
    review_comment: this.review_comment,
    reviewerFeedback: this.review_comment,
    submittedAt: this.submitted_at,
    submitted_at: this.submitted_at,
    reviewedAt: this.reviewed_at,
    reviewed_at: this.reviewed_at,
    publishedAt: this.published_at,
    published_at: this.published_at,
    createdAt: this.created_at,
    created_at: this.created_at,
    updatedAt: this.updated_at,
    updated_at: this.updated_at,
  };
};

const Article = mongoose.model('Article', articleSchema);

export default Article;
