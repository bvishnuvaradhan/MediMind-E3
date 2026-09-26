// MediMind Platform - Department Visual Theme & Specialty Utilities

export function getDepartmentSpecialtyConfig(dept = {}) {
  const code = (dept.code || dept.specialtyCode || '').toUpperCase();
  const name = (dept.name || '').toLowerCase();
  const id = (dept.id || '').toUpperCase();

  if (code.includes('ORTHO') || name.includes('ortho') || id.includes('ORTHO')) {
    return {
      key: 'orthopedics',
      displayName: 'Orthopedics',
      tone: 'indigo',
      bgColor: '#e0e7ff',
      textColor: '#4338ca',
      borderColor: '#c7d2fe',
      badgeBg: '#eef2ff',
      aiBadgeBg: '#e0e7ff',
      aiColor: '#3730a3',
      iconName: 'Activity',
    };
  }

  if (code.includes('DIAB') || name.includes('diab') || name.includes('endocrin') || id.includes('DIAB')) {
    return {
      key: 'diabetology',
      displayName: 'Diabetology & Endocrinology',
      tone: 'teal',
      bgColor: '#ccfbf1',
      textColor: '#0f766e',
      borderColor: '#99f6e4',
      badgeBg: '#f0fdfa',
      aiBadgeBg: '#ccfbf1',
      aiColor: '#115e59',
      iconName: 'Stethoscope',
    };
  }

  if (code.includes('CARDIO') || name.includes('cardio') || name.includes('heart') || id.includes('CARDIO')) {
    return {
      key: 'cardiology',
      displayName: 'Cardiology',
      tone: 'coral',
      bgColor: '#ffe4e6',
      textColor: '#be123c',
      borderColor: '#fecdd3',
      badgeBg: '#fff1f2',
      aiBadgeBg: '#ffe4e6',
      aiColor: '#9f1239',
      iconName: 'HeartPulse',
    };
  }

  if (code.includes('NEURO') || name.includes('neuro') || id.includes('NEURO')) {
    return {
      key: 'neurology',
      displayName: 'Neurology',
      tone: 'purple',
      bgColor: '#f3e8ff',
      textColor: '#7e22ce',
      borderColor: '#e9d5ff',
      badgeBg: '#faf5ff',
      aiBadgeBg: '#f3e8ff',
      aiColor: '#6b21a8',
      iconName: 'Brain',
    };
  }

  if (code.includes('ONCO') || name.includes('onco') || name.includes('cancer') || id.includes('ONCO')) {
    return {
      key: 'oncology',
      displayName: 'Oncology',
      tone: 'amber',
      bgColor: '#fef3c7',
      textColor: '#b45309',
      borderColor: '#fde68a',
      badgeBg: '#fffbeb',
      aiBadgeBg: '#fef3c7',
      aiColor: '#92400e',
      iconName: 'ShieldCheck',
    };
  }

  if (code.includes('PULMO') || name.includes('pulmo') || name.includes('respir') || id.includes('PULMO')) {
    return {
      key: 'pulmonology',
      displayName: 'Pulmonology',
      tone: 'sky',
      bgColor: '#e0f2fe',
      textColor: '#0369a1',
      borderColor: '#bae6fd',
      badgeBg: '#f0f9ff',
      aiBadgeBg: '#e0f2fe',
      aiColor: '#075985',
      iconName: 'Wind',
    };
  }

  if (code.includes('PED') || name.includes('ped') || name.includes('child') || id.includes('PED')) {
    return {
      key: 'pediatrics',
      displayName: 'Pediatrics',
      tone: 'cyan',
      bgColor: '#cffafe',
      textColor: '#0e7490',
      borderColor: '#a5f3fc',
      badgeBg: '#ecfeff',
      aiBadgeBg: '#cffafe',
      aiColor: '#155e75',
      iconName: 'UsersRound',
    };
  }

  if (code.includes('GASTRO') || name.includes('gastro') || name.includes('digest') || id.includes('GASTRO')) {
    return {
      key: 'gastroenterology',
      displayName: 'Gastroenterology',
      tone: 'orange',
      bgColor: '#ffedd5',
      textColor: '#c2410c',
      borderColor: '#fed7aa',
      badgeBg: '#fff7ed',
      aiBadgeBg: '#ffedd5',
      aiColor: '#9a3412',
      iconName: 'Layers',
    };
  }

  if (code.includes('NEPHRO') || name.includes('nephro') || name.includes('renal') || id.includes('NEPHRO')) {
    return {
      key: 'nephrology',
      displayName: 'Nephrology',
      tone: 'violet',
      bgColor: '#ede9fe',
      textColor: '#6d28d9',
      borderColor: '#ddd6fe',
      badgeBg: '#f5f3ff',
      aiBadgeBg: '#ede9fe',
      aiColor: '#5b21b6',
      iconName: 'Droplets',
    };
  }

  // Default: General Medicine
  return {
    key: 'genmed',
    displayName: 'General Medicine',
    tone: 'blue',
    bgColor: '#dbeafe',
    textColor: '#1d4ed8',
    borderColor: '#bfdbfe',
    badgeBg: '#eff6ff',
    aiBadgeBg: '#dbeafe',
    aiColor: '#1e40af',
    iconName: 'Stethoscope',
  };
}

export function formatDoctorCount(count) {
  const num = Number(count) || 0;
  return num === 1 ? '1 Doctor' : `${num} Doctors`;
}

export function formatVisitCount(count) {
  const num = Number(count) || 0;
  return num === 1 ? '1 Visit' : `${num} Visits`;
}

export function formatAiRunCount(count) {
  const num = Number(count) || 0;
  return num === 1 ? '1 AI Run' : `${num} AI Runs`;
}
