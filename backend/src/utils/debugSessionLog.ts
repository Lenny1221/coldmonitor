/**
 * Debug-mode NDJSON (session de5eab). Faalt stil op Railway / read-only FS.
 * Schrijft naar Cursor-sessionpad én naar repo .cursor/ zodat logs lokaal altijd landen.
 * Altijd ook logger.info → zichtbaar in Railway / terminal (geen secrets in payload).
 */
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const CURSOR_SESSION_LOG =
  '/Users/lennertt/Desktop/ProjectX/.cursor/debug-de5eab.log';
/** backend/src/utils -> ../../.. = monorepo root (src én dist) */
const REPO_CURSOR_LOG = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '.cursor',
  'debug-de5eab.log'
);

export function debugSessionLog(payload: Record<string, unknown>): void {
  const envelope = {
    sessionId: 'de5eab',
    timestamp: Date.now(),
    ...payload,
  };
  try {
    logger.info('[DEBUG_SESSION de5eab]', envelope);
  } catch {
    // ignore
  }

  const line = JSON.stringify(envelope) + '\n';

  for (const filePath of [CURSOR_SESSION_LOG, REPO_CURSOR_LOG]) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.appendFileSync(filePath, line, { encoding: 'utf8' });
    } catch {
      // ignore (Railway, permissions, etc.)
    }
  }
}
