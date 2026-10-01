import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Article from '../src/models/Article.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_knowledge_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let doctorId, deptId, otherDeptId, hospId;
let doctorToken, deptHeadToken, wrongDeptHeadToken, selfReviewDeptHeadToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Article.deleteMany({});

  doctorId = new mongoose.Types.ObjectId();
  deptId = new mongoose.Types.ObjectId();
  otherDeptId = new mongoose.Types.ObjectId();
  hospId = new mongoose.Types.ObjectId();

  doctorToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DOCTOR',
      referenceId: doctorId.toString(),
      doctorId: doctorId.toString(),
      departmentId: deptId.toString(),
      hospitalId: hospId.toString(),
    },
    JWT_SECRET
  );

  deptHeadToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DEPARTMENT_HEAD',
      referenceId: deptId.toString(),
      departmentId: deptId.toString(),
      doctorId: new mongoose.Types.ObjectId().toString(), // distinct doctor ID
      hospitalId: hospId.toString(),
    },
    JWT_SECRET
  );

  wrongDeptHeadToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DEPARTMENT_HEAD',
      referenceId: otherDeptId.toString(),
      departmentId: otherDeptId.toString(),
      doctorId: new mongoose.Types.ObjectId().toString(),
      hospitalId: hospId.toString(),
    },
    JWT_SECRET
  );

  // Department Head who is the author themselves
  selfReviewDeptHeadToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DEPARTMENT_HEAD',
      referenceId: deptId.toString(),
      departmentId: deptId.toString(),
      doctorId: doctorId.toString(), // same as author!
      hospitalId: hospId.toString(),
    },
    JWT_SECRET
  );
});

afterAll(async () => {
  await Article.deleteMany({});
  await mongoose.connection.close();
});

describe('Article Review & Publishing Lifecycle Suite', () => {
  let articleId;

  test('1. Author creates draft article', async () => {
    const res = await request(app)
      .post('/api/knowledge/articles')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        title: 'Advances in Cardiac Biomarkers',
        summary: 'Clinical utility of high-sensitivity troponin assays.',
        content: 'Comprehensive analysis of hs-cTn protocols in acute coronary syndrome.',
        category: 'Cardiology',
        tags: ['Cardiology', 'Troponin', 'Biomarkers'],
        departmentId: deptId.toString(),
        hospitalId: hospId.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    articleId = res.body.data.id;
  });

  test('2. Attempting to review DRAFT before submission is rejected (400)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${articleId}/review`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({
        decision: 'APPROVE',
      });

    expect(res.status).toBe(400);
  });

  test('3. Doctor submits draft for review (DRAFT -> UNDER_REVIEW) (200)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${articleId}/submit`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
    expect(res.body.data.submittedAt).toBeDefined();
  });

  test('4. Dept Head from wrong department is blocked from reviewing (403)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${articleId}/review`)
      .set('Authorization', `Bearer ${wrongDeptHeadToken}`)
      .send({
        decision: 'APPROVE',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('assigned department');
  });

  test('5. Clinician cannot peer-review their own authored article (403)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${articleId}/review`)
      .set('Authorization', `Bearer ${selfReviewDeptHeadToken}`)
      .send({
        decision: 'APPROVE',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('peer-review their own articles');
  });

  test('6. Dept Head requests changes WITHOUT feedback -> rejected (400)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${articleId}/review`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({
        decision: 'CHANGES_REQUESTED',
        // feedback missing!
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Detailed clinical feedback is required');
  });

  test('7. Dept Head requests changes WITH written feedback (200)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${articleId}/review`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({
        decision: 'CHANGES_REQUESTED',
        feedback: 'Please include the latest 2026 ACC/AHA clinical algorithm for 0/1-hour protocols.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CHANGES_REQUESTED');
    expect(res.body.data.reviewComment).toContain('latest 2026 ACC/AHA');
  });

  test('8. Author updates article and resubmits for review (200)', async () => {
    const res = await request(app)
      .put(`/api/knowledge/articles/${articleId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        content: 'Comprehensive analysis including 2026 ACC/AHA 0/1-hour hs-cTn algorithm protocols.',
        submitForReview: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
    expect(res.body.data.content).toContain('2026 ACC/AHA');
  });

  test('9. Dept Head reviews and approves article (200)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${articleId}/review`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({
        decision: 'APPROVE',
        feedback: 'Approved for publication.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
  });

  test('10. Dept Head publishes approved article (200)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${articleId}/publish`)
      .set('Authorization', `Bearer ${deptHeadToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PUBLISHED');
    expect(res.body.data.publishedAt).toBeDefined();
  });

  test('11. Unauthenticated public user can now read published article (200)', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles/${articleId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id.toString()).toBe(articleId.toString());
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  test('12. Author cannot modify an already published article directly (400)', async () => {
    const res = await request(app)
      .put(`/api/knowledge/articles/${articleId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        title: 'Attempted Post-Publish Tampering',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Cannot edit an article that is published');
  });
});
