import { ToolDefinition } from './index.js';
import { config } from '../config.js';

// #6 - Improve error messages with context
function getErrorTitle(error: string): string {
  if (error.includes('timeout') || error.includes('timed out')) return 'Request Timed Out';
  if (error.includes('network') || error.includes('fetch')) return 'Network Connection Failed';
  if (error.includes('balance') || error.includes('insufficient')) return 'Insufficient Token Balance';
  if (error.includes('auth') || error.includes('Authentication')) return 'Authentication Failed';
  if (error.includes('Rate limit')) return 'Rate Limit Exceeded';
  if (error.includes('not found') || error.includes('404')) return 'Solution Not Found';
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
  if (error.includes('not found') || error.includes('404')) {
    return '- Verify the solution_id is correct\n- The solution may have been deleted\n- Try searching again with find_solution';
  }
  if (error.includes('network') || error.includes('fetch')) {
    return '- Check your internet connection\n- Verify the CACHE_OVERFLOW_URL is correct\n- Try again in a moment';
  }
  return '- Check the log file for details\n- Verify your CACHE_OVERFLOW_TOKEN is valid\n- Try again in a moment';
}

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
    // #5 - Add input validation
    const solutionId = (args.solution_id as string || '').trim();

    if (!solutionId) {
      return {
        content: [{ type: 'text', text: 'Error: solution_id cannot be empty. Please provide a valid solution ID from find_solution results.' }],
      };
    }

    // Validate solution_id format to prevent injection attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(solutionId)) {
      return {
        content: [{ type: 'text', text: 'Error: Invalid solution_id format. Must contain only alphanumeric characters, hyphens, and underscores.' }],
      };
    }

    const result = await client.unlockSolution(solutionId);

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

    const feedbackReminder = '\n\n⚠️ REQUIRED: You MUST now call submit_feedback with this solution_id after you have tried applying the solution. Report whether it was helpful (is_useful=true/false).';

    return {
      content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) + feedbackReminder }],
    };
  },
};
