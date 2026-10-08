import mongoose from 'mongoose';
import User from '../models/User.js';
import { hashPassword } from './password.js';

export const seedCanonicalAuthUsers = async () => {
  try {
    const defaultPassword = 'Password123!';
    const hashedPassword = await hashPassword(defaultPassword);

    // Look up or establish logical references
    let hospitalRef = new mongoose.Types.ObjectId();
    let deptRef = new mongoose.Types.ObjectId();
    let doctorRef = new mongoose.Types.ObjectId();
    let familyRef = new mongoose.Types.ObjectId();

    try {
      const hospitalConn = mongoose.connection.useDb(process.env.HOSPITAL_DB_NAME || 'medimind_hospital');
      const hosp = (await hospitalConn.collection('hospitals').findOne({ adminEmail: 'admin@medimindhospital.com' })) ||
                   (await hospitalConn.collection('hospitals').findOne({ status: 'ACTIVE' }));
      if (hosp) {
        hospitalRef = hosp._id;
        const dept = (await hospitalConn.collection('departments').findOne({ hospital_id: hosp._id, name: /ortho/i })) ||
                     (await hospitalConn.collection('departments').findOne({ hospital_id: hosp._id }));
        if (dept) deptRef = dept._id;
      }
    } catch {
      // ignore
    }

    try {
      const doctorConn = mongoose.connection.useDb(process.env.DOCTOR_DB_NAME || 'medimind_doctor');
      const doc = (await doctorConn.collection('doctors').findOne({ email: 'dr.rahul.mehta@medimind.org' })) ||
                  (await doctorConn.collection('doctors').findOne({ full_name: /Rahul Mehta/i }));
      if (doc) doctorRef = doc._id;
    } catch {
      // ignore
    }

    const familyDefs = [
      { familyId: 'FAM-001', name: 'Kapoor Family', email: 'rohan.kapoor@example.com', mobile: '+91 98765 43210' },
      { familyId: 'FAM-002', name: 'Sharma Family', email: 'ravi.sharma@example.com', mobile: '+91 98765 43220' },
      { familyId: 'FAM-003', name: 'Patel Family', email: 'vikram.patel@example.com', mobile: '+91 98765 43230' },
      { familyId: 'FAM-004', name: 'Reddy Family', email: 'kiran.reddy@example.com', mobile: '+91 98765 43240' },
      { familyId: 'FAM-005', name: 'Menon Family', email: 'siddharth.menon@example.com', mobile: '+91 98765 43250' },
      { familyId: 'FAM-006', name: 'Mukherjee Family', email: 'debashis.mukherjee@example.com', mobile: '+91 98765 43260' },
    ];

    const familyRefs = {};
    try {
      const familyConn = mongoose.connection.useDb(process.env.FAMILY_DB_NAME || 'medimind_family');
      for (const fDef of familyDefs) {
        let fam = await familyConn.collection('families').findOne({ email: fDef.email });
        if (!fam) {
          const newFamId = new mongoose.Types.ObjectId();
          await familyConn.collection('families').insertOne({
            _id: newFamId,
            family_name: fDef.name,
            family_code: fDef.familyId,
            creator_user_id: new mongoose.Types.ObjectId(),
            email: fDef.email,
            mobile: fDef.mobile,
            status: 'ACTIVE',
            created_at: new Date(),
            updated_at: new Date(),
          });
          fam = { _id: newFamId };
        }
        familyRefs[fDef.familyId] = fam._id;
      }
    } catch {
      // ignore
    }

    const canonicalUsers = [
      // 1. Chairman accounts
      {
        email: 'chairman@medimind.org',
        role: 'CHAIRMAN',
        account_type: 'CHAIRMAN_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
      },
      {
        email: 'chairman@medimind.com',
        role: 'CHAIRMAN',
        account_type: 'CHAIRMAN_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
      },

      // 2. Hospital Admin accounts
      {
        email: 'admin@medimindhospital.com',
        role: 'HOSPITAL_ADMIN',
        account_type: 'HOSPITAL_ADMIN_ACCOUNT',
        reference_id: hospitalRef,
        hospital_id: 'HOSP-001',
      },
      {
        email: 'admin@apexmetro.hospital',
        role: 'HOSPITAL_ADMIN',
        account_type: 'HOSPITAL_ADMIN_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        hospital_id: 'HOSP-002',
      },
      {
        email: 'admin@stjude.hospital',
        role: 'HOSPITAL_ADMIN',
        account_type: 'HOSPITAL_ADMIN_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        hospital_id: 'HOSP-003',
      },

      // 3. Department Head accounts
      {
        email: 'priya.sharma@medimindhospital.com',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: deptRef,
        department_id: 'DEP-H1-ORTHO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'suresh.iyer@medimindhospital.com',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        department_id: 'DEP-H1-DIAB',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'rajesh.nair@medimindhospital.com',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        department_id: 'DEP-H1-CARDIO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'amit.verma@medimindhospital.com',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        department_id: 'DEP-H1-GEN',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'sunita.kulkarni@medimindhospital.com',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        department_id: 'DEP-H1-NEURO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'vikram.deshmukh@medimindhospital.com',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        department_id: 'DEP-H1-ONCO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'harish.rao@apexmetro.hospital',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        department_id: 'DEP-H2-ORTHO',
        hospital_id: 'HOSP-002',
      },
      {
        email: 'meera.reddy@apexmetro.hospital',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        department_id: 'DEP-H2-DIAB',
        hospital_id: 'HOSP-002',
      },
      {
        email: 'sanjay.gupta@apexmetro.hospital',
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        department_id: 'DEP-H2-CARDIO',
        hospital_id: 'HOSP-002',
      },

      // 4. Doctor accounts
      {
        email: 'rahul.mehta@medimindhospital.com',
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctorRef,
        doctor_id: 'doc_001',
        department_id: 'DEP-H1-ORTHO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'dr.rahul.mehta@medimind.org',
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctorRef,
        doctor_id: 'doc_001',
        department_id: 'DEP-H1-ORTHO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'vikram.anand@medimindhospital.com',
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        doctor_id: 'DOC-H1-ORTHO-2',
        department_id: 'DEP-H1-ORTHO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'sneha.reddy@medimindhospital.com',
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        doctor_id: 'DOC-H1-ORTHO-3',
        department_id: 'DEP-H1-ORTHO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'ananya.roy@medimindhospital.com',
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        doctor_id: 'DOC-H1-DIAB-1',
        department_id: 'DEP-H1-DIAB',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'arjun.patel@medimindhospital.com',
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        doctor_id: 'DOC-H1-CARDIO-1',
        department_id: 'DEP-H1-CARDIO',
        hospital_id: 'HOSP-001',
      },
      {
        email: 'deepak.verma@medimindhospital.com',
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        doctor_id: 'DOC-H1-GEN-1',
        department_id: 'DEP-H1-GEN',
        hospital_id: 'HOSP-001',
      },

      // 5. Family accounts (6 Families)
      {
        email: 'rohan.kapoor@example.com',
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: familyRefs['FAM-001'] || new mongoose.Types.ObjectId(),
        family_id: 'FAM-001',
      },
      {
        email: 'ravi.sharma@example.com',
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: familyRefs['FAM-002'] || new mongoose.Types.ObjectId(),
        family_id: 'FAM-002',
      },
      {
        email: 'vikram.patel@example.com',
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: familyRefs['FAM-003'] || new mongoose.Types.ObjectId(),
        family_id: 'FAM-003',
      },
      {
        email: 'kiran.reddy@example.com',
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: familyRefs['FAM-004'] || new mongoose.Types.ObjectId(),
        family_id: 'FAM-004',
      },
      {
        email: 'siddharth.menon@example.com',
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: familyRefs['FAM-005'] || new mongoose.Types.ObjectId(),
        family_id: 'FAM-005',
      },
      {
        email: 'debashis.mukherjee@example.com',
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: familyRefs['FAM-006'] || new mongoose.Types.ObjectId(),
        family_id: 'FAM-006',
      },
    ];

    for (const u of canonicalUsers) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        await User.create({
          ...u,
          password_hash: hashedPassword,
          status: 'ACTIVE',
        });
      } else {
        existing.password_hash = hashedPassword;
        existing.status = 'ACTIVE';
        existing.role = u.role;
        existing.account_type = u.account_type;
        if (u.family_id) existing.family_id = u.family_id;
        if (u.doctor_id) existing.doctor_id = u.doctor_id;
        if (u.department_id) existing.department_id = u.department_id;
        if (u.hospital_id) existing.hospital_id = u.hospital_id;
        if (!existing.reference_id) existing.reference_id = u.reference_id;
        await existing.save();
      }
    }

    console.log(`[auth-service] Successfully synchronized ${canonicalUsers.length} canonical demo accounts.`);
  } catch (err) {
    console.warn(`[auth-service] Canonical account sync skipped/failed: ${err.message}`);
  }
};
