import http from 'http';
import open from 'open';
import { logger } from '../logger.js';

const generateHTML = (title: string, body?: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Solution | cache.overflow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0A0A0B;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #fff;
    }

    .card {
      background: linear-gradient(145deg, rgba(30, 30, 32, 0.9), rgba(20, 20, 22, 0.95));
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      padding: 48px;
      max-width: 800px;
      width: 100%;
      backdrop-filter: blur(20px);
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #A78BFA;
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 18px;
      border-radius: 24px;
      margin-bottom: 28px;
    }

    .badge::before {
      content: "";
      width: 6px;
      height: 6px;
      background: #8B5CF6;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    h1 {
      font-size: 32px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .solution-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 36px;
    }

    .solution-title {
      font-size: 20px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .solution-body {
      font-size: 16px;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.6);
      max-height: 280px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .solution-body::-webkit-scrollbar {
      width: 4px;
    }

    .solution-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .solution-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
    }

    .buttons {
      display: flex;
      gap: 16px;
    }

    .btn {
      flex: 1;
      padding: 22px 36px;
      border: none;
      border-radius: 14px;
      font-family: inherit;
      font-size: 20px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .btn-safe {
      background: linear-gradient(135deg, #00FF41 0%, #00CC33 100%);
      color: #000;
    }

    .btn-safe:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 255, 65, 0.35);
    }

    .btn-safe:active {
      transform: translateY(0);
    }

    .btn-unsafe {
      background: linear-gradient(135deg, #FF4444 0%, #CC2233 100%);
      color: #fff;
    }

    .btn-unsafe:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 51, 51, 0.35);
    }

    .btn-unsafe:active {
      transform: translateY(0);
    }

    .hint {
      text-align: center;
      margin-top: 28px;
      font-size: 15px;
      color: rgba(255, 255, 255, 0.3);
    }

    .hint kbd {
      background: rgba(255, 255, 255, 0.1);
      padding: 4px 10px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
    }

    .completed {
      text-align: center;
      padding: 60px 20px;
    }

    .completed-icon {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 28px;
      font-size: 40px;
    }

    .completed-icon.safe {
      background: linear-gradient(135deg, rgba(0, 255, 65, 0.2), rgba(0, 204, 51, 0.1));
      border: 2px solid rgba(0, 255, 65, 0.5);
      box-shadow: 0 0 32px rgba(0, 255, 65, 0.2);
    }

    .completed-icon.unsafe {
      background: linear-gradient(135deg, rgba(255, 68, 68, 0.2), rgba(204, 34, 51, 0.1));
      border: 2px solid rgba(255, 68, 68, 0.5);
      box-shadow: 0 0 32px rgba(255, 68, 68, 0.2);
    }

    .completed h2 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .completed p {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.5);
    }
  </style>
</head>
<body>
  <div class="card" id="main-card">
    <div class="badge">Verification Required</div>

    <h1>Is this solution safe?</h1>
    <p class="subtitle">Review the code below and verify it's safe to use</p>

    <div class="solution-card">
      <div class="solution-title">${escapeHtml(title)}</div>
      <div class="solution-body">${body ? escapeHtml(body) : 'Solution body not available.\nUnlock to view full content.'}</div>
    </div>

    <div class="buttons">
      <button class="btn btn-safe" onclick="submit('safe')">Safe</button>
      <button class="btn btn-unsafe" onclick="submit('unsafe')">Unsafe</button>
    </div>

    <div class="hint">
      Press <kbd>S</kbd> for Safe or <kbd>U</kbd> for Unsafe
    </div>
  </div>

  <script>
    function submit(result) {
      const isSafe = result === 'safe';
      document.getElementById('main-card').innerHTML = \`
        <div class="completed">
          <div class="completed-icon \${result}">\${isSafe ? '&#10003;' : '&#10005;'}</div>
          <h2>\${isSafe ? 'Marked as Safe' : 'Marked as Unsafe'}</h2>
          <p>You can close this tab now</p>
        </div>
      \`;
      fetch('/result?value=' + result).catch(() => {});
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 's' || e.key === 'S') submit('safe');
      if (e.key === 'u' || e.key === 'U') submit('unsafe');
    });
  </script>
</body>
</html>
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Shows a modern verification dialog in the browser.
 * @param title The solution's query title
 * @param body The solution body (if available/unlocked)
 * @returns true if user clicked "Safe", false if "Unsafe", null if cancelled
 */
export async function showVerificationDialog(
  title: string,
  body?: string
): Promise<boolean | null> {
  return new Promise((resolve) => {
    const html = generateHTML(title, body);
    let resolved = false;

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost`);

      if (url.pathname === '/result') {
        const value = url.searchParams.get('value');
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        res.end('OK');

        if (!resolved) {
          resolved = true;
          server.close();

          switch (value) {
            case 'safe':
              logger.info('User verified solution as safe', { solutionTitle: title });
              resolve(true);
              break;
            case 'unsafe':
              logger.info('User verified solution as unsafe', { solutionTitle: title });
              resolve(false);
              break;
            default:
              logger.warn('User verification dialog closed with unknown result', {
                value,
                solutionTitle: title
              });
              resolve(null);
          }
        }
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      }
    });

    server.on('error', (error) => {
      logger.error('Verification dialog HTTP server error', error, {
        solutionTitle: title,
        errorType: 'VERIFICATION_DIALOG_ERROR',
      });
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });

    server.listen(0, 'localhost', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const url = `http://localhost:${address.port}`;
        logger.info('Verification dialog opened', {
          port: address.port,
          solutionTitle: title
        });

        open(url).catch((error) => {
          logger.error('Failed to open verification dialog in browser', error, {
            url,
            solutionTitle: title,
            errorType: 'BROWSER_OPEN_FAILURE',
          });
        });

        // Timeout after 55 seconds (within MCP client default 60s limit)
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            server.close();
            logger.warn('Verification dialog timed out', { solutionTitle: title });
            resolve(null);
          }
        }, 55 * 1000);
      } else {
        logger.error('Failed to get server address for verification dialog', undefined, {
          address,
          solutionTitle: title,
          errorType: 'SERVER_ADDRESS_ERROR',
        });
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }
    });
  });
}
