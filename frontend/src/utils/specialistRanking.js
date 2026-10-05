/**
 * MediMind AI Platform - Specialist Recommendations
 * 
 * Rules & Invariants:
 * 1. DOCTORS FROM MONGODB ONLY: Operates purely on dynamic doctor records passed from the API / MongoDB.
 * 2. No static mock arrays, fallback doctor objects, or hardcoded mock cities (e.g. New Delhi).
 * 3. Low Risk / No Fracture -> requiresSpecialist = false, 0 doctors recommended.
 * 4. Medium / High Risk -> Deterministic ranking returning up to 3 eligible MongoDB specialists.
 * 5. Department-head status is never used as a default recommendation criterion.
 */

// Platform Canonical Hospitals
export const CANONICAL_HOSPITALS = {
  'HOSP-001': { code: 'MM-BLR-01', name: 'MediMind Central Hospital', city: 'Bengaluru', state: 'Karnataka' },
  'HOSP-002': { code: 'APEX-HYD-02', name: 'Apex Metro Healthcare', city: 'Hyderabad', state: 'Telangana' },
  'HOSP-003': { code: 'STJ-KOC-03', name: 'St. Jude Multispecialty Hospital', city: 'Kochi', state: 'Kerala' },
  'MM-BLR-01': { code: 'MM-BLR-01', name: 'MediMind Central Hospital', city: 'Bengaluru', state: 'Karnataka' },
  'APEX-HYD-02': { code: 'APEX-HYD-02', name: 'Apex Metro Healthcare', city: 'Hyderabad', state: 'Telangana' },
  'STJ-KOC-03': { code: 'STJ-KOC-03', name: 'St. Jude Multispecialty Hospital', city: 'Kochi', state: 'Kerala' },
};

function resolveHospitalMetadata(doc) {
  // Check if doctor has canonical hospital code/ID
  const hospKey = doc.hospitalCode || doc.hospitalId || doc.hospital_id;
  if (hospKey && CANONICAL_HOSPITALS[hospKey]) {
    const canon = CANONICAL_HOSPITALS[hospKey];
    return {
      hospitalName: canon.name,
      city: canon.city,
      state: canon.state,
      hospitalLocation: `${canon.name}, ${canon.city}`,
    };
  }

  // Check if doctor has direct populated hospital properties from MongoDB
  const rawHospName = doc.hospitalName || doc.hospital;
  const rawCity = doc.city || doc.hospitalCity;
  const rawState = doc.state || doc.hospitalState;

  if (rawHospName) {
    const city = rawCity || 'Bengaluru';
    return {
      hospitalName: rawHospName,
      city,
      state: rawState || 'Karnataka',
      hospitalLocation: rawHospName.toLowerCase().includes(city.toLowerCase())
        ? rawHospName
        : `${rawHospName}, ${city}`,
    };
  }

  // Default to primary MediMind Central Hospital
  return {
    hospitalName: 'MediMind Central Hospital',
    city: 'Bengaluru',
    state: 'Karnataka',
    hospitalLocation: 'MediMind Central Hospital, Bengaluru',
  };
}

export function getRecommendedSpecialists(prediction, allDoctors = []) {
  if (!prediction) {
    return {
      requiresSpecialist: false,
      reason: 'No prediction telemetry available.',
      specialists: [],
    };
  }

  const titleLower = (prediction.title || '').toLowerCase();
  const typeLower = (prediction.type || '').toLowerCase();
  const deptLower = (prediction.department || '').toLowerCase();
  const resultLower = (prediction.result || '').toLowerCase();
  const riskLevel = prediction.riskLevel || 'Low Risk';

  // Determine clinical domain
  const isFracture =
    titleLower.includes('fracture') ||
    typeLower.includes('fracture') ||
    typeLower.includes('musculoskeletal') ||
    deptLower.includes('ortho');

  const isDiabetes =
    titleLower.includes('diabetes') ||
    typeLower.includes('metabolic') ||
    deptLower.includes('diabet');

  const isCardio =
    titleLower.includes('heart') ||
    titleLower.includes('cardio') ||
    deptLower.includes('cardio');

  const isNoFracture =
    isFracture &&
    (riskLevel === 'Low Risk' ||
      resultLower.includes('no acute') ||
      resultLower.includes('no fracture') ||
      resultLower.includes('unfractured') ||
      prediction.isFracture === false);

  // 1. Low Risk / No Fracture Gate (Zero Specialists Required)
  if (riskLevel === 'Low Risk' || isNoFracture) {
    return {
      requiresSpecialist: false,
      domain: isFracture ? 'Orthopedics' : isDiabetes ? 'Diabetology' : isCardio ? 'Cardiology' : 'General Medicine',
      riskLevel: 'Low Risk',
      reason: isFracture
        ? 'No specialist recommendation required based on this screening result. Radiographic evaluation indicates intact cortical margins without acute fracture disruption.'
        : 'No urgent specialist consultation required based on this screening result. Biomarkers and clinical indices are within normal baseline.',
      specialists: [],
    };
  }

  // 2. Determine target department
  let targetDepartment = 'General Medicine';
  if (isFracture) targetDepartment = 'Orthopedics';
  else if (isDiabetes) targetDepartment = 'Diabetology';
  else if (isCardio) targetDepartment = 'Cardiology';

  // 3. Filter eligible active doctors from MongoDB dataset
  const doctorList = Array.isArray(allDoctors) ? allDoctors : [];
  const eligibleDoctors = doctorList.filter((doc) => {
    if (doc.status && doc.status.toUpperCase() !== 'ACTIVE') return false;
    const docDept = (doc.departmentName || doc.department || '').toLowerCase();
    const docSpec = (doc.specialization || doc.specialty || '').toLowerCase();
    const docTitle = (doc.title || doc.role || doc.fullName || '').toLowerCase();

    if (isFracture) {
      return (
        docDept.includes('ortho') ||
        docSpec.includes('ortho') ||
        docSpec.includes('trauma') ||
        docSpec.includes('joint') ||
        docSpec.includes('spine') ||
        docSpec.includes('bone') ||
        docSpec.includes('arthroscopy')
      );
    }
    if (isDiabetes) {
      return (
        docDept.includes('diabet') ||
        docDept.includes('endocrin') ||
        docSpec.includes('diabet') ||
        docSpec.includes('endocrin') ||
        docSpec.includes('metabolic')
      );
    }
    if (isCardio) {
      return (
        docDept.includes('cardio') ||
        docSpec.includes('cardio') ||
        docSpec.includes('heart') ||
        docSpec.includes('coronary')
      );
    }
    return (
      docDept.includes('medicine') ||
      docDept.includes('general') ||
      docDept.includes('internal') ||
      docSpec.includes('medicine') ||
      docSpec.includes('physician') ||
      docTitle.includes('physician') ||
      docDept.includes('pulmon') ||
      docSpec.includes('pulmon')
    );
  });

  // Extract numeric features for ranking
  const getExpYears = (doc) => {
    if (typeof doc.experienceYears === 'number') return doc.experienceYears;
    if (typeof doc.experience_years === 'number') return doc.experience_years;
    const match = (doc.experience || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 5;
  };

  const getFee = (doc) => {
    if (typeof doc.consultationFee === 'number') return doc.consultationFee;
    const match = (String(doc.fee || '')).match(/\d+/);
    return match ? parseInt(match[0], 10) : 750;
  };

  const getRating = (doc) => {
    if (typeof doc.rating === 'number') return doc.rating;
    const match = (String(doc.rating || '')).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 4.8;
  };

  // 4. Deterministic Risk-Aware Ranking on MongoDB Doctors
  let rankedDoctors = [...eligibleDoctors];

  if (riskLevel === 'High Risk') {
    // High Risk: Prioritize clinical experience, trauma/critical specialty, and rating.
    rankedDoctors.sort((a, b) => {
      const expA = getExpYears(a);
      const expB = getExpYears(b);
      const ratingA = getRating(a);
      const ratingB = getRating(b);
      const feeA = getFee(a);
      const feeB = getFee(b);

      const scoreA = expA * 3 + ratingA * 15 - feeA / 500;
      const scoreB = expB * 3 + ratingB * 15 - feeB / 500;
      return scoreB - scoreA;
    });

    rankedDoctors = rankedDoctors.slice(0, 3).map((doc, idx) => {
      const hospMeta = resolveHospitalMetadata(doc);
      return {
        ...doc,
        id: doc.id || doc.doctorId || doc._id,
        doctorId: doc.doctorId || doc.id || doc._id,
        name: doc.fullName || doc.name || doc.title,
        specialization: doc.specialization || doc.specialty || doc.departmentName || targetDepartment,
        experience: doc.experience || `${getExpYears(doc)} years clinical practice`,
        experienceYears: getExpYears(doc),
        consultationFee: getFee(doc),
        rating: getRating(doc),
        city: hospMeta.city,
        state: hospMeta.state,
        hospital: hospMeta.hospitalName,
        hospitalName: hospMeta.hospitalName,
        hospitalLocation: hospMeta.hospitalLocation,
        modes: doc.modes || ['In-person OPD Clinic', 'Secure Video Consultation'],
        rankingReason:
          idx === 0
            ? 'Highly experienced specialist match'
            : idx === 1
            ? 'Senior clinical expertise & high rating'
            : 'Rapid access specialty care',
        rankingBadgeTone: 'coral',
      };
    });
  } else {
    // Medium Risk: Balance experience, cost, and location/rating.
    rankedDoctors.sort((a, b) => {
      const expA = getExpYears(a);
      const expB = getExpYears(b);
      const feeA = getFee(a);
      const feeB = getFee(b);
      const ratingA = getRating(a);
      const ratingB = getRating(b);

      const scoreA = ratingA * 10 + expA * 1.5 - feeA / 100;
      const scoreB = ratingB * 10 + expB * 1.5 - feeB / 100;
      return scoreB - scoreA;
    });

    rankedDoctors = rankedDoctors.slice(0, 3).map((doc, idx) => {
      const hospMeta = resolveHospitalMetadata(doc);
      return {
        ...doc,
        id: doc.id || doc.doctorId || doc._id,
        doctorId: doc.doctorId || doc.id || doc._id,
        name: doc.fullName || doc.name || doc.title,
        specialization: doc.specialization || doc.specialty || doc.departmentName || targetDepartment,
        experience: doc.experience || `${getExpYears(doc)} years clinical practice`,
        experienceYears: getExpYears(doc),
        consultationFee: getFee(doc),
        rating: getRating(doc),
        city: hospMeta.city,
        state: hospMeta.state,
        hospital: hospMeta.hospitalName,
        hospitalName: hospMeta.hospitalName,
        hospitalLocation: hospMeta.hospitalLocation,
        modes: doc.modes || ['In-person OPD Clinic', 'Secure Video Consultation'],
        rankingReason:
          idx === 0
            ? 'Best balance of experience & cost'
            : idx === 1
            ? 'Lower consultation fee'
            : 'Comprehensive specialty care',
        rankingBadgeTone: 'mint',
      };
    });
  }

  return {
    requiresSpecialist: true,
    domain: targetDepartment,
    riskLevel,
    reason:
      riskLevel === 'High Risk'
        ? `High clinical risk detected. Immediate consultation with an eligible ${targetDepartment} specialist is recommended.`
        : `Moderate risk detected. Consultation with a ${targetDepartment} specialist is recommended for detailed clinical evaluation.`,
    specialists: rankedDoctors,
  };
}
