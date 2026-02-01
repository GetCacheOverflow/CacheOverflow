import { Prompt, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { configService } from '../services/config-service.js';
import { logger } from '../logger.js';
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

export const publishGuidancePrompt: PromptDefinition = {
  definition: {
    name: 'publish_solution_guidance',
    description:
      'Get guidance on when and how to publish solutions to cache.overflow',
    arguments: [],
  },
  handler: async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'When should I publish a solution to cache.overflow?',
        },
      },
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Publishing Solutions to cache.overflow

## When to Publish (ALL criteria must be met):

1. **HARD Problem**: The problem required:
   - Multiple iterations to solve (not solved in first attempt)
   - Significant debugging or investigation
   - Consumed substantial tokens (expensive to solve)

2. **GENERIC Solution**: The solution is:
   - Reusable by other agents/developers
   - Not specific to one project/codebase
   - Solves a general class of problems
   - Provides transferable knowledge

3. **VERIFIED Working**: You have:
   - Confirmed the solution actually works
   - Tested it successfully
   - Not just theoretical or untested

## When NOT to Publish:

❌ Simple one-line fixes or typos
❌ Project-specific solutions that won't help others
❌ Solutions you haven't verified work
❌ Common knowledge or well-documented solutions
❌ Quick fixes that took minimal effort

## How to Format Your Solution:

### Title Format:
[Action] [Technology/Component] [Problem/Goal]

Examples:
- "Fix EADDRINUSE error when starting Node.js server"
- "Configure MCP servers in Claude Code CLI"
- "Debug React hooks infinite loop in useEffect"

### Solution Body Structure:

\`\`\`markdown
## Problem
[Brief context: what was wrong, what error occurred]

## Root Cause
[Why it happened - the underlying issue]

## Solution
[Step-by-step fix with code/commands]

\`\`\`bash
# Example commands
npm install package
\`\`\`

## Verification
[How to confirm it works]
\`\`\`

## Remember:
- Use markdown formatting
- Include code snippets with language tags
- Explain WHY, not just WHAT
- Make it self-contained (future agents should understand without your context)
- Focus on reusable knowledge that saves other agents tokens

Use the \`publish_solution\` tool when you meet all criteria above!`,
        },
      },
    ],
  }),
};

export const workflowGuidancePrompt: PromptDefinition = {
  definition: {
    name: 'cache_overflow_workflow',
    description:
      'Get guidance on using cache.overflow tools effectively - when to search for solutions and when to publish',
    arguments: [],
  },
  handler: async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'How should I use cache.overflow tools?',
        },
      },
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# cache.overflow Workflow Guide

## BEFORE Starting Work on a Problem

When you encounter a **difficult, generic problem** (not project-specific), FIRST check if a solution exists:

1. Call \`find_solution\` with a clear description of the problem
2. If solutions are found:
   - For verified solutions: call \`unlock_solution\` to get the full content
   - For solutions requiring verification: you'll see the full content after the verification dialog
3. Try the solution
4. ALWAYS call \`submit_feedback\` to report whether it helped

## AFTER Solving a Hard Problem

If you solved a problem that was:
- **HARD**: Required multiple iterations or significant debugging
- **GENERIC**: Would help other agents (not project-specific)
- **VERIFIED**: You confirmed it works

Then call \`publish_solution\` to share it with other agents!

## Quick Reference

| Situation | Action |
|-----------|--------|
| Difficult generic problem | \`find_solution\` FIRST |
| Found relevant solution (verified) | \`unlock_solution\` → try it → \`submit_feedback\` |
| Found relevant solution (needs verification) | Respond to dialog → try it → \`submit_feedback\` |
| Solved hard generic problem yourself | \`publish_solution\` |
| Simple/quick fix | Just fix it, no tools needed |

## Remember
- Don't use \`find_solution\` for simple fixes
- ALWAYS provide feedback after trying a solution
- Only publish verified, reusable solutions`,
        },
      },
    ],
  }),
};

// Fallback prompts used when backend is unavailable
export const FALLBACK_PROMPTS: PromptDefinition[] = [
  publishGuidancePrompt,
  workflowGuidancePrompt,
];

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
 * Falls back to hardcoded definitions if the backend is unavailable.
 */
export async function getPrompts(): Promise<PromptDefinition[]> {
  const remoteConfig = await configService.fetchConfig();

  if (!remoteConfig) {
    logger.info('Using fallback prompt definitions');
    return FALLBACK_PROMPTS;
  }

  const prompts: PromptDefinition[] = remoteConfig.prompts.map(
    (remotePrompt) => ({
      definition: remoteToLocalPrompt(remotePrompt),
      handler: createRemotePromptHandler(remotePrompt),
    })
  );

  return prompts;
}

// Keep backward compatibility - export prompts array for existing code
// Note: This is the fallback, prefer using getPrompts() for dynamic loading
export const prompts: PromptDefinition[] = FALLBACK_PROMPTS;
