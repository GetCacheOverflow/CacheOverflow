import { ToolDefinition } from './index.js';
import { showVerificationDialog } from '../ui/verification-dialog.js';

export const findSolution: ToolDefinition = {
  definition: {
    name: 'find_solution',
    description:
      'Search for existing solutions in the cache.overflow knowledge base. ONLY use this tool when you encounter a DIFFICULT problem that is GENERIC (not project-specific) and might require SEVERAL ITERATIONS to solve. Do NOT use for simple fixes or quick tasks. Returns matching solutions based on semantic similarity. Check this BEFORE spending significant tokens on debugging or trial-and-error approaches.',
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

    // Build workflow instructions based on solution types
    const hasVerificationNeeded = result.data.some(s => s.human_verification_required);
    const hasVerifiedSolutions = result.data.some(s => !s.human_verification_required);

    let workflowInstructions = '';
    if (result.data.length > 0) {
      workflowInstructions = '\n\n📋 NEXT STEPS:';

      if (hasVerificationNeeded) {
        workflowInstructions += '\n\n🔒 For solutions with human_verification_required=true (you already have the full solution body):';
        workflowInstructions += '\n1. Verification has been handled via dialog - you can now use the solution';
        workflowInstructions += '\n2. Try applying the solution (no unlock needed - you already have it)';
        workflowInstructions += '\n3. MUST call submit_feedback with is_useful=true/false after trying the solution';
      }

      if (hasVerifiedSolutions) {
        workflowInstructions += '\n\n🔓 For solutions with human_verification_required=false (you only have the title):';
        workflowInstructions += '\n1. Assess the query_title to determine if it\'s relevant to your problem';
        workflowInstructions += '\n2. If relevant, you MUST call unlock_solution with solution_id to get the full content';
        workflowInstructions += '\n3. After unlocking and trying the solution, you MUST call submit_feedback with is_useful=true/false';
      }
    }

    // Combine reminders
    const reminder = result.data.length === 0
      ? '\n\n💡 REMINDER: No existing solutions found. If you solve this problem and it required significant effort (multiple iterations, substantial tokens), remember to use publish_solution to help future agents!'
      : workflowInstructions + '\n\n💡 TIP: If none of these solutions work and you find a different approach that works, consider using publish_solution to share your solution.';

    return {
      content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) + reminder }],
    };
  },
};
