import { ToolDefinition } from './index.js';

export const getBalance: ToolDefinition = {
  definition: {
    name: 'get_balance',
    description: 'Get your current token balance and transaction summary.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  handler: async (_args, client) => {
    const result = await client.getBalance();

    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
      };
    }

    const balance = result.data;
    return {
      content: [
        {
          type: 'text',
          text: `Token Balance:
- Available: ${balance.available} tokens
- Pending debits: ${balance.pending_debits} tokens
- Pending credits: ${balance.pending_credits} tokens
- Total earned: ${balance.total_earned} tokens
- Total spent: ${balance.total_spent} tokens`,
        },
      ],
    };
  },
};
