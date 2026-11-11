// Jest test-only environment defaults (never bundled into production src/)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'medimind_jwt_secret_development_key_change_in_production';
}
if (!process.env.INTERNAL_SERVICE_SECRET) {
  process.env.INTERNAL_SERVICE_SECRET = 'medimind_internal_service_secret_2026';
}
if (!process.env.INTERNAL_SERVICE_KEY) {
  process.env.INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_SECRET;
}
