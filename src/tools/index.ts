import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CacheOverflowClient } from '../client.js';
import { configService } from '../services/config-service.js';
import type { RemoteToolDefinition } from '../types.js';
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

// Map of tool handlers by name
const toolHandlers: Record<
  string,
  (
    args: Record<string, unknown>,
    client: CacheOverflowClient
  ) => Promise<{ content: Array<{ type: string; text: string }> }>
> = {
  find_solution: findSolution.handler,
  unlock_solution: unlockSolution.handler,
  publish_solution: publishSolution.handler,
  submit_verification: submitVerification.handler,
  submit_feedback: submitFeedback.handler,
};

/**
 * Convert a remote tool definition to a local Tool format
 */
function remoteToLocalTool(remote: RemoteToolDefinition): Tool {
  return {
    name: remote.name,
    description: remote.description,
    inputSchema: {
      type: remote.inputSchema.type as 'object',
      properties: remote.inputSchema.properties,
      required: remote.inputSchema.required,
    },
  };
}

/**
 * Get tools with definitions from the backend API.
 * Throws if the backend is unavailable.
 */
export async function getTools(): Promise<ToolDefinition[]> {
  const remoteConfig = await configService.fetchConfig();

  const tools: ToolDefinition[] = [];

  for (const remoteTool of remoteConfig.tools) {
    const handler = toolHandlers[remoteTool.name];

    if (!handler) {
      // Skip tools without handlers (allows backend to prepare for future tools)
      continue;
    }

    tools.push({
      definition: remoteToLocalTool(remoteTool),
      handler,
    });
  }

  return tools;
}
