import { config } from '../config.js';
import { logger } from '../logger.js';
import type { McpConfigResponse } from '../types.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 5000; // 5 seconds
const MAX_RETRIES = 3;
const SUPPORTED_SCHEMA_VERSION = '1.0.0';

interface CachedConfig {
  data: McpConfigResponse;
  fetchedAt: number;
}

class ConfigService {
  private cache: CachedConfig | null = null;

  /**
   * Fetch MCP configuration from the backend API.
   * Returns cached value if available and not expired.
   * Throws on failure after retries are exhausted.
   */
  async fetchConfig(): Promise<McpConfigResponse> {
    // Return cached value if still valid
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.data;
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = Math.pow(3, attempt) * 100; // 300ms, 900ms
        logger.info('Retrying MCP config fetch', {
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          delay,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(`${config.api.url}/mcp/config`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          lastError = new Error(
            `MCP config fetch failed: ${response.status} ${response.statusText}`
          );
          logger.warn('Failed to fetch MCP config', {
            status: response.status,
            statusText: response.statusText,
            attempt: attempt + 1,
          });
          continue;
        }

        const data = (await response.json()) as McpConfigResponse;

        // Validate schema version
        if (!this.isSchemaVersionCompatible(data.schema_version)) {
          throw new Error(
            `MCP config schema version mismatch: expected major ${SUPPORTED_SCHEMA_VERSION}, got ${data.schema_version}`
          );
        }

        // Update cache
        this.cache = {
          data,
          fetchedAt: Date.now(),
        };

        logger.info('Fetched MCP config from backend', {
          schemaVersion: data.schema_version,
          toolCount: data.tools.length,
          promptCount: data.prompts.length,
          hasInstructions: !!data.instructions,
        });

        return data;
      } catch (error) {
        if (error instanceof Error) {
          lastError = error;
          if (error.name === 'AbortError') {
            logger.warn('MCP config fetch timed out', {
              attempt: attempt + 1,
            });
          } else {
            logger.warn('Failed to fetch MCP config', {
              error: error.message,
              attempt: attempt + 1,
            });
            // Schema version mismatch is not retryable
            if (error.message.includes('schema version mismatch')) {
              break;
            }
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError ?? new Error('Failed to fetch MCP config after retries');
  }

  /**
   * Check if the schema version is compatible.
   */
  private isSchemaVersionCompatible(version: string): boolean {
    // Extract major version for compatibility check
    const [major] = version.split('.');
    const [supportedMajor] = SUPPORTED_SCHEMA_VERSION.split('.');
    return major === supportedMajor;
  }

  /**
   * Invalidate the cache, forcing a fresh fetch on next request.
   */
  invalidateCache(): void {
    this.cache = null;
  }
}

// Export singleton instance
export const configService = new ConfigService();
