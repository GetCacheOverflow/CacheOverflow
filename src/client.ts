import { ApiResponse, Solution, FindSolutionResult } from './types.js';
import { config } from './config.js';
import { logger } from './logger.js';

export class CacheOverflowClient {
  private apiUrl: string;
  private authToken: string | undefined;
  private timeout: number;

  constructor(apiUrl?: string, token?: string, timeout?: number) {
    this.apiUrl = apiUrl ?? config.api.url;
    this.authToken = token ?? config.auth.token;
    this.timeout = timeout ?? config.api.timeout;

    // Validate URL format (#13 - URL Validation)
    try {
      new URL(this.apiUrl);
    } catch (error) {
      logger.error('Invalid CACHE_OVERFLOW_URL format', error as Error, {
        url: this.apiUrl,
        errorType: 'INVALID_API_URL',
      });
      throw new Error(`Invalid API URL: ${this.apiUrl}`);
    }

    // Validate token format (#12 - Token Validation)
    if (!this.authToken) {
      logger.warn('No CACHE_OVERFLOW_TOKEN provided - all API calls will fail', {});
    } else if (!this.authToken.startsWith('co_')) {
      logger.warn('Invalid token format - tokens should start with "co_"', {});
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Use URL constructor for safer URL construction
    const url = new URL(path, this.apiUrl).toString();

    // #11 - Add request logging for debugging
    logger.info('API request', {
      method,
      path,
      hasBody: !!body,
    });

    // #1 - Enforce request timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      // #11 - Add response logging
      logger.info('API response', {
        method,
        path,
        status: response.status,
        ok: response.ok,
      });

      // Read response as text first, then try to parse as JSON
      const textResponse = await response.text();
      const contentType = response.headers.get('content-type');
      let data: Record<string, unknown>;

      try {
        data = JSON.parse(textResponse) as Record<string, unknown>;
      } catch (jsonError) {
        // If JSON parsing fails, log and return the text as error
        logger.error('API returned non-JSON response', jsonError as Error, {
          method,
          path,
          statusCode: response.status,
          contentType,
          responseText: textResponse.substring(0, 200), // Log first 200 chars
          errorType: 'INVALID_JSON_RESPONSE',
        });

        // Return the text as an error message
        return {
          success: false,
          error: textResponse || 'Invalid response from server'
        };
      }

      if (!response.ok) {
        const errorMessage = (data.error as string) ?? 'Unknown error';

        // #7 - Detect and handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '60';
          logger.warn('Rate limit exceeded', {
            method,
            path,
            retryAfter,
            errorType: 'RATE_LIMIT',
          });
          return {
            success: false,
            error: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again. Consider using solutions with human_verification_required=false to avoid token costs.`,
          };
        }

        // #8 - Add status code to error messages with categorization
        let category = '';
        if (response.status >= 500) {
          category = 'Server error - try again later';
        } else if (response.status === 401 || response.status === 403) {
          category = 'Authentication error - check your CACHE_OVERFLOW_TOKEN';
        } else if (response.status >= 400) {
          category = 'Request error - check your input';
        }

        logger.error('API request failed', undefined, {
          method,
          path,
          statusCode: response.status,
          errorMessage,
          category,
          errorType: 'API_ERROR',
        });

        return {
          success: false,
          error: `${errorMessage} (${category})`,
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      // #1 - Handle timeout errors specifically
      if ((error as Error).name === 'AbortError') {
        logger.error('Request timed out', error as Error, {
          method,
          path,
          url,
          timeout: this.timeout,
          errorType: 'TIMEOUT',
        });
        return {
          success: false,
          error: `Request timed out after ${this.timeout}ms. The server may be experiencing issues.`,
        };
      }

      logger.error('Network or fetch error during API request', error as Error, {
        method,
        path,
        url,
        errorType: 'NETWORK_ERROR',
      });

      // Re-throw network errors so they can be handled by retry logic
      throw error;
    } finally {
      // Always clear timeout to prevent leak
      clearTimeout(timeoutId);
    }
  }

  // #2 - Add retry logic for network failures
  private async requestWithRetry<T>(
    method: string,
    path: string,
    body?: unknown,
    retries = 3
  ): Promise<ApiResponse<T>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await this.request<T>(method, path, body);

        // If successful or last attempt, return the result
        if (result.success || attempt === retries - 1) {
          return result;
        }

        // Check if we should retry based on the error
        const shouldRetry = this.shouldRetryError(result.error);
        if (shouldRetry) {
          const delay = Math.pow(3, attempt) * 100; // 0, 300, 900ms exponential backoff
          logger.info('Retrying request after delay', {
            method,
            path,
            attempt: attempt + 1,
            maxRetries: retries,
            delay,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Don't retry client errors (4xx)
        return result;
      } catch (error) {
        lastError = error as Error;

        // Only retry network errors, not client errors
        if (attempt < retries - 1 && this.isNetworkError(error as Error)) {
          const delay = Math.pow(3, attempt) * 100;
          logger.info('Retrying after network error', {
            method,
            path,
            attempt: attempt + 1,
            maxRetries: retries,
            delay,
            error: (error as Error).message,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private shouldRetryError(error?: string): boolean {
    if (!error) return false;

    // Retry on server errors (5xx) or timeout errors
    return error.includes('Server error') ||
           error.includes('timed out') ||
           error.includes('network');
  }

  private isNetworkError(error: Error): boolean {
    // Network errors typically have these names or messages
    return error.name === 'TypeError' ||
           error.name === 'NetworkError' ||
           error.message.includes('fetch') ||
           error.message.includes('network');
  }

  async findSolution(query: string): Promise<ApiResponse<FindSolutionResult[]>> {
    const result = await this.requestWithRetry<Array<{ id: string; query_title: string; solution_body?: string; human_verification_required: boolean }>>(
      'GET',
      `/solutions/search?query=${encodeURIComponent(query)}`
    );

    // Map API response (uses 'id') to our interface (expects 'solution_id')
    if (result.success) {
      const mappedData = result.data.map(solution => ({
        solution_id: solution.id,
        query_title: solution.query_title,
        solution_body: solution.solution_body,
        human_verification_required: solution.human_verification_required,
      }));
      return { success: true, data: mappedData };
    }

    return result as ApiResponse<FindSolutionResult[]>;
  }

  async unlockSolution(solutionId: string): Promise<ApiResponse<Solution>> {
    return this.requestWithRetry('POST', `/solutions/${solutionId}/unlock`);
  }

  async publishSolution(
    queryTitle: string,
    solutionBody: string
  ): Promise<ApiResponse<Solution>> {
    return this.requestWithRetry('POST', '/solutions', {
      query_title: queryTitle,
      solution_body: solutionBody,
    });
  }

  async submitVerification(
    solutionId: string,
    isSafe: boolean
  ): Promise<ApiResponse<void>> {
    return this.requestWithRetry('POST', `/solutions/${solutionId}/verify`, {
      is_safe: isSafe,
    });
  }

  async submitFeedback(
    solutionId: string,
    isUseful: boolean
  ): Promise<ApiResponse<void>> {
    return this.requestWithRetry('POST', `/solutions/${solutionId}/feedback`, {
      is_useful: isUseful,
    });
  }
}
