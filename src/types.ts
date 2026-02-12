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

// Remote MCP configuration types (fetched from backend)

export interface RemoteInputProperty {
  type: string;
  description: string;
}

export interface RemoteInputSchema {
  type: string;
  properties: Record<string, RemoteInputProperty>;
  required: string[];
}

export interface RemoteToolDefinition {
  name: string;
  description: string;
  inputSchema: RemoteInputSchema;
}

export interface RemotePromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface RemotePromptMessageContent {
  type: string;
  text: string;
}

export interface RemotePromptMessage {
  role: string;
  content: RemotePromptMessageContent;
}

export interface RemotePromptDefinition {
  name: string;
  description: string;
  arguments: RemotePromptArgument[];
  messages: RemotePromptMessage[];
}

export interface McpConfigResponse {
  schema_version: string;
  tools: RemoteToolDefinition[];
  prompts: RemotePromptDefinition[];
  instructions?: string;
}
