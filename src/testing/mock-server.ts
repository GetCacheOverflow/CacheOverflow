import * as http from 'node:http';
import { mockSolutions, mockFindResults, createMockSolution } from './mock-data.js';
import type { Solution, FindSolutionResult } from '../types.js';

interface RouteHandler {
  (
    req: http.IncomingMessage,
    body: unknown,
    params: Record<string, string>
  ): { status: number; data: unknown };
}

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export class MockServer {
  private server: http.Server | null = null;
  private port: number = 0;
  private routes: Route[] = [];

  get url(): string {
    return `http://localhost:${this.port}`;
  }

  constructor() {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // POST /solutions/find
    this.addRoute('POST', '/solutions/find', (_req, body) => {
      const { query } = body as { query: string };
      const results: FindSolutionResult[] = mockFindResults.filter((r) =>
        r.query_title.toLowerCase().includes((query ?? '').toLowerCase())
      );
      return { status: 200, data: results.length > 0 ? results : mockFindResults };
    });

    // POST /solutions/:id/unlock
    this.addRoute('POST', '/solutions/:id/unlock', (_req, _body, params) => {
      const solution = mockSolutions.find((s) => s.id === params.id);
      if (solution) {
        return { status: 200, data: solution };
      }
      return { status: 200, data: mockSolutions[0] };
    });

    // POST /solutions
    this.addRoute('POST', '/solutions', (_req, body) => {
      const { query_title, solution_body } = body as {
        query_title: string;
        solution_body: string;
      };
      const newSolution: Solution = createMockSolution({
        query_title,
        solution_body,
      });
      return { status: 200, data: newSolution };
    });

    // POST /solutions/:id/verify
    this.addRoute('POST', '/solutions/:id/verify', () => {
      return { status: 200, data: null };
    });

    // POST /solutions/:id/feedback
    this.addRoute('POST', '/solutions/:id/feedback', () => {
      return { status: 200, data: null };
    });
  }

  private addRoute(method: string, path: string, handler: RouteHandler): void {
    const paramNames: string[] = [];
    const patternString = path.replace(/:([^/]+)/g, (_match, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    const pattern = new RegExp(`^${patternString}$`);
    this.routes.push({ method, pattern, paramNames, handler });
  }

  private matchRoute(
    method: string,
    path: string
  ): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { route, params };
      }
    }
    return null;
  }

  async start(port?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', reject);

      this.server.listen(port ?? 0, () => {
        const address = this.server!.address();
        if (typeof address === 'object' && address !== null) {
          this.port = address.port;
        }
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = null;
          this.port = 0;
          resolve();
        }
      });
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url ?? '/', `http://localhost:${this.port}`);
    const method = req.method ?? 'GET';
    const path = url.pathname;

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      let parsedBody: unknown = null;
      if (body) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          // Ignore parse errors
        }
      }

      const matched = this.matchRoute(method, path);

      if (!matched) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }

      const { route, params } = matched;
      const result = route.handler(req, parsedBody, params);

      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.data));
    });
  }
}
