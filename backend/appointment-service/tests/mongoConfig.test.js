import { validateMongoConfig, maskMongoUri } from '../../mongoConfigValidator.js';

describe('Safe MongoDB Configuration & Masking Suite', () => {
  describe('validateMongoConfig', () => {
    test('throws when URI is null, undefined, or empty string', () => {
      expect(() => validateMongoConfig(null)).toThrow('MongoDB URI is missing or empty');
      expect(() => validateMongoConfig('')).toThrow('MongoDB URI is missing or empty');
      expect(() => validateMongoConfig('   ')).toThrow('MongoDB URI is missing or empty');
    });

    test('correctly identifies localhost URI in development mode', () => {
      const res = validateMongoConfig('mongodb://127.0.0.1:27017/test_db', { NODE_ENV: 'development' });
      expect(res.isLocalhost).toBe(true);
      expect(res.isRemote).toBe(false);
      expect(res.strictRemote).toBe(false);
      expect(res.allowLocalFallback).toBe(true);
    });

    test('strictly rejects localhost URI when STRICT_REMOTE_DB is enabled', () => {
      expect(() => {
        validateMongoConfig('mongodb://127.0.0.1:27017/test_db', { STRICT_REMOTE_DB: 'true' });
      }).toThrow('Localhost MongoDB is strictly prohibited when remote database is required');
    });

    test('strictly rejects localhost URI in production mode', () => {
      expect(() => {
        validateMongoConfig('mongodb://localhost:27017/prod_db', { NODE_ENV: 'production' });
      }).toThrow('Localhost MongoDB is strictly prohibited when remote database is required');
    });

    test('accepts remote Atlas mongodb+srv URI in strict mode', () => {
      const remoteUri = 'mongodb+srv://dbUser:SecretPass123@cluster0.plxllln.mongodb.net/medimind';
      const res = validateMongoConfig(remoteUri, { STRICT_REMOTE_DB: 'true', NODE_ENV: 'production' });
      expect(res.isLocalhost).toBe(false);
      expect(res.isRemote).toBe(true);
      expect(res.strictRemote).toBe(true);
    });
  });

  describe('maskMongoUri (Zero Credential Leakage)', () => {
    test('masks standard mongodb+srv URI with username and password', () => {
      const masked = maskMongoUri('mongodb+srv://medimind_admin:superSecretPassword99@cluster0.plxllln.mongodb.net/medimind_db');
      expect(masked).toBe('mongodb+srv://***:***@cluster0.plxllln.mongodb.net/medimind_db');
      expect(masked).not.toContain('medimind_admin');
      expect(masked).not.toContain('superSecretPassword99');
    });

    test('masks standard mongodb:// URI with credentials', () => {
      const masked = maskMongoUri('mongodb://user:myPass@remotehost.internal:27017/db');
      expect(masked).toBe('mongodb://***:***@remotehost.internal:27017/db');
      expect(masked).not.toContain('user');
      expect(masked).not.toContain('myPass');
    });

    test('handles empty or non-string inputs safely', () => {
      expect(maskMongoUri(null)).toBe('<EMPTY>');
      expect(maskMongoUri(undefined)).toBe('<EMPTY>');
      expect(maskMongoUri('')).toBe('<EMPTY>');
    });
  });
});
