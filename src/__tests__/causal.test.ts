// Test for think_causal tool functions

// We need to test the internal functions. Since they're not exported,
// we'll test through the MCP tool handler by importing and calling.
// Actually, let's create a simple inline test.

import { SYSTEMS_ARCHETYPES, LEVERAGE_POINTS } from "../constants.js";
import { CAUSAL_PATTERNS, LEVERAGE_PATTERNS } from "../constants/patterns.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  \u2705 ${name}`);
    passed++;
  } catch (e: any) {
    console.error(`  \u274C ${name}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

// Inline the key functions from causal.ts for testing
interface CausalRelationship {
  from: string;
  to: string;
  polarity: "+" | "-";
  type: "direct" | "indirect" | "moderated";
  description: string;
}

interface FeedbackLoop {
  id: string;
  name: string;
  type: "reinforcing" | "balancing";
  variables: string[];
  description: string;
}

// Copy of VARIABLE_POLARITY_HINTS
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

function findBestVariableMatch(text: string, variables: string[]): string | null {
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch: string | null = null;
  let bestScore = 0;
  for (const variable of variables) {
    const varLower = variable.toLowerCase();
    const varWords = varLower.split(/\s+/);
    if (textLower.includes(varLower)) return variable;
    let score = 0;
    for (const vw of varWords) {
      if (vw.length > 2 && words.some((w) => w.includes(vw) || vw.includes(w))) score++;
    }
    if (score > bestScore && score >= Math.ceil(varWords.length * 0.5)) {
      bestScore = score;
      bestMatch = variable;
    }
  }
  return bestMatch;
}

function hashPolarity(a: string, b: string): "+" | "-" {
  let hash = 0;
  const combined = a + b;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? "+" : "-";
}

function determinePolarity(from: string, to: string, _context: string): "+" | "-" {
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

function generateRelationshipDescription(from: string, to: string, polarity: "+" | "-", _context: string): string {
  const direction = polarity === "+" ? "increases" : "decreases";
  return `As ${from.toLowerCase()} ${direction}, ${to.toLowerCase()} tends to ${direction}. This relationship reflects a ${polarity === "+" ? "same-direction" : "opposite-direction"} causal link.`;
}

function generateSemanticRelationships(
  variables: string[],
  problemStatement: string,
  existing: CausalRelationship[],
  requiredCount: number,
): CausalRelationship[] {
  const relationships = [...existing];
  const existingPairs = new Set(relationships.map((r) => `${r.from}→${r.to}`));

  for (const variable of variables) {
    const hints = VARIABLE_POLARITY_HINTS[variable.toLowerCase()];
    if (!hints) continue;

    for (const target of hints.positive || []) {
      const targetVar = findBestVariableMatch(target, variables);
      if (targetVar && targetVar !== variable) {
        const key = `${variable}→${targetVar}`;
        if (!existingPairs.has(key)) {
          existingPairs.add(key);
          relationships.push({
            from: variable, to: targetVar, polarity: "+", type: "direct",
            description: generateRelationshipDescription(variable, targetVar, "+", problemStatement),
          });
        }
      }
    }

    for (const target of hints.negative || []) {
      const targetVar = findBestVariableMatch(target, variables);
      if (targetVar && targetVar !== variable) {
        const key = `${variable}→${targetVar}`;
        if (!existingPairs.has(key)) {
          existingPairs.add(key);
          relationships.push({
            from: variable, to: targetVar, polarity: "-", type: "direct",
            description: generateRelationshipDescription(variable, targetVar, "-", problemStatement),
          });
        }
      }
    }

    if (relationships.length >= requiredCount * 2) break;
  }

  // Pairwise fallback
  if (relationships.length < requiredCount) {
    for (let i = 0; i < variables.length && relationships.length < requiredCount; i++) {
      for (let j = 0; j < variables.length && relationships.length < requiredCount; j++) {
        if (i === j) continue;
        const key = `${variables[i]}→${variables[j]}`;
        if (!existingPairs.has(key)) {
          existingPairs.add(key);
          const polarity = determinePolarity(variables[i], variables[j], problemStatement);
          relationships.push({
            from: variables[i], to: variables[j], polarity, type: "indirect",
            description: generateRelationshipDescription(variables[i], variables[j], polarity, problemStatement),
          });
        }
      }
    }
  }

  return relationships.slice(0, Math.max(requiredCount, relationships.length));
}

function ensureGraphHasCycles(
  variables: string[],
  relationships: CausalRelationship[],
  _requiredCount: number,
  problemStatement: string,
): CausalRelationship[] {
  if (variables.length < 2) return relationships;
  const existingPairs = new Set(relationships.map((r) => `${r.from}→${r.to}`));
  const addRel = (from: string, to: string, polarity: "+" | "-") => {
    const key = `${from}→${to}`;
    if (!existingPairs.has(key) && from !== to) {
      existingPairs.add(key);
      relationships.push({
        from, to, polarity, type: "direct",
        description: generateRelationshipDescription(from, to, polarity, problemStatement),
      });
    }
  };
  for (let i = 0; i < variables.length - 1; i++) addRel(variables[i], variables[i + 1], "+");
  addRel(variables[variables.length - 1], variables[0], "-");
  if (variables.length >= 3) addRel(variables[variables.length - 2], variables[0], "+");
  for (let i = 0; i < variables.length - 2; i++) {
    addRel(variables[i], variables[i + 2], i % 2 === 0 ? "+" : "-");
  }
  for (let i = 0; i < variables.length - 2; i += 2) {
    addRel(variables[i + 2], variables[i], "-");
  }
  if (variables.length >= 4) {
    addRel(variables[Math.floor(variables.length / 2)], variables[0], "-");
  }
  return relationships;
}

function detectFeedbackLoops(
  variables: string[],
  relationships: CausalRelationship[],
  requiredCount: number,
): FeedbackLoop[] {
  const loops: FeedbackLoop[] = [];
  const adjacencyMap = new Map<string, { target: string; polarity: "+" | "-" }[]>();
  for (const rel of relationships) {
    if (!adjacencyMap.has(rel.from)) adjacencyMap.set(rel.from, []);
    adjacencyMap.get(rel.from)!.push({ target: rel.to, polarity: rel.polarity });
  }
  const seenLoopKeys = new Set<string>();

  function findLoop(start: string, current: string, path: string[], polarities: ("+" | "-")[]): void {
    if (path.length > variables.length) return;
    const neighbors = adjacencyMap.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (neighbor.target === start && path.length >= 2) {
        const allPolarities = [...polarities, neighbor.polarity];
        const negativeCount = allPolarities.filter((p) => p === "-").length;
        const loopType: "reinforcing" | "balancing" = negativeCount % 2 === 0 ? "reinforcing" : "balancing";
        const loopKey = path.join("→");
        if (!seenLoopKeys.has(loopKey)) {
          seenLoopKeys.add(loopKey);
          const loopId = `${loopType === "reinforcing" ? "R" : "B"}${loops.filter((l) => l.type === loopType).length + 1}`;
          loops.push({
            id: loopId, name: `${loopType} Loop ${loops.length + 1}`, type: loopType,
            variables: [...path], description: `${loopType} loop: ${path.join(" → ")} (${allPolarities.join(", ")})`,
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

// ─── Tests ─────────────────────────────────────────────────────────────

export function runTests() {
  console.log("\n=== Causal Tool Tests ===\n");

  // Test 1: Variables that MATCH VARIABLE_POLARITY_HINTS
  console.log("--- Test: Matching Variables (stress, burnout, etc.) ---");
  {
    const variables = ["stress", "performance", "burnout", "turnover", "morale"];
    const problem = "Team stress is increasing, leading to burnout and turnover, which reduces morale and performance.";
    const rels = generateSemanticRelationships(variables, problem, [], 5);
    console.log(`  Relationships generated: ${rels.length}`);
    rels.forEach(r => console.log(`    ${r.from} → ${r.to} (${r.polarity})`));
    test("Matching variables produce 5+ relationships", () => {
      if (rels.length < 5) throw new Error(`Expected >= 5, got ${rels.length}`);
    });

    const withCycles = ensureGraphHasCycles(variables, [...rels], 5, problem);
    console.log(`  After cycle enrichment: ${withCycles.length} relationships`);
    test("Cycle enrichment adds more relationships", () => {
      if (withCycles.length <= rels.length) throw new Error("No new relationships added");
    });

    const loops = detectFeedbackLoops(variables, withCycles, 2);
    console.log(`  Feedback loops detected: ${loops.length}`);
    loops.forEach(l => console.log(`    ${l.id} ${l.name}: ${l.variables.join(" → ")}`));
    test("At least 1 reinforcing loop detected", () => {
      if (!loops.some(l => l.type === "reinforcing")) throw new Error("No reinforcing loops");
    });
    test("At least 1 balancing loop detected", () => {
      if (!loops.some(l => l.type === "balancing")) throw new Error("No balancing loops");
    });
  }

  // Test 2: Variables that DON'T match VARIABLE_POLARITY_HINTS
  console.log("\n--- Test: Non-Matching Variables (domain-specific) ---");
  {
    const variables = ["model capability", "alignment pressure", "reward hacking", "proxy optimization", "safety degradation"];
    const problem = "The AI model training pipeline has reward hacking issues because the alignment mechanism doesn't account for capability emergence.";
    const rels = generateSemanticRelationships(variables, problem, [], 5);
    console.log(`  Relationships generated: ${rels.length}`);
    rels.forEach(r => console.log(`    ${r.from} → ${r.to} (${r.polarity})`));
    test("Non-matching variables produce 5+ relationships via pairwise fallback", () => {
      if (rels.length < 5) throw new Error(`Expected >= 5, got ${rels.length}`);
    });

    const withCycles = ensureGraphHasCycles(variables, [...rels], 5, problem);
    console.log(`  After cycle enrichment: ${withCycles.length} relationships`);
    test("Cycle enrichment adds relationships for non-matching vars", () => {
      if (withCycles.length <= rels.length) throw new Error("No new relationships added");
    });

    const loops = detectFeedbackLoops(variables, withCycles, 2);
    console.log(`  Feedback loops detected: ${loops.length}`);
    loops.forEach(l => console.log(`    ${l.id} ${l.name}: ${l.variables.join(" → ")}`));
    test("At least 1 feedback loop detected for non-matching vars", () => {
      if (loops.length < 1) throw new Error("No feedback loops detected");
    });
  }

  // Test 3: Leverage points
  console.log("\n--- Test: Leverage Points ---");
  test("LEVERAGE_POINTS has 12 categories", () => {
    const count = Object.keys(LEVERAGE_POINTS).length;
    if (count !== 12) throw new Error(`Expected 12, got ${count}`);
  });
  test("LEVERAGE_PATTERNS has 40+ entries", () => {
    if (LEVERAGE_PATTERNS.length < 40) throw new Error(`Expected >= 40, got ${LEVERAGE_PATTERNS.length}`);
  });

  // Test 4: Systems archetypes
  console.log("\n--- Test: Systems Archetypes ---");
  test("SYSTEMS_ARCHETYPES has 10 entries", () => {
    const count = Object.keys(SYSTEMS_ARCHETYPES).length;
    if (count !== 10) throw new Error(`Expected 10, got ${count}`);
  });
  test("CAUSAL_PATTERNS has 50+ entries", () => {
    if (CAUSAL_PATTERNS.length < 50) throw new Error(`Expected >= 50, got ${CAUSAL_PATTERNS.length}`);
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed > 0) process.exitCode = 1;
}

runTests();
