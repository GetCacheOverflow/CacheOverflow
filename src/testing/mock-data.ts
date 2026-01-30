import type { Solution, FindSolutionResult, Balance } from '../types.js';

export const mockSolutions: Solution[] = [
  {
    id: 'sol_001',
    author_id: 'user_123',
    query_title: 'How to implement binary search in TypeScript',
    solution_body: `function binarySearch<T>(arr: T[], target: T): number {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
    price_current: 50,
    verification_state: 'VERIFIED',
    access_count: 127,
    upvotes: 45,
    downvotes: 2,
  },
  {
    id: 'sol_002',
    author_id: 'user_456',
    query_title: 'Fix memory leak in Node.js event listeners',
    solution_body: `// Always remove event listeners when done
const handler = () => { /* ... */ };
emitter.on('event', handler);
// Later:
emitter.off('event', handler);

// Or use once() for one-time listeners
emitter.once('event', () => { /* ... */ });`,
    price_current: 75,
    verification_state: 'VERIFIED',
    access_count: 89,
    upvotes: 32,
    downvotes: 1,
  },
  {
    id: 'sol_003',
    author_id: 'user_789',
    query_title: 'Optimize React re-renders with useMemo',
    solution_body: `import { useMemo } from 'react';

function ExpensiveComponent({ data }) {
  const processed = useMemo(() => {
    return data.map(item => heavyComputation(item));
  }, [data]);

  return <div>{processed}</div>;
}`,
    price_current: 60,
    verification_state: 'PENDING',
    access_count: 15,
    upvotes: 8,
    downvotes: 0,
  },
];

export const mockFindResults: FindSolutionResult[] = [
  {
    solution_id: 'sol_001',
    query_title: 'How to implement binary search in TypeScript',
    human_verification_required: false,
  },
  {
    solution_id: 'sol_002',
    query_title: 'Fix memory leak in Node.js event listeners',
    human_verification_required: true,
  },
  {
    solution_id: 'sol_003',
    query_title: 'Optimize React re-renders with useMemo',
    solution_body: `import { useMemo } from 'react';

function ExpensiveComponent({ data }) {
  const processed = useMemo(() => {
    return data.map(item => heavyComputation(item));
  }, [data]);

  return <div>{processed}</div>;
}`,
    human_verification_required: false,
  },
];

export const mockBalance: Balance = {
  available: 1500,
  pending_debits: 75,
  pending_credits: 200,
  total_earned: 3500,
  total_spent: 1800,
};

export function createMockSolution(overrides: Partial<Solution> = {}): Solution {
  return {
    id: `sol_${Date.now()}`,
    author_id: 'user_mock',
    query_title: 'Mock solution title',
    solution_body: 'Mock solution body content',
    price_current: 50,
    verification_state: 'PENDING',
    access_count: 0,
    upvotes: 0,
    downvotes: 0,
    ...overrides,
  };
}

export function createMockFindResult(
  overrides: Partial<FindSolutionResult> = {}
): FindSolutionResult {
  return {
    solution_id: `sol_${Date.now()}`,
    query_title: 'Mock query title',
    human_verification_required: false,
    ...overrides,
  };
}

export function createMockBalance(overrides: Partial<Balance> = {}): Balance {
  return {
    available: 1000,
    pending_debits: 0,
    pending_credits: 0,
    total_earned: 1000,
    total_spent: 0,
    ...overrides,
  };
}
