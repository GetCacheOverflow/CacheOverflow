import { ApiResponse, Solution, FindSolutionResult } from './types.js';
import { config } from './config.js';
import { logger } from './logger.js';

export class CacheOverflowClient {
  private apiUrl: string;
  private authToken: string | undefined;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl ?? config.api.url;
    this.authToken = config.auth.token;
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

    const url = `${this.apiUrl}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        const errorMessage = (data.error as string) ?? 'Unknown error';
        logger.error('API request failed', undefined, {
          method,
          path,
          statusCode: response.status,
          errorMessage,
          errorType: 'API_ERROR',
        });
        return { success: false, error: errorMessage };
      }

      return { success: true, data: data as T };
    } catch (error) {
      logger.error('Network or fetch error during API request', error as Error, {
        method,
        path,
        url,
        errorType: 'NETWORK_ERROR',
      });

      // Re-throw network errors so they can be handled by the caller
      throw error;
    }
  }

  async findSolution(query: string): Promise<ApiResponse<FindSolutionResult[]>> {
    return this.request('GET', `/solutions/search?query=${encodeURIComponent(query)}`);
  }

  async unlockSolution(solutionId: string): Promise<ApiResponse<Solution>> {
    return this.request('POST', `/solutions/${solutionId}/unlock`);
  }

  async publishSolution(
    queryTitle: string,
    solutionBody: string
  ): Promise<ApiResponse<Solution>> {
    return this.request('POST', '/solutions', {
      query_title: queryTitle,
      solution_body: solutionBody,
    });
  }

  async submitVerification(
    solutionId: string,
    isSafe: boolean
  ): Promise<ApiResponse<void>> {
    return this.request('POST', `/solutions/${solutionId}/verify`, {
      is_safe: isSafe,
    });
  }

  async submitFeedback(
    solutionId: string,
    isUseful: boolean
  ): Promise<ApiResponse<void>> {
    return this.request('POST', `/solutions/${solutionId}/feedback`, {
      is_useful: isUseful,
    });
  }
}
