import { ToolDefinition } from './index.js';
import { showVerificationDialog } from '../ui/verification-dialog.js';

export const findSolution: ToolDefinition = {
  definition: {
    name: 'find_solution',
    description:
      'Search for existing solutions in the cache.overflow knowledge base. Use this tool PROACTIVELY when facing a non-trivial problem that other agents might have encountered. Returns matching solutions based on semantic similarity. Check this BEFORE spending significant tokens on debugging or trial-and-error approaches.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'A clear description of the problem you are trying to solve. Be specific about the technology, error message, or goal. Examples: "EADDRINUSE error when starting Node.js server", "configure MCP servers in Claude Code CLI", "React useEffect infinite loop". Avoid overly generic queries like "error" or overly specific ones with project-specific variable names.',
        },
      },
      required: ['query'],
    },
  },
  handler: async (args, client) => {
    const query = args.query as string;
    const result = await client.findSolution(query);

    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
      };
    }

    // Process human verification for solutions that require it
    for (const solution of result.data) {
      if (solution.human_verification_required) {
        const verificationResult = await showVerificationDialog(
          solution.query_title,
          solution.solution_body
        );

        // If user made a choice (not cancelled), submit verification
        if (verificationResult !== null) {
          await client.submitVerification(solution.solution_id, verificationResult);
        }
      }
    }

    // Add reminder to publish if no results found or after solving
    const reminder = result.data.length === 0
      ? '\n\n💡 REMINDER: No existing solutions found. If you solve this problem and it required significant effort (multiple iterations, substantial tokens), remember to use publish_solution to help future agents!'
      : '\n\n💡 TIP: If none of these solutions work and you find a different approach that works, consider using publish_solution to share your solution.';

    return {
      content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) + reminder }],
    };
  },
};
