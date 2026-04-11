import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  OutputDepth,
  OutputMode,
  EpistemicStatus,
  SuggestedTool,
  CausalLoopType,
  CausalPolarity,
  SystemsArchetype,
  LeveragePointCategory,
  ThoughtType,
} from "../types.js";
import { SYSTEMS_ARCHETYPES, LEVERAGE_POINTS, CHARACTER_LIMIT } from "../constants.js";
import { CAUSAL_PATTERNS, LEVERAGE_PATTERNS } from "../constants/patterns.js";
import { composeToolContent, getStructureForText } from "../utils/content-pipeline.js";

function enforceLimit(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return text.substring(0, CHARACTER_LIMIT - 200) + "\n\n---\n*Output truncated due to size limit.*";
}

interface CausalRelationship {
  from: string;
  to: string;
  polarity: CausalPolarity;
  type: "direct" | "indirect" | "moderated";
  description: string;
}

interface FeedbackLoop {
  id: string;
  name: string;
  type: CausalLoopType;
  variables: string[];
  description: string;
}

interface LeveragePoint {
  rank: number;
  category: LeveragePointCategory;
  intervention: string;
  expected_impact: string;
}

interface ArchetypeDetection {
  archetype: SystemsArchetype;
  name: string;
  structure: string;
  evidence: string;
  intervention_strategy: string;
  confidence?: number;
  isPartial?: boolean;
}

function depthToRelationshipCount(depth: OutputDepth): number {
  switch (depth) {
    case "essential":
      return 3;
    case "standard":
      return 5;
    case "exhaustive":
      return 10;
  }
}

function depthToLoopCount(depth: OutputDepth): number {
  switch (depth) {
    case "essential":
      return 1;
    case "standard":
      return 2;
    case "exhaustive":
      return 4;
  }
}

function determineEpistemicStatus(
  depth: OutputDepth,
  knownFeedbackLoops?: string,
): EpistemicStatus {
  if (depth === "exhaustive" && knownFeedbackLoops && knownFeedbackLoops.trim().length > 0) {
    return "well-supported";
  }
  if (depth === "essential") {
    return "speculative";
  }
  return "tentative";
}

function determineFollowup(depth: OutputDepth): SuggestedTool[] {
  const base: SuggestedTool[] = ["think_scenario", "think_cynefin"];
  if (depth === "exhaustive") {
    base.push("think_metacognitive");
  }
  return base;
}

/**
 * Supplements variables to ensure at least minCount for meaningful cycle detection.
 * Derives supplemental variables from problem context keywords.
 */
function supplementVariables(variables: string[], problemContext: string, minCount: number): string[] {
  if (variables.length >= minCount) return variables;

  const supplemental: string[] = [];
  const contextLower = problemContext.toLowerCase();

  // Context-aware supplemental variables
  const contextHints: Record<string, string[]> = {
    stress: ["Burnout", "Morale", "Turnover"],
    performance: ["Quality", "Efficiency", "Capacity"],
    growth: ["Resources", "Constraints", "Saturation"],
    team: ["Communication", "Trust", "Alignment"],
    market: ["Demand", "Competition", "Innovation"],
    change: ["Resistance", "Adaptation", "Learning"],
    system: ["Complexity", "Feedback", "Delays"],
    project: ["Scope", "Timeline", "Resources"],
    risk: ["Uncertainty", "Exposure", "Vulnerability"],
    cost: ["Budget", "Investment", "ROI"],
  };

  for (const [keyword, vars] of Object.entries(contextHints)) {
    if (contextLower.includes(keyword)) {
      for (const v of vars) {
        if (supplemental.length + variables.length >= minCount) break;
        if (!variables.some(existing => existing.toLowerCase().includes(v.toLowerCase()))) {
          supplemental.push(v);
        }
      }
    }
    if (supplemental.length + variables.length >= minCount) break;
  }

  // Fallback to generic system variables
  const fallbackVars = ["Resources", "Capacity", "Constraints", "Pressure", "Feedback"];
  for (const fv of fallbackVars) {
    if (supplemental.length + variables.length >= minCount) break;
    if (!variables.some(existing => existing.toLowerCase().includes(fv.toLowerCase()))) {
      supplemental.push(fv);
    }
  }

  return [...variables, ...supplemental];
}

function generateOperationalDefinition(variable: string, problemContext: string): string {
  const definitions: Record<string, string> = {
    stress: `The level of psychological, physiological, or organizational strain experienced by the system in response to demands exceeding available coping capacity.`,
    performance: `The measurable output or effectiveness of the system in achieving its stated objectives, typically tracked through quantitative or qualitative indicators.`,
    resources: `The finite pool of material, financial, human, or temporal assets available to the system for achieving its objectives.`,
    trust: `The degree of confidence that system participants have in each other's reliability, competence, and benevolent intentions.`,
    communication: `The frequency, quality, and openness of information exchange between system participants, including both formal and informal channels.`,
    motivation: `The internal and external drives that propel individuals or groups toward goal-directed action within the system.`,
    complexity: `The degree of interconnectedness, non-linearity, and unpredictability in the system's structure and behavior.`,
    uncertainty: `The extent to which future states of the system cannot be predicted with confidence due to incomplete information or inherent variability.`,
    feedback: `Information about the system's output that is returned to influence subsequent input, creating circular causality.`,
    adaptation: `The system's capacity to modify its structure or behavior in response to changing internal or external conditions.`,
    resistance: `The active or passive opposition to change within the system, whether from individuals, structures, or cultural norms.`,
    innovation: `The introduction and adoption of novel ideas, processes, or structures that alter the system's functioning.`,
    collaboration: `The degree to which system participants coordinate their efforts toward shared objectives rather than competing.`,
    accountability: `The extent to which system participants answer for their actions and decisions to others within the system.`,
    autonomy: `The degree of self-determination and independent decision-making authority available to system participants.`,
    alignment: `The degree to which individual goals, incentives, and actions are consistent with the system's overall objectives.`,
    capacity: `The maximum sustainable output or throughput that the system can achieve given its current structure and resources.`,
    quality: `The degree to which the system's outputs meet or exceed established standards or stakeholder expectations.`,
    learning: `The rate at which the system acquires, integrates, and applies new knowledge to improve its functioning.`,
    burnout: `A state of chronic physical and emotional exhaustion resulting from prolonged stress and inadequate recovery.`,
    morale: `The collective confidence, enthusiasm, and sense of purpose shared by participants within the system.`,
    turnover: `The rate at which participants leave and are replaced within the system, affecting institutional memory and stability.`,
    transparency: `The degree to which information about decisions, processes, and outcomes is openly accessible to system participants.`,
    equity: `The fairness of resource distribution, opportunity access, and outcome allocation across system participants.`,
    control: `The degree of influence that system participants can exert over their environment, decisions, and outcomes.`,
  };

  const normalizedVariable = variable.toLowerCase().trim();

  for (const [key, definition] of Object.entries(definitions)) {
    if (normalizedVariable.includes(key) || key.includes(normalizedVariable)) {
      return definition;
    }
  }

  return `The measurable level or degree of ${variable.toLowerCase()} within the context of "${problemContext.substring(0, 60)}...", serving as a key variable in the system's causal structure.`;
}

/**
 * Causal language patterns for extracting relationships from text.
 * Each pattern captures a common way causality is expressed.
 */
const CAUSAL_LANGUAGE_PATTERNS: {
  regex: RegExp;
  polarityFromVerb: (verb: string) => CausalPolarity;
}[] = [
  // "X increases Y", "X reduces Y", "X causes Y", "X leads to Y"
  { regex: /(\w[\w\s]+?)\s+(?:increases|boosts|amplifies|strengthens|enhances|drives|accelerates|promotes|builds|expands|improves|grows|raises)\s+(\w[\w\s]+?)(?:\.|,|;|$)/gi, polarityFromVerb: () => "+" as CausalPolarity },
  { regex: /(\w[\w\s]+?)\s+(?:decreases|reduces|diminishes|weakens|erodes|lowers|undermines|impairs|hinders|suppresses|limits|constrains|drains|damages|worsens)\s+(\w[\w\s]+?)(?:\.|,|;|$)/gi, polarityFromVerb: () => "-" as CausalPolarity },
  { regex: /(\w[\w\s]+?)\s+(?:causes|triggers|generates|produces|creates|results in|leads to|gives rise to|brings about)\s+(\w[\w\s]+?)(?:\.|,|;|$)/gi, polarityFromVerb: () => "+" as CausalPolarity },
  { regex: /(\w[\w\s]+?)\s+(?:prevents|stops|blocks|inhibits|avoids|mitigates|counters|opposes|resists)\s+(\w[\w\s]+?)(?:\.|,|;|$)/gi, polarityFromVerb: () => "-" as CausalPolarity },
  // "X affects Y" - neutral, determine by context
  { regex: /(\w[\w\s]+?)\s+(?:affects|influences|impacts|shapes|determines|drives|correlates with)\s+(\w[\w\s]+?)(?:\.|,|;|$)/gi, polarityFromVerb: (_v: string) => "+" as CausalPolarity },
  // "Y is caused by X" (passive)
  { regex: /(\w[\w\s]+?)\s+(?:is caused by|is driven by|is fueled by|stems from|arises from|results from|is a consequence of)\s+(\w[\w\s]+?)(?:\.|,|;|$)/gi, polarityFromVerb: () => "+" as CausalPolarity },
  // "Y decreases when X increases" type patterns
  { regex: /(\w[\w\s]+?)\s+(?:rises|increases|grows)\s+(?:as|when)\s+(\w[\w\s]+?)\s+(?:rises|increases|grows)/gi, polarityFromVerb: () => "+" as CausalPolarity },
  { regex: /(\w[\w\s]+?)\s+(?:falls|decreases|declines)\s+(?:as|when)\s+(\w[\w\s]+?)\s+(?:rises|increases|grows)/gi, polarityFromVerb: () => "-" as CausalPolarity },
];

/**
 * Known variable-type polarity heuristics for when text extraction is insufficient.
 */
const VARIABLE_POLARITY_HINTS: Record<string, { positive?: string[]; negative?: string[] }> = {
  stress: { positive: ["burnout", "turnover", "errors", "resistance"], negative: ["performance", "morale", "quality", "learning"] },
  performance: { positive: ["resources", "motivation", "learning", "collaboration"], negative: ["stress", "burnout", "complexity"] },
  resources: { positive: ["performance", "morale", "capacity", "quality"], negative: ["stress", "scarcity"] },
  trust: { positive: ["collaboration", "communication", "morale", "transparency"], negative: ["resistance", "turnover"] },
  communication: { positive: ["trust", "alignment", "collaboration", "transparency"], negative: ["misalignment", "conflict"] },
  motivation: { positive: ["performance", "innovation", "engagement"], negative: ["burnout", "turnover"] },
  complexity: { positive: ["errors", "stress", "communication overhead"], negative: ["performance", "speed"] },
  burnout: { positive: ["turnover", "errors", "resistance"], negative: ["performance", "morale", "quality"] },
  morale: { positive: ["performance", "collaboration", "retention"], negative: ["turnover", "resistance"] },
  turnover: { positive: ["stress", "costs"], negative: ["morale", "performance", "knowledge"] },
  quality: { positive: ["customer satisfaction", "trust", "reputation"], negative: ["rework", "costs"] },
  innovation: { positive: ["competitiveness", "growth", "engagement"], negative: ["stability", "predictability"] },
  collaboration: { positive: ["trust", "innovation", "performance"], negative: ["silo formation"] },
  accountability: { positive: ["quality", "trust", "performance"], negative: ["blame", "fear"] },
  autonomy: { positive: ["motivation", "innovation", "engagement"], negative: ["alignment", "coordination"] },
  alignment: { positive: ["performance", "efficiency", "collaboration"], negative: ["autonomy", "innovation"] },
  capacity: { positive: ["performance", "growth", "quality"], negative: ["stress", "bottlenecks"] },
  learning: { positive: ["performance", "adaptation", "innovation"], negative: ["errors", "resistance"] },
  resistance: { positive: ["stress", "turnover"], negative: ["change", "innovation", "adaptation"] },
  transparency: { positive: ["trust", "accountability", "collaboration"], negative: ["politics", "misinformation"] },
};

function extractRelationshipsFromText(
  problemStatement: string,
  variables: string[],
): CausalRelationship[] {
  const relationships: CausalRelationship[] = [];
  const seen = new Set<string>();

  for (const pattern of CAUSAL_LANGUAGE_PATTERNS) {
    const text = problemStatement;
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(text)) !== null) {
      const rawCause = match[1].trim();
      const rawEffect = match[2].trim();

      const causeVar = findBestVariableMatch(rawCause, variables);
      const effectVar = findBestVariableMatch(rawEffect, variables);

      if (causeVar && effectVar && causeVar !== effectVar) {
        const key = `${causeVar}→${effectVar}`;
        if (!seen.has(key)) {
          seen.add(key);
          const polarity = pattern.polarityFromVerb(match[0]);
          relationships.push({
            from: causeVar,
            to: effectVar,
            polarity,
            type: "direct",
            description: generateRelationshipDescription(causeVar, effectVar, polarity, problemStatement, undefined),
          });
        }
      }
    }
  }

  return relationships;
}

function findBestVariableMatch(text: string, variables: string[]): string | null {
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/).filter((w) => w.length > 2);

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const variable of variables) {
    const varLower = variable.toLowerCase();
    const varWords = varLower.split(/\s+/);

    if (textLower.includes(varLower)) {
      return variable;
    }

    let score = 0;
    for (const vw of varWords) {
      if (vw.length > 2 && words.some((w) => w.includes(vw) || vw.includes(w))) {
        score++;
      }
    }

    if (score > bestScore && score >= Math.ceil(varWords.length * 0.5)) {
      bestScore = score;
      bestMatch = variable;
    }
  }

  return bestMatch;
}

function extractRelationshipsFromKnownLoops(
  knownFeedbackLoops: string | undefined,
  variables: string[],
  problemStatement: string,
): CausalRelationship[] {
  if (!knownFeedbackLoops || !knownFeedbackLoops.trim()) return [];

  const relationships: CausalRelationship[] = [];
  const seen = new Set<string>();

  const clauses = knownFeedbackLoops.split(",").map((s) => s.trim()).filter(Boolean);

  const polarityVerbs: Record<string, CausalPolarity> = {
    increases: "+", boosts: "+", amplifies: "+", strengthens: "+", enhances: "+",
    improves: "+", promotes: "+", builds: "+", expands: "+", drives: "+",
    reduces: "-", decreases: "-", diminishes: "-", weakens: "-", erodes: "-",
    undermines: "-", impairs: "-", hinders: "-", suppresses: "-", limits: "-",
    causes: "+", triggers: "+", leads: "+", generates: "+",
    prevents: "-", blocks: "-", inhibits: "-", counters: "-",
  };

  for (const clause of clauses) {
    const clauseLower = clause.toLowerCase();

    let polarity: CausalPolarity | null = null;
    let verbPos = -1;

    for (const [verb, pol] of Object.entries(polarityVerbs)) {
      const pos = clauseLower.indexOf(verb);
      if (pos !== -1 && (verbPos === -1 || pos < verbPos)) {
        polarity = pol as CausalPolarity;
        verbPos = pos;
      }
    }

    if (!polarity) continue;

    const beforeVerb = clause.substring(0, verbPos).trim();
    const afterVerbStart = clauseLower.indexOf(Object.entries(polarityVerbs).find(([_, p]) => p === polarity)?.[0] || "") + (Object.entries(polarityVerbs).find(([_, p]) => p === polarity)?.[0].length || 0);
    const afterVerb = clause.substring(afterVerbStart).trim().replace(/^[,\s]+/, "");

    const causeVar = findBestVariableMatch(beforeVerb, variables);
    const effectVar = findBestVariableMatch(afterVerb, variables);

    if (causeVar && effectVar && causeVar !== effectVar) {
      const key = `${causeVar}→${effectVar}`;
      if (!seen.has(key)) {
        seen.add(key);
        relationships.push({
          from: causeVar,
          to: effectVar,
          polarity,
          type: "direct",
          description: generateRelationshipDescription(causeVar, effectVar, polarity, problemStatement, undefined),
        });
      }
    }
  }

  return relationships;
}

function matchCausalPatterns(
  variables: string[],
  problemStatement: string,
): CausalRelationship[] {
  const relationships: CausalRelationship[] = [];
  const seen = new Set<string>();
  const textLower = problemStatement.toLowerCase();

  for (const pattern of CAUSAL_PATTERNS) {
    // Check if any evidence marker is present in the problem statement
    const matchesEvidence = pattern.evidence_markers.some((marker) =>
      textLower.includes(marker.toLowerCase()),
    );

    if (!matchesEvidence) continue;

    // Check if the pattern's cause and effect variables map to our variables
    const causeVar = findBestVariableMatch(pattern.structure.cause, variables);
    const effectVar = findBestVariableMatch(pattern.structure.effect, variables);

    if (causeVar && effectVar && causeVar !== effectVar) {
      const key = `${causeVar}→${effectVar}`;
      if (!seen.has(key)) {
        seen.add(key);
        relationships.push({
          from: causeVar,
          to: effectVar,
          polarity: "+", // Causal patterns imply positive causation unless stated otherwise
          type: "direct",
          description: `${pattern.description}. ${pattern.structure.mechanism}`,
        });
      }
    }
  }

  return relationships;
}

function generateSemanticRelationships(
  variables: string[],
  problemStatement: string,
  existing: CausalRelationship[],
  requiredCount: number,
): CausalRelationship[] {
  const relationships = [...existing];
  const existingPairs = new Set(relationships.map((r) => `${r.from}→${r.to}`));
  const contextLower = problemStatement.toLowerCase();

  // Generate relationships based on variable polarity hints
  for (const variable of variables) {
    const hints = VARIABLE_POLARITY_HINTS[variable.toLowerCase()];
    if (!hints) continue;

    // Positive relationships
    for (const target of hints.positive || []) {
      const targetVar = findBestVariableMatch(target, variables);
      if (targetVar && targetVar !== variable) {
        const key = `${variable}→${targetVar}`;
        if (!existingPairs.has(key)) {
          existingPairs.add(key);
          relationships.push({
            from: variable,
            to: targetVar,
            polarity: "+",
            type: "direct",
            description: generateRelationshipDescription(variable, targetVar, "+", problemStatement, undefined),
          });
        }
      }
    }

    // Negative relationships
    for (const target of hints.negative || []) {
      const targetVar = findBestVariableMatch(target, variables);
      if (targetVar && targetVar !== variable) {
        const key = `${variable}→${targetVar}`;
        if (!existingPairs.has(key)) {
          existingPairs.add(key);
          relationships.push({
            from: variable,
            to: targetVar,
            polarity: "-",
            type: "direct",
            description: generateRelationshipDescription(variable, targetVar, "-", problemStatement, undefined),
          });
        }
      }
    }

    if (relationships.length >= requiredCount * 2) break;
  }

  // If still not enough, generate based on hash for deterministic output
  if (relationships.length < requiredCount) {
    for (let i = 0; i < variables.length && relationships.length < requiredCount; i++) {
      for (let j = 0; j < variables.length && relationships.length < requiredCount; j++) {
        if (i === j) continue;
        const key = `${variables[i]}→${variables[j]}`;
        if (!existingPairs.has(key)) {
          existingPairs.add(key);
          // Use context to determine more meaningful polarity
          const polarity = determinePolarity(variables[i], variables[j], problemStatement);
          relationships.push({
            from: variables[i],
            to: variables[j],
            polarity,
            type: "indirect",
            description: generateRelationshipDescription(variables[i], variables[j], polarity, problemStatement, undefined),
          });
        }
      }
    }
  }

  return relationships.slice(0, Math.max(requiredCount, relationships.length));
}

/**
 * Builds a rich causal graph with multiple overlapping cycles.
 * Creates: (1) backbone chain, (2) back-links for full-graph cycles,
 * (3) cross-links for shorter cycles, (4) short-cycle back-links.
 */
function ensureGraphHasCycles(
  variables: string[],
  relationships: CausalRelationship[],
  requiredCount: number,
  problemStatement: string,
): CausalRelationship[] {
  if (variables.length < 2) return relationships;

  const existingPairs = new Set(relationships.map((r) => `${r.from}→${r.to}`));
  const addRel = (from: string, to: string, polarity: CausalPolarity, type: CausalRelationship["type"] = "direct") => {
    const key = `${from}→${to}`;
    if (!existingPairs.has(key) && from !== to) {
      existingPairs.add(key);
      relationships.push({
        from,
        to,
        polarity,
        type,
        description: generateRelationshipDescription(from, to, polarity, problemStatement, undefined),
      });
    }
  };

  // 1. Backbone chain: v0→v1→v2→...→vn
  for (let i = 0; i < variables.length - 1; i++) {
    addRel(variables[i], variables[i + 1], "+");
  }

  // 2. Primary back-link: vn→v0 (creates full-graph cycle)
  addRel(variables[variables.length - 1], variables[0], "-");

  // 3. Secondary back-link: vn-1→v0 (creates shorter cycle with different polarity)
  if (variables.length >= 3) {
    addRel(variables[variables.length - 2], variables[0], "+");
  }

  // 4. Cross-links for additional cycle paths (v_i → v_{i+2})
  for (let i = 0; i < variables.length - 2; i++) {
    const polarity: CausalPolarity = i % 2 === 0 ? "+" : "-";
    addRel(variables[i], variables[i + 2], polarity, "indirect");
  }

  // 5. Short-cycle back-links: v_{i+2} → v_i for overlapping 2-step loops
  for (let i = 0; i < variables.length - 2; i += 2) {
    addRel(variables[i + 2], variables[i], "-", "direct");
  }

  // 6. Middle-to-start back-link for odd-length cycles
  if (variables.length >= 4) {
    const midIdx = Math.floor(variables.length / 2);
    addRel(variables[midIdx], variables[0], "-");
  }

  return relationships;
}

function generateCausalRelationships(
  variables: string[],
  problemContext: string,
  knownFeedbackLoops?: string,
  knownConstraints?: string,
  requiredCount?: number,
): CausalRelationship[] {
  const count = requiredCount ?? 5;

  // Step 1: Extract from problem text using causal language patterns
  const fromText = extractRelationshipsFromText(problemContext, variables);

  // Step 2: Extract from known feedback loops
  const fromKnownLoops = extractRelationshipsFromKnownLoops(knownFeedbackLoops, variables, problemContext);

  // Step 3: Match against CAUSAL_PATTERNS from patterns.ts
  const fromPatterns = matchCausalPatterns(variables, problemContext);

  // Merge with deduplication
  const merged = new Map<string, CausalRelationship>();
  for (const rel of [...fromKnownLoops, ...fromText, ...fromPatterns]) {
    const key = `${rel.from}→${rel.to}`;
    if (!merged.has(key)) {
      merged.set(key, rel);
    }
  }

  // Step 4: Fill gaps with semantic relationships
  const existing = Array.from(merged.values());
  const supplemented = generateSemanticRelationships(variables, problemContext, existing, count);

  // Step 5: Ensure the graph has cycles for feedback loop detection
  const withCycles = ensureGraphHasCycles(variables, supplemented, count, problemContext);

  return withCycles.slice(0, Math.max(count, withCycles.length));
}

function determinePolarity(from: string, to: string, _context: string): CausalPolarity {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  const positiveIndicators = ["increase", "growth", "improve", "enhance", "boost", "strengthen", "expand", "accelerate", "rise", "build", "develop", "advance", "gain", "amplify", "elevate"];
  const negativeIndicators = ["decrease", "reduce", "decline", "diminish", "weaken", "erode", "loss", "drop", "fall", "damage", "degrade", "worsen", "impair", "destroy", "collapse"];

  const fromIsPositive = positiveIndicators.some((w) => fromLower.includes(w));
  const fromIsNegative = negativeIndicators.some((w) => fromLower.includes(w));
  const toIsNegativeOutcome = negativeIndicators.some((w) => toLower.includes(w));

  if (fromIsPositive && !toIsNegativeOutcome) return "+";
  if (fromIsPositive && toIsNegativeOutcome) return "-";
  if (fromIsNegative && !toIsNegativeOutcome) return "-";
  if (fromIsNegative && toIsNegativeOutcome) return "+";

  return hashPolarity(from, to);
}

function hashPolarity(a: string, b: string): CausalPolarity {
  let hash = 0;
  const combined = a + b;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? "+" : "-";
}

function determineRelationshipType(
  from: string,
  to: string,
  knownLoops: string[],
): "direct" | "indirect" | "moderated" {
  const loopMentions = knownLoops.some(
    (loop) => loop.toLowerCase().includes(from.toLowerCase()) && loop.toLowerCase().includes(to.toLowerCase()),
  );
  if (loopMentions) return "direct";
  return hashPolarity(from, to) === "+" ? "direct" : "indirect";
}

function generateRelationshipDescription(
  from: string,
  to: string,
  polarity: CausalPolarity,
  _context: string,
  constraints?: string,
): string {
  const direction = polarity === "+" ? "increases" : "decreases";
  const inverseDirection = polarity === "+" ? "decreases" : "increases";
  const constraintNote = constraints
    ? ` (subject to: ${constraints.substring(0, 80)})`
    : "";

  return `As ${from.toLowerCase()} ${direction}, ${to.toLowerCase()} tends to ${direction}${constraintNote}. This relationship reflects a ${polarity === "+" ? "same-direction" : "opposite-direction"} causal link where changes in ${from.toLowerCase()} propagate to ${to.toLowerCase()} through established system mechanisms.`;
}

function detectFeedbackLoops(
  variables: string[],
  relationships: CausalRelationship[],
  requiredCount: number,
  problemContext: string,
): FeedbackLoop[] {
  const loops: FeedbackLoop[] = [];
  const adjacencyMap = new Map<string, { target: string; polarity: CausalPolarity }[]>();

  for (const rel of relationships) {
    if (!adjacencyMap.has(rel.from)) {
      adjacencyMap.set(rel.from, []);
    }
    adjacencyMap.get(rel.from)!.push({ target: rel.to, polarity: rel.polarity });
  }

  const seenLoopKeys = new Set<string>();
  const relationshipMap = new Map<string, CausalPolarity>();
  for (const rel of relationships) {
    relationshipMap.set(`${rel.from}→${rel.to}`, rel.polarity);
  }

  function findLoop(start: string, current: string, path: string[], polarities: CausalPolarity[]): void {
    if (path.length > variables.length) return;

    const neighbors = adjacencyMap.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (neighbor.target === start && path.length >= 2) {
        const allPolarities = [...polarities, neighbor.polarity];
        const negativeCount = allPolarities.filter((p) => p === "-").length;
        const loopType: CausalLoopType = negativeCount % 2 === 0 ? "reinforcing" : "balancing";

        const loopKey = path.join("→");
        if (!seenLoopKeys.has(loopKey)) {
          seenLoopKeys.add(loopKey);
          const loopName = generateLoopName(loopType, path, allPolarities, problemContext);
          const loopId = `${loopType === "reinforcing" ? "R" : "B"}${loops.filter((l) => l.type === loopType).length + 1}`;
          loops.push({
            id: loopId,
            name: loopName,
            type: loopType,
            variables: [...path],
            description: generateLoopDescription(loopType, path, allPolarities, relationshipMap, problemContext),
          });
        }
      } else if (!path.includes(neighbor.target) && path.length < variables.length) {
        findLoop(start, neighbor.target, [...path, neighbor.target], [...polarities, neighbor.polarity]);
      }
    }
  }

  for (const variable of variables) {
    findLoop(variable, variable, [variable], []);
    if (loops.length >= requiredCount * 3) break;
  }

  const hasR = loops.some((l) => l.type === "reinforcing");
  const hasB = loops.some((l) => l.type === "balancing");

  if (hasR && hasB) {
    const rLoops = loops.filter((l) => l.type === "reinforcing");
    const bLoops = loops.filter((l) => l.type === "balancing");
    const result = [rLoops[0], bLoops[0], ...loops.filter((l) => l !== rLoops[0] && l !== bLoops[0])];
    return result.slice(0, requiredCount);
  }

  return loops.slice(0, requiredCount);
}

function generateLoopName(
  type: CausalLoopType,
  variables: string[],
  polarities: CausalPolarity[],
  context: string,
): string {
  const contextLower = context.toLowerCase();
  const varKeywords = variables.map((v) => v.toLowerCase());
  const negativeCount = polarities.filter((p) => p === "-").length;

  if (type === "reinforcing") {
    if (varKeywords.some((k) => k.includes("stress") || k.includes("burnout"))) return "Stress Amplification";
    if (varKeywords.some((k) => k.includes("trust"))) return "Trust Accumulation";
    if (varKeywords.some((k) => k.includes("innovation"))) return "Innovation Flywheel";
    if (varKeywords.some((k) => k.includes("learning"))) return "Learning Acceleration";
    if (varKeywords.some((k) => k.includes("motivation"))) return "Motivation Engine";
    if (varKeywords.some((k) => k.includes("quality"))) return "Quality Compounder";
    if (varKeywords.some((k) => k.includes("collaboration"))) return "Collaboration Multiplier";
    if (varKeywords.some((k) => k.includes("morale"))) return "Morale Builder";

    if (contextLower.includes("growth") || contextLower.includes("expand")) return "Growth Engine";
    if (contextLower.includes("decline") || contextLower.includes("collapse")) return "Decline Spiral";
    if (contextLower.includes("success")) return "Success Momentum";
    if (contextLower.includes("fear") || contextLower.includes("anxiety")) return "Anxiety Spiral";
    if (contextLower.includes("debt")) return "Debt Accumulation";
    if (contextLower.includes("complexity")) return "Complexity Explosion";

    if (negativeCount >= 2) return "Double-Negative Amplifier";
    return "Self-Reinforcing Cycle";
  }

  if (varKeywords.some((k) => k.includes("stress") || k.includes("burnout"))) return "Burnout Brake";
  if (varKeywords.some((k) => k.includes("resource") || k.includes("capacity"))) return "Capacity Limiter";
  if (varKeywords.some((k) => k.includes("quality"))) return "Quality Gatekeeper";
  if (varKeywords.some((k) => k.includes("resistance"))) return "Resistance Dampener";
  if (varKeywords.some((k) => k.includes("performance"))) return "Performance Regulator";
  if (varKeywords.some((k) => k.includes("turnover"))) return "Turnover Stabilizer";

  if (contextLower.includes("balance") || contextLower.includes("equilibrium")) return "Equilibrium Seeker";
  if (contextLower.includes("limit") || contextLower.includes("constraint")) return "Constraint Enforcer";
  if (contextLower.includes("saturat")) return "Saturation Brake";

  return "Self-Correcting Loop";
}

function generateLoopDescription(
  type: CausalLoopType,
  variables: string[],
  polarities: CausalPolarity[],
  relationshipMap: Map<string, CausalPolarity>,
  _context: string,
): string {
  const varChain = variables.map((v, i) => {
    const next = variables[(i + 1) % variables.length];
    const key = `${v}→${next}`;
    const pol = relationshipMap.get(key) || polarities[i] || "+";
    const polSymbol = pol === "+" ? "(+)" : "(-)";
    return `${v.toLowerCase()} ${polSymbol}`;
  }).join(" → ");

  const negativeCount = polarities.filter((p) => p === "-").length;
  const primaryVar = variables[0]?.toLowerCase() ?? "the system";

  if (type === "reinforcing") {
    let description = `This reinforcing loop (${variables.length} variables, ${negativeCount} negative link${negativeCount !== 1 ? "s" : ""}) creates self-amplifying dynamics through the chain: ${varChain}. `;
    description += `A change in ${primaryVar} propagates through the loop and returns amplified, creating exponential growth or accelerating decline. `;
    description += `With ${negativeCount === 0 ? "all positive links reinforcing the same direction" : `${negativeCount} negative link(s) that, in even combination, still produce amplification`}, this loop will drive the system toward an extreme state if left unchecked.`;
    return description;
  }

  let description = `This balancing loop (${variables.length} variables, ${negativeCount} odd negative link${negativeCount !== 1 ? "s" : ""}) creates self-correcting dynamics through the chain: ${varChain}. `;
  description += `As ${primaryVar} shifts, the odd number of negative links (${negativeCount}) generates counter-pressure that opposes further change. `;
  description += `This loop acts as the system's thermostat, maintaining stability by pushing back against deviations from equilibrium. It is the primary source of resistance to change interventions.`;
  return description;
}

function generateLeveragePoints(
  variables: string[],
  loops: FeedbackLoop[],
  problemContext: string,
  depth: OutputDepth,
): LeveragePoint[] {
  const allCategories: LeveragePointCategory[] = [
    "transcend-paradigm",
    "paradigm",
    "goals",
    "self-organization",
    "rules",
    "information-flows",
    "positive-feedback",
    "negative-feedback",
    "delays",
    "stock-and-flow",
    "buffers",
    "parameters",
  ];

  const leveragePoints: LeveragePoint[] = [];
  const contextLower = problemContext.toLowerCase();

  for (const category of allCategories) {
    const lp = LEVERAGE_POINTS[category];
    const matchingPatterns = LEVERAGE_PATTERNS.filter((p) => {
      const rankMatch = Math.abs(p.meadows_rank - lp.rank) <= 2;
      const domainMatch = p.applies_when.some((condition) =>
        contextLower.includes(condition.toLowerCase().split(" ")[0]),
      );
      return rankMatch || domainMatch;
    });

    const patternContext = matchingPatterns.length > 0
      ? ` Relevant patterns detected: ${matchingPatterns.slice(0, 2).map((p) => p.description).join("; ")}.`
      : "";

    const intervention = generateIntervention(category, variables, loops, problemContext) + patternContext;
    const impact = generateImpactDescription(category, variables, problemContext, matchingPatterns);

    leveragePoints.push({
      rank: lp.rank,
      category,
      intervention,
      expected_impact: impact,
    });
  }

  const topCount = depth === "essential" ? 6 : depth === "standard" ? 8 : 12;
  return leveragePoints.slice(0, topCount);
}

function generateIntervention(
  category: LeveragePointCategory,
  variables: string[],
  loops: FeedbackLoop[],
  context: string,
): string {
  const primaryVar = variables[0] ?? "the system";
  const contextLower = context.toLowerCase();

  const interventions: Record<LeveragePointCategory, string> = {
    "transcend-paradigm": `Cultivate the capacity to step outside the current framing of "${context.substring(0, 60)}..." entirely and recognize that the entire system of variables is one of many possible constructions. Practice holding multiple contradictory models simultaneously without needing to resolve them into a single "truth."`,
    paradigm: `Shift the underlying worldview from one that treats "${contextLower.includes("problem") ? "this as a problem to be solved" : "this as a static situation"}" to one that recognizes it as a living system with its own logic. This means moving from mechanistic to ecological thinking, from linear to circular causality.`,
    goals: `Redefine the system's purpose from its current implicit goal to one that explicitly accounts for long-term sustainability and the well-being of all stakeholders. The goal should be measurable and should align with the highest-leverage variables: ${variables.slice(0, 3).join(", ")}.`,
    "self-organization": `Create conditions for the system to evolve its own structure by introducing diversity, experimentation, and selection mechanisms. This means reducing top-down control and enabling participants to self-organize around emerging patterns rather than prescribed plans.`,
    rules: `Change the formal rules that govern behavior: incentives, constraints, permissions, and prohibitions. Specifically, redesign the rules that currently reinforce the most problematic feedback loops (${loops.map((l) => l.name).join(", ")}) to instead strengthen balancing mechanisms.`,
    "information-flows": `Restructure who has access to what information. Add missing feedback loops so that the consequences of actions are visible to those who take them. Make ${variables[0] ?? "key system metrics"} transparent and real-time rather than delayed and aggregated.`,
    "positive-feedback": `Reduce the gain around reinforcing loops that are driving undesirable dynamics. This can be done by introducing friction, caps, or cooling-off periods that slow the rate of amplification without eliminating the loop entirely.`,
    "negative-feedback": `Strengthen balancing loops that provide self-correction. Make the system's natural stabilizing mechanisms more responsive by reducing the threshold at which corrective action is triggered and increasing the magnitude of the correction.`,
    delays: `Shorten the time lag between action and feedback in the system. Replace periodic reviews with continuous monitoring, and ensure that the consequences of decisions are visible to decision-makers before the next decision is made.`,
    "stock-and-flow": `Restructure the physical or organizational architecture of the system. This might mean changing reporting relationships, altering the flow of resources, or redesigning the processes that convert inputs to outputs.`,
    buffers: `Increase the size of stabilizing stocks that absorb fluctuations in the system. This provides a cushion against variability and gives balancing loops more time to respond before the system reaches a tipping point.`,
    parameters: `Adjust the numerical values that govern system behavior — rates, thresholds, standards, and constants. While this is the lowest leverage intervention, it can be effective when parameters are significantly misaligned with system reality.`,
  };

  return interventions[category];
}

function generateImpactDescription(
  category: LeveragePointCategory,
  variables: string[],
  _context: string,
  matchingPatterns?: typeof LEVERAGE_PATTERNS,
): string {
  const lp = LEVERAGE_POINTS[category];
  const actionability = lp.actionability;
  const patternNote = matchingPatterns && matchingPatterns.length > 0
    ? ` Supported by ${matchingPatterns.length} matching leverage pattern(s).`
    : "";

  if (lp.rank <= 4) {
    return `Transformative — changes the fundamental nature of the system. High difficulty to implement, requires deep structural or cultural shift. Effects cascade through all ${variables.length} identified variables.${patternNote}`;
  }
  if (lp.rank <= 7) {
    return `Significant — alters the dynamics of key feedback loops. Moderate difficulty, requires changes to information architecture or loop structure. Most effective when combined with goal-level interventions.${patternNote}`;
  }
  return `Incremental — produces measurable but limited change. ${actionability === "high" ? "Relatively easy to implement" : "Moderate implementation difficulty"}, but effects are often temporary if higher-leverage points are not also addressed.${patternNote}`;
}

function detectArchetypes(
  variables: string[],
  relationships: CausalRelationship[],
  loops: FeedbackLoop[],
  problemContext: string,
): ArchetypeDetection[] {
  const detections: ArchetypeDetection[] = [];

  for (const [archetypeKey, archetype] of Object.entries(SYSTEMS_ARCHETYPES)) {
    const key = archetypeKey as SystemsArchetype;
    const match = evaluateArchetypeMatch(key, archetype, variables, relationships, loops, problemContext);
    if (match) {
      detections.push(match);
    }
  }

  // Sort: strong matches first (by evidence length), then partials (by confidence)
  const strong = detections.filter(d => !d.isPartial);
  const partials = detections.filter(d => d.isPartial);
  strong.sort((a, b) => b.evidence.length - a.evidence.length);
  partials.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  return [...strong.slice(0, 3), ...partials.slice(0, 2)];
}

function evaluateArchetypeMatch(
  key: SystemsArchetype,
  archetype: { name: string; structure: string; description: string; early_warning: string; intervention_strategy: string },
  variables: string[],
  relationships: CausalRelationship[],
  loops: FeedbackLoop[],
  context: string,
): ArchetypeDetection | null {
  const contextLower = context.toLowerCase();
  const reinforcingLoops = loops.filter((l) => l.type === "reinforcing");
  const balancingLoops = loops.filter((l) => l.type === "balancing");

  // Structural loop topology analysis
  const structuralScore = analyzeArchetypeStructure(key, variables, loops, relationships);

  let evidence = structuralScore.evidence;
  let confidence = structuralScore.confidence;

  // Context keyword scoring (supplements structural analysis)
  switch (key) {
    case "fixes-that-fail":
      if (contextLower.includes("quick fix") || contextLower.includes("short-term") || contextLower.includes("temporary") || contextLower.includes("band-aid") || contextLower.includes("patch")) {
        confidence += 20;
        evidence += ` Problem context references short-term solutions or quick fixes.`;
      }
      break;

    case "shifting-the-burden":
      if (contextLower.includes("dependency") || contextLower.includes("external") || contextLower.includes("support") || contextLower.includes("crutch") || contextLower.includes("workaround")) {
        confidence += 15;
        evidence += ` Context suggests reliance on external support or symptomatic interventions.`;
      }
      break;

    case "limits-to-growth":
      if (contextLower.includes("growth") || contextLower.includes("limit") || contextLower.includes("constraint") || contextLower.includes("plateau") || contextLower.includes("ceiling") || contextLower.includes("cap")) {
        confidence += 20;
        evidence += ` Context explicitly mentions growth, limits, or constraints.`;
      }
      break;

    case "tragedy-of-the-commons":
      if (contextLower.includes("shared") || contextLower.includes("common") || contextLower.includes("resource") || contextLower.includes("compete") || contextLower.includes("overuse") || contextLower.includes("depletion")) {
        confidence += 20;
        evidence += ` Context involves shared resources or competition among actors.`;
      }
      break;

    case "escalation":
      if (contextLower.includes("competition") || contextLower.includes("rival") || contextLower.includes("arms race") || contextLower.includes("escalat") || contextLower.includes("tit-for-tat") || contextLower.includes("retaliate")) {
        confidence += 20;
        evidence += ` Context explicitly describes competitive or adversarial dynamics.`;
      }
      break;

    case "success-to-the-successful":
      if (contextLower.includes("resource") || contextLower.includes("allocation") || contextLower.includes("winner") || contextLower.includes("unequal") || contextLower.includes("rich get richer") || contextLower.includes("advantage")) {
        confidence += 15;
        evidence += ` Context involves resource allocation or unequal outcomes.`;
      }
      break;

    case "drift-to-low-performance":
      if (contextLower.includes("decline") || contextLower.includes("drift") || contextLower.includes("standard") || contextLower.includes("mediocre") || contextLower.includes("lowering bar") || contextLower.includes("accepting less")) {
        confidence += 20;
        evidence += ` Context suggests gradual decline or lowering of standards.`;
      }
      break;

    case "growth-and-underinvestment":
      if (contextLower.includes("investment") || contextLower.includes("capacity") || contextLower.includes("infrastructure") || contextLower.includes("underinvest") || contextLower.includes("not enough resources")) {
        confidence += 20;
        evidence += ` Context references investment, capacity, or infrastructure concerns.`;
      }
      break;

    case "accidental-adversaries":
      if (contextLower.includes("partner") || contextLower.includes("cooperat") || contextLower.includes("alliance") || contextLower.includes("misunderstand") || contextLower.includes("unintended conflict")) {
        confidence += 20;
        evidence += ` Context involves partnerships or cooperative relationships with emerging friction.`;
      }
      break;

    case "attractiveness":
      if (contextLower.includes("multiple") || contextLower.includes("option") || contextLower.includes("attract") || contextLower.includes("spread thin") || contextLower.includes("competing priorities")) {
        confidence += 15;
        evidence += ` Context suggests multiple competing initiatives or options.`;
      }
      break;
  }

  if (confidence >= 10) {
    return {
      archetype: key,
      name: archetype.name,
      structure: archetype.structure,
      evidence: evidence.trim(),
      intervention_strategy: archetype.intervention_strategy,
      confidence,
      isPartial: confidence < 20,
    };
  }

  return null;
}

/**
 * Analyzes loop topology and variable structure to detect archetype patterns.
 * Returns confidence score and evidence based on structural analysis.
 */
function analyzeArchetypeStructure(
  key: SystemsArchetype,
  variables: string[],
  loops: FeedbackLoop[],
  relationships: CausalRelationship[],
): { confidence: number; evidence: string } {
  const reinforcingLoops = loops.filter((l) => l.type === "reinforcing");
  const balancingLoops = loops.filter((l) => l.type === "balancing");
  const allLoops = loops;

  const sharedVars = (a: FeedbackLoop, b: FeedbackLoop): string[] =>
    a.variables.filter((v) => b.variables.includes(v));

  const loopHasKeyword = (loop: FeedbackLoop, keywords: string[]): boolean =>
    keywords.some((kw) => loop.variables.some((v) => v.toLowerCase().includes(kw)));

  const negativeRelCount = relationships.filter((r) => r.polarity === "-").length;

  switch (key) {
    case "fixes-that-fail": {
      // Structure: B loop (symptomatic fix) + R loop (unintended consequence worsening problem)
      // Key: B loop shares a "problem/symptom" variable with R loop
      if (balancingLoops.length >= 1 && reinforcingLoops.length >= 1) {
        const bLoop = balancingLoops[0];
        const rLoop = reinforcingLoops[0];
        const shared = sharedVars(bLoop, rLoop);
        if (shared.length > 0) {
          return {
            confidence: 35,
            evidence: `Structural match: balancing loop "${bLoop.name}" and reinforcing loop "${rLoop.name}" share variable(s) "${shared.join(", ")}" — consistent with fixes-that-fail where a symptomatic fix (B) shares the problem variable with an unintended consequence loop (R).`,
          };
        }
        return {
          confidence: 15,
          evidence: `Partial structural match: both balancing (${balancingLoops.length}) and reinforcing (${reinforcingLoops.length}) loops present, but no shared variables detected between primary loops.`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "shifting-the-burden": {
      // Structure: 2+ B loops (symptomatic + fundamental) where symptomatic undermines fundamental
      if (balancingLoops.length >= 2) {
        const hasShared = balancingLoops.some((a, i) =>
          balancingLoops.slice(i + 1).some((b) => sharedVars(a, b).length > 0),
        );
        const underminingEvidence = negativeRelCount >= 2;
        const conf = hasShared ? 30 : 15;
        return {
          confidence: conf,
          evidence: `Structural match: ${balancingLoops.length} balancing loops detected${hasShared ? " with shared variables between them" : ""}${underminingEvidence ? " and negative causal links suggesting undermining dynamics" : ""}. Consistent with shifting-the-burden where symptomatic and fundamental solutions compete.${hasShared ? "" : " (partial — no shared variables between balancing loops)"}`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "limits-to-growth": {
      // Structure: R loop (growth) + B loop (constraint/limit)
      if (reinforcingLoops.length >= 1 && balancingLoops.length >= 1) {
        const growthVars = variables.filter((v) =>
          /growth|increase|expand|accelerate|compound|momentum|scale/i.test(v),
        );
        const limitVars = variables.filter((v) =>
          /limit|constraint|cap|ceiling|resource|capacity|bottleneck|saturation/i.test(v),
        );
        const hasGrowthVar = growthVars.length > 0;
        const hasLimitVar = limitVars.length > 0;
        const conf = (hasGrowthVar && hasLimitVar) ? 40 : hasGrowthVar ? 25 : hasLimitVar ? 25 : 15;
        return {
          confidence: conf,
          evidence: `Structural match: ${reinforcingLoops.length} reinforcing loop(s) driving growth + ${balancingLoops.length} balancing loop(s) imposing limits.${hasGrowthVar ? ` Growth variable(s): ${growthVars.join(", ")}.` : ""}${hasLimitVar ? ` Limit variable(s): ${limitVars.join(", ")}.` : ""}${!hasGrowthVar && !hasLimitVar ? " No explicit growth/limit variables detected — partial match based on loop structure only." : ""}`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "tragedy-of-the-commons": {
      // Structure: 2+ R loops (individual actors) sharing a resource variable, with eventual B loop
      if (reinforcingLoops.length >= 2) {
        const resourceVars = variables.filter((v) =>
          /resource|common|shared|pool|stock|capacity|environment/i.test(v),
        );
        const sharesResource = reinforcingLoops.some((loop) =>
          resourceVars.some((rv) => loop.variables.includes(rv)),
        );
        const conf = sharesResource ? 35 : reinforcingLoops.length >= 3 ? 20 : 12;
        return {
          confidence: conf,
          evidence: `Structural match: ${reinforcingLoops.length} reinforcing loops (individual gain dynamics)${sharesResource ? ` sharing resource variable(s): ${resourceVars.join(", ")}` : ""}${balancingLoops.length > 0 ? ` with ${balancingLoops.length} balancing loop(s) suggesting eventual resource constraint` : ""}.`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "escalation": {
      // Structure: 2+ R loops where each loop's output feeds the other loop's input (mutual reinforcement)
      if (reinforcingLoops.length >= 2) {
        const mutualOverlap = reinforcingLoops[0].variables.some((v) =>
          reinforcingLoops[1].variables.includes(v),
        );
        const opposingPolarity = relationships.some((r) =>
          reinforcingLoops[0].variables.includes(r.from) &&
          reinforcingLoops[1].variables.includes(r.to) &&
          r.polarity === "-",
        );
        const conf = mutualOverlap ? 40 : opposingPolarity ? 30 : 15;
        return {
          confidence: conf,
          evidence: `Structural match: ${reinforcingLoops.length} reinforcing loops${mutualOverlap ? " with overlapping variables suggesting mutual influence" : ""}${opposingPolarity ? " and opposing causal links suggesting adversarial dynamics" : ""}. Consistent with escalation pattern.${!mutualOverlap && !opposingPolarity ? " (partial — no direct mutual influence detected between loops)" : ""}`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "success-to-the-successful": {
      // Structure: 2+ R loops competing for a shared resource, where early success in one loop starves the other
      if (reinforcingLoops.length >= 2) {
        const competingResource = allLoops.length >= 3;
        const conf = competingResource ? 25 : 15;
        return {
          confidence: conf,
          evidence: `Structural match: ${reinforcingLoops.length} reinforcing loops${competingResource ? " competing within a system that also contains balancing loops (resource competition)" : ""}. ${competingResource ? "Balancing loops create the resource constraint that produces winner-take-all dynamics." : "Partial — no balancing loops detected to enforce resource competition."}`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "drift-to-low-performance": {
      // Structure: B loop where the goal/standard variable gradually erodes (implicit in single B loop with low pressure)
      if (balancingLoops.length >= 1) {
        const hasPerformanceVar = variables.some((v) =>
          /performance|standard|quality|goal|target|expectation|benchmark/i.test(v),
        );
        const hasDeclineVar = variables.some((v) =>
          /decline|drift|erosion|degrade|worsen|slip|slide|compromise/i.test(v),
        );
        const conf = (hasPerformanceVar && hasDeclineVar) ? 30 : hasPerformanceVar ? 18 : 12;
        return {
          confidence: conf,
          evidence: `Structural match: ${balancingLoops.length} balancing loop(s) with self-correcting dynamics.${hasPerformanceVar ? " Performance/standard variable detected." : ""}${hasDeclineVar ? " Decline/erosion variable detected." : ""} ${hasPerformanceVar && hasDeclineVar ? "Consistent with drift-to-low-performance where the standard gradually adapts downward." : "Partial match — missing explicit performance or decline variables."}`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "growth-and-underinvestment": {
      // Structure: R loop (growth) + B loop (capacity constraint) + potential investment B loop
      if (reinforcingLoops.length >= 1 && balancingLoops.length >= 1) {
        const hasCapacityVar = variables.some((v) =>
          /capacity|investment|infrastructure|resource|capability|fund|budget/i.test(v),
        );
        const hasGrowthVar = variables.some((v) =>
          /growth|demand|pressure|load|throughput|scale/i.test(v),
        );
        const conf = (hasCapacityVar && hasGrowthVar) ? 35 : hasCapacityVar ? 20 : hasGrowthVar ? 20 : 12;
        return {
          confidence: conf,
          evidence: `Structural match: ${reinforcingLoops.length} growth-driving loop(s) + ${balancingLoops.length} limiting loop(s).${hasCapacityVar ? " Capacity/investment variable detected — suggests underinvestment dynamic." : ""}${hasGrowthVar ? " Growth/pressure variable detected." : ""} ${hasCapacityVar && hasGrowthVar ? "Consistent with growth-and-underinvestment where capacity constraints limit growth that could be resolved through investment." : "Partial match."}`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "accidental-adversaries": {
      // Structure: 2+ R loops where parties are trying to cooperate but their actions inadvertently conflict
      if (reinforcingLoops.length >= 2) {
        const sharedBetweenR = sharedVars(reinforcingLoops[0], reinforcingLoops[1]);
        const conf = sharedBetweenR.length > 0 ? 25 : 12;
        return {
          confidence: conf,
          evidence: `Structural match: ${reinforcingLoops.length} reinforcing loops${sharedBetweenR.length > 0 ? ` sharing variables: ${sharedBetweenR.join(", ")}` : ""}. Consistent with accidental-adversaries where cooperative parties' actions create unintended mutual interference.${sharedBetweenR.length === 0 ? " (partial — no shared variables between reinforcing loops)" : ""}`,
        };
      }
      return { confidence: 0, evidence: "" };
    }

    case "attractiveness": {
      // Structure: 2+ R loops competing for limited resources (similar to tragedy-of-commons but without commons depletion)
      if (reinforcingLoops.length >= 2) {
        const conf = allLoops.length >= 3 ? 20 : 10;
        return {
          confidence: conf,
          evidence: `Structural match: ${reinforcingLoops.length} reinforcing loops (growth processes) in a system with ${allLoops.length} total loops.${allLoops.length >= 3 ? " Additional balancing loops suggest resource competition between growth processes." : " Partial — no balancing loops detected to enforce resource limits."}`,
        };
      }
      return { confidence: 0, evidence: "" };
    }
  }

  return { confidence: 0, evidence: "" };
}

function generateOutput(
  problemStatement: string,
  variables: string[],
  relationships: CausalRelationship[],
  loops: FeedbackLoop[],
  leveragePoints: LeveragePoint[],
  archetypes: ArchetypeDetection[],
  epistemicStatus: EpistemicStatus,
  suggestedFollowup: SuggestedTool[],
  outputMode: OutputMode,
): string {
  const fullText = `${problemStatement} ${variables.join(" ")}`;

  const composeSection = (stepNumber: number, totalSteps: number, thoughtType: ThoughtType, previousOutputs: string[]): string => {
    return composeToolContent({
      toolName: "think_causal",
      text: fullText,
      initialPosition: problemStatement,
      mode: "analytical",
      subMode: "deductive",
      stepNumber,
      totalSteps,
      thoughtType,
      previousOutputs,
    });
  };

  const composerAttempt = composeSection(0, 5, "deconstructive", []);
  if (composerAttempt.length >= 50 && outputMode === "executive") {
    return enforceLimit(`## Causal Loop Analysis: ${problemStatement.substring(0, 80)}\n\n${composerAttempt}\n\n**Epistemic Status:** ${epistemicStatus}\n**Suggested Follow-up:** ${suggestedFollowup.join(", ")}`);
  }

  const sections: string[] = [];
  const truncatedProblem = problemStatement.length > 80 ? problemStatement.substring(0, 77) + "..." : problemStatement;

  sections.push(`## Causal Loop Analysis: ${truncatedProblem}\n`);

  if (outputMode === "executive") {
    sections.push(`### Executive Summary\n`);
    sections.push(
      `This analysis identifies ${loops.filter((l) => l.type === "reinforcing").length} reinforcing loop(s) ` +
      `and ${loops.filter((l) => l.type === "balancing").length} balancing loop(s) within a system of ` +
      `${variables.length} key variables. ${archetypes.length} systems archetype(s) detected. ` +
      `The highest-leverage intervention points are at ranks ${leveragePoints.slice(0, 3).map((lp) => lp.rank).join(", ")}.`
    );
    sections.push("");
    sections.push("### Meta-Analysis\n");
    sections.push(`**Epistemic Status:** ${epistemicStatus}`);
    sections.push(`**Suggested Follow-up:** ${suggestedFollowup.join(", ")}`);
    return enforceLimit(sections.join("\n\n"));
  }

  sections.push("### Variables\n");
  for (const variable of variables) {
    sections.push(`- **${variable}:** ${generateOperationalDefinition(variable, problemStatement)}`);
  }
  sections.push("");

  sections.push("### Causal Relationships\n");
  const relHeaders = ["From", "To", "Pol.", "Type", "Description"];
  const relRows = relationships.map((r) => [
    r.from,
    r.to,
    r.polarity,
    r.type,
    r.description.substring(0, 120),
  ]);
  sections.push(mdTable(relHeaders, relRows));
  sections.push("");

  sections.push("### Feedback Loops\n");
  for (const loop of loops) {
    sections.push(
      `**${loop.id} — ${loop.name}:** ${loop.description} Variables involved: ${loop.variables.join(" → ")}.`,
    );
    sections.push("");
  }

  sections.push("### Leverage Points (Ranked by Impact)\n");
  const lpHeaders = ["Rank", "Category", "Intervention", "Expected Impact"];
  const lpRows = leveragePoints.map((lp) => [
    `${lp.rank}`,
    LEVERAGE_POINTS[lp.category].name,
    lp.intervention.substring(0, 100),
    lp.expected_impact.substring(0, 80),
  ]);
  sections.push(mdTable(lpHeaders, lpRows));
  sections.push("");

  sections.push("### Systems Archetype Detection\n");
  const strongArchetypes = archetypes.filter(a => !a.isPartial);
  const partialArchetypes = archetypes.filter(a => a.isPartial);

  if (strongArchetypes.length === 0 && partialArchetypes.length === 0) {
    sections.push("No archetype matches detected. This may indicate a novel system structure or insufficient relationship data for archetype pattern matching.");
  } else {
    if (strongArchetypes.length > 0) {
      for (const detection of strongArchetypes) {
        sections.push(`#### ${detection.name} (${detection.archetype})`);
        sections.push(`**Structure:** ${detection.structure}`);
        sections.push(`**Evidence:** ${detection.evidence}`);
        sections.push(`**Intervention Strategy:** ${detection.intervention_strategy}`);
        sections.push("");
      }
    }

    if (partialArchetypes.length > 0) {
      sections.push("#### Partial Matches (Below Confidence Threshold)");
      sections.push("The following archetypes showed structural similarities below the primary confidence threshold (15-24) and may warrant further investigation:");
      sections.push("");
      for (const detection of partialArchetypes) {
        sections.push(`- **${detection.name}** (${detection.archetype}) — Confidence: ${detection.confidence}%`);
        sections.push(`  ${detection.evidence}`);
        sections.push("");
      }
    }
  }

  sections.push("### Meta-Analysis\n");
  sections.push(`**Epistemic Status:** ${epistemicStatus}`);
  sections.push(`**Suggested Follow-up:** ${suggestedFollowup.join(", ")}`);

  if (outputMode === "analytical" || outputMode === "exploratory") {
    sections.push("");
    sections.push(`**Analytical Notes:** This analysis was generated programmatically from ${variables.length} variables and ${relationships.length} causal relationships. ` +
      `The causal map is a simplification of a complex system and should be validated against empirical data. ` +
      `Feedback loop identification is based on graph-theoretic cycle detection and polarity counting. ` +
      `Archetype matching uses structural pattern recognition with confidence thresholds.`);
  }

  if (outputMode === "exploratory") {
    sections.push("");
    sections.push(`**Exploratory Questions for Further Investigation:**`);
    sections.push(`1. What variables are missing from this map that could significantly alter the system dynamics?`);
    sections.push(`2. Are there delays in the feedback loops that could cause oscillation or overshoot?`);
    sections.push(`3. Which balancing loops are weakest and most vulnerable to being overwhelmed by reinforcing dynamics?`);
    sections.push(`4. What paradigm-level assumptions underlie the current system structure?`);
  }

  return sections.join("\n\n");
}

function mdTable(headers: string[], rows: string[][]): string {
  const maxColWidths: number[] = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );

  const pad = (cell: string, col: number): string => {
    const w = maxColWidths[col];
    return cell.padEnd(w);
  };

  const headerLine = `| ${headers.map((h, i) => pad(h, i)).join(" | ")} |`;
  const separator = `| ${maxColWidths.map((w) => "-".repeat(w)).join(" | ")} |`;
  const bodyLines = rows.map((row) => `| ${row.map((c, i) => pad(c, i)).join(" | ")} |`);

  return [headerLine, separator, ...bodyLines].join("\n");
}

const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_causal",
    {
      title: "Causal Loop Analysis",
      description:
        "Performs causal loop analysis of a systemic problem. Maps variables and their causal relationships " +
        "with polarities (+/-), identifies reinforcing (R) and balancing (B) feedback loops, ranks intervention " +
        "points using Donella Meadows' 12 Leverage Points framework, and detects systems archetypes. " +
        "Best for understanding why interventions backfire, finding high-leverage intervention points, " +
        "and mapping circular causality.\n\n" +
        "The analysis depth controls detail level: 'essential' produces 3 relationships and 1 loop for quick " +
        "assessment, 'standard' produces 5 relationships and 2 loops for thorough analysis, and 'exhaustive' " +
        "produces 10+ relationships and 4+ loops for comprehensive examination.\n\n" +
        "Output modes tailor the report: 'executive' for leadership summaries, 'analytical' for detailed " +
        "systems analysis, and 'exploratory' for open-ended investigation with generative questions.",
      inputSchema: z
        .object({
          problem_statement: z
            .string()
            .min(20)
            .describe(
              "The systemic problem to analyze. Should describe a complex situation with interrelated factors, " +
                "not a simple technical problem. Minimum 20 characters."
            ),
          key_variables: z
            .array(z.string())
            .min(3)
            .max(12)
            .describe(
              "Key variables or factors in the system. Each should be a noun or noun phrase representing " +
                "a measurable or observable quantity. Minimum 3, maximum 12 variables."
            ),
          known_feedback_loops: z
            .string()
            .optional()
            .describe(
              "Comma-separated list of known feedback relationships, e.g. 'stress reduces performance, " +
                "performance reduces resources'. If provided, improves analysis accuracy and epistemic status."
            ),
          known_constraints: z
            .string()
            .optional()
            .describe(
              "Known system constraints or boundary conditions, e.g. 'budget is fixed at $1M per quarter, " +
                "team size cannot exceed 20'. These constrain the causal relationships generated."
            ),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard")
            .describe(
              "Controls analysis depth: 'essential' (3 relationships, 1 loop), 'standard' (5 relationships, " +
                "2 loops), 'exhaustive' (10+ relationships, 4+ loops)."
            ),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output format: 'executive' for leadership summaries, 'analytical' for detailed systems " +
                "analysis, 'exploratory' for open-ended investigation with generative questions."
            ),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          problem_statement,
          key_variables,
          known_feedback_loops,
          known_constraints,
          output_depth,
          output_mode,
        } = args;

        const relCount = depthToRelationshipCount(output_depth);
        const loopCount = depthToLoopCount(output_depth);

        // Ensure minimum 4 variables for meaningful cycle detection
        const enrichedVariables = supplementVariables(key_variables, problem_statement, 4);

        const relationships = generateCausalRelationships(
          enrichedVariables,
          problem_statement,
          known_feedback_loops,
          known_constraints,
          relCount,
        );

        const loops = detectFeedbackLoops(
          enrichedVariables,
          relationships,
          loopCount,
          problem_statement,
        );

        const leveragePoints = generateLeveragePoints(
          enrichedVariables,
          loops,
          problem_statement,
          output_depth,
        );

        const archetypes = detectArchetypes(
          enrichedVariables,
          relationships,
          loops,
          problem_statement,
        );

        const epistemicStatus = determineEpistemicStatus(output_depth, known_feedback_loops);
        const suggestedFollowup = determineFollowup(output_depth);

        const output = generateOutput(
          problem_statement,
          enrichedVariables,
          relationships,
          loops,
          leveragePoints,
          archetypes,
          epistemicStatus,
          suggestedFollowup,
          output_mode,
        );

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
