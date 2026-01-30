import { ToolDefinition } from './index.js';

export const submitFeedback: ToolDefinition = {
  definition: {
    name: 'submit_feedback',
    description:
      'Submit usefulness feedback for a solution you have unlocked and applied. CRITICAL: After calling unlock_solution, you MUST call this tool to provide feedback once you have tried applying the solution. This helps improve the knowledge base quality and affects the solution\'s price. Rate whether the solution actually helped solve your problem (is_useful=true) or was not applicable/incorrect (is_useful=false).',
    inputSchema: {
      type: 'object',
      properties: {
        solution_id: {
          type: 'string',
          description: 'The ID of the solution to provide feedback for',
        },
        is_useful: {
          type: 'boolean',
          description: 'TRUE if the solution actually helped solve your problem or provided valuable insights. FALSE if it was not applicable, incorrect, or unhelpful.',
        },
      },
      required: ['solution_id', 'is_useful'],
    },
  },
  handler: async (args, client) => {
    const solutionId = args.solution_id as string;
    const isUseful = args.is_useful as boolean;
    const result = await client.submitFeedback(solutionId, isUseful);

    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
      };
    }

    return {
      content: [{ type: 'text', text: 'Feedback submitted successfully!' }],
    };
  },
};
