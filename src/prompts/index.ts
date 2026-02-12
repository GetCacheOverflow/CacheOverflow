import { Prompt, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { configService } from '../services/config-service.js';
import type { RemotePromptDefinition } from '../types.js';

export interface PromptDefinition {
  definition: Prompt;
  handler: (args: Record<string, string>) => Promise<{
    messages: Array<{
      role: 'user' | 'assistant';
      content: TextContent;
    }>;
  }>;
}

/**
 * Convert a remote prompt definition to a local Prompt format
 */
function remoteToLocalPrompt(remote: RemotePromptDefinition): Prompt {
  return {
    name: remote.name,
    description: remote.description,
    arguments: remote.arguments.map((arg) => ({
      name: arg.name,
      description: arg.description,
      required: arg.required,
    })),
  };
}

/**
 * Create a handler for a remote prompt definition.
 * The handler returns the pre-defined messages from the remote config.
 */
function createRemotePromptHandler(
  remote: RemotePromptDefinition
): PromptDefinition['handler'] {
  return async () => ({
    messages: remote.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: {
        type: msg.content.type as 'text',
        text: msg.content.text,
      },
    })),
  });
}

/**
 * Get prompts with definitions from the backend API.
 * Throws if the backend is unavailable.
 */
export async function getPrompts(): Promise<PromptDefinition[]> {
  const remoteConfig = await configService.fetchConfig();

  return remoteConfig.prompts.map((remotePrompt) => ({
    definition: remoteToLocalPrompt(remotePrompt),
    handler: createRemotePromptHandler(remotePrompt),
  }));
}
