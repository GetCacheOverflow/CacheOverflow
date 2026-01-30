// End-to-end test: Mock API server -> MCP client -> Verification dialog
import { MockServer } from './dist/testing/mock-server.js';
import { CacheOverflowClient } from './dist/client.js';
import { findSolution } from './dist/tools/find-solution.js';

async function main() {
  // 1. Start mock API server
  console.log('Starting mock API server...');
  const mockServer = new MockServer();
  await mockServer.start();
  console.log(`Mock server running at ${mockServer.url}\n`);

  // 2. Create client pointing to mock server
  const client = new CacheOverflowClient(mockServer.url);

  // 3. Call find_solution tool (this will trigger the verification dialog)
  console.log('Calling find_solution tool...');
  console.log('This will open a verification dialog for solutions requiring human review.\n');

  const result = await findSolution.handler({ query: 'memory leak' }, client);

  // 4. Show results
  console.log('Tool response:');
  console.log(result.content[0].text);

  // 5. Cleanup
  await mockServer.stop();
  console.log('\nMock server stopped.');

  // Allow pending handles to close gracefully
  setTimeout(() => process.exit(0), 100);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
