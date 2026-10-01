import mongoose from 'mongoose';
import Article from '../models/Article.js';
import { internalServices } from '../utils/internalServices.js';

export const articleService = {
  /**
   * Create a new knowledge article (Doctor / Clinician author)
   */
  async createArticle(user, payload) {
    if (!['DOCTOR', 'DEPARTMENT_HEAD', 'CHAIRMAN'].includes(user.role)) {
      const err = new Error('Access forbidden: only clinicians can author knowledge articles');
      err.statusCode = 403;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId || payload.authorDoctorId || payload.author_doctor_id;
    if (!doctorId) {
      const err = new Error('Doctor profile not linked to user account');
      err.statusCode = 403;
      throw err;
    }

    const { title, summary, content, category, tags } = payload;
    if (!title || !summary || !content || !category) {
      const err = new Error('title, summary, content, and category are required');
      err.statusCode = 400;
      throw err;
    }

    // Resolve department and hospital from doctor service or payload
    let departmentId = payload.departmentId || payload.department_id || user.departmentId;
    let hospitalId = payload.hospitalId || payload.hospital_id || user.hospitalId;
    let authorName = payload.authorName || payload.author || null;
    let departmentName = payload.departmentName || payload.department || null;
    let hospitalName = payload.hospitalName || payload.hospital || null;

    try {
      const doctorData = await internalServices.getDoctor(doctorId);
      if (doctorData) {
        if (!departmentId && doctorData.department_id) departmentId = doctorData.department_id;
        if (!hospitalId && doctorData.hospital_id) hospitalId = doctorData.hospital_id;
        if (!authorName) authorName = doctorData.full_name || `${doctorData.first_name || ''} ${doctorData.last_name || ''}`.trim();
      }
    } catch {
      // Fallback to payload or defaults
    }

    if (departmentId && !departmentName) {
      try {
        const deptData = await internalServices.getDepartment(departmentId);
        if (deptData) departmentName = deptData.name;
      } catch {
        // ignore
      }
    }

    if (hospitalId && !hospitalName) {
      try {
        const hospData = await internalServices.getHospital(hospitalId);
        if (hospData) hospitalName = hospData.name;
      } catch {
        // ignore
      }
    }

    if (!departmentId) {
      const err = new Error('Department ID is required to author a clinical article');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      const err = new Error('Invalid department ID format');
      err.statusCode = 400;
      throw err;
    }

    const submitForReview = Boolean(payload.submitForReview);
    const initialStatus = submitForReview ? 'UNDER_REVIEW' : 'DRAFT';
    const submittedAt = submitForReview ? new Date() : null;

    const article = await Article.create({
      author_doctor_id: doctorId,
      department_id: departmentId,
      hospital_id: hospitalId || null,
      author_name: authorName,
      department_name: departmentName,
      hospital_name: hospitalName,
      title: title.trim(),
      summary: summary.trim(),
      content,
      category: category.trim(),
      tags: Array.isArray(tags) ? tags : [],
      status: initialStatus,
      submitted_at: submittedAt,
    });

    return article.toPublicJSON();
  },

  /**
   * List articles with role-based scoping and multi-parameter filtering
   */
  async getArticles(user, query = {}) {
    const filter = {};

    // 1. Role-based scoping
    if (!user || user.role === 'FAMILY') {
      // Public / Family can only see published articles
      filter.status = 'PUBLISHED';
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      // Doctor sees all PUBLISHED articles, plus own articles in any status
      filter.$or = [
        { status: 'PUBLISHED' },
        { author_doctor_id: doctorId },
      ];
    } else if (user.role === 'DEPARTMENT_HEAD') {
      const deptId = user.departmentId || user.referenceId;
      const doctorId = user.doctorId;
      // Dept Head sees all published articles,
      // plus non-draft articles in their assigned department,
      // plus own authored articles
      const conditions = [
        { status: 'PUBLISHED' },
        { department_id: deptId, status: { $ne: 'DRAFT' } },
      ];
      if (doctorId) {
        conditions.push({ author_doctor_id: doctorId });
      }
      filter.$or = conditions;
    } else if (user.role === 'HOSPITAL_ADMIN') {
      const hospitalId = user.hospitalId || user.referenceId;
      // Hospital Admin oversight: own-hospital non-draft articles only
      filter.hospital_id = hospitalId;
      filter.status = { $ne: 'DRAFT' };
    } else if (user.role === 'CHAIRMAN') {
      // Chairman platform oversight: non-draft articles across all hospitals
      filter.status = { $ne: 'DRAFT' };
    }

    // 2. Query filters
    // Status filter
    if (query.status && query.status !== 'All') {
      let reqStatus = query.status.toUpperCase().replace(/\s+/g, '_');
      if (reqStatus === 'UNDER_REVIEW' || reqStatus === 'REVIEW') reqStatus = 'UNDER_REVIEW';
      if (reqStatus === 'CHANGES_REQUESTED') reqStatus = 'CHANGES_REQUESTED';

      if (filter.status && typeof filter.status === 'string') {
        if (filter.status !== reqStatus) {
          return [];
        }
      } else if (filter.status && filter.status.$ne) {
        if (reqStatus === filter.status.$ne) {
          return [];
        }
        filter.status = reqStatus;
      } else {
        filter.status = reqStatus;
      }
    }

    // Department filter
    if (query.departmentId || query.department_id) {
      const deptId = query.departmentId || query.department_id;
      if (mongoose.Types.ObjectId.isValid(deptId)) {
        filter.department_id = deptId;
      }
    } else if (query.department && query.department !== 'All') {
      if (mongoose.Types.ObjectId.isValid(query.department)) {
        filter.department_id = query.department;
      } else {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { department_name: new RegExp(query.department, 'i') },
            { category: new RegExp(query.department, 'i') },
          ],
        });
      }
    }

    // Hospital filter (for Chairman / Multi-hospital query)
    if (query.hospitalId || query.hospital_id) {
      const hId = query.hospitalId || query.hospital_id;
      if (mongoose.Types.ObjectId.isValid(hId)) {
        filter.hospital_id = hId;
      }
    } else if (query.hospital && query.hospital !== 'All') {
      if (mongoose.Types.ObjectId.isValid(query.hospital)) {
        filter.hospital_id = query.hospital;
      } else {
        filter.hospital_name = new RegExp(query.hospital, 'i');
      }
    }

    // Author filter
    if (query.authorId || query.author_id) {
      const aId = query.authorId || query.author_id;
      if (mongoose.Types.ObjectId.isValid(aId)) {
        filter.author_doctor_id = aId;
      }
    } else if (query.author && query.author !== 'All') {
      filter.author_name = new RegExp(query.author, 'i');
    }

    // Category filter
    if (query.category && query.category !== 'All') {
      filter.category = new RegExp(query.category, 'i');
    }

    // Search / keyword filter
    const keyword = query.search || query.q || query.keyword;
    if (keyword && keyword.trim()) {
      const kwRegex = new RegExp(keyword.trim(), 'i');
      const searchOr = [
        { title: kwRegex },
        { summary: kwRegex },
        { content: kwRegex },
        { author_name: kwRegex },
        { department_name: kwRegex },
        { category: kwRegex },
        { tags: kwRegex },
      ];
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
    }

    // Date / Period filter
    if (query.startDate || query.endDate) {
      const dateFilter = {};
      if (query.startDate) dateFilter.$gte = new Date(query.startDate);
      if (query.endDate) dateFilter.$lte = new Date(query.endDate);
      filter.created_at = dateFilter;
    }

    const articles = await Article.find(filter).sort({ published_at: -1, created_at: -1 });
    return articles.map((a) => a.toPublicJSON());
  },

  /**
   * Retrieve single article by ID with strict visibility rules
   */
  async getArticleById(user, articleId) {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      const err = new Error('Invalid article ID format');
      err.statusCode = 400;
      throw err;
    }

    const article = await Article.findById(articleId);
    if (!article) {
      const err = new Error('Article not found');
      err.statusCode = 404;
      throw err;
    }

    // Published articles are public
    if (article.status === 'PUBLISHED') {
      return article.toPublicJSON();
    }

    // If not published, authentication is required
    if (!user) {
      const err = new Error('Authentication required to view non-published articles');
      err.statusCode = 401;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    const isAuthor = doctorId && article.author_doctor_id.toString() === doctorId.toString();

    // Drafts are strictly private to author
    if (article.status === 'DRAFT') {
      if (!isAuthor) {
        const err = new Error('Access forbidden: drafts are private to their author');
        err.statusCode = 403;
        throw err;
      }
      return article.toPublicJSON();
    }

    // Review / pending statuses (SUBMITTED, UNDER_REVIEW, CHANGES_REQUESTED, APPROVED, REJECTED)
    if (isAuthor) {
      return article.toPublicJSON();
    }

    if (user.role === 'CHAIRMAN') {
      return article.toPublicJSON();
    }

    if (user.role === 'DEPARTMENT_HEAD') {
      const deptId = user.departmentId || user.referenceId;
      if (deptId && article.department_id.toString() === deptId.toString()) {
        return article.toPublicJSON();
      }
      const err = new Error('Access forbidden: article belongs to another department');
      err.statusCode = 403;
      throw err;
    }

    if (user.role === 'HOSPITAL_ADMIN') {
      const hospitalId = user.hospitalId || user.referenceId;
      if (hospitalId && article.hospital_id && article.hospital_id.toString() === hospitalId.toString()) {
        return article.toPublicJSON();
      }
      const err = new Error('Access forbidden: article belongs to another hospital');
      err.statusCode = 403;
      throw err;
    }

    const err = new Error('Access forbidden: you do not have permission to view this article');
    err.statusCode = 403;
    throw err;
  },

  /**
   * Update article content (Author only, when DRAFT or CHANGES_REQUESTED)
   */
  async updateArticle(user, articleId, payload) {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      const err = new Error('Invalid article ID format');
      err.statusCode = 400;
      throw err;
    }

    const article = await Article.findById(articleId);
    if (!article) {
      const err = new Error('Article not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (!doctorId || article.author_doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: only the author can edit this article');
      err.statusCode = 403;
      throw err;
    }

    // Status lifecycle check
    if (!['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(article.status)) {
      const err = new Error(`Cannot edit an article that is ${article.status.toLowerCase().replace('_', ' ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (payload.title !== undefined) article.title = payload.title.trim();
    if (payload.summary !== undefined) article.summary = payload.summary.trim();
    if (payload.content !== undefined) article.content = payload.content;
    if (payload.category !== undefined) article.category = payload.category.trim();
    if (payload.tags !== undefined && Array.isArray(payload.tags)) article.tags = payload.tags;

    // Resubmit support
    if (payload.submitForReview === true) {
      article.status = 'UNDER_REVIEW';
      article.submitted_at = new Date();
    }

    await article.save();
    return article.toPublicJSON();
  },

  /**
   * Delete draft article (Author only)
   */
  async deleteArticle(user, articleId) {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      const err = new Error('Invalid article ID format');
      err.statusCode = 400;
      throw err;
    }

    const article = await Article.findById(articleId);
    if (!article) {
      const err = new Error('Article not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    const isAuthor = doctorId && article.author_doctor_id.toString() === doctorId.toString();

    if (!isAuthor && user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: only the author can delete this article');
      err.statusCode = 403;
      throw err;
    }

    if (article.status !== 'DRAFT' && user.role !== 'CHAIRMAN') {
      const err = new Error('Only draft articles can be deleted');
      err.statusCode = 400;
      throw err;
    }

    await Article.findByIdAndDelete(articleId);
    return { id: articleId, deleted: true };
  },

  /**
   * Submit article for Department Head review (Transitions DRAFT / CHANGES_REQUESTED -> UNDER_REVIEW)
   */
  async submitForReview(user, articleId) {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      const err = new Error('Invalid article ID format');
      err.statusCode = 400;
      throw err;
    }

    const article = await Article.findById(articleId);
    if (!article) {
      const err = new Error('Article not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (!doctorId || article.author_doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: only the author can submit this article for review');
      err.statusCode = 403;
      throw err;
    }

    if (!['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(article.status)) {
      const err = new Error(`Cannot submit article currently in status: ${article.status}`);
      err.statusCode = 400;
      throw err;
    }

    article.status = 'UNDER_REVIEW';
    article.submitted_at = new Date();
    await article.save();

    return article.toPublicJSON();
  },

  /**
   * Department Head reviews article (Approves or Requests Changes)
   */
  async reviewArticle(user, articleId, payload) {
    if (!['DEPARTMENT_HEAD', 'CHAIRMAN'].includes(user.role)) {
      const err = new Error('Access forbidden: only Department Heads can review knowledge articles');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      const err = new Error('Invalid article ID format');
      err.statusCode = 400;
      throw err;
    }

    const article = await Article.findById(articleId);
    if (!article) {
      const err = new Error('Article not found');
      err.statusCode = 404;
      throw err;
    }

    // Scoping: Department Head must match department
    if (user.role === 'DEPARTMENT_HEAD') {
      const deptId = user.departmentId || user.referenceId;
      if (!deptId || article.department_id.toString() !== deptId.toString()) {
        const err = new Error('Access forbidden: you can only review articles in your assigned department');
        err.statusCode = 403;
        throw err;
      }
    }

    // Cannot approve own article
    const reviewerDoctorId = user.doctorId;
    if (reviewerDoctorId && article.author_doctor_id.toString() === reviewerDoctorId.toString()) {
      const err = new Error('Access forbidden: clinicians cannot peer-review their own articles');
      err.statusCode = 403;
      throw err;
    }
    if (user.referenceId && article.author_doctor_id.toString() === user.referenceId.toString()) {
      const err = new Error('Access forbidden: clinicians cannot peer-review their own articles');
      err.statusCode = 403;
      throw err;
    }

    // Status lifecycle check
    if (article.status === 'DRAFT') {
      const err = new Error('Cannot review a draft article; author must submit it for review first');
      err.statusCode = 400;
      throw err;
    }

    if (article.status === 'PUBLISHED') {
      const err = new Error('Article is already published');
      err.statusCode = 400;
      throw err;
    }

    const rawDecision = (payload.decision || payload.status || '').toUpperCase().replace(/\s+/g, '_');
    const feedback = payload.feedback || payload.reviewComment || payload.review_comment;

    if (['CHANGES_REQUESTED', 'REJECT', 'REJECTED'].includes(rawDecision)) {
      if (!feedback || !feedback.trim()) {
        const err = new Error('Detailed clinical feedback is required when requesting changes');
        err.statusCode = 400;
        throw err;
      }
      article.status = 'CHANGES_REQUESTED';
      article.review_comment = feedback.trim();
      article.reviewed_by = user.userId;
      article.reviewed_at = new Date();
    } else if (['APPROVE', 'APPROVED'].includes(rawDecision)) {
      article.status = 'APPROVED';
      article.review_comment = feedback ? feedback.trim() : null;
      article.reviewed_by = user.userId;
      article.reviewed_at = new Date();

      if (payload.publishNow === true) {
        article.status = 'PUBLISHED';
        article.published_at = new Date();
      }
    } else {
      const err = new Error('Invalid review decision: must be APPROVE or CHANGES_REQUESTED');
      err.statusCode = 400;
      throw err;
    }

    await article.save();
    return article.toPublicJSON();
  },

  /**
   * Publish approved article (Department Head / Chairman)
   */
  async publishArticle(user, articleId) {
    if (!['DEPARTMENT_HEAD', 'CHAIRMAN'].includes(user.role)) {
      const err = new Error('Access forbidden: only Department Heads can publish knowledge articles');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      const err = new Error('Invalid article ID format');
      err.statusCode = 400;
      throw err;
    }

    const article = await Article.findById(articleId);
    if (!article) {
      const err = new Error('Article not found');
      err.statusCode = 404;
      throw err;
    }

    // Scoping for Department Head
    if (user.role === 'DEPARTMENT_HEAD') {
      const deptId = user.departmentId || user.referenceId;
      if (!deptId || article.department_id.toString() !== deptId.toString()) {
        const err = new Error('Access forbidden: you can only publish articles in your assigned department');
        err.statusCode = 403;
        throw err;
      }
    }

    if (article.status === 'PUBLISHED') {
      const err = new Error('Article is already published');
      err.statusCode = 400;
      throw err;
    }

    if (!['APPROVED', 'UNDER_REVIEW', 'SUBMITTED'].includes(article.status)) {
      const err = new Error('Article must be reviewed and approved before publishing');
      err.statusCode = 400;
      throw err;
    }

    article.status = 'PUBLISHED';
    article.published_at = new Date();
    await article.save();

    return article.toPublicJSON();
  },
};
