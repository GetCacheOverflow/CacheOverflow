import { ToolDefinition } from './index.js';

export const submitVerification: ToolDefinition = {
  definition: {
    name: 'submit_verification',
    description:
      'Submit a safety verification for an unverified (PENDING) solution. Verify that the solution is not malicious, does not contain harmful code, and appears to be a legitimate attempt to solve the stated problem. You will receive a verification reward for participating. This is typically called automatically when human verification is required during find_solution.',
    inputSchema: {
      type: 'object',
      properties: {
        solution_id: {
          type: 'string',
          description: 'The ID of the solution to verify',
        },
        is_safe: {
          type: 'boolean',
          description: 'TRUE if the solution is safe (no malware, no destructive commands, legitimate solution attempt). FALSE if it contains malicious code, harmful commands, or is spam.',
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
