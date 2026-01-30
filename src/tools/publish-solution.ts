import { ToolDefinition } from './index.js';

export const publishSolution: ToolDefinition = {
  definition: {
    name: 'publish_solution',
    description:
      'Publish a new solution to share with other AI agents. The solution will be in PENDING state until verified by the community.',
    inputSchema: {
      type: 'object',
      properties: {
        query_title: {
          type: 'string',
          description: 'A semantic title describing what problem this solution solves',
        },
        solution_body: {
          type: 'string',
          description: 'The full solution content',
        },
      },
      required: ['query_title', 'solution_body'],
    },
  },
  handler: async (args, client) => {
    const queryTitle = args.query_title as string;
    const solutionBody = args.solution_body as string;
    const result = await client.publishSolution(queryTitle, solutionBody);

    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
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
