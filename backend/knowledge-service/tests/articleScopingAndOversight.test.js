import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Article from '../src/models/Article.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_knowledge_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let hospAId, hospBId, deptAId, deptBId, doctorAId, doctorBId, chairmanId;
let adminAToken, adminBToken, chairmanToken, deptHeadAToken, doctorAToken;

let draftArtA, underReviewArtA, publishedArtA, underReviewArtB, publishedArtB;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Article.deleteMany({});

  hospAId = new mongoose.Types.ObjectId();
  hospBId = new mongoose.Types.ObjectId();
  deptAId = new mongoose.Types.ObjectId();
  deptBId = new mongoose.Types.ObjectId();
  doctorAId = new mongoose.Types.ObjectId();
  doctorBId = new mongoose.Types.ObjectId();
  chairmanId = new mongoose.Types.ObjectId();

  adminAToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'HOSPITAL_ADMIN',
      referenceId: hospAId.toString(),
      hospitalId: hospAId.toString(),
    },
    JWT_SECRET
  );

  adminBToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'HOSPITAL_ADMIN',
      referenceId: hospBId.toString(),
      hospitalId: hospBId.toString(),
    },
    JWT_SECRET
  );

  chairmanToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'CHAIRMAN',
      referenceId: chairmanId.toString(),
    },
    JWT_SECRET
  );

  deptHeadAToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DEPARTMENT_HEAD',
      referenceId: deptAId.toString(),
      departmentId: deptAId.toString(),
      hospitalId: hospAId.toString(),
      doctorId: new mongoose.Types.ObjectId().toString(),
    },
    JWT_SECRET
  );

  doctorAToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DOCTOR',
      referenceId: doctorAId.toString(),
      doctorId: doctorAId.toString(),
      departmentId: deptAId.toString(),
      hospitalId: hospAId.toString(),
    },
    JWT_SECRET
  );

  // Seed sample articles across hospitals & departments
  draftArtA = await Article.create({
    author_doctor_id: doctorAId,
    department_id: deptAId,
    hospital_id: hospAId,
    author_name: 'Dr. Alice',
    department_name: 'Neurology',
    hospital_name: 'Metropolitan Hospital',
    title: 'Epilepsy Management in Outpatient Care',
    summary: 'Guidelines on epilepsy',
    content: 'Full neurology content',
    category: 'Neurology',
    tags: ['Epilepsy', 'Neurology'],
    status: 'DRAFT',
  });

  underReviewArtA = await Article.create({
    author_doctor_id: doctorAId,
    department_id: deptAId,
    hospital_id: hospAId,
    author_name: 'Dr. Alice',
    department_name: 'Neurology',
    hospital_name: 'Metropolitan Hospital',
    title: 'Stroke Thrombolysis Protocol 2026',
    summary: 'Acute stroke protocols',
    content: 'Full stroke thrombolysis management guide',
    category: 'Neurology',
    tags: ['Stroke', 'Neurology', 'Emergency'],
    status: 'UNDER_REVIEW',
    submitted_at: new Date(),
  });

  publishedArtA = await Article.create({
    author_doctor_id: doctorAId,
    department_id: deptAId,
    hospital_id: hospAId,
    author_name: 'Dr. Alice',
    department_name: 'Neurology',
    hospital_name: 'Metropolitan Hospital',
    title: 'Migraine Prophylaxis Best Practices',
    summary: 'Migraine treatment regimens',
    content: 'Evidence-based CGRP inhibitor overview',
    category: 'Neurology',
    tags: ['Migraine', 'Headache'],
    status: 'PUBLISHED',
    published_at: new Date(),
  });

  underReviewArtB = await Article.create({
    author_doctor_id: doctorBId,
    department_id: deptBId,
    hospital_id: hospBId,
    author_name: 'Dr. Bob',
    department_name: 'Pediatrics',
    hospital_name: 'City Children Clinic',
    title: 'Pediatric Sepsis Recognition',
    summary: 'Early warning indicators in pediatric sepsis',
    content: 'Clinical criteria for pediatric sepsis',
    category: 'Pediatrics',
    tags: ['Sepsis', 'Pediatrics'],
    status: 'UNDER_REVIEW',
    submitted_at: new Date(),
  });

  publishedArtB = await Article.create({
    author_doctor_id: doctorBId,
    department_id: deptBId,
    hospital_id: hospBId,
    author_name: 'Dr. Bob',
    department_name: 'Pediatrics',
    hospital_name: 'City Children Clinic',
    title: 'Neonatal Jaundice Phototherapy Guidelines',
    summary: 'Management of hyperbilirubinemia',
    content: 'Bhutani nomogram and phototherapy thresholds',
    category: 'Pediatrics',
    tags: ['Jaundice', 'Neonatal'],
    status: 'PUBLISHED',
    published_at: new Date(),
  });
});

afterAll(async () => {
  await Article.deleteMany({});
  await mongoose.connection.close();
});

describe('Article Scoping & Role Oversight Suite', () => {
  test('1. Hospital Admin A can view own-hospital non-draft articles', async () => {
    const res = await request(app)
      .get('/api/knowledge/articles')
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const ids = res.body.data.map((a) => a.id.toString());
    // Should include underReviewArtA and publishedArtA
    expect(ids).toContain(underReviewArtA._id.toString());
    expect(ids).toContain(publishedArtA._id.toString());
    // Should NOT include private draft
    expect(ids).not.toContain(draftArtA._id.toString());
    // Should NOT include Hospital B articles
    expect(ids).not.toContain(underReviewArtB._id.toString());
  });

  test('2. Hospital Admin A is blocked from viewing private draft directly (403)', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles/${draftArtA._id}`)
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('drafts are private to their author');
  });

  test('3. Hospital Admin A is blocked from viewing Hospital B non-published article (403)', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles/${underReviewArtB._id}`)
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('article belongs to another hospital');
  });

  test('4. Hospital Admin is blocked from performing peer review (403)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/articles/${underReviewArtA._id}/review`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ decision: 'APPROVE' });

    expect(res.status).toBe(403);
  });

  test('5. Dept Head A is blocked from viewing Dept B under_review article (403)', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles/${underReviewArtB._id}`)
      .set('Authorization', `Bearer ${deptHeadAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('article belongs to another department');
  });

  test('6. Chairman can view non-draft articles across all hospitals', async () => {
    const res = await request(app)
      .get('/api/knowledge/articles')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const ids = res.body.data.map((a) => a.id.toString());
    // Cross-hospital access confirmed
    expect(ids).toContain(underReviewArtA._id.toString());
    expect(ids).toContain(publishedArtA._id.toString());
    expect(ids).toContain(underReviewArtB._id.toString());
    expect(ids).toContain(publishedArtB._id.toString());
    // Drafts remain strictly private
    expect(ids).not.toContain(draftArtA._id.toString());
  });

  test('7. Multi-parameter filter: search by keyword', async () => {
    const res = await request(app)
      .get('/api/knowledge/articles?q=Thrombolysis')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Stroke Thrombolysis Protocol 2026');
  });

  test('8. Multi-parameter filter: by category & status', async () => {
    const res = await request(app)
      .get('/api/knowledge/articles?category=Pediatrics&status=PUBLISHED')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Neonatal Jaundice Phototherapy Guidelines');
  });

  test('9. Multi-parameter filter: by author ID', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles?authorId=${doctorAId.toString()}&status=PUBLISHED`)
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].authorDoctorId.toString()).toBe(doctorAId.toString());
  });

  test('10. Multi-parameter filter: by hospital ID', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles?hospitalId=${hospBId.toString()}`)
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((a) => a.hospitalId.toString() === hospBId.toString())).toBe(true);
  });

  test('11. Doctor A can view their own draft in their list', async () => {
    const res = await request(app)
      .get('/api/knowledge/articles')
      .set('Authorization', `Bearer ${doctorAToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((a) => a.id.toString());
    expect(ids).toContain(draftArtA._id.toString());
  });

  test('12. Hospital Admin B only sees Hospital B articles', async () => {
    const res = await request(app)
      .get('/api/knowledge/articles')
      .set('Authorization', `Bearer ${adminBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((a) => a.hospitalId.toString() === hospBId.toString())).toBe(true);
  });
});
