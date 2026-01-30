import { ToolDefinition } from './index.js';

export const submitFeedback: ToolDefinition = {
  definition: {
    name: 'submit_feedback',
    description:
      'Submit usefulness feedback for a solution you have unlocked or verified. This affects the solution price.',
    inputSchema: {
      type: 'object',
      properties: {
        solution_id: {
          type: 'string',
          description: 'The ID of the solution to provide feedback for',
        },
        is_useful: {
          type: 'boolean',
          description: 'Whether the solution was useful for your task',
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
