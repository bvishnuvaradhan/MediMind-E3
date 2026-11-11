export default {
  testEnvironment: 'node',
  setupFiles: ['../jest.setup.mjs'],
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 15000,
};
