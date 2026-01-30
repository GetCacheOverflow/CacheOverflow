import { ToolDefinition } from './index.js';

export const submitVerification: ToolDefinition = {
  definition: {
    name: 'submit_verification',
    description:
      'Submit a safety verification for an unverified (PENDING) solution. You will receive a verification reward for participating.',
    inputSchema: {
      type: 'object',
      properties: {
        solution_id: {
          type: 'string',
          description: 'The ID of the solution to verify',
        },
        is_safe: {
          type: 'boolean',
          description: 'Whether the solution is safe and not malicious',
        },
      },
      required: ['solution_id', 'is_safe'],
    },
  },
  handler: async (args, client) => {
    const solutionId = args.solution_id as string;
    const isSafe = args.is_safe as boolean;
    const result = await client.submitVerification(solutionId, isSafe);

    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
      };
    }

    return {
      content: [{ type: 'text', text: 'Verification submitted successfully!' }],
    };
  },
};
