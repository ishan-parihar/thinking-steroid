import type { ProblemStructure } from "../types.js";
import {
  CAUSAL_PATTERNS,
  ASSUMPTION_PATTERNS,
  SHADOW_PATTERNS_KG,
  LEVERAGE_PATTERNS,
} from "../constants/patterns.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GraphQuery {
  domains: string[];
  entities: string[];
  relationships: string[];
  claims: string[];
  rawText: string;
}

export interface RetrievedPatterns {
  causal: import("../constants/patterns.js").CausalPattern[];
  assumptions: import("../constants/patterns.js").AssumptionPattern[];
  shadows: import("../constants/patterns.js").ShadowPattern[];
  leveragePoints: import("../constants/patterns.js").LeveragePoint[];
  /** Optional: systems archetypes detected in the analysis (populated by causal tool) */
  archetypes?: string[];
  /** Optional: Jungian archetype match from shadow analysis */
  archetypeMatch?: { archetype: string; pattern: string; role: string; warning: string };
  /** Optional: cognitive biases detected (populated by metacognitive tool) */
  biases?: string[];
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export function scoreEvidenceOverlap(
  markers: string[],
  textInputs: string[]
): number {
  const combined = textInputs.join(" ").toLowerCase();
  let matchCount = 0;
  for (const marker of markers) {
    if (combined.includes(marker.toLowerCase())) {
      matchCount++;
    }
  }
  return matchCount / Math.max(1, markers.length);
}

// ─── Retrieval ───────────────────────────────────────────────────────────────

export function retrievePatterns(
  query: GraphQuery,
  topN = 3
): RetrievedPatterns {
  return {
    causal: scoreAndFilter(
      CAUSAL_PATTERNS,
      query,
      "evidence_markers",
      () => [query.rawText, ...query.relationships, ...query.claims]
    ).slice(0, topN),
    assumptions: scoreAndFilter(
      ASSUMPTION_PATTERNS,
      query,
      "detection_signals",
      () => [query.rawText, ...query.claims, ...query.entities]
    ).slice(0, topN),
    shadows: scoreAndFilter(
      SHADOW_PATTERNS_KG,
      query,
      "manifests_as",
      () => [query.rawText, ...query.relationships, ...query.entities]
    ).slice(0, topN),
    leveragePoints: scoreAndFilter(
      LEVERAGE_PATTERNS,
      query,
      "applies_when",
      () => [query.rawText, ...query.relationships, ...query.claims]
    ).slice(0, topN),
  };
}

function scoreAndFilter<T extends { domains: string[] }>(
  patterns: T[],
  query: GraphQuery,
  markerField: keyof T & string,
  getText: () => string[]
): T[] {
  const scored: { pattern: T; score: number }[] = [];

  for (const pattern of patterns) {
    const domainMatch = pattern.domains.some((d) =>
      query.domains.includes(d)
    );
    if (!domainMatch) continue;

    const markers = pattern[markerField] as unknown as string[];
    const score = scoreEvidenceOverlap(markers, getText());
    if (score > 0) {
      scored.push({ pattern, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.pattern);
}

// ─── Query Builder ───────────────────────────────────────────────────────────

export function buildGraphQuery(structure: ProblemStructure, rawText = ""): GraphQuery {
  return {
    domains: structure.domain_signals,
    entities: structure.entities,
    relationships: structure.relationships,
    claims: structure.claims,
    rawText,
  };
}
