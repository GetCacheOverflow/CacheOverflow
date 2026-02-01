#!/usr/bin/env node

/**
 * Simple script to help users locate and view their cache.overflow MCP logs
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const homeLogPath = path.join(os.homedir(), '.cache-overflow', 'cache-overflow-mcp.log');
const tempLogPath = path.join(os.tmpdir(), 'cache-overflow', 'cache-overflow-mcp.log');
const customLogPath = process.env.CACHE_OVERFLOW_LOG_DIR
  ? path.join(process.env.CACHE_OVERFLOW_LOG_DIR, 'cache-overflow-mcp.log')
  : null;

console.log('🔍 Looking for cache.overflow MCP log file...\n');

// Check custom location first
if (customLogPath && fs.existsSync(customLogPath)) {
  console.log('✅ Found log file at custom location:');
  console.log(`   ${customLogPath}\n`);
  displayLog(customLogPath);
}
// Check home directory
else if (fs.existsSync(homeLogPath)) {
  console.log('✅ Found log file at default location:');
  console.log(`   ${homeLogPath}\n`);
  displayLog(homeLogPath);
}
// Check temp directory
else if (fs.existsSync(tempLogPath)) {
  console.log('✅ Found log file at fallback location:');
  console.log(`   ${tempLogPath}\n`);
  displayLog(tempLogPath);
}
// No log file found
else {
  console.log('❌ No log file found. Checked locations:');
  console.log(`   ${homeLogPath}`);
  console.log(`   ${tempLogPath}`);
  if (customLogPath) {
    console.log(`   ${customLogPath}`);
  }
  console.log('\nThe log file is created when the MCP server starts.');
  console.log('Make sure cache.overflow-mcp has been run at least once.\n');
  process.exit(1);
}

function displayLog(logPath) {
  const stats = fs.statSync(logPath);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log(`📊 File size: ${sizeKB} KB`);
  console.log(`🕐 Last modified: ${stats.mtime.toLocaleString()}\n`);

  // Read the file
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());

  console.log(`📝 Total log entries: ${lines.length}\n`);

  // Count by level
  const levels = { ERROR: 0, WARN: 0, INFO: 0 };
  lines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      if (entry.level in levels) {
        levels[entry.level]++;
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  });

  console.log('📈 Log level breakdown:');
  console.log(`   ERROR: ${levels.ERROR}`);
  console.log(`   WARN:  ${levels.WARN}`);
  console.log(`   INFO:  ${levels.INFO}\n`);

  // Show last 10 entries
  const recentLines = lines.slice(-10);
  console.log('📋 Last 10 log entries:\n');
  console.log('─'.repeat(80));

  recentLines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const level = entry.level.padEnd(5);
      const icon = entry.level === 'ERROR' ? '❌' : entry.level === 'WARN' ? '⚠️' : 'ℹ️';

      console.log(`${icon} [${timestamp}] ${level} ${entry.message}`);

      if (entry.error) {
        console.log(`   Error: ${entry.error.name}: ${entry.error.message}`);
      }

      if (entry.context && Object.keys(entry.context).length > 0) {
        console.log(`   Context: ${JSON.stringify(entry.context)}`);
      }

      console.log('─'.repeat(80));
    } catch (e) {
      console.log(line);
      console.log('─'.repeat(80));
    }
  });

  console.log(`\n💡 To view the full log file, run:`);
  if (process.platform === 'win32') {
    console.log(`   type "${logPath}"`);
  } else {
    console.log(`   cat "${logPath}"`);
  }

  console.log(`\n💡 To follow logs in real-time, run:`);
  if (process.platform === 'win32') {
    console.log(`   Get-Content "${logPath}" -Wait`);
  } else {
    console.log(`   tail -f "${logPath}"`);
  }

  console.log('');
}
