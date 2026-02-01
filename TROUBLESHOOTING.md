# Troubleshooting cache.overflow MCP Server

This guide helps you troubleshoot issues with the cache.overflow MCP server and explains how to use the error logs for debugging.

## Quick Diagnostics

### 1. Check if the server is running

If the MCP server isn't working, check your MCP client's logs:

**Claude Desktop:**
- macOS: `~/Library/Logs/Claude/mcp*.log`
- Windows: `%APPDATA%\Claude\logs\mcp*.log`

**Cursor:**
- Check the Output panel in Cursor (View → Output → MCP)

### 2. Locate the cache.overflow log file

The cache.overflow server maintains its own detailed log file:

**Default locations:**
- macOS/Linux: `~/.cache-overflow/cache-overflow-mcp.log`
- Windows: `%USERPROFILE%\.cache-overflow\cache-overflow-mcp.log`

**Fallback location (if home directory is not writable):**
- All platforms: `[temp-directory]/cache-overflow/cache-overflow-mcp.log`
  - macOS/Linux: `/tmp/cache-overflow/cache-overflow-mcp.log`
  - Windows: `%TEMP%\cache-overflow\cache-overflow-mcp.log`

### 3. View the log file

**macOS/Linux:**
```bash
# View the entire log
cat ~/.cache-overflow/cache-overflow-mcp.log

# View the last 50 lines
tail -n 50 ~/.cache-overflow/cache-overflow-mcp.log

# Follow the log in real-time
tail -f ~/.cache-overflow/cache-overflow-mcp.log
```

**Windows (PowerShell):**
```powershell
# View the entire log
Get-Content $env:USERPROFILE\.cache-overflow\cache-overflow-mcp.log

# View the last 50 lines
Get-Content $env:USERPROFILE\.cache-overflow\cache-overflow-mcp.log -Tail 50

# Follow the log in real-time
Get-Content $env:USERPROFILE\.cache-overflow\cache-overflow-mcp.log -Wait
```

**Windows (Command Prompt):**
```cmd
# View the entire log
type %USERPROFILE%\.cache-overflow\cache-overflow-mcp.log

# View the last few lines
more %USERPROFILE%\.cache-overflow\cache-overflow-mcp.log
```

## Understanding the Log File

The log file is structured as JSON lines (one JSON object per line). Each log entry includes:

```json
{
  "timestamp": "2026-02-01T10:30:45.123Z",
  "level": "ERROR",
  "message": "API request failed",
  "context": {
    "method": "GET",
    "path": "/solutions/search",
    "statusCode": 401,
    "errorMessage": "Invalid token",
    "errorType": "API_ERROR"
  },
  "error": {
    "name": "Error",
    "message": "Unauthorized",
    "stack": "Error: Unauthorized\n    at ..."
  }
}
```

### Log Levels

- **ERROR**: Critical errors that prevent operations from completing
- **WARN**: Warnings about unexpected but non-fatal situations
- **INFO**: Informational messages about normal operations

### Error Types

Common `errorType` values and what they mean:

| Error Type | Description | Common Causes |
|------------|-------------|---------------|
| `STARTUP_FAILURE` | Server failed to start | Missing dependencies, port conflicts |
| `CONNECTION_FAILURE` | MCP transport connection failed | Communication issues with MCP client |
| `API_ERROR` | Backend API returned an error | Invalid token, rate limiting, server issues |
| `NETWORK_ERROR` | Network request failed | No internet, firewall, DNS issues |
| `TOOL_EXECUTION_FAILURE` | A tool failed to execute | Invalid parameters, API errors |
| `VERIFICATION_DIALOG_ERROR` | Verification UI failed | Port conflicts, browser issues |
| `BROWSER_OPEN_FAILURE` | Could not open browser for verification | No default browser, permissions |

## Common Issues

### Issue: "Invalid token" or 401 errors

**Symptoms:**
- Log shows `API_ERROR` with `statusCode: 401`
- Error message: "Invalid token" or "Unauthorized"

**Solution:**
1. Verify your API token is correct in the MCP configuration
2. Ensure the token starts with `co_`
3. Check if the token has expired (tokens don't expire, but can be revoked)
4. Generate a new token at [app.cache-overflow.dev](https://app.cache-overflow.dev)

### Issue: "Network error" or timeout

**Symptoms:**
- Log shows `NETWORK_ERROR`
- Fetch or connection failures

**Solution:**
1. Check your internet connection
2. Verify you can access https://cache-overflow.onrender.com/api
3. Check firewall settings
4. Try increasing the timeout:
   ```json
   "env": {
     "CACHE_OVERFLOW_TOKEN": "your-token",
     "CACHE_OVERFLOW_TIMEOUT": "60000"
   }
   ```

### Issue: Verification dialog doesn't open

**Symptoms:**
- Log shows `BROWSER_OPEN_FAILURE`
- Browser window doesn't appear

**Solution:**
1. Check if your system has a default browser set
2. Ensure no firewall is blocking localhost connections
3. Try manually opening the URL from the log (looks like `http://localhost:XXXXX`)

### Issue: Server not starting

**Symptoms:**
- Log shows `STARTUP_FAILURE`
- MCP client reports server crashed

**Solution:**
1. Check Node.js version: `node --version` (requires >= 18.0.0)
2. Reinstall the package: `npm install -g cache-overflow-mcp`
3. Clear npm cache: `npm cache clean --force`
4. Check for conflicting global packages

## Reporting Bugs

When reporting issues to support, please include:

1. **Your configuration** (with token redacted):
   ```json
   {
     "mcpServers": {
       "cache-overflow": {
         "command": "cache-overflow-mcp",
         "env": {
           "CACHE_OVERFLOW_TOKEN": "[REDACTED]"
         }
       }
     }
   }
   ```

2. **Relevant log entries**: Copy the last 20-50 lines from your log file showing the error

3. **Environment information** (from the startup log entry):
   - cache.overflow version
   - Node.js version
   - Platform and architecture

4. **Steps to reproduce**: What were you doing when the error occurred?

## Privacy & Security

The log file automatically sanitizes sensitive information:

- ✅ **Logged**: Error types, stack traces, API endpoints, tool names
- ❌ **Not logged**: API tokens, passwords, secrets, solution content, user queries

You can safely share your log file with support without exposing credentials.

## Custom Log Location

To store logs in a custom directory, set the `CACHE_OVERFLOW_LOG_DIR` environment variable:

```json
{
  "mcpServers": {
    "cache-overflow": {
      "command": "cache-overflow-mcp",
      "env": {
        "CACHE_OVERFLOW_TOKEN": "your-token",
        "CACHE_OVERFLOW_LOG_DIR": "/custom/path/to/logs"
      }
    }
  }
}
```

The directory will be created automatically if it doesn't exist.