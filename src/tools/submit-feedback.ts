import { ToolDefinition } from './index.js';
import { config } from '../config.js';

// #6 - Improve error messages with context
function getErrorTitle(error: string): string {
  if (error.includes('timeout') || error.includes('timed out')) return 'Request Timed Out';
  if (error.includes('network') || error.includes('fetch')) return 'Network Connection Failed';
  if (error.includes('auth') || error.includes('Authentication')) return 'Authentication Failed';
  if (error.includes('Rate limit')) return 'Rate Limit Exceeded';
  if (error.includes('not found') || error.includes('404')) return 'Solution Not Found';
  if (error.includes('already submitted')) return 'Feedback Already Submitted';
  return 'Operation Failed';
}

function getRecoverySuggestions(error: string): string {
  if (error.includes('timeout') || error.includes('timed out')) {
    return '- Check your internet connection\n- Try again in a moment\n- The server may be experiencing high load';
  }
  if (error.includes('auth') || error.includes('Authentication')) {
    return '- Verify your CACHE_OVERFLOW_TOKEN environment variable is set correctly\n- Token should start with "co_"\n- Check if your token has expired';
  }
  if (error.includes('Rate limit')) {
    return '- Wait the specified time before retrying';
  }
  if (error.includes('not found') || error.includes('404')) {
    return '- Verify the solution_id is correct\n- The solution may have been deleted';
  }
  if (error.includes('already submitted')) {
    return '- You have already submitted feedback for this solution\n- No action needed';
  }
  if (error.includes('network') || error.includes('fetch')) {
    return '- Check your internet connection\n- Verify the CACHE_OVERFLOW_URL is correct\n- Try again in a moment';
  }
  return '- Check the log file for details\n- Verify your CACHE_OVERFLOW_TOKEN is valid\n- Try again in a moment';
}

export const submitFeedback: ToolDefinition = {
  definition: {
    name: 'submit_feedback',
    description:
      'Submit usefulness feedback for a solution you have tried. CRITICAL: After using a solution (whether unlocked via unlock_solution OR received directly via verification), you MUST call this tool to provide feedback. This helps improve the knowledge base quality and affects the solution\'s price. Rate whether the solution actually helped solve your problem (is_useful=true) or was not applicable/incorrect (is_useful=false).',
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
    // #5 - Add input validation
    const solutionId = (args.solution_id as string || '').trim();
    const isUseful = args.is_useful as boolean;

    if (!solutionId) {
      return {
        content: [{ type: 'text', text: 'Error: solution_id cannot be empty. Please provide a valid solution ID.' }],
      };
    }

    if (typeof isUseful !== 'boolean') {
      return {
        content: [{ type: 'text', text: 'Error: is_useful must be a boolean (true or false).' }],
      };
    }

    const result = await client.submitFeedback(solutionId, isUseful);

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

    return {
      content: [{ type: 'text', text: 'Feedback submitted successfully!' }],
    };
  },
};
