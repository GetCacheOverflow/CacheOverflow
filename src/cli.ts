#!/usr/bin/env node

import { CacheOverflowServer } from './server.js';

async function main() {
  const server = new CacheOverflowServer();
  await server.start();
}

main().catch(console.error);
