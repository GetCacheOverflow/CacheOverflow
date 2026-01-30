import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CacheOverflowClient } from './client.js';
import { MockServer } from './testing/mock-server.js';
import { mockSolutions, mockFindResults } from './testing/mock-data.js';

describe('CacheOverflowClient', () => {
  let mockServer: MockServer;
  let client: CacheOverflowClient;

  beforeAll(async () => {
    mockServer = new MockServer();
    await mockServer.start();
    client = new CacheOverflowClient(mockServer.url);
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  describe('findSolution', () => {
    it('should return search results', async () => {
      const result = await client.findSolution('binary search');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data[0]).toHaveProperty('solution_id');
        expect(result.data[0]).toHaveProperty('query_title');
        expect(result.data[0]).toHaveProperty('human_verification_required');
      }
    });

    it('should return results matching the query', async () => {
      const result = await client.findSolution('TypeScript');

      expect(result.success).toBe(true);
      if (result.success) {
        const hasTypeScript = result.data.some((r) =>
          r.query_title.toLowerCase().includes('typescript')
        );
        expect(hasTypeScript).toBe(true);
      }
    });
  });

  describe('unlockSolution', () => {
    it('should return the unlocked solution', async () => {
      const result = await client.unlockSolution(mockSolutions[0].id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('solution_body');
        expect(result.data).toHaveProperty('price_current');
        expect(result.data).toHaveProperty('verification_state');
      }
    });

    it('should return a solution even for unknown IDs', async () => {
      const result = await client.unlockSolution('unknown_id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('id');
      }
    });
  });

  describe('publishSolution', () => {
    it('should create a new solution', async () => {
      const result = await client.publishSolution(
        'How to test async code in Vitest',
        'Use async/await with expect().resolves or expect().rejects'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('id');
        expect(result.data.query_title).toBe('How to test async code in Vitest');
        expect(result.data.solution_body).toBe(
          'Use async/await with expect().resolves or expect().rejects'
        );
        expect(result.data.verification_state).toBe('PENDING');
      }
    });
  });

  describe('submitVerification', () => {
    it('should submit verification successfully', async () => {
      const result = await client.submitVerification(mockSolutions[0].id, true);

      expect(result.success).toBe(true);
    });

    it('should allow marking as unsafe', async () => {
      const result = await client.submitVerification(mockSolutions[0].id, false);

      expect(result.success).toBe(true);
    });
  });

  describe('submitFeedback', () => {
    it('should submit positive feedback', async () => {
      const result = await client.submitFeedback(mockSolutions[0].id, true);

      expect(result.success).toBe(true);
    });

    it('should submit negative feedback', async () => {
      const result = await client.submitFeedback(mockSolutions[0].id, false);

      expect(result.success).toBe(true);
    });
  });
});
