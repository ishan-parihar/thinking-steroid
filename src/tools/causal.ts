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
} from "../types.js";
import { SYSTEMS_ARCHETYPES, LEVERAGE_POINTS } from "../constants.js";

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

function generateCausalRelationships(
  variables: string[],
  problemContext: string,
  knownFeedbackLoops?: string,
  knownConstraints?: string,
  requiredCount?: number,
): CausalRelationship[] {
  const relationships: CausalRelationship[] = [];
  const count = requiredCount ?? 5;
  const parsedKnownLoops = knownFeedbackLoops
    ? knownFeedbackLoops.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const relationshipTemplates: Record<string, { polarity: CausalPolarity; type: "direct" | "indirect" | "moderated"; description: string }[]> = {};

  for (let i = 0; i < variables.length; i++) {
    for (let j = 0; j < variables.length; j++) {
      if (i === j) continue;
      const key = `${variables[i]}→${variables[j]}`;
      const polarity = determinePolarity(variables[i], variables[j], problemContext);
      const relType = determineRelationshipType(variables[i], variables[j], parsedKnownLoops);
      const description = generateRelationshipDescription(variables[i], variables[j], polarity, problemContext, knownConstraints);

      relationships.push({
        from: variables[i],
        to: variables[j],
        polarity,
        type: relType,
        description,
      });
    }
  }

  return relationships.slice(0, Math.min(count, relationships.length));
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

  const visited = new Set<string>();

  function findLoop(start: string, current: string, path: string[], polarities: CausalPolarity[]): void {
    if (path.length > variables.length) return;

    const neighbors = adjacencyMap.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (neighbor.target === start && path.length >= 2) {
        const allPolarities = [...polarities, neighbor.polarity];
        const negativeCount = allPolarities.filter((p) => p === "-").length;
        const loopType: CausalLoopType = negativeCount % 2 === 0 ? "reinforcing" : "balancing";

        const loopKey = [...path].sort().join("-");
        if (!visited.has(loopKey)) {
          visited.add(loopKey);
          const loopName = generateLoopName(loopType, path, problemContext);
          loops.push({
            id: `${loopType === "reinforcing" ? "R" : "B"}${loops.filter((l) => l.type === loopType).length + 1}`,
            name: loopName,
            type: loopType,
            variables: [...path],
            description: generateLoopDescription(loopType, path, allPolarities, problemContext),
          });
        }
      } else if (!path.includes(neighbor.target) && path.length < variables.length) {
        findLoop(start, neighbor.target, [...path, neighbor.target], [...polarities, neighbor.polarity]);
      }
    }
  }

  for (const variable of variables) {
    findLoop(variable, variable, [variable], []);
    if (loops.length >= requiredCount * 2) break;
  }

  return loops.slice(0, requiredCount);
}

function generateLoopName(type: CausalLoopType, variables: string[], context: string): string {
  const contextLower = context.toLowerCase();

  if (type === "reinforcing") {
    if (contextLower.includes("growth") || contextLower.includes("expand")) return "Growth Engine";
    if (contextLower.includes("decline") || contextLower.includes("collapse")) return "Decline Spiral";
    if (contextLower.includes("trust")) return "Trust Accumulation";
    if (contextLower.includes("stress") || contextLower.includes("burnout")) return "Stress Amplification";
    if (contextLower.includes("success")) return "Success Momentum";
    if (contextLower.includes("innovation")) return "Innovation Flywheel";
    return "Virtuous Cycle";
  }

  if (contextLower.includes("balance") || contextLower.includes("equilibrium")) return "Equilibrium Seeker";
  if (contextLower.includes("stress") || contextLower.includes("burnout")) return "Burnout Brake";
  if (contextLower.includes("resource")) return "Resource Limiter";
  if (contextLower.includes("quality")) return "Quality Gatekeeper";
  return "Stabilizing Force";
}

function generateLoopDescription(
  type: CausalLoopType,
  variables: string[],
  _polarities: CausalPolarity[],
  _context: string,
): string {
  const varList = variables.map((v) => v.toLowerCase()).join(" → ");

  if (type === "reinforcing") {
    return `This reinforcing loop creates self-amplifying dynamics: changes in ${varList} feed back to magnify the initial change. Each cycle through the loop compounds the effect, leading to exponential growth or accelerating decline depending on the initial direction. Left unchecked, this loop will drive the system toward an extreme state.`;
  }

  return `This balancing loop creates self-correcting dynamics: as ${varList} shifts, the loop generates counter-pressure that resists further change in the same direction. This loop acts as the system's thermostat, maintaining stability by opposing deviations from a target state. It is the primary source of resistance to change interventions.`;
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

  for (const category of allCategories) {
    const lp = LEVERAGE_POINTS[category];
    const intervention = generateIntervention(category, variables, loops, problemContext);
    const impact = generateImpactDescription(category, variables, problemContext);

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
): string {
  const lp = LEVERAGE_POINTS[category];
  const actionability = lp.actionability;

  if (lp.rank <= 4) {
    return `Transformative — changes the fundamental nature of the system. High difficulty to implement, requires deep structural or cultural shift. Effects cascade through all ${variables.length} identified variables.`;
  }
  if (lp.rank <= 7) {
    return `Significant — alters the dynamics of key feedback loops. Moderate difficulty, requires changes to information architecture or loop structure. Most effective when combined with goal-level interventions.`;
  }
  return `Incremental — produces measurable but limited change. ${actionability === "high" ? "Relatively easy to implement" : "Moderate implementation difficulty"}, but effects are often temporary if higher-leverage points are not also addressed.`;
}

function detectArchetypes(
  variables: string[],
  relationships: CausalRelationship[],
  loops: FeedbackLoop[],
  problemContext: string,
): ArchetypeDetection[] {
  const detections: ArchetypeDetection[] = [];
  const reinforcingLoops = loops.filter((l) => l.type === "reinforcing");
  const balancingLoops = loops.filter((l) => l.type === "balancing");

  for (const [archetypeKey, archetype] of Object.entries(SYSTEMS_ARCHETYPES)) {
    const key = archetypeKey as SystemsArchetype;
    const match = evaluateArchetypeMatch(key, archetype, variables, relationships, loops, problemContext);
    if (match) {
      detections.push(match);
    }
  }

  return detections.sort((a, b) => b.evidence.length - a.evidence.length).slice(0, 3);
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

  let evidence = "";
  let confidence = 0;

  switch (key) {
    case "fixes-that-fail":
      if (balancingLoops.length >= 1 && reinforcingLoops.length >= 1) {
        confidence += 30;
        evidence = `System exhibits both balancing loops (${balancingLoops.map((l) => l.name).join(", ")}) and reinforcing loops (${reinforcingLoops.map((l) => l.name).join(", ")}), consistent with the B-R-B structure of fixes-that-fail.`;
      }
      if (contextLower.includes("quick fix") || contextLower.includes("short-term") || contextLower.includes("temporary")) {
        confidence += 30;
        evidence += ` Problem context references short-term solutions or quick fixes.`;
      }
      break;

    case "shifting-the-burden":
      if (balancingLoops.length >= 2) {
        confidence += 25;
        evidence = `Multiple balancing loops detected (${balancingLoops.length}), suggesting dependency on symptomatic solutions.`;
      }
      if (contextLower.includes("dependency") || contextLower.includes("external") || contextLower.includes("support")) {
        confidence += 25;
        evidence += ` Context suggests reliance on external support or symptomatic interventions.`;
      }
      break;

    case "limits-to-growth":
      if (reinforcingLoops.length >= 1 && balancingLoops.length >= 1) {
        confidence += 30;
        evidence = `Presence of both growth-driving reinforcing loop(s) and limiting balancing loop(s) matches the R-B structure.`;
      }
      if (contextLower.includes("growth") || contextLower.includes("limit") || contextLower.includes("constraint") || contextLower.includes("plateau")) {
        confidence += 30;
        evidence += ` Context explicitly mentions growth, limits, or constraints.`;
      }
      break;

    case "tragedy-of-the-commons":
      if (reinforcingLoops.length >= 2) {
        confidence += 25;
        evidence = `Multiple reinforcing loops suggest individual actors independently optimizing their own gains.`;
      }
      if (contextLower.includes("shared") || contextLower.includes("common") || contextLower.includes("resource") || contextLower.includes("compete")) {
        confidence += 30;
        evidence += ` Context involves shared resources or competition among actors.`;
      }
      break;

    case "escalation":
      if (reinforcingLoops.length >= 2) {
        confidence += 35;
        evidence = `Two or more reinforcing loops create the R-R structure characteristic of mutual escalation.`;
      }
      if (contextLower.includes("competition") || contextLower.includes("rival") || contextLower.includes("arms race") || contextLower.includes("escalat")) {
        confidence += 30;
        evidence += ` Context explicitly describes competitive or adversarial dynamics.`;
      }
      break;

    case "success-to-the-successful":
      if (reinforcingLoops.length >= 2) {
        confidence += 30;
        evidence = `Multiple reinforcing loops with resource competition create winner-take-all dynamics.`;
      }
      if (contextLower.includes("resource") || contextLower.includes("allocation") || contextLower.includes("winner") || contextLower.includes("unequal")) {
        confidence += 25;
        evidence += ` Context involves resource allocation or unequal outcomes.`;
      }
      break;

    case "drift-to-low-performance":
      if (balancingLoops.length >= 1) {
        confidence += 25;
        evidence = `Balancing loop structure consistent with gradual standard erosion.`;
      }
      if (contextLower.includes("decline") || contextLower.includes("drift") || contextLower.includes("standard") || contextLower.includes("mediocre")) {
        confidence += 30;
        evidence += ` Context suggests gradual decline or lowering of standards.`;
      }
      break;

    case "growth-and-underinvestment":
      if (reinforcingLoops.length >= 1 && balancingLoops.length >= 1) {
        confidence += 25;
        evidence = `Growth loop paired with balancing loop suggests capacity constraints.`;
      }
      if (contextLower.includes("investment") || contextLower.includes("capacity") || contextLower.includes("infrastructure") || contextLower.includes("underinvest")) {
        confidence += 30;
        evidence += ` Context references investment, capacity, or infrastructure concerns.`;
      }
      break;

    case "accidental-adversaries":
      if (reinforcingLoops.length >= 2) {
        confidence += 25;
        evidence = `Multiple reinforcing loops suggest unintended adversarial dynamics between cooperative parties.`;
      }
      if (contextLower.includes("partner") || contextLower.includes("cooperat") || contextLower.includes("alliance") || contextLower.includes("misunderstand")) {
        confidence += 30;
        evidence += ` Context involves partnerships or cooperative relationships with emerging friction.`;
      }
      break;

    case "attractiveness":
      if (reinforcingLoops.length >= 2) {
        confidence += 25;
        evidence = `Multiple growth processes competing for limited resources matches the attractiveness structure.`;
      }
      if (contextLower.includes("multiple") || contextLower.includes("option") || contextLower.includes("attract") || contextLower.includes("spread thin")) {
        confidence += 25;
        evidence += ` Context suggests multiple competing initiatives or options.`;
      }
      break;
  }

  if (confidence >= 40) {
    return {
      archetype: key,
      name: archetype.name,
      structure: archetype.structure,
      evidence: evidence.trim(),
      intervention_strategy: archetype.intervention_strategy,
    };
  }

  return null;
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
    const tag = loop.type === "reinforcing" ? "R" : "B";
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
  if (archetypes.length === 0) {
    sections.push("No strong archetype matches detected with current confidence threshold. This may indicate a novel system structure or insufficient relationship data for archetype pattern matching.");
  } else {
    for (const detection of archetypes) {
      sections.push(`#### ${detection.name} (${detection.archetype})`);
      sections.push(`**Structure:** ${detection.structure}`);
      sections.push(`**Evidence:** ${detection.evidence}`);
      sections.push(`**Intervention Strategy:** ${detection.intervention_strategy}`);
      sections.push("");
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

        const relationships = generateCausalRelationships(
          key_variables,
          problem_statement,
          known_feedback_loops,
          known_constraints,
          relCount,
        );

        const loops = detectFeedbackLoops(
          key_variables,
          relationships,
          loopCount,
          problem_statement,
        );

        const leveragePoints = generateLeveragePoints(
          key_variables,
          loops,
          problem_statement,
          output_depth,
        );

        const archetypes = detectArchetypes(
          key_variables,
          relationships,
          loops,
          problem_statement,
        );

        const epistemicStatus = determineEpistemicStatus(output_depth, known_feedback_loops);
        const suggestedFollowup = determineFollowup(output_depth);

        const output = generateOutput(
          problem_statement,
          key_variables,
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
