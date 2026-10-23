export const serviceUrls = {
  auth: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001',
  family: process.env.FAMILY_SERVICE_URL || 'http://127.0.0.1:5002',
  hospital: process.env.HOSPITAL_SERVICE_URL || 'http://127.0.0.1:5003',
  doctor: process.env.DOCTOR_SERVICE_URL || 'http://127.0.0.1:5004',
  appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://127.0.0.1:5005',
  record: process.env.RECORD_SERVICE_URL || 'http://127.0.0.1:5006',
  ai: process.env.AI_SERVICE_URL || 'http://127.0.0.1:5007',
  knowledge: process.env.KNOWLEDGE_SERVICE_URL || 'http://127.0.0.1:5008',
};
