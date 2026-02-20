import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { configService } from './services/config-service.js';
import { logger } from './logger.js';

const BLOCK_START = '### cache.overflow';
const BLOCK_REGEX = /### cache\.overflow\n```\n[\s\S]*?\n```/;

function wrapInstructions(instructions: string): string {
  return `${BLOCK_START}\n\`\`\`\n${instructions}\n\`\`\``;
}

/**
 * Initialize a repository file with cache.overflow server instructions.
 *
 * Fetches the latest instructions from the cache.overflow API and injects
 * them into the given file, wrapped in a recognizable block. If the block
 * already exists, it is replaced in-place. Otherwise it is appended.
 */
export async function initAgent(filePath: string): Promise<void> {
  const resolvedPath = resolve(process.cwd(), filePath);

  // 1. Fetch instructions from the API
  console.log('Fetching cache.overflow instructions...');
  const remoteConfig = await configService.fetchConfig();

  if (!remoteConfig.instructions) {
    throw new Error('Remote config missing instructions field');
  }

  const block = wrapInstructions(remoteConfig.instructions);

  // 2. Ensure parent directories exist
  const parentDir = dirname(resolvedPath);
  await mkdir(parentDir, { recursive: true });

  // 3. Read existing file content (or start empty)
  let existingContent = '';
  try {
    existingContent = await readFile(resolvedPath, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
    // File doesn't exist yet — that's fine, we'll create it
  }

  // 4. Inject or replace the block
  let newContent: string;
  if (BLOCK_REGEX.test(existingContent)) {
    // Replace existing block in-place
    newContent = existingContent.replace(BLOCK_REGEX, block);
    console.log('Replaced existing cache.overflow block.');
  } else if (existingContent.length > 0) {
    // Append to existing content with a blank line separator
    newContent = existingContent.trimEnd() + '\n\n' + block + '\n';
    console.log('Appended cache.overflow block to existing file.');
  } else {
    // New file
    newContent = block + '\n';
    console.log('Created new file with cache.overflow block.');
  }

  // 5. Write the file
  await writeFile(resolvedPath, newContent, 'utf-8');

  logger.info('Injected cache.overflow instructions', {
    filePath: resolvedPath,
    replaced: BLOCK_REGEX.test(existingContent),
  });

  console.log(`cache.overflow instructions injected into ${filePath}`);
}
