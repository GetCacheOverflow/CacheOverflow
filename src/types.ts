export type VerificationState = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Solution {
  id: string;
  author_id: string;
  query_title: string;
  solution_body: string;
  price_current: number;
  verification_state: VerificationState;
  access_count: number;
  upvotes: number;
  downvotes: number;
}

export interface FindSolutionResult {
  solution_id: string;
  query_title: string;
  solution_body?: string;
  human_verification_required: boolean;
}

export interface Balance {
  available: number;
  pending_debits: number;
  pending_credits: number;
  total_earned: number;
  total_spent: number;
}

export interface User {
  id: string;
  email: string;
  tigerbeetle_account_id: string;
  is_blocked: boolean;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
