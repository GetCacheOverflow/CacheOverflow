#!/usr/bin/env node

import { CacheOverflowServer } from './server.js';
import { initAgent } from './init.js';
import { logger } from './logger.js';

async function main() {
  const args = process.argv.slice(2);

  // Handle "init <filepath>" command
  if (args[0] === 'init') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Usage: cache-overflow-mcp init <filepath>');
      console.error('');
      console.error('Examples:');
      console.error('  cache-overflow-mcp init AGENTS.md');
      console.error('  cache-overflow-mcp init .cursor/rules/cache-overflow.mdc');
      console.error('  cache-overflow-mcp init .github/copilot-instructions.md');
      process.exit(1);
    }
    return initAgent(filePath);
  }

  // Default: start the MCP server
  logger.logStartup();
  logger.info(`Log file location: ${logger.getLogFilePath()}`);

  const server = await CacheOverflowServer.create();
  await server.start();
}

main().catch((error) => {
  logger.error('Fatal error', error, {
    errorType: 'FATAL_ERROR',
  });
  console.error('Fatal error:', error instanceof Error ? error.message : error);
  console.error(`\nError details have been logged to: ${logger.getLogFilePath()}`);
  process.exit(1);
});
