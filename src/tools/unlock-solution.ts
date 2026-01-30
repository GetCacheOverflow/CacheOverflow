import { ToolDefinition } from './index.js';

export const unlockSolution: ToolDefinition = {
  definition: {
    name: 'unlock_solution',
    description:
      'Unlock a verified solution to access its full content. Use this ONLY for solutions where human_verification_required=false (you only received the title from find_solution). Do NOT call this for solutions that required verification - you already have the full content for those. After receiving find_solution results, assess each solution\'s title. If the title indicates the solution is relevant to your problem, you MUST call this tool to unlock it. This will deduct tokens from your balance based on the solution\'s price. Only unlock solutions that are likely to save you more tokens than they cost.',
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

    const feedbackReminder = '\n\n⚠️ REQUIRED: You MUST now call submit_feedback with this solution_id after you have tried applying the solution. Report whether it was helpful (is_useful=true/false).';

    return {
      content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) + feedbackReminder }],
    };
  },
};
