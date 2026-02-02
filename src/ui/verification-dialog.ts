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

    .timer {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(139, 92, 246, 0.2);
      border: 1px solid rgba(139, 92, 246, 0.4);
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      color: #A78BFA;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    }
    .timer.warning {
      background: rgba(255, 68, 68, 0.25);
      border-color: rgba(255, 68, 68, 0.5);
      color: #FF6B6B;
      animation: pulse-warning 1s ease-in-out infinite;
    }
    @keyframes pulse-warning {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  </style>
</head>
<body>
  <div class="timer" id="timer">Time remaining: <span id="countdown">55</span>s</div>
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
    // Store interval reference for proper cleanup
    let countdownInterval = null;

    function submit(result) {
      // Clear countdown interval to prevent resource leak
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      const isSafe = result === 'safe';
      const mainCard = document.getElementById('main-card');

      // Clear existing content safely
      if (mainCard) {
        mainCard.textContent = '';

        // Create DOM elements instead of innerHTML to avoid XSS
        const completedDiv = document.createElement('div');
        completedDiv.className = 'completed';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'completed-icon ' + (result === 'safe' ? 'safe' : result === 'unsafe' ? 'unsafe' : '');
        iconDiv.innerHTML = isSafe ? '&#10003;' : '&#10005;';

        const h2 = document.createElement('h2');
        h2.textContent = isSafe ? 'Marked as Safe' : 'Marked as Unsafe';

        const p = document.createElement('p');
        p.textContent = 'You can close this tab now';

        completedDiv.appendChild(iconDiv);
        completedDiv.appendChild(h2);
        completedDiv.appendChild(p);
        mainCard.appendChild(completedDiv);
      }

      // Log errors properly instead of silently swallowing them
      fetch('/result?value=' + result).catch((err) => {
        console.error('Failed to send result to server:', err);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 's' || e.key === 'S') submit('safe');
      if (e.key === 'u' || e.key === 'U') submit('unsafe');
    });

    // #9 - Add countdown timer
    let timeLeft = 55;
    const countdown = document.getElementById('countdown');
    const timer = document.getElementById('timer');

    countdownInterval = setInterval(() => {
      timeLeft--;
      if (countdown) countdown.textContent = timeLeft.toString();
      if (timeLeft <= 10 && timer) {
        timer.classList.add('warning');
      }
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }, 1000);
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

// #15 - Distinguish error types in verification dialog resolution
type VerificationResult = boolean | null | { error: string };

/**
 * Shows a modern verification dialog in the browser.
 * @param title The solution's query title
 * @param body The solution body (if available/unlocked)
 * @returns true if user clicked "Safe", false if "Unsafe", null if cancelled, or error object if failed
 */
// Type for Node.js Server with closeAllConnections method
interface ServerWithCloseAll {
  closeAllConnections?: () => void;
}

export async function showVerificationDialog(
  title: string,
  body?: string
): Promise<boolean | null> {
  return new Promise((resolve) => {
    const html = generateHTML(title, body);
    let resolved = false;
    let timeoutHandle: NodeJS.Timeout | null = null;

    // Cleanup function to prevent multiple server close calls
    const cleanupServer = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      // Remove error listener to prevent leak
      server.removeListener('error', errorHandler);

      // Close server gracefully
      server.close((err) => {
        if (err) {
          logger.error('Error closing verification dialog server', err, {
            solutionTitle: title,
            errorType: 'SERVER_CLOSE_ERROR',
          });
        }
      });

      // Destroy all active sockets using type guard
      if ('closeAllConnections' in server && typeof (server as ServerWithCloseAll).closeAllConnections === 'function') {
        (server as ServerWithCloseAll).closeAllConnections!();
      }
    };

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost`);

      if (url.pathname === '/result') {
        const value = url.searchParams.get('value');

        // Remove overly permissive CORS header (local server doesn't need it)
        try {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
        } catch (error) {
          logger.error('Error sending response to verification dialog', error as Error, {
            solutionTitle: title,
            errorType: 'RESPONSE_WRITE_ERROR',
          });
          // Continue with resolution anyway - user already made choice
        }

        if (!resolved) {
          resolved = true;
          cleanupServer();

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

    // Store error handler reference for cleanup
    const errorHandler = (error: Error) => {
      logger.error('Verification dialog HTTP server error', error, {
        solutionTitle: title,
        errorType: 'VERIFICATION_DIALOG_ERROR',
      });
      if (!resolved) {
        resolved = true;
        cleanupServer();
        // Return null for errors (treated same as cancellation for now)
        resolve(null);
      }
    };

    server.on('error', errorHandler);

    server.listen(0, 'localhost', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        // Validate server is bound to localhost only for security
        if (address.address !== 'localhost' && address.address !== '127.0.0.1' && address.address !== '::1') {
          logger.error('Server must bind to localhost only', undefined, {
            actualAddress: address.address,
            solutionTitle: title,
            errorType: 'INVALID_BIND_ADDRESS',
          });
          if (!resolved) {
            resolved = true;
            cleanupServer();
            resolve(null);
          }
          return;
        }

        const url = `http://localhost:${address.port}`;
        logger.info('Verification dialog opened', {
          port: address.port,
          solutionTitle: title
        });

        // #3 - Fix verification dialog browser open failure
        open(url).catch((error) => {
          logger.error('Failed to open verification dialog in browser', error, {
            url,
            solutionTitle: title,
            errorType: 'BROWSER_OPEN_FAILURE',
          });

          // Provide fallback manual URL when browser open fails
          console.error(`\n${'='.repeat(60)}`);
          console.error('⚠️  Could not open browser automatically');
          console.error('Please open this URL manually to verify the solution:');
          console.error(`\n   ${url}\n`);
          console.error(`${'='.repeat(60)}\n`);
        });

        // Timeout after 55 seconds (within MCP client default 60s limit)
        timeoutHandle = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanupServer();
            logger.warn('Verification dialog timed out', { solutionTitle: title });
            // Return null for timeout (treated as cancellation)
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
