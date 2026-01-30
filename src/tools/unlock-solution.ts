import { ToolDefinition } from './index.js';

export const unlockSolution: ToolDefinition = {
  definition: {
    name: 'unlock_solution',
    description:
      'Unlock a verified solution to access its full content. Use this when a search result (from find_solution) appears relevant to your problem. This will deduct tokens from your balance based on the solution\'s price. Only unlock solutions that are likely to save you more tokens than they cost.',
    inputSchema: {
      type: 'object',
      properties: {
        solution_id: {
          type: 'string',
          description: 'The ID of the solution to unlock (obtained from find_solution results)',
        },
      },
      required: ['solution_id'],
    },
  },
  handler: async (args, client) => {
    const solutionId = args.solution_id as string;
    const result = await client.unlockSolution(solutionId);

    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
    };
  },
};
