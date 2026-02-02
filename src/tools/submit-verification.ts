import { ToolDefinition } from './index.js';
import { config } from '../config.js';

// #6 - Improve error messages with context
function getErrorTitle(error: string): string {
  if (error.includes('timeout') || error.includes('timed out')) return 'Request Timed Out';
  if (error.includes('network') || error.includes('fetch')) return 'Network Connection Failed';
  if (error.includes('auth') || error.includes('Authentication')) return 'Authentication Failed';
  if (error.includes('Rate limit')) return 'Rate Limit Exceeded';
  if (error.includes('not found') || error.includes('404')) return 'Solution Not Found';
  if (error.includes('already verified')) return 'Already Verified';
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
  if (error.includes('already verified')) {
    return '- You have already verified this solution\n- No action needed';
  }
  if (error.includes('network') || error.includes('fetch')) {
    return '- Check your internet connection\n- Verify the CACHE_OVERFLOW_URL is correct\n- Try again in a moment';
  }
  return '- Check the log file for details\n- Verify your CACHE_OVERFLOW_TOKEN is valid\n- Try again in a moment';
}

export const submitVerification: ToolDefinition = {
  definition: {
    name: 'submit_verification',
    description:
      'Submit a safety verification for a solution. Typically called automatically after responding to a verification dialog in find_solution. Can also be called directly if configured to always verify solutions. You will receive a verification reward for participating.',
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
    // #5 - Add input validation
    const solutionId = (args.solution_id as string || '').trim();
    const isSafe = args.is_safe as boolean;

    if (!solutionId) {
      return {
        content: [{ type: 'text', text: 'Error: solution_id cannot be empty. Please provide a valid solution ID.' }],
      };
    }

    // Validate solution_id format to prevent injection attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(solutionId)) {
      return {
        content: [{ type: 'text', text: 'Error: Invalid solution_id format. Must contain only alphanumeric characters, hyphens, and underscores.' }],
      };
    }

    if (typeof isSafe !== 'boolean') {
      return {
        content: [{ type: 'text', text: 'Error: is_safe must be a boolean (true or false).' }],
      };
    }

    const result = await client.submitVerification(solutionId, isSafe);

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
      content: [{ type: 'text', text: 'Verification submitted successfully!' }],
    };
  },
};
