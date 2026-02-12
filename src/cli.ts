#!/usr/bin/env node

import { CacheOverflowServer } from './server.js';
import { logger } from './logger.js';

async function main() {
  // Log startup information
  logger.logStartup();
  logger.info(`Log file location: ${logger.getLogFilePath()}`);

  const server = await CacheOverflowServer.create();
  await server.start();
}

main().catch((error) => {
  logger.error('Fatal error during server startup', error, {
    errorType: 'STARTUP_FAILURE',
  });
  console.error('Fatal error:', error);
  console.error(`\nError details have been logged to: ${logger.getLogFilePath()}`);
  console.error('Please send this log file when reporting issues.');
  process.exit(1);
});
