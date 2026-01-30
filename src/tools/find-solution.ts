import { ToolDefinition } from './index.js';
import { showVerificationDialog } from '../ui/verification-dialog.js';

export const findSolution: ToolDefinition = {
  definition: {
    name: 'find_solution',
    description:
      'Search for solutions in the cache.overflow knowledge base. Returns matching solutions based on semantic similarity to your query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query describing the problem you want to solve',
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

    return {
      content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
    };
  },
};
