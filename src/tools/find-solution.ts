import { ToolDefinition } from './index.js';
import { showVerificationDialog } from '../ui/verification-dialog.js';
import { config } from '../config.js';

// #6 - Improve error messages with context
function getErrorTitle(error: string): string {
  if (error.includes('timeout') || error.includes('timed out')) return 'Request Timed Out';
  if (error.includes('network') || error.includes('fetch')) return 'Network Connection Failed';
  if (error.includes('balance') || error.includes('insufficient')) return 'Insufficient Token Balance';
  if (error.includes('auth') || error.includes('Authentication')) return 'Authentication Failed';
  if (error.includes('Rate limit')) return 'Rate Limit Exceeded';
  return 'Operation Failed';
}

function getRecoverySuggestions(error: string): string {
  if (error.includes('timeout') || error.includes('timed out')) {
    return '- Check your internet connection\n- Try again in a moment\n- The server may be experiencing high load';
  }
  if (error.includes('balance') || error.includes('insufficient')) {
    return '- Check your balance with another tool or API call\n- Earn tokens by publishing solutions\n- Look for solutions with human_verification_required=false';
  }
  if (error.includes('auth') || error.includes('Authentication')) {
    return '- Verify your CACHE_OVERFLOW_TOKEN environment variable is set correctly\n- Token should start with "co_"\n- Check if your token has expired';
  }
  if (error.includes('Rate limit')) {
    return '- Wait the specified time before retrying\n- Consider using solutions with human_verification_required=false to avoid token costs';
  }
  if (error.includes('network') || error.includes('fetch')) {
    return '- Check your internet connection\n- Verify the CACHE_OVERFLOW_URL is correct\n- Try again in a moment';
  }
  return '- Check the log file for details\n- Verify your CACHE_OVERFLOW_TOKEN is valid\n- Try again in a moment';
}

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
    // #5 - Add input validation
    const query = (args.query as string || '').trim();

    if (!query) {
      return {
        content: [{ type: 'text', text: 'Error: Query cannot be empty. Please provide a description of the problem you are trying to solve.' }],
      };
    }

    if (query.length < 5) {
      return {
        content: [{ type: 'text', text: 'Error: Query must be at least 5 characters long. Please provide more details about the problem.' }],
      };
    }

    if (query.length > 500) {
      return {
        content: [{ type: 'text', text: 'Error: Query must be less than 500 characters. Please provide a more concise description.' }],
      };
    }

    const result = await client.findSolution(query);

    if (!result.success) {
      // #6 - Improve error messages with context
      const errorMessage = [
        `❌ ${getErrorTitle(result.error || '')}`,
        '',
        result.error,
        '',
        '💡 **What to try:**',
        getRecoverySuggestions(result.error || ''),
        '',
        `📋 **Logs**: Check ${config.logging.logDir || '~/.cache-overflow'}/cache-overflow-mcp.log for details`,
      ].join('\n');

      return {
        content: [{ type: 'text', text: errorMessage }],
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
          // #10 - Catch verification submission errors
          try {
            const submitResult = await client.submitVerification(solution.solution_id, verificationResult);
            if (!submitResult.success) {
              // Log but don't fail - user still gets the solution content
              console.warn(`Warning: Failed to submit verification for solution ${solution.solution_id}: ${submitResult.error}`);
            }
          } catch (error) {
            // Log but don't fail - user still gets the solution content
            console.warn(`Warning: Error submitting verification for solution ${solution.solution_id}:`, error);
          }
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
