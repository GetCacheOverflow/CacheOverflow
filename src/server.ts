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
import { logger } from './logger.js';

export class CacheOverflowServer {
  private server: Server;
  private client: CacheOverflowClient;

  constructor() {
    this.server = new Server(
      {
        name: 'cache-overflow',
        version: '0.3.5',
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
        const error = new Error(`Unknown tool: ${request.params.name}`);
        logger.error('Unknown tool requested', error, {
          toolName: request.params.name,
          availableTools: tools.map(t => t.definition.name),
        });
        throw error;
      }

      try {
        logger.info(`Executing tool: ${request.params.name}`, {
          toolName: request.params.name,
          // Don't log full arguments as they might contain sensitive data
          hasArguments: Object.keys(request.params.arguments ?? {}).length > 0,
        });
        return await tool.handler(request.params.arguments ?? {}, this.client);
      } catch (error) {
        logger.error(`Tool execution failed: ${request.params.name}`, error as Error, {
          toolName: request.params.name,
          errorType: 'TOOL_EXECUTION_FAILURE',
        });
        throw error;
      }
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: prompts.map((p) => p.definition),
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const prompt = prompts.find((p) => p.definition.name === request.params.name);
      if (!prompt) {
        const error = new Error(`Unknown prompt: ${request.params.name}`);
        logger.error('Unknown prompt requested', error, {
          promptName: request.params.name,
          availablePrompts: prompts.map(p => p.definition.name),
        });
        throw error;
      }

      try {
        return await prompt.handler(request.params.arguments ?? {});
      } catch (error) {
        logger.error(`Prompt execution failed: ${request.params.name}`, error as Error, {
          promptName: request.params.name,
          errorType: 'PROMPT_EXECUTION_FAILURE',
        });
        throw error;
      }
    });
  }

  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('MCP server connected successfully via stdio transport');
    } catch (error) {
      logger.error('Failed to connect MCP server', error as Error, {
        errorType: 'CONNECTION_FAILURE',
      });
      throw error;
    }
  }
}
