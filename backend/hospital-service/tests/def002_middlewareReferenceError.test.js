import { jest } from '@jest/globals';
import { optionalAuth, authenticate } from '../src/middleware/authMiddleware.js';

describe('DEF-002 Regression Suite: Hospital Service Auth Middleware Reference Safety', () => {
  const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';

  test('optionalAuth does NOT throw ReferenceError when x-user-reference-id is missing', () => {
    const req = {
      headers: {
        'x-internal-service-secret': INTERNAL_SECRET,
        'x-user-id': 'usr_test_123',
        'x-user-role': 'HOSPITAL_ADMIN',
        // 'x-user-reference-id' is intentionally omitted
      },
    };
    const res = {};
    const next = jest.fn();

    expect(() => {
      optionalAuth(req, res, next);
    }).not.toThrow();

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('usr_test_123');
    expect(req.user.role).toBe('HOSPITAL_ADMIN');
    expect(req.user.referenceId).toBeNull();
  });

  test('optionalAuth correctly populates referenceId when provided in headers', () => {
    const req = {
      headers: {
        'x-internal-service-secret': INTERNAL_SECRET,
        'x-user-id': 'usr_test_admin',
        'x-user-role': 'HOSPITAL_ADMIN',
        'x-user-reference-id': 'hosp_aarogyam_01',
      },
    };
    const res = {};
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeDefined();
    expect(req.user.referenceId).toBe('hosp_aarogyam_01');
    expect(req.user.hospitalId).toBe('hosp_aarogyam_01');
  });

  test('optionalAuth passes through unauthenticated requests with req.user = null without throwing', () => {
    const req = {
      headers: {},
    };
    const res = {};
    const next = jest.fn();

    expect(() => {
      optionalAuth(req, res, next);
    }).not.toThrow();

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeNull();
  });

  test('authenticate middleware safely handles missing reference-id header without error', () => {
    const req = {
      headers: {
        'x-internal-service-secret': INTERNAL_SECRET,
        'x-user-id': 'usr_test_doc',
        'x-user-role': 'DOCTOR',
        // omitted reference-id
      },
    };
    const res = {};
    const next = jest.fn();

    expect(() => {
      authenticate(req, res, next);
    }).not.toThrow();

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.referenceId).toBeNull();
  });
});
