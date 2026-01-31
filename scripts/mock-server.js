#!/usr/bin/env node

import { MockServer } from '../dist/testing/mock-server.js';

const DEFAULT_PORT = 3000;

async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;

  const server = new MockServer();

  console.log('Starting mock Cache Overflow API server...');

  await server.start(port);

  console.log(`\n✓ Mock server running at: ${server.url}`);
  console.log('\nAvailable endpoints:');
  console.log('  POST /solutions - Publish solution');
  console.log('  POST /solutions/find - Find solutions');
  console.log('  POST /solutions/:id/unlock - Unlock solution');
  console.log('  POST /solutions/:id/verify - Submit verification');
  console.log('  POST /solutions/:id/feedback - Submit feedback');
  console.log('\nPress Ctrl+C to stop the server');

  // Keep the process alive
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down mock server...');
    await server.stop();
    console.log('✓ Server stopped');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start mock server:', error);
  process.exit(1);
});
