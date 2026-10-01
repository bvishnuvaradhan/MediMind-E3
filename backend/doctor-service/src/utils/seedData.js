import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';

export const CANONICAL_DOCTORS = [
  {
    full_name: 'Dr. Rahul Mehta',
    email: 'dr.rahul.mehta@medimind.org',
    mobile: '+91 98765 21001',
    specialization: 'Joint Replacement & Arthroscopy',
    qualifications: ['MBBS', 'MS (Orthopedics)', 'DNB'],
    experience_years: 10,
    professional_description: 'Senior Consultant Orthopedic Surgeon specializing in minimally invasive joint replacements, arthroscopic reconstruction, and sports injuries.',
    availability: [
      { day: 'MONDAY', start_time: '09:00', end_time: '17:00' },
      { day: 'TUESDAY', start_time: '09:00', end_time: '17:00' },
      { day: 'WEDNESDAY', start_time: '09:00', end_time: '17:00' },
      { day: 'THURSDAY', start_time: '09:00', end_time: '17:00' },
      { day: 'FRIDAY', start_time: '09:00', end_time: '16:00' },
    ],
    status: 'ACTIVE',
  },
  {
    full_name: 'Dr. Arun Kumar',
    email: 'arun.kumar@medimindhospital.com',
    mobile: '+91 98765 21002',
    specialization: 'Cardiology',
    qualifications: ['MBBS', 'MD (Medicine)', 'DM (Cardiology)'],
    experience_years: 12,
    professional_description: 'Interventional Cardiologist focused on coronary angioplasty, structural heart disease, and preventative cardiac rehabilitation.',
    availability: [
      { day: 'MONDAY', start_time: '10:00', end_time: '18:00' },
      { day: 'WEDNESDAY', start_time: '10:00', end_time: '18:00' },
      { day: 'FRIDAY', start_time: '10:00', end_time: '18:00' },
      { day: 'SATURDAY', start_time: '09:00', end_time: '13:00' },
    ],
    status: 'ACTIVE',
  },
  {
    full_name: 'Dr. Sneha Kulkarni',
    email: 'sneha.kulkarni@medimindhospital.com',
    mobile: '+91 98765 21003',
    specialization: 'Neurology',
    qualifications: ['MBBS', 'MD', 'DM (Neurology)'],
    experience_years: 8,
    professional_description: 'Consultant Neurologist with expertise in stroke management, epilepsy monitoring, and neuro-rehabilitation protocols.',
    availability: [
      { day: 'TUESDAY', start_time: '09:00', end_time: '15:00' },
      { day: 'THURSDAY', start_time: '09:00', end_time: '15:00' },
      { day: 'SATURDAY', start_time: '10:00', end_time: '14:00' },
    ],
    status: 'ACTIVE',
  },
  {
    full_name: 'Dr. Rohan Varma',
    email: 'rohan.varma@medimindhospital.com',
    mobile: '+91 98765 21004',
    specialization: 'Diabetology & Endocrinology',
    qualifications: ['MBBS', 'MD (Endocrinology)'],
    experience_years: 9,
    professional_description: 'Specialist in metabolic syndromes, type-1/type-2 diabetes reversal programs, and thyroid disorder therapeutics.',
    availability: [
      { day: 'MONDAY', start_time: '08:30', end_time: '16:30' },
      { day: 'WEDNESDAY', start_time: '08:30', end_time: '16:30' },
      { day: 'FRIDAY', start_time: '08:30', end_time: '16:30' },
    ],
    status: 'ACTIVE',
  },
  {
    full_name: 'Dr. Ananya Sen',
    email: 'ananya.sen@medimindhospital.com',
    mobile: '+91 98765 21005',
    specialization: 'Pediatrics & Neonatology',
    qualifications: ['MBBS', 'DNB (Pediatrics)'],
    experience_years: 7,
    professional_description: 'Pediatric specialist managing developmental milestones, acute childhood infections, and newborn critical care.',
    availability: [
      { day: 'MONDAY', start_time: '09:00', end_time: '14:00' },
      { day: 'TUESDAY', start_time: '09:00', end_time: '14:00' },
      { day: 'THURSDAY', start_time: '09:00', end_time: '14:00' },
      { day: 'FRIDAY', start_time: '09:00', end_time: '14:00' },
    ],
    status: 'ACTIVE',
  },
];

export const seedCanonicalDoctors = async () => {
  try {
    const count = await Doctor.countDocuments();
    if (count > 0) {
      return;
    }

    console.log('[doctor-service] Seeding canonical doctors...');

    // Attempt to connect to medimind_hospital to resolve real hospital & department ObjectIds
    let defaultHospitalId = new mongoose.Types.ObjectId();
    let defaultDeptId = new mongoose.Types.ObjectId();

    try {
      const hospitalConn = mongoose.connection.useDb(process.env.HOSPITAL_DB_NAME || 'medimind_hospital');
      const hosp = await hospitalConn.collection('hospitals').findOne({ status: 'ACTIVE' });
      if (hosp) {
        defaultHospitalId = hosp._id;
        const dept = await hospitalConn.collection('departments').findOne({ hospital_id: hosp._id });
        if (dept) {
          defaultDeptId = dept._id;
        }
      }
    } catch {
      // Fallback to synthetic ObjectIds
    }

    for (const doc of CANONICAL_DOCTORS) {
      await Doctor.create({
        ...doc,
        user_id: new mongoose.Types.ObjectId(),
        hospital_id: defaultHospitalId,
        department_id: defaultDeptId,
      });
    }

    console.log(`[doctor-service] Successfully seeded ${CANONICAL_DOCTORS.length} canonical doctors.`);
  } catch (err) {
    console.warn(`[doctor-service] Seeding canonical doctors skipped/failed: ${err.message}`);
  }
};
