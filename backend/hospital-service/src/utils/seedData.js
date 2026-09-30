import Hospital from '../models/Hospital.js';
import Department from '../models/Department.js';
import HospitalRequest from '../models/HospitalRequest.js';

export const CANONICAL_HOSPITALS = [
  {
    code: 'MM-BLR-01',
    name: 'MediMind Central Hospital',
    tagline: 'Center of Excellence in Multi-Specialty Tertiary Care & AI Diagnostics',
    type: 'Multi-Specialty Research Hospital',
    address: {
      street: '45 Healthcare Enclave, Bannerghatta Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560076',
    },
    phone: '+91 80 2345 6789',
    emergencyPhone: '+91 80 2345 9999',
    email: 'contact@medimindhospital.com',
    adminEmail: 'admin@medimindhospital.com',
    website: 'https://bengaluru.medimind.health',
    status: 'ACTIVE',
    bedCapacity: 450,
    accreditation: 'NABH & JCI Accredited',
    facilityLevel: 'Certified Level-3 Multi-Specialty Tertiary Care Facility',
    establishedYear: 2018,
    licenseNumber: 'KA-MED-HOSP-2018-0941',
  },
  {
    code: 'APEX-HYD-02',
    name: 'Apex Metro Healthcare',
    tagline: 'Precision Care & Advanced Cardiometabolic Sciences',
    type: 'Specialty Surgical & Metabolic Center',
    address: {
      street: '88 HITEC City Main Road, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500081',
    },
    phone: '+91 40 4567 8900',
    emergencyPhone: '+91 40 4567 8999',
    email: 'contact@apexmetro.hospital',
    adminEmail: 'admin@apexmetro.hospital',
    website: 'https://hyderabad.apexmetro.health',
    status: 'ACTIVE',
    bedCapacity: 180,
    accreditation: 'NABH Accredited',
    facilityLevel: 'Level-2 Specialty Care Hospital',
    establishedYear: 2020,
    licenseNumber: 'TG-MED-HOSP-2020-0512',
  },
  {
    code: 'STJ-KOC-03',
    name: 'St. Jude Multispecialty Hospital',
    tagline: 'Compassionate Tertiary Care with Multi-Disciplinary Excellence',
    type: 'Multi-Disciplinary Tertiary Care Institute',
    address: {
      street: '12 Marine Drive Extension, Ernakulam',
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      pincode: '682011',
    },
    phone: '+91 484 2890 100',
    emergencyPhone: '+91 484 2890 999',
    email: 'contact@stjude.hospital',
    adminEmail: 'admin@stjude.hospital',
    website: 'https://kochi.stjude.health',
    status: 'ACTIVE',
    bedCapacity: 600,
    accreditation: 'NABH & JCI Accredited',
    facilityLevel: 'Certified Level-3 Advanced Multi-Specialty Institute',
    establishedYear: 2015,
    licenseNumber: 'KL-MED-HOSP-2015-1108',
  },
];

export const CANONICAL_REQUESTS = [
  {
    code: 'REQ-HOSP-001',
    name: 'Aster Prime Healthcare',
    type: 'Tertiary Care & Super-Specialty Hospital',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    address: 'Plot 4, HITEC City Main Rd, Madhapur, Hyderabad, Telangana 500081',
    contactPerson: 'Dr. Ramesh Naidu',
    contactRole: 'Medical Director & Chief of Surgery',
    phone: '+91 40 4969 1100',
    emergencyPhone: '+91 40 4969 1199',
    email: 'ramesh.naidu@asterprime.health',
    requestedDepartments: ['Orthopedics', 'Cardiology', 'General Medicine', 'Neurology'],
    bedCapacity: 350,
    accreditation: 'NABH Certified & ISO 9001:2015',
    facilityLevel: 'Tertiary Care Super-Specialty Center',
    establishedYear: 2018,
    licenseNumber: 'TS-MED-HOSP-2018-0941',
    notes: 'Applying for MediMind Platform integration with focus on automated fracture triage.',
    status: 'PENDING',
  },
  {
    code: 'REQ-HOSP-002',
    name: 'Fortis Memorial Health Institute',
    type: 'Multi-Specialty Research & Clinical Hospital',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    address: '154/9 Bannerghatta Main Rd, Opp IIMB, Bengaluru, Karnataka 560076',
    contactPerson: 'Dr. Ananya Sen',
    contactRole: 'Chief Operating Officer & Head of Clinical Operations',
    phone: '+91 80 6621 4400',
    emergencyPhone: '+91 80 6621 4499',
    email: 'ananya.sen@fortishealth.in',
    requestedDepartments: ['Cardiology', 'Diabetology & Endocrinology', 'Pediatrics & Neonatology'],
    bedCapacity: 420,
    accreditation: 'JCI & NABH Accredited',
    facilityLevel: 'Quaternary Care & Research Institute',
    establishedYear: 2016,
    licenseNumber: 'KA-MED-HOSP-2016-0428',
    notes: 'Seeking platform onboarding for cross-hospital referral connectivity.',
    status: 'PENDING',
  },
];

export const seedCanonicalData = async () => {
  const existingCount = await Hospital.countDocuments();
  if (existingCount === 0) {
    console.log('[hospital-service] Seeding canonical hospitals and requests...');
    const createdHospitals = await Hospital.insertMany(CANONICAL_HOSPITALS);
    await HospitalRequest.insertMany(CANONICAL_REQUESTS);

    // Seed departments for Hospital 1 (6 departments)
    const h1 = createdHospitals[0];
    const h1Depts = [
      { name: 'Orthopedics', code: 'ORTHO', specialization: 'Musculoskeletal Trauma', linkedAi: 'Fracture Detection', aiModuleId: 'ai_fracture' },
      { name: 'Diabetology & Endocrinology', code: 'DIAB', specialization: 'Glycemic Regulation', linkedAi: 'Diabetes Risk Assessment', aiModuleId: 'ai_diabetes' },
      { name: 'Cardiology', code: 'CARDIO', specialization: 'Interventional Cardiology', linkedAi: 'Heart Disease Risk Stratification', aiModuleId: 'ai_cardio' },
      { name: 'General Medicine', code: 'GENMED', specialization: 'Internal Medicine', linkedAi: 'General Health Assessment', aiModuleId: 'ai_general' },
      { name: 'Neurology', code: 'NEURO', specialization: 'Neurological Sciences' },
      { name: 'Pediatrics & Neonatology', code: 'PEDI', specialization: 'Child Healthcare' },
    ];
    for (const d of h1Depts) {
      await Department.create({ ...d, hospital_id: h1._id, status: 'ACTIVE' });
    }

    // Seed departments for Hospital 2 (3 departments)
    const h2 = createdHospitals[1];
    const h2Depts = [
      { name: 'Orthopedics', code: 'ORTHO', specialization: 'Joint Reconstruction' },
      { name: 'Diabetology & Endocrinology', code: 'DIAB', specialization: 'Metabolic Disorders' },
      { name: 'Cardiology', code: 'CARDIO', specialization: 'Cardiac Care' },
    ];
    for (const d of h2Depts) {
      await Department.create({ ...d, hospital_id: h2._id, status: 'ACTIVE' });
    }

    // Seed departments for Hospital 3 (8 departments)
    const h3 = createdHospitals[2];
    const h3Depts = [
      { name: 'Orthopedics & Joint Care', code: 'ORTHO', specialization: 'Arthroplasty' },
      { name: 'Cardiovascular Surgery', code: 'CARDIO', specialization: 'Cardiothoracic' },
      { name: 'Diabetology', code: 'DIAB', specialization: 'Diabetes' },
      { name: 'General Medicine', code: 'GENMED', specialization: 'Family Medicine' },
      { name: 'Pediatrics', code: 'PEDI', specialization: 'Pediatric Care' },
      { name: 'Nephrology', code: 'NEPHRO', specialization: 'Renal Sciences' },
      { name: 'Pulmonology', code: 'PULMO', specialization: 'Respiratory Medicine' },
      { name: 'Gastroenterology', code: 'GASTRO', specialization: 'GI Care' },
    ];
    for (const d of h3Depts) {
      await Department.create({ ...d, hospital_id: h3._id, status: 'ACTIVE' });
    }

    console.log('[hospital-service] Canonical dataset seeded successfully.');
  }
};
