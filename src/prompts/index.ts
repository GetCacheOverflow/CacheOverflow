import { Prompt, TextContent } from '@modelcontextprotocol/sdk/types.js';

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

export const prompts: PromptDefinition[] = [publishGuidancePrompt];
