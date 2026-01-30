import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CacheOverflowClient } from '../client.js';
import { findSolution } from './find-solution.js';
import { unlockSolution } from './unlock-solution.js';
import { publishSolution } from './publish-solution.js';
import { submitVerification } from './submit-verification.js';
import { submitFeedback } from './submit-feedback.js';

export interface ToolDefinition {
  definition: Tool;
  handler: (
    args: Record<string, unknown>,
    client: CacheOverflowClient
  ) => Promise<{ content: Array<{ type: string; text: string }> }>;
}

export const tools: ToolDefinition[] = [
  findSolution,
  unlockSolution,
  publishSolution,
  submitVerification,
  submitFeedback,
];
