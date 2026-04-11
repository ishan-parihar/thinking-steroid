import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
import type { ReasoningGraph, ReasoningNode } from "../types.js";

const DEFAULT_MAX_AGE = 1800_000; // 30 minutes

interface NavigatorSession {
  token: string;
  graph: ReasoningGraph;
  createdAt: number;
  lastAccessed: number;
  maxAge: number;
}

const sessions: Map<string, NavigatorSession> = new Map();

// ─── File-based persistence ──────────────────────────────────────────────────
const SESSIONS_DIR = join(process.cwd(), ".sessions");
const PERSIST_ENABLED = process.env.NAVIGATOR_PERSIST === "1" || process.env.NAVIGATOR_PERSIST === "true";

function ensureSessionDir(): void {
  if (!existsSync(SESSIONS_DIR)) {
    mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

function sessionFilePath(token: string): string {
  return join(SESSIONS_DIR, `${token}.json`);
}

function saveSession(session: NavigatorSession): void {
  if (!PERSIST_ENABLED) return;
  try {
    ensureSessionDir();
    writeFileSync(sessionFilePath(session.token), JSON.stringify(session, null, 2));
  } catch { /* ignore write errors — in-memory still works */ }
}

function loadSession(token: string): NavigatorSession | null {
  if (!PERSIST_ENABLED) return null;
  try {
    const path = sessionFilePath(token);
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as NavigatorSession;
  } catch { return null; }
}

function loadAllSessions(): void {
  if (!PERSIST_ENABLED) return;
  try {
    ensureSessionDir();
    for (const file of readdirSync(SESSIONS_DIR)) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = readFileSync(join(SESSIONS_DIR, file), "utf-8");
        const session = JSON.parse(raw) as NavigatorSession;
        if (session.lastAccessed + session.maxAge > Date.now()) {
          sessions.set(session.token, session);
        } else {
          unlinkSync(join(SESSIONS_DIR, file));
        }
      } catch { /* skip corrupt files */ }
    }
  } catch { /* ignore directory errors */ }
}
// ─── End persistence ─────────────────────────────────────────────────────────

function generateToken(): string {
  return "nav_" + Math.random().toString(36).substring(2, 10);
}

function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.lastAccessed + session.maxAge < now) {
      sessions.delete(token);
    }
  }
}

function calculateParallelGroups(nodes: ReasoningNode[]): number[][] {
  const depthMap = new Map<number, number>();

  function getDepth(nodeId: number): number {
    if (depthMap.has(nodeId)) return depthMap.get(nodeId)!;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.dependsOn.length === 0) {
      depthMap.set(nodeId, 0);
      return 0;
    }
    const maxDepDepth = Math.max(...node.dependsOn.map(getDepth));
    const depth = maxDepDepth + 1;
    depthMap.set(nodeId, depth);
    return depth;
  }

  for (const node of nodes) {
    getDepth(node.id);
  }

  const groups: Map<number, number[]> = new Map();
  for (const [nodeId, depth] of depthMap) {
    if (!groups.has(depth)) groups.set(depth, []);
    groups.get(depth)!.push(nodeId);
  }

  const result: number[][] = [];
  const sortedDepths = Array.from(groups.keys()).sort((a, b) => a - b);
  for (const depth of sortedDepths) {
    result.push(groups.get(depth)!);
  }

  return result;
}

function calculateCoverage(nodes: ReasoningNode[]): Record<string, number> {
  const coverage: Record<string, number> = {};
  for (const node of nodes) {
    coverage[node.thoughtType] = (coverage[node.thoughtType] || 0) + 1;
  }
  return coverage;
}

function buildNextInstruction(graph: ReasoningGraph): string {
  const ready = graph.nodes.filter((n) => n.status === "ready");
  if (ready.length === 0) {
    const pending = graph.nodes.filter((n) => n.status === "pending");
    const blocked = graph.nodes.filter((n) => n.status === "blocked");
    if (pending.length === 0 && blocked.length === 0) {
      return "All nodes completed. Session finished.";
    }
    return `No ready nodes. ${pending.length} pending, ${blocked.length} blocked. Consider replanning.`;
  }
  const first = ready[0];
  const names = ready.map((n) => `#${n.id}(${n.thoughtType})`).join(", ");
  return `Execute ready nodes: ${names}. Start with #${first.id} (${first.tool} — ${first.purpose}).`;
}

function initialiseNodeStatuses(nodes: ReasoningNode[]): void {
  for (const node of nodes) {
    if (node.dependsOn.length === 0) {
      node.status = "ready";
    } else {
      node.status = "pending";
    }
  }
}

function propagateReadiness(nodes: ReasoningNode[]): void {
  for (const node of nodes) {
    if (node.status !== "pending") continue;
    const allDepsCompleted = node.dependsOn.every((depId) => {
      const dep = nodes.find((n) => n.id === depId);
      return dep?.status === "completed" || dep?.status === "skipped";
    });
    if (allDepsCompleted) {
      node.status = "ready";
    }
  }
}

export function createSession(graph: ReasoningGraph): string {
  const token = generateToken();
  initialiseNodeStatuses(graph.nodes);
  const parallelGroups = calculateParallelGroups(graph.nodes);
  const coverage = calculateCoverage(graph.nodes);
  const nextInstruction = buildNextInstruction(graph);

  const session: NavigatorSession = {
    token,
    graph: {
      ...graph,
      parallelGroups,
      coverage,
      nextInstruction,
      sessionToken: token,
    },
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    maxAge: DEFAULT_MAX_AGE,
  };

  sessions.set(token, session);
  saveSession(session);
  return token;
}

export function getSession(token: string): NavigatorSession | null {
  cleanupExpiredSessions();
  let session = sessions.get(token) ?? null;
  if (!session) {
    session = loadSession(token);
    if (session) sessions.set(token, session);
  }
  if (session) {
    session.lastAccessed = Date.now();
    saveSession(session);
  }
  return session;
}

export function updateNode(
  token: string,
  nodeId: number,
  output: string,
  quality?: number,
): void {
  const session = getSession(token);
  if (!session) return;

  const node = session.graph.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  node.status = "completed";
  node.output = output;
  node.qualityScore = quality;
  session.graph.completedNodes++;

  propagateReadiness(session.graph.nodes);
  session.graph.nextInstruction = buildNextInstruction(session.graph);
  session.lastAccessed = Date.now();
  saveSession(session);
}

export function getReadyNodes(token: string): number[] {
  const session = getSession(token);
  if (!session) return [];
  return session.graph.nodes
    .filter((n) => n.status === "ready")
    .map((n) => n.id);
}

// All valid thought types the navigator can produce
const ALL_THOUGHT_TYPES = [
  'diagnostic', 'deconstructive', 'relational', 'perspectival',
  'developmental', 'prospective', 'synthetic', 'corrective',
];

/**
 * Detects coverage gaps in the reasoning graph.
 * Returns a description of the gap if one exists, null otherwise.
 */
function detectCoverageGap(nodes: ReasoningNode[]): string | null {
  const completed = nodes.filter((n) => n.status === "completed");
  if (completed.length === 0) return null;

  // Count completed nodes by thought type
  const typeCounts: Record<string, number> = {};
  for (const node of completed) {
    typeCounts[node.thoughtType] = (typeCounts[node.thoughtType] || 0) + 1;
  }

  // Rule 1: If diagnostic >= 4 but prospective = 0
  if ((typeCounts['diagnostic'] || 0) >= 4 && !typeCounts['prospective']) {
    return "Heavy diagnostic analysis (4+ nodes) with no prospective thinking — add forward-looking nodes.";
  }

  // Rule 2: Any thought type has 0 nodes while others have >= 3
  const presentTypes = Object.keys(typeCounts);
  const absentTypes = ALL_THOUGHT_TYPES.filter((t) => !typeCounts[t]);
  const hasOverrepresented = presentTypes.some((t) => typeCounts[t] >= 3);

  if (absentTypes.length >= 2 && hasOverrepresented) {
    const missing = absentTypes.slice(0, 2).join(", ");
    const heavy = presentTypes.filter((t) => typeCounts[t] >= 3).join(", ");
    return `Coverage gap: missing '${missing}' while '${heavy}' is over-represented (3+ nodes).`;
  }

  // Rule 3: If synthetic is absent but we have 5+ completed nodes
  if (completed.length >= 5 && !typeCounts['synthetic']) {
    return "5+ nodes completed but no synthetic integration — add a synthesis node.";
  }

  return null;
}

export function shouldReplan(token: string): boolean {
  const session = getSession(token);
  if (!session) return false;

  const { nodes } = session.graph;
  const completed = nodes.filter((n) => n.status === "completed");

  const lowQuality = completed.some(
    (n) => n.qualityScore !== undefined && n.qualityScore < 0.5,
  );
  if (lowQuality) return true;

  const contradictionKeywords = /\b(however|contradiction)\b/i;
  const withContradictions = completed.filter(
    (n) => n.output && contradictionKeywords.test(n.output),
  );
  if (withContradictions.length >= 2) return true;

  const ready = nodes.filter((n) => n.status === "ready");
  const pending = nodes.filter((n) => n.status === "pending");
  if (ready.length === 0 && pending.length === 0) {
    // All nodes completed — replan only if coverage gap exists
    const coverageGap = detectCoverageGap(nodes);
    if (coverageGap) return true;
    return false;
  }

  // Coverage gap detection (partial completion)
  const coverageGap = detectCoverageGap(nodes);
  if (coverageGap) return true;

  return false;
}

export function getCoverageGapDescription(token: string): string | null {
  const session = getSession(token);
  if (!session) return null;
  return detectCoverageGap(session.graph.nodes);
}

export function replan(token: string): ReasoningGraph | null {
  const session = getSession(token);
  if (!session) return null;

  if (session.graph.replanCount >= 2) return null;

  const { nodes } = session.graph;

  const maxId = nodes.reduce((max, n) => Math.max(max, n.id), 0);
  let nextId = maxId + 1;

  const lowQuality = nodes.filter(
    (n) => n.status === "completed" && n.qualityScore !== undefined && n.qualityScore < 0.5,
  );

  for (const node of lowQuality) {
    const replacement: ReasoningNode = {
      id: nextId++,
      tool: node.tool,
      thoughtType: node.thoughtType,
      purpose: `${node.purpose} (replan — original quality: ${node.qualityScore})`,
      params: node.params,
      dependsOn: node.dependsOn,
      status: "ready",
    };
    nodes.push(replacement);
  }

  const blocked = nodes.filter((n) => n.status === "blocked");
  for (const node of blocked) {
    node.status = "ready";
  }

  session.graph.parallelGroups = calculateParallelGroups(nodes);
  session.graph.coverage = calculateCoverage(nodes);
  session.graph.totalNodes = nodes.length;
  session.graph.nextInstruction = buildNextInstruction(session.graph);
  session.graph.replanCount++;
  session.lastAccessed = Date.now();
  saveSession(session);

  return session.graph;
}

export function terminateSession(token: string): void {
  sessions.delete(token);
  if (PERSIST_ENABLED) {
    try {
      const filePath = sessionFilePath(token);
      if (existsSync(filePath)) unlinkSync(filePath);
    } catch { /* ignore deletion errors */ }
  }
}

export function getActiveSessionCount(): number {
  return sessions.size;
}

export interface SessionSummary {
  token: string;
  totalNodes: number;
  completedNodes: number;
  replanCount: number;
  ageMinutes: number;
  nextInstruction: string;
}

export function listActiveSessions(): SessionSummary[] {
  cleanupExpiredSessions();
  const result: SessionSummary[] = [];
  const now = Date.now();
  for (const [, session] of sessions) {
    result.push({
      token: session.token,
      totalNodes: session.graph.totalNodes,
      completedNodes: session.graph.completedNodes,
      replanCount: session.graph.replanCount,
      ageMinutes: Math.round((now - session.createdAt) / 60_000),
      nextInstruction: session.graph.nextInstruction,
    });
  }
  return result;
}

export function initializePersistence(): void {
  loadAllSessions();
}
