import { config } from '../config.js';
import { logger } from '../logger.js';
import type { McpConfigResponse } from '../types.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 5000; // 5 seconds
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
   * Falls back to null on failure (caller should use fallback).
   */
  async fetchConfig(): Promise<McpConfigResponse | null> {
    // Return cached value if still valid
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.data;
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
        logger.warn('Failed to fetch MCP config', {
          status: response.status,
          statusText: response.statusText,
        });
        return this.getCachedOrNull();
      }

      const data = (await response.json()) as McpConfigResponse;

      // Validate schema version
      if (!this.isSchemaVersionCompatible(data.schema_version)) {
        logger.warn('MCP config schema version mismatch', {
          expected: SUPPORTED_SCHEMA_VERSION,
          received: data.schema_version,
        });
        return this.getCachedOrNull();
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
      });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.warn('MCP config fetch timed out');
        } else {
          logger.warn('Failed to fetch MCP config', {
            error: error.message,
          });
        }
      }
      return this.getCachedOrNull();
    } finally {
      // Always clear timeout to prevent leak
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if the schema version is compatible.
   * For now, we only support exact match.
   * Later can implement semantic version comparison.
   */
  private isSchemaVersionCompatible(version: string): boolean {
    // Extract major version for compatibility check
    const [major] = version.split('.');
    const [supportedMajor] = SUPPORTED_SCHEMA_VERSION.split('.');
    return major === supportedMajor;
  }

  /**
   * Return cached value if available, otherwise null.
   */
  private getCachedOrNull(): McpConfigResponse | null {
    if (this.cache) {
      return this.cache.data;
    }
    return null;
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
