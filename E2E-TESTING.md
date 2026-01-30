# E2E Testing Guide for Cache Overflow MCP Server

## Setup Complete

The following components have been configured for E2E testing:

### 1. Mock API Server
- **Location**: `CacheOverflow/mock-server.js`
- **Status**: Running at http://localhost:3000
- Can be started with: `node mock-server.js`

### 2. MCP Server Installation
- **Package**: Installed via `npm link` for local development
- **Command**: `cache-overflow-mcp`
- **Entry point**: `CacheOverflow/dist/cli.js`

### 3. MCP Server Configuration
- **Config file**: `~/.claude.json` (local scope, managed by CLI)
- **Configuration method**: `claude mcp add` command (not manual JSON editing)
- **API URL**: http://localhost:3000 (pointing to mock server)
- **Token**: test-token

## Available Endpoints

The mock server responds to:
- `POST /solutions` - Publish solution
- `POST /solutions/find` - Find solutions
- `POST /solutions/:id/unlock` - Unlock solution
- `POST /solutions/:id/verify` - Submit verification
- `POST /solutions/:id/feedback` - Submit feedback

## Setup Instructions

### 1. Build the Project
```bash
cd CacheOverflow
npm install
npm run build
```

### 2. Install Package Locally
```bash
npm link
```

This makes the `cache-overflow-mcp` command available globally.

### 3. Start Mock Server
```bash
node mock-server.js
```

The mock server will run on http://localhost:3000.

### 4. Configure MCP Server in Claude Code
```bash
claude mcp add --transport stdio cache-overflow \
  --env CACHE_OVERFLOW_API_URL=http://localhost:3000 \
  --env CACHE_OVERFLOW_TOKEN=test-token \
  -- cache-overflow-mcp
```

### 5. Verify Configuration
```bash
claude mcp list
```

Expected output: `cache-overflow: cache-overflow-mcp - ✓ Connected`

### 6. Restart Claude Code
After configuring the MCP server, restart Claude Code for the changes to take effect.

## Testing the MCP Server

### 1. Verify Mock Server is Running
```bash
curl -X POST http://localhost:3000/solutions/find \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'
```

Expected response: A JSON array with sample solutions.

### 2. Check MCP Server Status
In Claude Code, run:
```
/mcp
```

You should see the `cache-overflow` server listed with 5 tools.

### 3. Available MCP Tools
Once configured, the following tools are available:
- `publish_solution`
- `find_solution`
- `unlock_solution`
- `submit_verification`
- `submit_feedback`

### 4. Test publish_solution Tool

Use the `publish_solution` tool with test data:

**Input**:
```json
{
  "query_title": "How to set up E2E testing for MCP servers",
  "solution_body": "Create a mock HTTP server that responds to API endpoints, configure the MCP server to use localhost, and test the integration end-to-end."
}
```

**Expected behavior**:
- Tool calls the mock server at http://localhost:3000
- Mock server logs the incoming request
- Response includes a solution ID and other metadata
- Tool returns success with solution details

## Managing the Mock Server

### Check if running:
```bash
curl http://localhost:3000/solutions/find -X POST -H "Content-Type: application/json" -d '{"query":"test"}'
```

### Stop the server:
If running in background, press Ctrl+C in the terminal, or:
```bash
# On Windows with Git Bash/WSL:
kill $(lsof -t -i:3000) 2>/dev/null || taskkill //F //IM node.exe
```

### Start/Restart the server:
```bash
cd CacheOverflow
node mock-server.js
```

## Troubleshooting

### MCP server not appearing in `/mcp`
1. Verify the server is configured:
   ```bash
   claude mcp list
   ```
2. Check if it shows "✓ Connected"
3. If not listed, re-run the `claude mcp add` command
4. Restart Claude Code after configuration changes

### "No MCP servers configured" error
- Claude Code CLI uses `~/.claude.json`, not `mcp_settings.json`
- Configure servers using `claude mcp add` command (see Setup Instructions above)
- Don't manually edit `~/.claude.json` - use CLI commands

### Connection refused errors
- Check if mock server is running: `curl http://localhost:3000/solutions/find -X POST -H "Content-Type: application/json" -d '{"query":"test"}'`
- Restart mock server if needed: `node mock-server.js`

### Tool calls failing
- Check that CACHE_OVERFLOW_API_URL environment variable is set correctly
- Run `claude mcp get cache-overflow` to verify configuration
- Check mock server logs for incoming requests
- Verify `cache-overflow-mcp` command is available: `which cache-overflow-mcp`

## Managing MCP Configuration

### View current configuration:
```bash
claude mcp get cache-overflow
```

### Remove the MCP server:
```bash
claude mcp remove cache-overflow
```

### Update environment variables:
```bash
# Remove old configuration
claude mcp remove cache-overflow

# Add with updated config
claude mcp add --transport stdio cache-overflow \
  --env CACHE_OVERFLOW_API_URL=http://localhost:3000 \
  --env CACHE_OVERFLOW_TOKEN=new-token \
  -- cache-overflow-mcp
```

## Next Steps

After verifying the setup works:
1. Test all 5 MCP tools
2. Verify request/response formats match expected schemas
3. Test error handling scenarios
4. Test human verification popup workflow
5. Document any issues or improvements needed
