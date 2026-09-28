import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Family from '../src/models/Family.js';
import FamilyMember from '../src/models/FamilyMember.js';

const TEST_DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medimind_family_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Family.deleteMany({});
  await FamilyMember.deleteMany({});
});

afterAll(async () => {
  await Family.deleteMany({});
  await FamilyMember.deleteMany({});
  await mongoose.connection.close();
});

describe('Family Member Operations & Scoping Isolation', () => {
  let familyA;
  let creatorAId;
  let tokenA;

  let familyB;
  let creatorBId;
  let tokenB;

  let memberA1;
  let memberB1;

  beforeEach(async () => {
    await Family.deleteMany({});
    await FamilyMember.deleteMany({});

    // Setup Family A
    creatorAId = new mongoose.Types.ObjectId();
    familyA = await Family.create({
      family_name: 'Kapoor Family',
      creator_user_id: creatorAId,
      email: 'rohan.kapoor@example.com',
      mobile: '+91 98765 43210',
      status: 'ACTIVE',
    });

    tokenA = jwt.sign(
      {
        userId: creatorAId.toString(),
        role: 'FAMILY',
        referenceId: familyA._id.toString(),
      },
      JWT_SECRET
    );

    memberA1 = await FamilyMember.create({
      family_id: familyA._id,
      full_name: 'Priya Kapoor',
      date_of_birth: new Date('1975-07-24'),
      gender: 'FEMALE',
      blood_group: 'A+',
      status: 'ACTIVE',
    });

    // Setup Family B
    creatorBId = new mongoose.Types.ObjectId();
    familyB = await Family.create({
      family_name: 'Patel Family',
      creator_user_id: creatorBId,
      email: 'vikram.patel@example.com',
      mobile: '+91 98765 43230',
      status: 'ACTIVE',
    });

    tokenB = jwt.sign(
      {
        userId: creatorBId.toString(),
        role: 'FAMILY',
        referenceId: familyB._id.toString(),
      },
      JWT_SECRET
    );

    memberB1 = await FamilyMember.create({
      family_id: familyB._id,
      full_name: 'Aarav Patel',
      date_of_birth: new Date('2012-03-10'),
      gender: 'MALE',
      blood_group: 'O+',
      status: 'ACTIVE',
    });
  });

  describe('1. Add Member (POST /api/families/members)', () => {
    it('successfully adds a member to the authenticated family', async () => {
      const res = await request(app)
        .post('/api/families/members')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Arjun Kapoor',
          dateOfBirth: '2010-11-06',
          gender: 'MALE',
          bloodGroup: 'B+',
          phone: '+91 98765 43213',
          email: 'arjun.kapoor@example.com',
          allergies: ['Dust'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Arjun Kapoor');
      expect(res.body.data.familyId).toBe(familyA._id.toString());
      expect(res.body.data.gender).toBe('MALE');
      expect(res.body.data.bloodGroup).toBe('B+');
    });

    it('rejects invalid gender with 400', async () => {
      const res = await request(app)
        .post('/api/families/members')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Invalid Member',
          dateOfBirth: '2000-01-01',
          gender: 'INVALID_GENDER',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Gender must be one of');
    });

    it('rejects invalid blood group with 400', async () => {
      const res = await request(app)
        .post('/api/families/members')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Invalid Blood Member',
          dateOfBirth: '2000-01-01',
          gender: 'FEMALE',
          bloodGroup: 'Z_POSITIVE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Blood group must be one of');
    });
  });

  describe('2. List Members (GET /api/families/members)', () => {
    it('returns only members belonging to the caller family', async () => {
      const resA = await request(app)
        .get('/api/families/members')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.success).toBe(true);
      expect(resA.body.data.length).toBe(1);
      expect(resA.body.data[0].fullName).toBe('Priya Kapoor');

      const resB = await request(app)
        .get('/api/families/members')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.success).toBe(true);
      expect(resB.body.data.length).toBe(1);
      expect(resB.body.data[0].fullName).toBe('Aarav Patel');
    });
  });

  describe('3. Cross-Family Security & Scoping Invariants', () => {
    it('BLOCKS Family A from accessing Family B member (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/families/members/${memberB1._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not belong to your family');
    });

    it('BLOCKS Family A from updating Family B member (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/families/members/${memberB1._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ fullName: 'Malicious Update Name' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not belong to your family');

      // Verify record was untouched in database
      const untouched = await FamilyMember.findById(memberB1._id);
      expect(untouched.full_name).toBe('Aarav Patel');
    });

    it('BLOCKS Family A from removing Family B member (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/families/members/${memberB1._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      const untouched = await FamilyMember.findById(memberB1._id);
      expect(untouched.status).toBe('ACTIVE');
    });
  });

  describe('4. Update & Remove Member (PUT & DELETE)', () => {
    it('allows family member update by family caller', async () => {
      const res = await request(app)
        .put(`/api/families/members/${memberA1._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          bloodGroup: 'AB+',
          phone: '+91 98765 00000',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bloodGroup).toBe('AB+');
      expect(res.body.data.phone).toBe('+91 98765 00000');
    });

    it('allows family creator to remove member', async () => {
      const res = await request(app)
        .delete(`/api/families/members/${memberA1._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Family member removed successfully');

      // Verify soft deletion
      const removed = await FamilyMember.findById(memberA1._id);
      expect(removed.status).toBe('REMOVED');
      expect(removed.removed_at).toBeDefined();

      // Verify removed member no longer listed in active members
      const listRes = await request(app)
        .get('/api/families/members')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(listRes.body.data.length).toBe(0);
    });

    it('rejects member removal when caller is not the family creator (403)', async () => {
      const nonCreatorUserId = new mongoose.Types.ObjectId();
      const nonCreatorToken = jwt.sign(
        {
          userId: nonCreatorUserId.toString(),
          role: 'FAMILY',
          referenceId: familyA._id.toString(),
        },
        JWT_SECRET
      );

      const res = await request(app)
        .delete(`/api/families/members/${memberA1._id}`)
        .set('Authorization', `Bearer ${nonCreatorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only the family creator can remove');
    });

    it('returns 400 for malformed member ID', async () => {
      const res = await request(app)
        .get('/api/families/members/invalid_id_format_123')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid');
    });

    it('returns 404 for non-existent member ID', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/families/members/${randomId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Family member not found');
    });
  });
});
