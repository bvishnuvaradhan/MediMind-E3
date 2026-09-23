import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  jwtSecret: process.env.JWT_SECRET || "",
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || "",
  services: {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:5001",
    family: process.env.FAMILY_SERVICE_URL || "http://localhost:5002",
    hospital: process.env.HOSPITAL_SERVICE_URL || "http://localhost:5003",
    doctor: process.env.DOCTOR_SERVICE_URL || "http://localhost:5004",
    appointment: process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5005",
    record: process.env.RECORD_SERVICE_URL || "http://localhost:5006",
    ai: process.env.AI_SERVICE_URL || "http://localhost:5007",
    knowledge: process.env.KNOWLEDGE_SERVICE_URL || "http://localhost:5008",
  },
};

export const validateConfig = () => {
  if (!config.jwtSecret || config.jwtSecret.trim().length === 0) {
    throw new Error("JWT_SECRET environment variable is required on api-gateway");
  }
};
