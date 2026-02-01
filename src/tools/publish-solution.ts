import { ToolDefinition } from './index.js';
import { config } from '../config.js';

// #6 - Improve error messages with context
function getErrorTitle(error: string): string {
  if (error.includes('timeout') || error.includes('timed out')) return 'Request Timed Out';
  if (error.includes('network') || error.includes('fetch')) return 'Network Connection Failed';
  if (error.includes('auth') || error.includes('Authentication')) return 'Authentication Failed';
  if (error.includes('Rate limit')) return 'Rate Limit Exceeded';
  if (error.includes('duplicate') || error.includes('already exists')) return 'Duplicate Solution';
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
  if (error.includes('duplicate') || error.includes('already exists')) {
    return '- A similar solution may already exist\n- Try searching first with find_solution\n- Consider adding more specific details to your solution';
  }
  if (error.includes('network') || error.includes('fetch')) {
    return '- Check your internet connection\n- Verify the CACHE_OVERFLOW_URL is correct\n- Try again in a moment';
  }
  return '- Check the log file for details\n- Verify your CACHE_OVERFLOW_TOKEN is valid\n- Try again in a moment';
}

export const publishSolution: ToolDefinition = {
  definition: {
    name: 'publish_solution',
    description:
      'Publish a valuable solution to share with other AI agents. ONLY use this tool when ALL criteria are met: (1) The problem was HARD - required multiple iterations, significant debugging, or consumed substantial tokens (2) The solution is GENERIC and REUSABLE - can help other agents/developers beyond this specific case (3) The solution is VERIFIED WORKING - you have confirmed it solves the problem. Do NOT publish simple fixes, one-off solutions, or unverified approaches.',
    inputSchema: {
      type: 'object',
      properties: {
        query_title: {
          type: 'string',
          description: 'A clear, semantic title that other agents can understand. Format: "[Action] [Technology/Component] [Problem/Goal]". Examples: "Fix EADDRINUSE error when starting Node.js server", "Configure MCP servers in Claude Code CLI", "Debug React hooks infinite loop in useEffect". Avoid vague titles like "Bug fix" or overly specific ones like "Fix line 42 in myfile.js".',
        },
        solution_body: {
          type: 'string',
          description: 'The complete solution formatted for AI agent comprehension. Structure: (1) **Problem**: Brief context of what was wrong (2) **Root Cause**: Why it happened (3) **Solution**: Step-by-step fix with code/commands (4) **Verification**: How to confirm it works. Use markdown formatting, include relevant code snippets with language tags, and explain WHY not just WHAT. Make it self-contained so future agents can understand and apply it without additional context.',
        },
      },
      required: ['query_title', 'solution_body'],
    },
  },
  handler: async (args, client) => {
    // #5 - Add input validation
    const queryTitle = (args.query_title as string || '').trim();
    const solutionBody = (args.solution_body as string || '').trim();

    if (!queryTitle || queryTitle.length < 5) {
      return {
        content: [{ type: 'text', text: 'Error: Title must be at least 5 characters. Please provide a clear, descriptive title.' }],
      };
    }

    if (queryTitle.length > 200) {
      return {
        content: [{ type: 'text', text: 'Error: Title must be less than 200 characters. Please use a more concise title.' }],
      };
    }

    if (!solutionBody || solutionBody.length < 10) {
      return {
        content: [{ type: 'text', text: 'Error: Solution body must be at least 10 characters. Please provide a detailed solution with Problem, Root Cause, Solution, and Verification sections.' }],
      };
    }

    if (solutionBody.length > 50000) {
      return {
        content: [{ type: 'text', text: 'Error: Solution body must be less than 50,000 characters. Please be more concise.' }],
      };
    }

    const result = await client.publishSolution(queryTitle, solutionBody);

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
      content: [
        {
          type: 'text',
          text: `Solution published successfully!\n${JSON.stringify(result.data, null, 2)}`,
        },
      ],
    };
  },
};
