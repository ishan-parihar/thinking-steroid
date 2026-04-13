import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { OutputDepth, PolarityThinkingInput, SystemsArchetype, EpistemicStatus, SuggestedTool, OutputMode } from "../types.js";
import {
  INTEGRATION_SPECTRUM_ROWS,
  INTEGRATION_SPECTRUM_LEVELS,
  SYSTEMS_ARCHETYPES,
} from "../constants.js";
import { formatPolarityMap } from "../utils/formatters.js";
import { composeToolContent, getStructureForText } from "../utils/content-pipeline.js";
import type { ThoughtType } from "../types.js";

// ─── Tool Annotations ────────────────────────────────────────────────────────

const TOOL_ANNOTATIONS = {
  readOnlyHint: true as const,
  destructiveHint: false as const,
  idempotentHint: true as const,
  openWorldHint: false as const,
};

// ─── Depth Configuration ─────────────────────────────────────────────────────

interface DepthConfig {
  minAnalysisDepth: number;
  includeExamples: boolean;
  includeMetaReflection: boolean;
  spectrumDetail: "summary" | "detailed" | "comprehensive";
}

const DEPTH_CONFIGS: Record<OutputDepth, DepthConfig> = {
  essential: {
    minAnalysisDepth: 1,
    includeExamples: false,
    includeMetaReflection: false,
    spectrumDetail: "summary",
  },
  standard: {
    minAnalysisDepth: 2,
    includeExamples: true,
    includeMetaReflection: true,
    spectrumDetail: "detailed",
  },
  exhaustive: {
    minAnalysisDepth: 3,
    includeExamples: true,
    includeMetaReflection: true,
    spectrumDetail: "comprehensive",
  },
};

// ─── Composer Context ────────────────────────────────────────────────────────

interface PolarityComposerContext {
  fullText: string;
  initialPosition: string;
  outputMode: OutputMode;
}

// ─── Polarity Analysis Generator ─────────────────────────────────────────────

/**
 * Generates the 9-row polarity map analysis for a given tension.
 */
function generatePolarityAnalysis(
  input: PolarityThinkingInput & { output_depth: OutputDepth },
  composerCtx?: PolarityComposerContext
): Record<string, { a: string; b: string }> {
  const {
    pole_a,
    pole_b,
    domain,
    current_position,
    desired_outcome,
  } = input;
  const config = DEPTH_CONFIGS[input.output_depth];

  const analysis: Record<string, { a: string; b: string }> = {};

  // 1. Rewards of Focus
  analysis["Rewards of Focus"] = {
    a: generateRewardsOfFocus(
      pole_a, pole_b, domain, current_position, "a", config, composerCtx, 1, 9
    ),
    b: generateRewardsOfFocus(
      pole_a, pole_b, domain, current_position, "b", config, composerCtx, 2, 9
    ),
  };

  // 2. Overemphasis Feedback
  analysis["Overemphasis Feedback"] = {
    a: generateOveremphasisFeedback(pole_a, domain, "a", config, composerCtx, 3, 9),
    b: generateOveremphasisFeedback(pole_b, domain, "b", config, composerCtx, 4, 9),
  };

  // 3. Neglect Risks
  analysis["Neglect Risks"] = {
    a: generateNeglectRisks(pole_a, pole_b, domain, "a", config, composerCtx, 5, 9),
    b: generateNeglectRisks(pole_b, pole_a, domain, "b", config, composerCtx, 6, 9),
  };

  // 4. Circular Causal Loops
  analysis["Circular Causal Loops"] = {
    a: generateCircularCausalLoop(pole_a, pole_b, domain, "a-fuels-b", config, composerCtx, 7, 9),
    b: generateCircularCausalLoop(pole_b, pole_a, domain, "b-fuels-a", config, composerCtx, 8, 9),
  };

  // 5. Balkanization Risks
  analysis["Balkanization Risks"] = {
    a: generateBalkanizationRisk(pole_a, pole_b, domain, "a", config, composerCtx, 9, 9),
    b: generateBalkanizationRisk(pole_b, pole_a, domain, "b", config, composerCtx, 10, 9),
  };

  // 6. Extremity Feedback
  analysis["Extremity Feedback"] = {
    a: generateExtremityFeedback(pole_a, domain, current_position, "a", config, composerCtx, 11, 9),
    b: generateExtremityFeedback(pole_b, domain, current_position, "b", config, composerCtx, 12, 9),
  };

  // 7. Transcendence Rewards
  analysis["Transcendence Rewards"] = {
    a: generateTranscendenceReward(pole_a, pole_b, domain, desired_outcome, "a", config, composerCtx, 13, 9),
    b: generateTranscendenceReward(pole_b, pole_a, domain, desired_outcome, "b", config, composerCtx, 14, 9),
  };

  // 8. Reflection Loops
  analysis["Reflection Loops"] = {
    a: generateReflectionLoop(pole_a, domain, "a", config, composerCtx, 15, 9),
    b: generateReflectionLoop(pole_b, domain, "b", config, composerCtx, 16, 9),
  };

  // 9. Meta-Reflection Process
  analysis["Meta-Reflection Process"] = {
    a: generateMetaReflection(pole_a, pole_b, domain, current_position, "meta-perspective", config, composerCtx, 17, 9),
    b: generateMetaReflection(pole_a, pole_b, domain, current_position, "system-integration", config, composerCtx, 18, 9),
  };

  return analysis;
}

function generateRewardsOfFocus(
  pole: string,
  oppositePole: string,
  domain: string,
  currentPosition: string,
  side: "a" | "b",
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "diagnostic";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const focusDescription =
    side === "a"
      ? `When ${pole} is emphasized in the context of ${domain}`
      : `When ${pole} receives focused attention within ${domain}`;

  const base = `${focusDescription}, the system gains distinct advantages. The primary reward is the deepening of ${pole.toLowerCase()}-specific capacities — the skills, insights, and structural benefits that accrue when ${pole.toLowerCase()} is cultivated as a primary value. In the ${domain} domain, this manifests as enhanced ability to leverage ${pole.toLowerCase()} as a strategic asset. Current positioning ("${currentPosition}") suggests the system is ${getPositionRelation(currentPosition, side === "a" ? "aligned" : "divergent")} with this pole's potential.`;

  if (config.includeExamples) {
    return `${base}\n\nConcrete manifestations include: (1) the development of domain-specific competencies that are only accessible through sustained commitment to ${pole.toLowerCase()}, (2) the creation of feedback loops that reinforce ${pole.toLowerCase()}-aligned behaviors, and (3) the emergence of identity coherence for stakeholders who identify strongly with ${pole.toLowerCase()}. The cost of this focus is the opportunity cost of not developing the complementary capacities of ${oppositePole.toLowerCase()}.`;
  }

  return base;
}

function generateOveremphasisFeedback(
  pole: string,
  domain: string,
  _side: "a" | "b",
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "diagnostic";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const base = `Early warning signs that ${pole} is being overdone in the ${domain} context include: the emergence of diminishing returns where additional investment in ${pole.toLowerCase()} yields progressively smaller benefits, the appearance of resistance or backlash from stakeholders who experience ${pole.toLowerCase()} as oppressive or constraining, and the gradual erosion of the complementary capacities that ${pole.toLowerCase()} depends on but does not itself generate.`;

  if (config.minAnalysisDepth >= 2) {
    return `${base}\n\nThese feedback signals are the system's self-correcting mechanism — nature's way of indicating that the natural oscillation between poles has been disrupted. The overemphasis feedback is particularly insidious because it often masquerades as "more of what works" — the system doubles down on the strategy that has been successful, unaware that the context has shifted and the marginal value of additional ${pole.toLowerCase()} is declining.`;
  }

  return base;
}

function generateNeglectRisks(
  neglectedPole: string,
  dominantPole: string,
  domain: string,
  _side: "a" | "b",
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "diagnostic";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const base = `When ${neglectedPole} is underfocused in favor of ${dominantPole} within ${domain}, the system incurs specific and predictable risks. The neglected pole does not simply remain static — it atrophies, creating a structural deficit that becomes increasingly costly to remediate. In the ${domain} domain, this manifests as growing blind spots that ${neglectedPole.toLowerCase()} would have illuminated, stakeholder alienation among those who need ${neglectedPole.toLowerCase()} to thrive, and the accumulation of "debt" in the neglected domain.`;

  if (config.includeExamples) {
    return `${base}\n\nSpecific risks include: (1) the development of compensatory pathologies where the system overcompensates for the absence of ${neglectedPole.toLowerCase()} through increasingly extreme expressions of ${dominantPole.toLowerCase()}, (2) the loss of talent and engagement from stakeholders whose strengths lie in the ${neglectedPole.toLowerCase()} domain, and (3) the creation of systemic fragility — the system becomes unable to respond to challenges that require ${neglectedPole.toLowerCase()}-specific capacities.`;
  }

  return base;
}

function generateCircularCausalLoop(
  sourcePole: string,
  targetPole: string,
  domain: string,
  direction: string,
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "relational";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const source = sourcePole;
  const target = targetPole;

  const base = `The ${source} → ${target} dynamic in the ${domain} context reveals how ${source.toLowerCase()} naturally generates conditions that support and strengthen ${target.toLowerCase()}. This is not a contradiction but a feature of genuine polarities: each pole, when well-developed, creates the foundation upon which the other can flourish. Specifically, the cultivation of ${source.toLowerCase()} produces surplus capacity, stability, or resources that can be invested in developing ${target.toLowerCase()}.`;

  if (config.minAnalysisDepth >= 2) {
    return `${base}\n\nThis circular causality operates through several mechanisms: (1) the maturation of ${source.toLowerCase()} creates confidence and security that makes exploration of ${target.toLowerCase()} feel safe rather than threatening, (2) the skills developed through ${source.toLowerCase()} practice transfer to ${target.toLowerCase()} in non-obvious ways, and (3) the stakeholders who benefit from ${source.toLowerCase()} become advocates for the balanced development that includes ${target.toLowerCase()}. Breaking this loop by suppressing either pole starves both.`;
  }

  return base;
}

function generateBalkanizationRisk(
  pole: string,
  oppositePole: string,
  domain: string,
  _side: "a" | "b",
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "perspectival";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const base = `When the ${domain} system fragments into "${pole.toLowerCase()}-only" factions, the result is a balkanized landscape where stakeholders sort themselves into camps that exclusively champion ${pole.toLowerCase()} while demonizing ${oppositePole.toLowerCase()}. This fragmentation destroys the system's capacity for polarity management by converting a dynamic tension into a political conflict. Each faction develops its own vocabulary, metrics, and criteria for success that are incommensurate with the other faction's.`;

  if (config.includeExamples) {
    return `${base}\n\nIn the ${domain} context, balkanization typically manifests as: organizational silos where ${pole.toLowerCase()}-oriented teams refuse to collaborate with ${oppositePole.toLowerCase()}-oriented teams, hiring practices that select exclusively for ${pole.toLowerCase()} aptitude while screening out ${oppositePole.toLowerCase()} strengths, and reward systems that incentivize ${pole.toLowerCase()} at the expense of ${oppositePole.toLowerCase()}. The eventual outcome is a system that has optimized one pole so thoroughly that it has lost the capacity to access the other, rendering it vulnerable to environmental changes that require the neglected pole.`;
  }

  return base;
}

function generateExtremityFeedback(
  pole: string,
  domain: string,
  currentPosition: string,
  _side: "a" | "b",
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "diagnostic";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const base = `Signs that ${pole} has become extreme in the ${domain} context include: the transformation of ${pole.toLowerCase()} from a value into an ideology — a closed system of belief that resists correction from evidence or feedback, the experience of stakeholders who feel that the system has become "too much" of ${pole.toLowerCase()} to the point of dysfunction, and the emergence of counter-movements or resistance that explicitly organize around the need to restore ${pole.toLowerCase()}'s opposite. The system's current position ("${currentPosition}") should be evaluated against these extremity markers to assess whether ${pole.toLowerCase()} has crossed from healthy expression into pathological excess.`;

  if (config.minAnalysisDepth >= 2) {
    return `${base}\n\nThe extremity feedback is particularly important because it represents the system's immune response to imbalance. Unlike the overemphasis feedback (which warns of diminishing returns), extremity feedback signals that the pole has become actively harmful — that the system is not merely missing opportunities on the other side but is actively damaging itself through the excessive expression of this pole. In ${domain}, this often looks like the weaponization of ${pole.toLowerCase()} — using it not as a value to be cultivated but as a weapon to suppress legitimate expressions of the opposite pole.`;
  }

  return base;
}

function generateTranscendenceReward(
  pole: string,
  oppositePole: string,
  domain: string,
  desiredOutcome: string,
  _side: "a" | "b",
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "synthetic";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const base = `When ${pole} is well-integrated with ${oppositePole} in the ${domain} context — rather than being emphasized at ${oppositePole}'s expense — the system achieves a qualitatively different level of functioning. This is the reward of transcendence: not the compromise of both poles but the emergence of capacities that are only available when both poles are simultaneously honored and actively managed. The desired outcome ("${desiredOutcome}") likely requires this transcendent integration rather than the maximization of either pole alone.`;

  if (config.includeExamples) {
    return `${base}\n\nSpecific transcendent benefits in the ${domain} context include: (1) the development of "both/and" thinking that can hold ${pole.toLowerCase()} and ${oppositePole.toLowerCase()} as complementary rather than contradictory, (2) the creation of structural arrangements that institutionalize oscillation between poles rather than freezing on one, and (3) the cultivation of leadership that can articulate the value of both poles and manage the tension between them without premature resolution. This is the difference between "managing" a polarity and "transcending" it — the former maintains the tension productively, the latter transforms the system so that the tension becomes generative rather than merely manageable.`;
  }

  return base;
}

function generateReflectionLoop(
  pole: string,
  domain: string,
  _side: "a" | "b",
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "perspectival";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const base = `The ${pole} reflection loop invites the system to examine its own relationship with ${pole.toLowerCase()} in the ${domain} context: Are we cultivating ${pole.toLowerCase()} because it is genuinely valuable, or because it has become a default that we have stopped questioning? What assumptions about ${pole.toLowerCase()} are we making that deserve examination? How might our current expression of ${pole.toLowerCase()} be serving some stakeholders while marginalizing others? This meta-level reflection prevents the pole from becoming an unexamined dogma and keeps the system's engagement with ${pole.toLowerCase()} fresh, contextual, and responsive to changing conditions.`;

  if (config.minAnalysisDepth >= 2) {
    return `${base}\n\nEffective reflection on ${pole} in the ${domain} context requires: (1) creating dedicated space for stakeholders to voice their experience of how ${pole.toLowerCase()} is being expressed, (2) regularly reviewing the metrics used to evaluate ${pole.toLowerCase()} to ensure they capture its full value and not just its most easily measured aspects, and (3) periodically conducting "pre-mortem" analyses that imagine the ways in which our current approach to ${pole.toLowerCase()} might be setting us up for future failure. The goal is not to weaken the system's commitment to ${pole.toLowerCase()} but to make that commitment more conscious, more flexible, and more responsive to the actual needs of the system.`;
  }

  return base;
}

function generateMetaReflection(
  poleA: string,
  poleB: string,
  domain: string,
  currentPosition: string,
  perspective: string,
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "synthetic";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 9,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  if (perspective === "meta-perspective") {
    const base = `From a meta-perspective on the ${poleA} ↔ ${poleB} polarity in the ${domain} context, the system's current position ("${currentPosition}") can be understood not as a fixed point but as a phase in an ongoing oscillation. The polarity is not a problem to be solved but a dynamic to be managed. The meta-perspective recognizes that the tension between ${poleA.toLowerCase()} and ${poleB.toLowerCase()} is a source of creative energy — a generative friction that, when properly channeled, produces innovations that neither pole could generate alone. The question is not "which pole should we choose?" but "how do we structure our engagement with this polarity so that it serves rather than depletes the system?"`;

    if (config.minAnalysisDepth >= 2) {
      return `${base}\n\nThis meta-perspective also reveals the temporal dimension of polarity management: the system may need to emphasize ${poleA.toLowerCase()} at certain phases and ${poleB.toLowerCase()} at others, and the art of polarity management lies in reading the system's needs accurately and shifting emphasis fluidly. The current position should be assessed not against an ideal balance (which is itself a misleading concept) but against the question of whether the system is responding adaptively to the changing demands of its environment.`;
    }

    return base;
  }

  // system-integration perspective
  const base = `At the system level, integration of the ${poleA} ↔ ${poleB} polarity in ${domain} requires structural conditions that prevent the system from settling into a static preference for either pole. This includes: (1) governance structures that require representation from both ${poleA.toLowerCase()}-oriented and ${poleB.toLowerCase()}-oriented stakeholders in decision-making, (2) processes that explicitly evaluate both poles before major decisions, (3) metrics that track the health of both poles rather than optimizing for one, and (4) leadership development that cultivates the capacity to hold polarity tension without premature resolution. The system-level integration insight is that polarity management is not an individual skill but a structural capability — it must be designed into the system's architecture, not left to the discretion of individual leaders.`;

  if (config.includeExamples) {
    return `${base}\n\nIn the ${domain} context, system-level integration might look like: cross-functional teams that deliberately combine ${poleA.toLowerCase()} and ${poleB.toLowerCase()} strengths, decision-making processes that include a "polarity check" step, performance reviews that assess contributions to both poles, and cultural narratives that celebrate the productive tension between ${poleA.toLowerCase()} and ${poleB.toLowerCase()} rather than treating it as a conflict to be resolved.`;
  }

  return base;
}

/**
 * Generates the 16-row × 4-level integration spectrum analysis.
 */
function generateIntegrationSpectrum(
  poleA: string,
  poleB: string,
  domain: string,
  config: DepthConfig,
  composerCtx?: PolarityComposerContext
): Record<string, Record<string, string>> {
  const spectrum: Record<string, Record<string, string>> = {};
  const totalCells = INTEGRATION_SPECTRUM_ROWS.length * INTEGRATION_SPECTRUM_LEVELS.length;
  let cellIndex = 0;

  for (const dimension of INTEGRATION_SPECTRUM_ROWS) {
    spectrum[dimension] = {};
    for (const level of INTEGRATION_SPECTRUM_LEVELS) {
      cellIndex++;
      spectrum[dimension][level] = generateSpectrumCell(
        dimension,
        level,
        poleA,
        poleB,
        domain,
        config,
        composerCtx,
        cellIndex,
        totalCells
      );
    }
  }

  return spectrum;
}

function generateSpectrumCell(
  dimension: string,
  level: string,
  poleA: string,
  poleB: string,
  domain: string,
  config: DepthConfig,
  composerCtx?: PolarityComposerContext,
  stepNumber?: number,
  totalSteps?: number
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "perspectival";
    const composed = composeToolContent({
      toolName: "think_polarity",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 64,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const levelNum = parseInt(level.charAt(0), 10);
  const levelDescriptor =
    levelNum === 1
      ? "barely present"
      : levelNum === 2
        ? "emerging but inconsistent"
        : levelNum === 3
          ? "well-established and reliable"
          : "effortless and generative";

  const base = `At the ${level.toLowerCase()} level of ${dimension.toLowerCase()}, the relationship between ${poleA.toLowerCase()} and ${poleB.toLowerCase()} in the ${domain} context is characterized by ${levelDescriptor} capacity for ${dimension.toLowerCase()}.`;

  if (config.spectrumDetail === "summary") {
    return base;
  }

  // Add dimension-specific elaboration
  let elaboration = "";
  switch (dimension) {
    case "Harmonious Integration":
      elaboration = ` This reflects the degree to which ${poleA.toLowerCase()} and ${poleB.toLowerCase()} are experienced as complementary rather than conflicting. At level ${levelNum}, the system ${levelNum >= 3 ? "consistently recognizes and leverages" : levelNum >= 2 ? "occasionally notices" : "rarely perceives"} the ways in which each pole enhances the other.`;
      break;
    case "Pathological Disintegration":
      elaboration = ` This measures the extent to which the tension between ${poleA.toLowerCase()} and ${poleB.toLowerCase()} has become destructive. At level ${levelNum}, the system ${levelNum <= 2 ? "frequently experiences" : levelNum === 3 ? "rarely experiences" : "has virtually eliminated"} the patterns of mutual sabotage that occur when poles are weaponized against each other.`;
      break;
    case "Balance":
      elaboration = ` This assesses the system's ability to maintain appropriate emphasis on both poles over time. At level ${levelNum}, the system ${levelNum >= 3 ? "has institutionalized practices" : levelNum >= 2 ? "has some informal mechanisms" : "lacks reliable mechanisms"} for monitoring and adjusting the relative emphasis on ${poleA.toLowerCase()} and ${poleB.toLowerCase()}.`;
      break;
    case "Dynamic Interplay":
      elaboration = ` This captures the fluidity with which the system moves between poles as context demands. At level ${levelNum}, the system ${levelNum >= 3 ? "seamlessly shifts emphasis" : levelNum >= 2 ? "sometimes adjusts" : "struggles to adjust"} its focus between ${poleA.toLowerCase()} and ${poleB.toLowerCase()} in response to changing conditions.`;
      break;
    case "Fluid Transition":
      elaboration = ` This evaluates how smoothly the system transitions from emphasizing one pole to the other. At level ${levelNum}, transitions ${levelNum >= 3 ? "are experienced as natural and unforced" : levelNum >= 2 ? "can be managed with effort" : "feel jarring and disruptive"} for stakeholders in the ${domain} domain.`;
      break;
    case "Interdependence":
      elaboration = ` This measures the system's recognition that ${poleA.toLowerCase()} and ${poleB.toLowerCase()} genuinely need each other. At level ${levelNum}, stakeholders ${levelNum >= 3 ? "deeply understand" : levelNum >= 2 ? "intellectually accept" : "resist the idea"} that each pole's full value is only realized in relationship to its opposite.`;
      break;
    case "Hidden Synergy":
      elaboration = ` This identifies the non-obvious ways in which ${poleA.toLowerCase()} and ${poleB.toLowerCase()} amplify each other. At level ${levelNum}, the system ${levelNum >= 3 ? "actively discovers and leverages" : levelNum >= 2 ? "occidentally stumbles upon" : "remains blind to"} synergistic interactions between the poles.`;
      break;
    case "Emergent Properties":
      elaboration = ` This tracks the emergence of qualities that exist only when both poles are present. At level ${levelNum}, the ${domain} system ${levelNum >= 3 ? "regularly generates" : levelNum >= 2 ? "sometimes produces" : "has not yet accessed"} outcomes that transcend what either ${poleA.toLowerCase()} or ${poleB.toLowerCase()} could achieve alone.`;
      break;
    case "Generative Outcome":
      elaboration = ` This assesses whether the polarity tension produces net positive value. At level ${levelNum}, the relationship between ${poleA.toLowerCase()} and ${poleB.toLowerCase()} ${levelNum >= 3 ? "is a consistent source of innovation" : levelNum >= 2 ? "occasionally creates value through tension" : "is experienced as net costly"} for the ${domain} domain.`;
      break;
    case "Emergence from Combinations":
      elaboration = ` This examines how specific combinations of ${poleA.toLowerCase()} and ${poleB.toLowerCase()} produce unique results. At level ${levelNum}, the system ${levelNum >= 3 ? "deliberately experiments with" : levelNum >= 2 ? "has discovered some" : "has not explored"} different ratios and sequences of pole emphasis.`;
      break;
    case "Transcendence":
      elaboration = ` This measures the degree to which the system has moved beyond the polarity to a higher-order frame. At level ${levelNum}, the ${domain} system ${levelNum >= 3 ? "operates from a meta-framework" : levelNum >= 2 ? "occasionally achieves perspective" : "remains trapped within"} that encompasses both ${poleA.toLowerCase()} and ${poleB.toLowerCase()} without reducing one to the other.`;
      break;
    case "Unconscious Attachment":
      elaboration = ` This identifies hidden biases toward one pole that operate below awareness. At level ${levelNum}, the system has ${levelNum <= 2 ? "significant" : levelNum === 3 ? "minimal" : "virtually no"} unexamined preferences for either ${poleA.toLowerCase()} or ${poleB.toLowerCase()} that distort polarity management.`;
      break;
    case "Impact on Neutrality":
      elaboration = ` This evaluates how the polarity affects the system's capacity for impartial assessment. At level ${levelNum}, the tension between ${poleA.toLowerCase()} and ${poleB.toLowerCase()} ${levelNum >= 3 ? "enhances objectivity" : levelNum >= 2 ? "has mixed effects on" : "significantly compromises"} the system's ability to assess situations without pole-colored glasses.`;
      break;
    case "Developmental Tools":
      elaboration = ` This catalogs the specific practices available for polarity development. At level ${levelNum}, the ${domain} system ${levelNum >= 3 ? "has a rich toolkit" : levelNum >= 2 ? "has some useful practices" : "lacks structured approaches"} for developing the capacity to hold and manage the ${poleA.toLowerCase()} ↔ ${poleB.toLowerCase()} tension.`;
      break;
    case "Step-by-step Transcendence":
      elaboration = ` This maps the progressive stages through which polarity mastery develops. At level ${levelNum}, the system is at a stage where ${levelNum === 1 ? "basic awareness of the polarity is being established" : levelNum === 2 ? "initial management practices are being tested" : levelNum === 3 ? "sophisticated polarity management is routine" : "the system is exploring what lies beyond polarity management itself"}.`;
      break;
    case "Signs of Transcendence":
      elaboration = ` This identifies observable indicators that transcendence is occurring. At level ${levelNum}, the ${domain} system ${levelNum >= 3 ? "clearly exhibits" : levelNum >= 2 ? "shows tentative signs of" : "does not yet display"} markers such as the ability to articulate the value of both poles simultaneously, the presence of stakeholders who champion the tension itself, and the emergence of practices that require both poles to function.`;
      break;
    default:
      elaboration = ` The specific manifestation of ${dimension.toLowerCase()} at level ${levelNum} reflects the system's current maturity in managing the ${poleA.toLowerCase()} ↔ ${poleB.toLowerCase()} dynamic.`;
  }

  return base + elaboration;
}

function getPositionRelation(position: string, alignment: string): string {
  const lowerPosition = position.toLowerCase();
  if (alignment === "aligned") {
    return lowerPosition.includes("strong") ||
      lowerPosition.includes("high") ||
      lowerPosition.includes("well") ||
      lowerPosition.includes("emphasiz")
      ? "well-positioned to capitalize on"
      : "potentially positioned to develop";
  }
  return lowerPosition.includes("weak") ||
    lowerPosition.includes("low") ||
    lowerPosition.includes("neglect")
    ? "showing signs of underinvestment in"
    : "may need to assess its relationship with";
}

// ─── Systems Archetype Detection ─────────────────────────────────────────────

interface ArchetypeDetectionResult {
  key: SystemsArchetype;
  matchScore: number;
  evidence: string;
}

function detectArchetypes(params: {
  poleA: string;
  poleB: string;
  domain: string;
  currentPosition: string;
  evidence: string;
  desiredOutcome: string;
}): ArchetypeDetectionResult[] {
  const { poleA, poleB, domain, currentPosition, evidence, desiredOutcome } = params;
  const combinedContext = `${currentPosition} ${evidence} ${desiredOutcome} ${domain}`.toLowerCase();

  const detections: ArchetypeDetectionResult[] = [];

  // Fixes That Fail: emphasis on one pole provides quick relief but worsens underlying tension
  if (matchesPatterns(combinedContext, [
    "quick", "fix", "short-term", "temporary", "worsen", "recur", "relapse",
    "symptom", "band-aid", "patch", "unintended", "side effect", "backfire",
    "keeps coming back", "same problem", "recurring",
  ]) || matchesPatterns(combinedContext, [
    "immediate", "relief", "later", "worse", "cycle", "repeat",
  ])) {
    detections.push({
      key: "fixes-that-fail",
      matchScore: countPatternMatches(combinedContext, [
        "quick", "fix", "short-term", "temporary", "worsen", "recur", "relapse",
        "symptom", "band-aid", "patch", "unintended", "side effect", "backfire",
        "immediate", "relief", "cycle", "repeat",
      ]),
      evidence: `The polarity between ${poleA} and ${poleB} in ${domain} shows signs of a Fixes That Fail pattern: emphasis on ${currentPosition.toLowerCase()} may provide immediate benefits while inadvertently strengthening the underlying tension. The system risks falling into a cycle where the "solution" becomes part of the problem.`.trim(),
    });
  }

  // Shifting the Burden: one pole represents symptomatic solution that erodes capacity in the other
  if (matchesPatterns(combinedContext, [
    "depend", "rely", "outsourc", "erode", "capacity", "atrophy", "weaken",
    "symptomatic", "crutch", "external", "consultant", "intervention",
    "losing ability", "can't do it ourselves", "help", "support",
  ]) || matchesPatterns(combinedContext, [
    "borrow", "lean on", "fallback", "default", "easy way",
  ])) {
    detections.push({
      key: "shifting-the-burden",
      matchScore: countPatternMatches(combinedContext, [
        "depend", "rely", "outsourc", "erode", "capacity", "atrophy", "weaken",
        "symptomatic", "crutch", "external", "intervention", "losing ability",
        "help", "support", "borrow", "lean on", "fallback", "default",
      ]),
      evidence: `The ${poleA} ↔ ${poleB} dynamic in ${domain} exhibits Shifting the Burden characteristics: the system may be offloading tension resolution to ${currentPosition.toLowerCase()}, which provides relief but erodes the capacity to naturally oscillate between both poles. This creates a dependency loop where the system loses its inherent polarity management ability.`.trim(),
    });
  }

  // Limits to Growth: pushing one pole eventually encounters resistance from the other
  if (matchesPatterns(combinedContext, [
    "plateau", "slow", "resistance", "limit", "ceiling", "constraint",
    "bottleneck", "stall", "diminishing", "return", "saturation",
    "pushing harder", "not working", "growth", "scaling",
  ]) || matchesPatterns(combinedContext, [
    "peak", "max", "cap", "bound", "wall", "barrier",
  ])) {
    detections.push({
      key: "limits-to-growth",
      matchScore: countPatternMatches(combinedContext, [
        "plateau", "slow", "resistance", "limit", "ceiling", "constraint",
        "bottleneck", "stall", "diminishing", "saturation", "pushing harder",
        "peak", "max", "cap", "bound", "barrier",
      ]),
      evidence: `The ${poleA} ↔ ${poleB} polarity in ${domain} shows a Limits to Growth structure: continued emphasis on ${currentPosition.toLowerCase()} is likely encountering or will encounter natural resistance from the neglected pole. The harder the system pushes one direction, the stronger the counter-force becomes from the other.`.trim(),
    });
  }

  // Tragedy of the Commons: individual optimization of one pole degrades the shared system
  if (matchesPatterns(combinedContext, [
    "shared", "common", "deplete", "degrade", "individual", "collective",
    "resource", "overuse", "self-interest", "group", "team", "organizational",
    "silo", "compete", "free rider",
  ]) || matchesPatterns(combinedContext, [
    "everyone", "nobody", "race to the bottom", "overfish", "overwork",
  ])) {
    detections.push({
      key: "tragedy-of-the-commons",
      matchScore: countPatternMatches(combinedContext, [
        "shared", "common", "deplete", "degrade", "individual", "collective",
        "resource", "overuse", "self-interest", "silo", "compete", "free rider",
        "overwork", "race to the bottom",
      ]),
      evidence: `The tension between ${poleA} and ${poleB} in ${domain} reflects a Tragedy of the Commons pattern: individual actors or sub-units optimizing for their preferred pole may be degrading the shared capacity to maintain both poles. What makes sense locally creates collective dysfunction.`.trim(),
    });
  }

  // Escalation: two poles drive each other in an arms-race pattern
  if (matchesPatterns(combinedContext, [
    "escalat", "arms race", "reactive", "counter", "spiral", "intensif",
    "increasingly", "more and more", "defensive", "attack", "threat",
    "retaliate", "tit-for-tat", "cycle of", "vicious",
  ]) || matchesPatterns(combinedContext, [
    "they did", "so we", "had to", "respond", "fight back",
  ])) {
    detections.push({
      key: "escalation",
      matchScore: countPatternMatches(combinedContext, [
        "escalat", "arms race", "reactive", "counter", "spiral", "intensif",
        "increasingly", "defensive", "threat", "retaliate", "tit-for-tat",
        "vicious", "respond", "fight back",
      ]),
      evidence: `The ${poleA} ↔ ${poleB} dynamic in ${domain} shows Escalation characteristics: each pole may be perceived as a defensive response to the other, creating a reinforcing cycle where each side's actions are experienced as threats by the other, driving increasingly extreme positions.`.trim(),
    });
  }

  // Success to the Successful: one pole gets more resources because it's already winning
  if (matchesPatterns(combinedContext, [
    "resource", "funding", "budget", "investment", "priority", "winning",
    "already working", "proven", "track record", "starve", "neglect",
    "favor", "preferred", "legacy", "incumbent",
  ]) || matchesPatterns(combinedContext, [
    "gets more", "gets less", "rich get richer", "momentum", "doubled down",
  ])) {
    detections.push({
      key: "success-to-the-successful",
      matchScore: countPatternMatches(combinedContext, [
        "resource", "funding", "budget", "investment", "priority", "winning",
        "proven", "starve", "favor", "preferred", "legacy", "incumbent",
        "gets more", "gets less", "rich get richer", "doubled down",
      ]),
      evidence: `The ${poleA} ↔ ${poleB} polarity in ${domain} exhibits Success to the Successful dynamics: the pole that has historically received more attention (${currentPosition.toLowerCase()}) continues to attract resources, while the other pole is starved regardless of its potential contribution. Past success becomes the justification for continued investment.`.trim(),
    });
  }

  // Drift to Low Performance: tension between poles gradually lowers standards
  if (matchesPatterns(combinedContext, [
    "standard", "lower", "accept", "normaliz", "drift", "gradual",
    "used to be", "that's just how", "mediocre", "good enough",
    "decline", "erosion", "slip", "slide", "compromise",
  ]) || matchesPatterns(combinedContext, [
    "always been this way", "can't expect", "realistic", "pragmatic",
  ])) {
    detections.push({
      key: "drift-to-low-performance",
      matchScore: countPatternMatches(combinedContext, [
        "standard", "lower", "accept", "normaliz", "drift", "gradual",
        "mediocre", "good enough", "decline", "erosion", "slip", "slide",
        "always been", "realistic", "pragmatic",
      ]),
      evidence: `The ${poleA} ↔ ${poleB} tension in ${domain} shows Drift to Low Performance signs: the gap between the desired outcome (${desiredOutcome.toLowerCase()}) and current reality may be leading to gradual lowering of standards. The system adapts to underperformance by redefining what "good" looks like.`.trim(),
    });
  }

  // Growth and Underinvestment: growth in one pole limited by inadequate investment in the other
  if (matchesPatterns(combinedContext, [
    "invest", "infrastructure", "capacity", "build", "foundation", "prepare",
    "future", "demand", "supply", "can't keep up", "need more",
    "underinvest", "underfund", "lack of", "insufficient",
  ]) || matchesPatterns(combinedContext, [
    "growing pains", "outgrew", "didn't plan", "reactive", "behind",
  ])) {
    detections.push({
      key: "growth-and-underinvestment",
      matchScore: countPatternMatches(combinedContext, [
        "invest", "infrastructure", "capacity", "build", "foundation",
        "demand", "supply", "can't keep up", "underinvest", "underfund",
        "lack of", "insufficient", "growing pains", "behind",
      ]),
      evidence: `The ${poleA} ↔ ${poleB} dynamic in ${domain} reflects Growth and Underinvestment: growth in ${currentPosition.toLowerCase()} may be constrained by inadequate investment in the complementary pole. The system interprets the slowdown as lack of potential rather than lack of capacity building in the other pole.`.trim(),
    });
  }

  // Accidental Adversaries: cooperation between poles breaks down due to misaligned actions
  if (matchesPatterns(combinedContext, [
    "misalign", "misunderstand", "partner", "ally", "cooperation", "breakdown",
    "threaten", "unilateral", "independent", "communication", "trust",
    "drift apart", "growing apart", "no longer", "used to work",
  ]) || matchesPatterns(combinedContext, [
    "didn't mean to", "surprised", "assumed", "thought they",
  ])) {
    detections.push({
      key: "accidental-adversaries",
      matchScore: countPatternMatches(combinedContext, [
        "misalign", "misunderstand", "partner", "cooperation", "breakdown",
        "threaten", "unilateral", "communication", "trust", "drift apart",
        "surprised", "assumed",
      ]),
      evidence: `The relationship between ${poleA} and ${poleB} in ${domain} shows Accidental Adversaries patterns: actions taken to strengthen one pole may inadvertently threaten the other, causing defensive responses that undermine the cooperative dynamic that originally made both poles valuable.`.trim(),
    });
  }

  // Attractiveness: multiple poles compete for limited attention/resources
  if (matchesPatterns(combinedContext, [
    "compete", "attention", "focus", "spread thin", "too many", "prioritize",
    "multiple", "initiative", "option", "choice", "opportunity",
    "dilemma", "trade-off", "can't do all",
  ]) || matchesPatterns(combinedContext, [
    "everything at once", "pulling", "divided", "stretched",
  ])) {
    detections.push({
      key: "attractiveness",
      matchScore: countPatternMatches(combinedContext, [
        "compete", "attention", "focus", "spread thin", "prioritize",
        "multiple", "initiative", "option", "dilemma", "trade-off",
        "pulling", "divided", "stretched",
      ]),
      evidence: `The ${poleA} ↔ ${poleB} polarity in ${domain} exhibits the Attractiveness Principle: both poles (and potentially other competing priorities) are pulling for limited resources and attention. Neither pole can reach critical mass because the system is trying to pursue multiple attractive options simultaneously.`.trim(),
    });
  }

  detections.sort((a, b) => b.matchScore - a.matchScore);
  return detections;
}

function matchesPatterns(text: string, patterns: string[]): boolean {
  return patterns.some((p) => text.includes(p.toLowerCase()));
}

function countPatternMatches(text: string, patterns: string[]): number {
  return patterns.filter((p) => text.includes(p.toLowerCase())).length;
}

function generateArchetypeSection(
  archetypes: ArchetypeDetectionResult[]
): string {
  if (archetypes.length === 0) {
    return `## Systems Archetype Analysis

No strong systems archetype pattern was detected in this polarity configuration. This may indicate a relatively balanced dynamic without the characteristic reinforcing/balancing loop structures that define Senge's archetypes, or that the available context data is insufficient for reliable pattern matching.

**Recommendation:** Re-assess after collecting more longitudinal data about how the ${"poleA"} ↔ ${"poleB"} tension evolves over time. Archetype patterns often become visible only after several cycles of interaction.`.trim();
  }

  const archetypeEntries = archetypes.map((arch) => {
    const constants = SYSTEMS_ARCHETYPES[arch.key];
    return `### ${constants.name} (${constants.structure})

**Match Confidence:** ${arch.matchScore >= 6 ? "Strong" : arch.matchScore >= 4 ? "Moderate" : "Weak"} (${arch.matchScore} signal(s) detected)

**Structure:** ${constants.structure}

**Description:** ${constants.description}

**Evidence in This Context:** ${arch.evidence}

**Early Warning Signs:** ${constants.early_warning}

**Intervention Strategy:** ${constants.intervention_strategy}`;
  }).join("\n\n---\n\n");

  return `## Systems Archetype Analysis

The following systems archetype pattern(s) from Peter Senge's framework have been detected in the ${"poleA"} ↔ ${"poleB"} polarity configuration. Archetypes are recurring structures of behavior that help explain why well-intentioned interventions often produce unintended consequences.

${archetypeEntries}`;
}

function generateEpistemicAssessment(
  input: PolarityThinkingInput & { output_depth: OutputDepth }
): string {
  const { evidence_for_position } = input;
  const evidenceStrength = evidence_for_position.length;
  const status = evidenceStrength > 200
    ? "well-supported"
    : evidenceStrength > 80
      ? "tentative"
      : "speculative";

  const followupTools: string[] = ["think_sequential", "think_aqal_situational"];
  if (evidenceStrength < 100) {
    followupTools.push("think_shadow");
  }

  return `## Epistemic Assessment

**Epistemic Status:** ${status}

This polarity analysis is ${status} based on the evidence provided (${evidenceStrength} characters). ${
    status === "well-supported"
      ? "The detailed evidence provides a solid foundation for the polarity mapping and archetype detection."
      : status === "tentative"
        ? "Additional data would strengthen confidence in the archetype pattern matching and polarity assessments."
        : "The limited evidence suggests this analysis should be treated as a preliminary hypothesis requiring validation."
  }

**Suggested Follow-up Tools:**
- \`think_sequential\` — Step through the causal logic of detected archetype patterns to validate the loop structures
- \`think_aqal_situational\` — Examine how the polarity and archetypes manifest across individual/collective and interior/exterior dimensions
${followupTools.includes("think_shadow") ? "- `think_shadow` — Explore unconscious dynamics that may be driving the polarity tension and archetype patterns\n" : ""}
- \`think_cynefin\` — Assess whether this polarity situation operates in a complex, complicated, or chaotic domain to calibrate intervention strategy`;
}

// ─── Current Position Assessment ─────────────────────────────────────────────

function generatePositionAssessment(
  input: PolarityThinkingInput & { output_depth: OutputDepth }
): string {
  const { current_position, evidence_for_position, pole_a, pole_b, domain } =
    input;

  return `### Current Position Assessment

**Reported Position:** ${current_position}

**Evidence:** ${evidence_for_position}

**Assessment:** The system's self-reported position on the ${pole_a} ↔ ${pole_b} continuum in the ${domain} context should be evaluated against multiple data points. The evidence provided ("${evidence_for_position}") suggests ${
    evidence_for_position.toLowerCase().includes("strong") ||
    evidence_for_position.toLowerCase().includes("clear") ||
    evidence_for_position.toLowerCase().includes("demonstrat")
      ? "a well-established positioning that is likely accurate"
      : evidence_for_position.toLowerCase().includes("unclear") ||
          evidence_for_position.toLowerCase().includes("mixed") ||
          evidence_for_position.toLowerCase().includes("vari")
        ? "an ambiguous positioning that may benefit from further investigation"
        : "a positioning claim that should be tested against additional evidence sources"
  }. 

Key considerations for validating this assessment include:
- Whether the evidence captures both poles or only reflects one side
- Whether the data is recent enough to reflect current conditions
- Whether the assessment accounts for variation across different sub-contexts within ${domain}
- Whether stakeholders from both pole-perspectives were included in the assessment`;
}

// ─── Tool Registration ───────────────────────────────────────────────────────

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_polarity",
    {
      title: "Polarity / Dialectical Thinking Map",
      description:
        "Generates a structured polarity mapping analysis of the dynamic tension between two complementary poles. " +
        "Produces a 9-row polarity table (Rewards of Focus, Overemphasis Feedback, Neglect Risks, Circular Causal Loops, " +
        "Balkanization Risks, Extremity Feedback, Transcendence Rewards, Reflection Loops, Meta-Reflection Process) and " +
        "a 16-row × 4-level integration spectrum table. The output follows a template-based framework that structures " +
        "dialectical analysis into consistent sections, helping avoid premature synthesis by requiring sustained attention " +
        "on each pole's value.",
      inputSchema: z
        .object({
          pole_a: z
            .string()
            .describe("First pole/perspective (e.g., 'Structure')"),
          pole_b: z
            .string()
            .describe("Opposing pole/perspective (e.g., 'Flexibility')"),
          domain: z
            .string()
            .describe("Context/domain where this tension plays out"),
          current_position: z
            .string()
            .describe(
              "Where the system currently sits in this tension"
            ),
          evidence_for_position: z
            .string()
            .describe(
              "Observable data supporting the current position assessment"
            ),
          desired_outcome: z
            .string()
            .describe("What successful integration would look like"),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard"),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output presentation mode: 'executive' for concise summaries, " +
                "'analytical' for full detailed output (default), 'exploratory' with open questions."
            ),
        })
        .strict(),
      annotations: TOOL_ANNOTATIONS,
    },
    async (args) => {
      try {
        const input: PolarityThinkingInput & {
          output_depth: OutputDepth;
        } = {
          pole_a: args.pole_a,
          pole_b: args.pole_b,
          domain: args.domain,
          current_position: args.current_position,
          evidence_for_position: args.evidence_for_position,
          desired_outcome: args.desired_outcome,
          output_depth: args.output_depth ?? "standard",
        };

        const fullText = `${input.pole_a} vs ${input.pole_b} in ${input.domain}`;
        getStructureForText(fullText, input.current_position);
        const outputMode = args.output_mode ?? 'analytical';
        const composerCtx: PolarityComposerContext = {
          fullText,
          initialPosition: input.current_position,
          outputMode,
        };

        const polarityAnalysis = generatePolarityAnalysis(input, composerCtx);
        const integrationSpectrum = generateIntegrationSpectrum(
          input.pole_a,
          input.pole_b,
          input.domain,
          DEPTH_CONFIGS[input.output_depth],
          composerCtx
        );

        const formattedOutput = formatPolarityMap(
          input.pole_a,
          input.pole_b,
          input.domain,
          polarityAnalysis,
          integrationSpectrum,
          outputMode
        );

        const positionAssessment = generatePositionAssessment(input);

        const detectedArchetypes = detectArchetypes({
          poleA: input.pole_a,
          poleB: input.pole_b,
          domain: input.domain,
          currentPosition: input.current_position,
          evidence: input.evidence_for_position,
          desiredOutcome: input.desired_outcome,
        });

        const archetypeComposed = composeToolContent({
          toolName: "think_polarity",
          text: fullText,
          initialPosition: input.current_position,
          mode: outputMode === "executive" ? "strategic" : outputMode === "exploratory" ? "creative" : "analytical",
          subMode: "deductive",
          stepNumber: 19,
          totalSteps: 20,
          thoughtType: "diagnostic" as ThoughtType,
          previousOutputs: [],
        });
        const archetypeSection = archetypeComposed.length > 200
          ? `## Systems Archetype Analysis\n\n${archetypeComposed}`
          : generateArchetypeSection(detectedArchetypes);
        const epistemicAssessment = generateEpistemicAssessment(input);

        const epistemicStatus: EpistemicStatus = input.output_depth === 'exhaustive' ? 'well-supported' : input.output_depth === 'standard' ? 'tentative' : 'speculative';
        const suggestedFollowup: SuggestedTool[] = ['think_aqal_situational', 'think_shadow'];

        const metaAnalysis = `\n\n## Meta-Analysis\n\n- **Epistemic Status:** ${epistemicStatus}\n- **Suggested Follow-ups:** ${suggestedFollowup.join(', ')}`;

        let exploratorySection = '';
        if (args.output_mode === 'exploratory') {
          exploratorySection = `\n\n## Open Questions\n\n1. What would happen if the ${input.pole_a} ↔ ${input.pole_b} polarity dissolved entirely — is this a genuine tension or a false dichotomy?\n2. Which stakeholder groups experience this polarity differently, and how would centering their experience shift the map?\n3. What historical conditions created this polarity, and under what future conditions might it become obsolete?`;
        }

        const fullOutput = `${formattedOutput}\n\n---\n\n${positionAssessment}\n\n---\n\n${archetypeSection}\n\n---\n\n${epistemicAssessment}${metaAnalysis}${exploratorySection}`;

        return {
          content: [{ type: "text", text: fullOutput }],
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error in think_polarity";
        return {
          content: [
            {
              type: "text",
              text: `Error generating polarity analysis: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
