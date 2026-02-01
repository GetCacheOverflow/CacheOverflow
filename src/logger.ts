import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

class Logger {
  private logFilePath: string;
  private maxLogSizeBytes = 5 * 1024 * 1024; // 5MB max log file size

  constructor() {
    // Determine log file location
    const logDir = process.env.CACHE_OVERFLOW_LOG_DIR ?? path.join(os.homedir(), '.cache-overflow');

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (err) {
        // Fallback to temp directory if home directory is not writable
        const tempLogDir = path.join(os.tmpdir(), 'cache-overflow');
        if (!fs.existsSync(tempLogDir)) {
          fs.mkdirSync(tempLogDir, { recursive: true });
        }
        this.logFilePath = path.join(tempLogDir, 'cache-overflow-mcp.log');
        return;
      }
    }

    this.logFilePath = path.join(logDir, 'cache-overflow-mcp.log');
  }

  private rotateLogIfNeeded(): void {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const stats = fs.statSync(this.logFilePath);
        if (stats.size >= this.maxLogSizeBytes) {
          // Rotate: keep the last 1MB of the file
          const content = fs.readFileSync(this.logFilePath, 'utf-8');
          const lines = content.split('\n');
          const keptLines = lines.slice(-1000); // Keep last 1000 lines
          fs.writeFileSync(this.logFilePath, keptLines.join('\n') + '\n');
        }
      }
    } catch (err) {
      // Ignore rotation errors - don't want logging to break the app
    }
  }

  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      // Sanitize sensitive fields
      if (key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('auth')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private writeLog(entry: LogEntry): void {
    try {
      this.rotateLogIfNeeded();
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (err) {
      // If we can't write to log file, write to stderr as fallback
      console.error('Failed to write to log file:', err);
      console.error('Original log entry:', entry);
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      context: this.sanitizeContext(context),
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.writeLog(entry);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context: this.sanitizeContext(context),
    };

    this.writeLog(entry);
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context: this.sanitizeContext(context),
    };

    this.writeLog(entry);
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }

  logStartup(): void {
    this.info('MCP Server starting', {
      version: '0.3.4',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      apiUrl: process.env.CACHE_OVERFLOW_URL ?? 'https://cache-overflow.onrender.com/api',
      hasAuthToken: !!process.env.CACHE_OVERFLOW_TOKEN,
    });
  }
}

// Singleton instance
export const logger = new Logger();
