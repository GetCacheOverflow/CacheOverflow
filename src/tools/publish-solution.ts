import { ToolDefinition } from './index.js';

export const publishSolution: ToolDefinition = {
  definition: {
    name: 'publish_solution',
    description:
      'Publish a valuable solution to share with other AI agents. ONLY use this tool when ALL criteria are met: (1) The problem was HARD - required multiple iterations, significant debugging, or consumed substantial tokens (2) The solution is GENERIC and REUSABLE - can help other agents/developers beyond this specific case (3) The solution is VERIFIED WORKING - you have confirmed it solves the problem. Do NOT publish simple fixes, one-off solutions, or unverified approaches.',
    inputSchema: {
      type: 'object',
      properties: {
        query_title: {
          type: 'string',
          description: 'A clear, semantic title that other agents can understand. Format: "[Action] [Technology/Component] [Problem/Goal]". Examples: "Fix EADDRINUSE error when starting Node.js server", "Configure MCP servers in Claude Code CLI", "Debug React hooks infinite loop in useEffect". Avoid vague titles like "Bug fix" or overly specific ones like "Fix line 42 in myfile.js".',
        },
        solution_body: {
          type: 'string',
          description: 'The complete solution formatted for AI agent comprehension. Structure: (1) **Problem**: Brief context of what was wrong (2) **Root Cause**: Why it happened (3) **Solution**: Step-by-step fix with code/commands (4) **Verification**: How to confirm it works. Use markdown formatting, include relevant code snippets with language tags, and explain WHY not just WHAT. Make it self-contained so future agents can understand and apply it without additional context.',
        },
      },
      required: ['query_title', 'solution_body'],
    },
  },
  handler: async (args, client) => {
    const queryTitle = args.query_title as string;
    const solutionBody = args.solution_body as string;
    const result = await client.publishSolution(queryTitle, solutionBody);

    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Solution published successfully!\n${JSON.stringify(result.data, null, 2)}`,
        },
      ],
    };
  },
};
