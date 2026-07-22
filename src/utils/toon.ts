/**
 * TOON Helper — Token-Oriented Object Notation for AXI-compliant CLIs
 * Provides ~40% token savings over equivalent JSON (AXI §1)
 */

/**
 * Format output in requested format (TOON or JSON)
 */
export function formatText(value: unknown, format: string = 'toon'): string {
  if (format === 'json') {
    return JSON.stringify(value, null, 2);
  }
  // TOON format: compact, human-readable output
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const entries = keys.map(k => `${k}: ${formatValue(obj[k])}`).join(', ');
    return `{${entries}}`;
  }
  return JSON.stringify(value);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/**
 * Print output to stdout in the requested format
 */
export function printOutput(value: unknown, format: string = 'toon'): void {
  console.log(formatText(value, format));
}

/**
 * Truncate a string to max characters with ellipsis (AXI §3)
 */
export function truncateStr(s: string, max: number): string {
  if (s.length <= max) return s;
  const truncated = s.slice(0, max);
  return `${truncated}...\n  ... (truncated, ${s.length} chars total)`;
}

/**
 * Print structured error to stdout (AXI §6) and exit with code 2
 */
export function axiError(msg: string, hint?: string): never {
  const out: Record<string, string> = { error: msg };
  if (hint) out.help = hint;
  console.log(formatText(out, 'toon'));
  process.exit(2);
}

/**
 * Format a list in TOON format (AXI §2)
 */


/**
 * Get home directory path
 */
export function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '~';
}

/**
 * Get executable path with home dir collapsed to ~
 */
export function getBinPath(): string {
  try {
    const execPath = process.argv[0] || 'thinking-steroid';
    const homeDir = getHomeDir();
    return execPath.replace(homeDir, '~');
  } catch {
    return 'thinking-steroid';
  }
}