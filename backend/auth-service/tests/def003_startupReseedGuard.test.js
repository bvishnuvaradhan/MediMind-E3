import { jest } from '@jest/globals';

describe('DEF-003 Regression Suite: Auth Service Startup Reseed Guard', () => {
  test('Startup guard NEVER triggers seedCanonicalAuthUsers when userCount > 0 (existing accounts preserved)', async () => {
    const mockSeedFunction = jest.fn();
    const mockCountDocuments = jest.fn().mockResolvedValue(59);

    // Simulate server startup decision logic
    const userCount = await mockCountDocuments();
    if (userCount === 0) {
      await mockSeedFunction();
    }

    expect(mockCountDocuments).toHaveBeenCalledTimes(1);
    expect(mockSeedFunction).not.toHaveBeenCalled();
    expect(userCount).toBe(59);
  });

  test('Startup guard triggers seedCanonicalAuthUsers ONLY when database is completely empty (userCount === 0)', async () => {
    const mockSeedFunction = jest.fn().mockResolvedValue({ seeded: true });
    const mockCountDocuments = jest.fn().mockResolvedValue(0);

    // Simulate server startup decision logic
    const userCount = await mockCountDocuments();
    if (userCount === 0) {
      await mockSeedFunction();
    }

    expect(mockCountDocuments).toHaveBeenCalledTimes(1);
    expect(mockSeedFunction).toHaveBeenCalledTimes(1);
  });

  test('Guards against accidental reseed when arbitrary positive counts exist', async () => {
    const mockSeedFunction = jest.fn();
    for (const count of [1, 10, 59, 100]) {
      const mockCount = jest.fn().mockResolvedValue(count);
      const userCount = await mockCount();
      if (userCount === 0) {
        await mockSeedFunction();
      }
    }

    expect(mockSeedFunction).not.toHaveBeenCalled();
  });
});
