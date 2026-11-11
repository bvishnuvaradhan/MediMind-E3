import { resolveServiceUrl } from './runtimeConfig.js';

export const serviceUrls = {
  get auth() {
    return resolveServiceUrl('AUTH_SERVICE_URL', 'auth', 5001);
  },
  get family() {
    return resolveServiceUrl('FAMILY_SERVICE_URL', 'family', 5002);
  },
  get hospital() {
    return resolveServiceUrl('HOSPITAL_SERVICE_URL', 'hospital', 5003);
  },
  get doctor() {
    return resolveServiceUrl('DOCTOR_SERVICE_URL', 'doctor', 5004);
  },
  get appointment() {
    return resolveServiceUrl('APPOINTMENT_SERVICE_URL', 'appointment', 5005);
  },
  get record() {
    return resolveServiceUrl('RECORD_SERVICE_URL', 'records', 5006);
  },
  get ai() {
    return resolveServiceUrl('AI_SERVICE_URL', 'ai', 5007, { requiredInProd: Boolean(process.env.VERCEL) });
  },
  get knowledge() {
    return resolveServiceUrl('KNOWLEDGE_SERVICE_URL', 'knowledge', 5008);
  },
};
