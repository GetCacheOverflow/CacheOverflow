import { ApiResponse, Solution, FindSolutionResult } from './types.js';
import { config } from './config.js';

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

    const response = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return { success: false, error: (data.error as string) ?? 'Unknown error' };
    }

    return { success: true, data: data as T };
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
