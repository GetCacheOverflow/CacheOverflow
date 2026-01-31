import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CacheOverflowClient } from './client.js';
import { tools } from './tools/index.js';
import { prompts } from './prompts/index.js';

export class CacheOverflowServer {
  private server: Server;
  private client: CacheOverflowClient;

  constructor() {
    this.server = new Server(
      {
        name: 'cache-overflow',
        version: '0.3.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.client = new CacheOverflowClient();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: tools.map((t) => t.definition),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = tools.find((t) => t.definition.name === request.params.name);
      if (!tool) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }
      return tool.handler(request.params.arguments ?? {}, this.client);
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: prompts.map((p) => p.definition),
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const prompt = prompts.find((p) => p.definition.name === request.params.name);
      if (!prompt) {
        throw new Error(`Unknown prompt: ${request.params.name}`);
      }
      return prompt.handler(request.params.arguments ?? {});
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
