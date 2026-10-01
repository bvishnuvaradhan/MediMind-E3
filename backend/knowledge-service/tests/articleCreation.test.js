import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Article from '../src/models/Article.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_knowledge_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let doctor1Id, doctor2Id, dept1Id, hosp1Id, familyId;
let doctor1Token, doctor2Token, familyToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Article.deleteMany({});

  doctor1Id = new mongoose.Types.ObjectId();
  doctor2Id = new mongoose.Types.ObjectId();
  dept1Id = new mongoose.Types.ObjectId();
  hosp1Id = new mongoose.Types.ObjectId();
  familyId = new mongoose.Types.ObjectId();

  doctor1Token = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DOCTOR',
      referenceId: doctor1Id.toString(),
      doctorId: doctor1Id.toString(),
      departmentId: dept1Id.toString(),
      hospitalId: hosp1Id.toString(),
    },
    JWT_SECRET
  );

  doctor2Token = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DOCTOR',
      referenceId: doctor2Id.toString(),
      doctorId: doctor2Id.toString(),
      departmentId: dept1Id.toString(),
      hospitalId: hosp1Id.toString(),
    },
    JWT_SECRET
  );

  familyToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'FAMILY',
      referenceId: familyId.toString(),
      familyId: familyId.toString(),
    },
    JWT_SECRET
  );
});

afterAll(async () => {
  await Article.deleteMany({});
  await mongoose.connection.close();
});

describe('Article Creation & Author Lifecycle Suite', () => {
  let createdArticleId;

  test('1. Health check returns 200 UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('knowledge-service');
  });

  test('2. Rejects article creation without auth token (401)', async () => {
    const res = await request(app)
      .post('/api/knowledge/articles')
      .send({
        title: 'Managing Pediatric Asthma',
        summary: 'A clinical overview of pediatric asthma care.',
        content: 'Clinical guidelines and protocols for pediatric asthma management.',
        category: 'Pediatrics',
      });
    expect(res.status).toBe(401);
  });

  test('3. Rejects article creation for non-clinician role (FAMILY) (403)', async () => {
    const res = await request(app)
      .post('/api/knowledge/articles')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        title: 'Managing Pediatric Asthma',
        summary: 'A clinical overview of pediatric asthma care.',
        content: 'Clinical guidelines and protocols for pediatric asthma management.',
        category: 'Pediatrics',
        departmentId: dept1Id.toString(),
      });
    expect(res.status).toBe(403);
  });

  test('4. Rejects article creation when required fields are missing (400)', async () => {
    const res = await request(app)
      .post('/api/knowledge/articles')
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({
        title: 'Managing Pediatric Asthma',
        // missing summary, content, category
      });
    expect(res.status).toBe(400);
  });

  test('5. Doctor successfully creates DRAFT article (201)', async () => {
    const res = await request(app)
      .post('/api/knowledge/articles')
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({
        title: 'Managing Pediatric Asthma',
        summary: 'A clinical overview of pediatric asthma care.',
        content: 'Clinical guidelines and protocols for pediatric asthma management in acute and outpatient settings.',
        category: 'Pediatrics',
        tags: ['Asthma', 'Pediatrics', 'Respiratory'],
        departmentId: dept1Id.toString(),
        hospitalId: hosp1Id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Managing Pediatric Asthma');
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.authorDoctorId.toString()).toBe(doctor1Id.toString());

    createdArticleId = res.body.data.id;
  });

  test('6. Author accesses own draft article (200)', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles/${createdArticleId}`)
      .set('Authorization', `Bearer ${doctor1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id.toString()).toBe(createdArticleId.toString());
    expect(res.body.data.status).toBe('DRAFT');
  });

  test('7. Another doctor is blocked from viewing private draft (403)', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles/${createdArticleId}`)
      .set('Authorization', `Bearer ${doctor2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('8. Unauthenticated public user cannot view private draft (401)', async () => {
    const res = await request(app)
      .get(`/api/knowledge/articles/${createdArticleId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('9. Author updates draft article (200)', async () => {
    const res = await request(app)
      .put(`/api/knowledge/articles/${createdArticleId}`)
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({
        title: 'Managing Pediatric Asthma: Updated Guidelines',
        tags: ['Asthma', 'Pediatrics', 'Respiratory', '2026'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Managing Pediatric Asthma: Updated Guidelines');
    expect(res.body.data.tags).toContain('2026');
  });

  test('10. Non-author doctor is blocked from updating draft (403)', async () => {
    const res = await request(app)
      .put(`/api/knowledge/articles/${createdArticleId}`)
      .set('Authorization', `Bearer ${doctor2Token}`)
      .send({
        title: 'Unauthorized Modification',
      });

    expect(res.status).toBe(403);
  });

  test('11. Author can delete draft article (200)', async () => {
    const tempArticle = await Article.create({
      author_doctor_id: doctor1Id,
      department_id: dept1Id,
      hospital_id: hosp1Id,
      title: 'Draft to Delete',
      summary: 'Summary to delete',
      content: 'Content to delete',
      category: 'General',
      status: 'DRAFT',
    });

    const res = await request(app)
      .delete(`/api/knowledge/articles/${tempArticle._id}`)
      .set('Authorization', `Bearer ${doctor1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Article.findById(tempArticle._id);
    expect(check).toBeNull();
  });
});
