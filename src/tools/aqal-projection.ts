import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { OutputDepth, AqalProjectionInput, ProjectionRow, Quadrant, EpistemicStatus, SuggestedTool, OutputMode, SubjectType } from "../types.js";
import { QUADRANTS } from "../constants.js";
import { formatAqalProjection } from "../utils/formatters.js";
import { composeToolContent } from "../utils/content-pipeline.js";
import type { ThoughtType } from "../types.js";

function detectSubjectType(
  situation: string,
  currentTrajectory: string,
  interventionPlanned: string,
  timeConstraints: string,
): SubjectType {
  const combined = `${situation} ${currentTrajectory} ${interventionPlanned} ${timeConstraints}`.toLowerCase();
  const aiSignals = ["model", "agent", "ai ", "neural", "training", "inference", "prompt", "llm", "language model", "algorithm", "generation", "token"];
  const orgSignals = ["team", "organization", "company", "department", "management", "culture", "workflow", "velocity", "sprint", "standup", "silo", "stakeholder"];
  const techSignals = ["api", "microservice", "database", "pipeline", "deployment", "infrastructure", "server", "container", "kubernetes", "docker", "cloud", "monolith"];
  const aiScore = aiSignals.filter(s => combined.includes(s)).length;
  const orgScore = orgSignals.filter(s => combined.includes(s)).length;
  const techScore = techSignals.filter(s => combined.includes(s)).length;

  const maxScore = Math.max(aiScore, orgScore, techScore);
  if (maxScore >= 2) {
    const closeCount = [aiScore, orgScore, techScore].filter(s => s >= maxScore - 1).length;
    if (closeCount >= 2) return "mixed";
  }

  if (aiScore >= 2 && aiScore >= orgScore && aiScore >= techScore) return "ai-system";
  if (orgScore >= 2 && orgScore >= aiScore && orgScore >= techScore) return "organization";
  if (techScore >= 2 && techScore >= aiScore && techScore >= orgScore) return "technical-system";
  return "human";
}

// ─── Tool Annotations ────────────────────────────────────────────────────────

const TOOL_ANNOTATIONS = {
  readOnlyHint: true as const,
  destructiveHint: false as const,
  idempotentHint: true as const,
  openWorldHint: false as const,
};

// ─── Composer Context ────────────────────────────────────────────────────────

interface ProjectionComposerContext {
  fullText: string;
  initialPosition: string;
  outputMode: OutputMode;
}

// ─── Depth Configuration ─────────────────────────────────────────────────────

interface DepthConfig {
  includeSecondOrderEffects: boolean;
  includeCrossQuadrantDynamics: boolean;
  temporalDetail: "basic" | "detailed" | "comprehensive";
}

const DEPTH_CONFIGS: Record<OutputDepth, DepthConfig> = {
  essential: {
    includeSecondOrderEffects: false,
    includeCrossQuadrantDynamics: false,
    temporalDetail: "basic",
  },
  standard: {
    includeSecondOrderEffects: true,
    includeCrossQuadrantDynamics: true,
    temporalDetail: "detailed",
  },
  exhaustive: {
    includeSecondOrderEffects: true,
    includeCrossQuadrantDynamics: true,
    temporalDetail: "comprehensive",
  },
};

// ─── Quadrant Analysis Generator ─────────────────────────────────────────────

function generateQuadrantAnalysis(
  quadrant: Quadrant,
  input: AqalProjectionInput & { output_depth: OutputDepth },
  config: DepthConfig,
  subjectType: SubjectType,
  composerCtx?: ProjectionComposerContext
): ProjectionRow {
  const { situation, current_trajectory, intervention_planned, time_constraints } = input;

  const horizonThoughtTypes: Record<"short-term" | "mid-term" | "long-term", ThoughtType> = {
    "short-term": "diagnostic",
    "mid-term": "relational",
    "long-term": "prospective",
  };

  return {
    situation_summary: generateSituationSummary(quadrant, situation, current_trajectory, subjectType, composerCtx),
    solution_summary: generateSolutionSummary(quadrant, intervention_planned, time_constraints, subjectType, composerCtx),
    short_term: generateTemporalProjection(quadrant, "short-term", situation, intervention_planned, current_trajectory, config, subjectType, composerCtx, 1, 3, horizonThoughtTypes),
    mid_term: generateTemporalProjection(quadrant, "mid-term", situation, intervention_planned, current_trajectory, config, subjectType, composerCtx, 2, 3, horizonThoughtTypes),
    long_term: generateTemporalProjection(quadrant, "long-term", situation, intervention_planned, current_trajectory, config, subjectType, composerCtx, 3, 3, horizonThoughtTypes),
  };
}

function generateSituationSummary(
  quadrant: Quadrant,
  situation: string,
  currentTrajectory: string,
  subjectType: SubjectType,
  composerCtx?: ProjectionComposerContext
): string {
  if (composerCtx) {
    const composed = composeToolContent({
      toolName: "think_aqal_projection",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 4,
      thoughtType: "perspectival",
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const qInfo = QUADRANTS[quadrant];
  const frameworkNote = subjectType !== "human"
    ? `\n\nNote: Subject type detected as '${subjectType}'. Psychological frameworks (developmental stages, neuroplasticity) have been replaced with structural/architectural analysis appropriate for non-human subjects.`
    : "";
  return `In the ${qInfo.full_label} quadrant, the situation "${situation}" manifests as ${getQuadrantSpecificManifestation(quadrant, situation, subjectType)}. The current trajectory ("${currentTrajectory}") indicates that ${getTrajectoryImplication(quadrant, currentTrajectory, subjectType)}. This quadrant's epistemology — ${qInfo.epistemology.toLowerCase()} — reveals dimensions of the situation that other quadrants cannot access.${frameworkNote}`;
}

function generateSolutionSummary(
  quadrant: Quadrant,
  interventionPlanned: string,
  timeConstraints: string,
  subjectType: SubjectType,
  composerCtx?: ProjectionComposerContext
): string {
  if (composerCtx) {
    const composed = composeToolContent({
      toolName: "think_aqal_projection",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: 2,
      totalSteps: 4,
      thoughtType: "perspectival",
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const qInfo = QUADRANTS[quadrant];
  return `Addressing the situation from the ${qInfo.full_label} perspective, the planned intervention "${interventionPlanned}" ${assessInterventionFit(quadrant, interventionPlanned, subjectType)}. ${timeConstraints ? `Time constraints ("${timeConstraints}") ${getTimeConstraintImpact(quadrant, timeConstraints, subjectType)}.` : "In the absence of explicit time constraints, this quadrant can proceed at its natural pace of change."} The solution approach must honor this quadrant's unique mode of knowing and acting.`;
}

function generateTemporalProjection(
  quadrant: Quadrant,
  horizon: "short-term" | "mid-term" | "long-term",
  situation: string,
  interventionPlanned: string,
  currentTrajectory: string,
  config: DepthConfig,
  subjectType: SubjectType,
  composerCtx?: ProjectionComposerContext,
  stepNumber?: number,
  totalSteps?: number,
  thoughtTypeMap?: Record<"short-term" | "mid-term" | "long-term", ThoughtType>
): string {
  if (composerCtx) {
    const thoughtType = thoughtTypeMap?.[horizon] ?? "diagnostic";
    const composed = composeToolContent({
      toolName: "think_aqal_projection",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: stepNumber ?? 1,
      totalSteps: totalSteps ?? 3,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const qInfo = QUADRANTS[quadrant];
  const temporalCharacteristics = getTemporalCharacteristics(quadrant, horizon, subjectType);

  const base = `Over the ${horizon === "short-term" ? "<1 year" : horizon === "mid-term" ? "1-3 year" : "3+ year"} horizon, the ${qInfo.label} quadrant ${temporalCharacteristics}.`;

  if (config.temporalDetail === "basic") {
    return `${base} The planned intervention "${interventionPlanned}" will ${getImmediateImpact(quadrant, horizon, subjectType)} in this domain.`;
  }

  const elaboration = generateTemporalElaboration(quadrant, horizon, situation, interventionPlanned, currentTrajectory, config, subjectType);
  return `${base}\n\n${elaboration}`;
}

function generateTemporalElaboration(
  quadrant: Quadrant,
  horizon: string,
  situation: string,
  interventionPlanned: string,
  currentTrajectory: string,
  config: DepthConfig,
  subjectType: SubjectType,
): string {
  const qInfo = QUADRANTS[quadrant];
  const changeVelocity = getChangeVelocity(quadrant, subjectType);

  let content = `Given that the ${qInfo.label} quadrant ${changeVelocity}, the ${horizon} projection for "${situation}" should account for ${getProjectionConsideration(quadrant, horizon, subjectType)}. `;

  content += `The intervention "${interventionPlanned}" will ${getInterventionTrajectory(quadrant, horizon, interventionPlanned, subjectType)}. `;

  if (config.temporalDetail === "comprehensive") {
    content += `\n\nKey milestones to monitor include: ${getMilestones(quadrant, horizon, subjectType)}. `;
    content += `Potential deviations from the projected trajectory include: ${getDeviationRisks(quadrant, horizon, subjectType)}. `;
    content += `The interaction between the current trajectory ("${currentTrajectory}") and the planned intervention creates ${getInteractionEffect(quadrant, horizon)}.`;
  }

  return content;
}

// ─── Quadrant-Specific Content Generators ────────────────────────────────────

function getQuadrantSpecificManifestation(quadrant: Quadrant, situation: string, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiQuadrantManifestation(quadrant, situation);
  if (subjectType === "organization") return getOrgQuadrantManifestation(quadrant, situation);
  if (subjectType === "technical-system") return getTechQuadrantManifestation(quadrant, situation);

  switch (quadrant) {
    case "intentional":
      return `the interior experience of stakeholders — their beliefs, emotions, values, and sense of meaning in relation to "${situation}". This includes shifts in self-understanding, changes in perspective, and the evolution of personal narratives that shape how individuals interpret and respond to the situation`;
    case "behavioral":
      return `the observable patterns, measurable outcomes, and physical manifestations associated with "${situation}". This includes behavioral routines, physiological responses, performance metrics, and any externally verifiable data that can be tracked and quantified`;
    case "cultural":
      return `the shared meanings, collective narratives, and intersubjective agreements that shape how the group or community understands "${situation}". This includes cultural norms, shared values, collective identity, and the stories that the group tells itself about what is happening`;
    case "social":
      return `the structural arrangements, institutional frameworks, and systemic conditions that shape the context in which "${situation}" unfolds. This includes organizational structures, legal and policy environments, technological infrastructure, economic conditions, and the objective systems that enable or constrain collective action`;
  }
}

function getTrajectoryImplication(quadrant: Quadrant, trajectory: string, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiTrajectoryImplication(quadrant, trajectory);
  if (subjectType === "organization") return getOrgTrajectoryImplication(quadrant, trajectory);
  if (subjectType === "technical-system") return getTechTrajectoryImplication(quadrant, trajectory);

  const qInfo = QUADRANTS[quadrant];
  switch (quadrant) {
    case "intentional":
      return `inner experience is already shifting in ways that may accelerate or resist the planned intervention. Interior changes often precede exterior ones, suggesting that ${qInfo.label.toLowerCase()} indicators may be leading signals of broader transformation`;
    case "behavioral":
      return `observable patterns are already in motion. Behavioral momentum can be difficult to redirect once established, but behavioral changes are also the most immediately measurable indicators of whether an intervention is taking effect`;
    case "cultural":
      return `shared understanding is evolving. Cultural shifts tend to lag behind individual interior changes but lead structural changes, making the ${qInfo.label.toLowerCase()} quadrant a critical bridge between personal transformation and systemic reform`;
    case "social":
      return `structural conditions are already in flux. The inertia of social systems means that current trajectory may persist beyond the intended intervention window, creating both opportunities (existing momentum) and risks (resistance to redirection)`;
  }
}

function assessInterventionFit(quadrant: Quadrant, intervention: string, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiInterventionFit(quadrant, intervention);
  if (subjectType === "organization") return getOrgInterventionFit(quadrant, intervention);
  if (subjectType === "technical-system") return getTechInterventionFit(quadrant, intervention);

  switch (quadrant) {
    case "intentional":
      return "aligns with interior transformation if it includes practices that shift individual meaning-making, self-awareness, and values. Purely structural interventions will have limited impact here without corresponding interior work";
    case "behavioral":
      return "is well-suited to this quadrant if it specifies observable actions, measurable targets, and concrete behavioral changes. Vague intentions without behavioral specificity will struggle to produce results in this domain";
    case "cultural":
      return "requires engagement with shared meaning-making to succeed. Interventions that ignore cultural narratives, values, and collective identity will encounter resistance regardless of their structural or behavioral merits";
    case "social":
      return "demands attention to structural conditions — policies, systems, resources, and institutional arrangements. Without structural support, even well-intentioned interior and behavioral changes will lack the scaffolding to sustain themselves";
  }
}

function getTimeConstraintImpact(quadrant: Quadrant, constraints: string, subjectType: SubjectType): string {
  const velocity = getChangeVelocity(quadrant, subjectType);
  if (constraints.toLowerCase().includes("urgent") || constraints.toLowerCase().includes("immediate") || constraints.toLowerCase().includes("short")) {
    return `may create tension in the ${quadrant} quadrant, which ${velocity}. Urgency in this domain risks superficial compliance without meaningful change`;
  }
  return `provides a temporal frame within which the ${quadrant} quadrant's natural pace of change (${velocity}) can be assessed against external expectations`;
}

function getChangeVelocity(quadrant: Quadrant, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiChangeVelocity(quadrant);
  if (subjectType === "organization") return getOrgChangeVelocity(quadrant);
  if (subjectType === "technical-system") return getTechChangeVelocity(quadrant);

  switch (quadrant) {
    case "intentional":
      return "can change instantaneously through insight, reframing, or shifts in perspective";
    case "behavioral":
      return "changes on a timescale of weeks to months through habit formation, practice, and neuroplasticity";
    case "cultural":
      return "evolves over months to years, requiring sustained dialogue, shared experience, and often generational turnover";
    case "social":
      return "is the slowest to change, as institutional structures, legal frameworks, and economic systems resist rapid alteration due to path dependency and vested interests";
  }
}

function getTemporalCharacteristics(quadrant: Quadrant, horizon: string, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiTemporalCharacteristics(quadrant, horizon);
  if (subjectType === "organization") return getOrgTemporalCharacteristics(quadrant, horizon);
  if (subjectType === "technical-system") return getTechTemporalCharacteristics(quadrant, horizon);

  switch (quadrant) {
    case "intentional":
      if (horizon === "short-term") return "can experience rapid shifts through insight, coaching, or catalytic experiences";
      if (horizon === "mid-term") return "will consolidate new perspectives into stable meaning-making frameworks";
      return "may undergo developmental stage transitions that fundamentally restructure how reality is interpreted";
    case "behavioral":
      if (horizon === "short-term") return "will show initial behavioral modifications, though habits remain fragile and context-dependent";
      if (horizon === "mid-term") return "can establish new behavioral patterns that become automatic through repetition and reinforcement";
      return "may embody entirely new behavioral repertoires that reflect deep structural changes in neural and physiological organization";
    case "cultural":
      if (horizon === "short-term") return "will show surface-level shifts in language and expressed values, though deeper assumptions remain intact";
      if (horizon === "mid-term") return "can begin to shift shared narratives and collective identity as new stories gain traction";
      return "may undergo worldview transitions that redefine what the group considers real, valuable, and possible";
    case "social":
      if (horizon === "short-term") return "will show minimal structural change due to systemic inertia, though policy adjustments may begin";
      if (horizon === "mid-term") return "can implement structural reforms, though their effectiveness depends on alignment with interior and cultural shifts";
      return "may undergo paradigm-level institutional transformation, but only if supported by corresponding changes in the other three quadrants";
    default:
      return "will evolve according to its natural pace of change";
  }
}

function getImmediateImpact(quadrant: Quadrant, horizon: string, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiImmediateImpact(quadrant, horizon);
  if (subjectType === "organization") return getOrgImmediateImpact(quadrant, horizon);
  if (subjectType === "technical-system") return getTechImmediateImpact(quadrant, horizon);

  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "initiate shifts in individual perspective and self-understanding"
        : horizon === "mid-term"
          ? "consolidate new meaning-making capacities"
          : "transform the foundational worldview from which individuals operate";
    case "behavioral":
      return horizon === "short-term"
        ? "produce observable changes in action patterns, though these may require conscious effort to maintain"
        : horizon === "mid-term"
          ? "establish new behavioral routines that operate with decreasing conscious effort"
          : "embody new behavioral capacities as second nature";
    case "cultural":
      return horizon === "short-term"
        ? "introduce new narratives and language into the collective discourse"
        : horizon === "mid-term"
          ? "shift the shared stories that define group identity and purpose"
          : "transform the cultural worldview that shapes what the group considers possible and desirable";
    case "social":
      return horizon === "short-term"
        ? "initiate structural adjustments, though systemic effects will be limited by institutional inertia"
        : horizon === "mid-term"
          ? "implement structural reforms that begin to reshape the systemic landscape"
          : "reconfigure the institutional architecture that constrains and enables collective behavior";
  }
}

function getProjectionConsideration(quadrant: Quadrant, horizon: string, subjectType: SubjectType): string {
  const velocity = getChangeVelocity(quadrant, subjectType);
  switch (horizon) {
    case "short-term":
      return `the ${quadrant} quadrant's change velocity — ${velocity}. Short-term projections should be realistic about what can genuinely shift in this timeframe`;
    case "mid-term":
      return `the compounding effects of sustained attention to ${quadrant}-level changes over an extended period. The mid-term horizon is where initial changes either consolidate or regress`;
    case "long-term":
      return `the possibility of qualitative transformation — not just quantitative accumulation of change but a fundamental shift in how the ${quadrant} domain operates`;
    default:
      return `the evolving relationship between ${quadrant} domain conditions and the broader system context`;
  }
}

function getInterventionTrajectory(quadrant: Quadrant, horizon: string, intervention: string, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiInterventionTrajectory(quadrant, horizon, intervention);
  if (subjectType === "organization") return getOrgInterventionTrajectory(quadrant, horizon, intervention);
  if (subjectType === "technical-system") return getTechInterventionTrajectory(quadrant, horizon, intervention);

  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "create immediate shifts in how individuals understand and experience the situation"
        : horizon === "mid-term"
          ? "embed new perspectives into stable patterns of meaning-making"
          : "contribute to developmental evolution in how individuals relate to reality itself";
    case "behavioral":
      return horizon === "short-term"
        ? "produce measurable changes in specific behaviors, though these may require ongoing conscious effort"
        : horizon === "mid-term"
          ? "establish behavioral patterns that become self-sustaining through habit formation"
          : "reconfigure the behavioral repertoire available to individuals and the collective";
    case "cultural":
      return horizon === "short-term"
        ? "seed new narratives into the collective conversation"
        : horizon === "mid-term"
          ? "shift the cultural story from its current trajectory toward a new shared understanding"
          : "establish a new cultural paradigm that redefines the group's relationship to the situation";
    case "social":
      return horizon === "short-term"
        ? "begin the process of structural adjustment, though full effects will take longer to materialize"
        : horizon === "mid-term"
          ? "implement structural changes that reshape the conditions within which individuals and groups operate"
          : "create institutional arrangements that sustain and amplify the changes initiated in the other quadrants";
  }
}

function getMilestones(quadrant: Quadrant, horizon: string, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiMilestones(quadrant, horizon);
  if (subjectType === "organization") return getOrgMilestones(quadrant, horizon);
  if (subjectType === "technical-system") return getTechMilestones(quadrant, horizon);

  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "evidence of perspective shifts in stakeholder feedback, changes in self-reported experience"
        : horizon === "mid-term"
          ? "stable adoption of new meaning-making frameworks, reduced resistance to change"
          : "developmental stage transitions, non-dual insights, or fundamental worldview shifts";
    case "behavioral":
      return horizon === "short-term"
        ? "measurable changes in target behaviors, compliance with new protocols"
        : horizon === "mid-term"
          ? "habit formation metrics, reduced variance in behavioral performance"
          : "systemic behavioral transformation, new norms of action established across the population";
    case "cultural":
      return horizon === "short-term"
        ? "emergence of new language and narratives in group discourse"
        : horizon === "mid-term"
          ? "shifts in collective identity markers, changes in what the group values and celebrates"
          : "cultural paradigm shift, new shared worldview that replaces the previous one";
    case "social":
      return horizon === "short-term"
        ? "policy announcements, structural adjustments, resource reallocations"
        : horizon === "mid-term"
          ? "implementation of structural reforms, measurable changes in system-level metrics"
          : "institutional transformation, new systemic architecture that supports and sustains the other three quadrants' changes";
  }
}

function getDeviationRisks(quadrant: Quadrant, horizon: string, subjectType: SubjectType): string {
  if (subjectType === "ai-system") return getAiDeviationRisks(quadrant, horizon);
  if (subjectType === "organization") return getOrgDeviationRisks(quadrant, horizon);
  if (subjectType === "technical-system") return getTechDeviationRisks(quadrant, horizon);

  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "resistance to new perspectives, regression to familiar meaning-making patterns"
        : horizon === "mid-term"
          ? "fragmentation of the group into divergent worldviews, loss of shared narrative"
          : "developmental regression under stress, re-emergence of earlier-stage consciousness patterns";
    case "behavioral":
      return horizon === "short-term"
        ? "non-compliance, relapse to previous behavioral patterns, lack of reinforcement"
        : horizon === "mid-term"
          ? "habit decay without sufficient repetition, environmental changes that disrupt new patterns"
          : "systemic behavioral regression, reversion to previous norms under pressure";
    case "cultural":
      return horizon === "short-term"
        ? "narrative rejection, counter-narratives that reinforce the old paradigm"
        : horizon === "mid-term"
          ? "cultural balkanization, splintering into subcultures with incompatible worldviews"
          : "cultural stagnation, the inability to evolve shared meaning in response to changing conditions";
    case "social":
      return horizon === "short-term"
        ? "political resistance, resource constraints, implementation failure"
        : horizon === "mid-term"
          ? "structural reform that is implemented but not internalized, creating a facade of change without substance"
          : "institutional capture, the co-optation of new structures by old power dynamics";
  }
}

function getAiMilestones(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term" ? "interpretability analysis reveals internal representation patterns" : horizon === "mid-term" ? "alignment verification confirms model behavior matches objectives" : "mechanistic interpretability maps decision pathways through model architecture";
    case "behavioral":
      return horizon === "short-term" ? "evaluation benchmarks show performance within acceptable bounds" : horizon === "mid-term" ? "continuous monitoring detects no significant distribution shift" : "behavioral test suite covers known failure modes with stable pass rates";
    case "cultural":
      return horizon === "short-term" ? "transparency reports published with stakeholder feedback collected" : horizon === "mid-term" ? "external review board alignment assessment completed" : "value learning pipeline incorporates diverse cultural perspectives into outputs";
    case "social":
      return horizon === "short-term" ? "dependency graph mapped with cascade risks identified" : horizon === "mid-term" ? "deployment pipeline safety gates operational with automated rollback" : "formal verification completed for critical system safety properties";
  }
}

function getOrgMilestones(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term" ? "360-degree feedback completed with blind spots identified" : horizon === "mid-term" ? "leadership coaching shows measurable shifts in decision-making patterns" : "executive development program graduates demonstrate changed leadership behaviors";
    case "behavioral":
      return horizon === "short-term" ? "process redesign pilot shows reduced handoff friction" : horizon === "mid-term" ? "outcome-based metrics replace activity metrics across teams" : "experiment-driven development practices embedded in team workflows";
    case "cultural":
      return horizon === "short-term" ? "organizational dialogue sessions surface unspoken assumptions" : horizon === "mid-term" ? "cultural audit reveals gap between espoused and enacted values" : "new organizational narrative gains traction replacing old dominant story";
    case "social":
      return horizon === "short-term" ? "power structure mapping complete with bottlenecks identified" : horizon === "mid-term" ? "incentive redesign implemented with collaboration metrics" : "governance reforms operational with transparent resource allocation";
  }
}

function getTechMilestones(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term" ? "architectural decision records created for critical components" : horizon === "mid-term" ? "architecture review identifies and prioritizes technical debt" : "system mental models documented and validated across team";
    case "behavioral":
      return horizon === "short-term" ? "observability pipeline deployed covering all critical paths" : horizon === "mid-term" ? "automated test coverage reaches target thresholds" : "chaos engineering validates system resilience under failure conditions";
    case "cultural":
      return horizon === "short-term" ? "blameless postmortem process established and used consistently" : horizon === "mid-term" ? "documentation culture metrics show improved accuracy and currency" : "knowledge-sharing practices become regular organizational rhythm";
    case "social":
      return horizon === "short-term" ? "service dependency map complete with single points of failure identified" : horizon === "mid-term" ? "infrastructure-as-code eliminates configuration drift" : "disaster recovery procedures tested with documented recovery time objectives";
  }
}

function getAiDeviationRisks(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term" ? "interpretability analysis reveals unexpected representations requiring redesign" : horizon === "mid-term" ? "alignment verification exposes capability gaps reducing performance" : "training distribution shift causes model behavior to diverge from alignment objectives";
    case "behavioral":
      return horizon === "short-term" ? "evaluation benchmarks reveal edge case failures previously unmeasured" : horizon === "mid-term" ? "continuous monitoring produces alert fatigue from false positives" : "behavioral test suite overfitting causes model to optimize for test performance";
    case "cultural":
      return horizon === "short-term" ? "stakeholder feedback reveals conflicting value requirements" : horizon === "mid-term" ? "external review board creates development delays with approval bottlenecks" : "value learning from diverse perspectives produces outputs no stakeholder group fully endorses";
    case "social":
      return horizon === "short-term" ? "dependency mapping reveals critical third-party service vulnerabilities" : horizon === "mid-term" ? "deployment safety gates slow iteration below competitive velocity" : "formal verification proves infeasible for large-scale systems creating safety guarantee gaps";
  }
}

function getOrgDeviationRisks(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term" ? "leadership coaching reduces decision speed as established patterns are questioned" : horizon === "mid-term" ? "360-degree feedback damages relationships by surfacing uncomfortable truths" : "increased self-awareness at top creates dissonance with unsupportive organizational structures";
    case "behavioral":
      return horizon === "short-term" ? "outcome-based metrics incentivize short-term results over long-term health" : horizon === "mid-term" ? "feedback mechanisms surface problems faster than organization can address" : "value stream mapping reveals waste threatening established political arrangements";
    case "cultural":
      return horizon === "short-term" ? "surfacing assumptions creates identity disruption for invested stakeholders" : horizon === "mid-term" ? "rewarding prevention over heroics reduces visibility for crisis responders" : "narrative interventions backfire as perceived inauthentic or imposed from above";
    case "social":
      return horizon === "short-term" ? "power mapping exposes informal hierarchies resisting formal change" : horizon === "mid-term" ? "incentive redesign creates political resistance from those who lose influence" : "governance reforms perceived as bureaucracy rather than enabling frameworks";
  }
}

function getTechDeviationRisks(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term" ? "architecture reviews uncover design debt requiring significant refactoring" : horizon === "mid-term" ? "threat modeling reveals security assumptions requiring fundamental redesign" : "system mental models become outdated creating false confidence in understanding";
    case "behavioral":
      return horizon === "short-term" ? "observability data volume overwhelms teams without proper tooling" : horizon === "mid-term" ? "chaos engineering reveals vulnerabilities requiring architectural not operational fixes" : "distributed tracing adds latency and complexity to service communication";
    case "cultural":
      return horizon === "short-term" ? "blameless postmortems feel unnatural in blame-oriented cultures" : horizon === "mid-term" ? "documentation culture competes with feature development for resources" : "mentorship programs require time investment not showing immediate return";
    case "social":
      return horizon === "short-term" ? "service dependency mapping reveals costly single points of failure" : horizon === "mid-term" ? "infrastructure-as-code learning curve reduces deployment velocity" : "service mesh introduces new critical infrastructure layer becoming itself a dependency";
  }
}

// ─── Subject-Type-Specific Change Velocity Helpers ───────────────────────────

function getAiChangeVelocity(quadrant: Quadrant): string {
  switch (quadrant) {
    case "intentional":
      return "changes with model updates, fine-tuning cycles, and architectural modifications";
    case "behavioral":
      return "changes on a timescale of evaluation cycles — benchmark results shift after retraining or prompt adjustments";
    case "cultural":
      return "evolves as alignment guidelines, transparency reports, and stakeholder feedback are incorporated over weeks to months";
    case "social":
      return "is the slowest to change, as API contracts, dependency chains, and deployment infrastructure require coordinated updates across systems";
  }
}

function getOrgChangeVelocity(quadrant: Quadrant): string {
  switch (quadrant) {
    case "intentional":
      return "can shift through targeted coaching, feedback cycles, and reflective practices";
    case "behavioral":
      return "changes on a timescale of sprint cycles through process redesign, new tooling adoption, and routine adjustment";
    case "cultural":
      return "evolves over months to quarters through sustained dialogue, narrative work, and leadership modeling";
    case "social":
      return "is the slowest to change, as organizational structures, reporting relationships, and incentive systems resist rapid alteration due to political dynamics and coordination costs";
  }
}

function getTechChangeVelocity(quadrant: Quadrant): string {
  switch (quadrant) {
    case "intentional":
      return "changes with architectural decisions, design documentation updates, and team mental model alignment";
    case "behavioral":
      return "changes on a timescale of deployment/release cycles — CI/CD pipelines, test suites, and observability data reflect new behavior";
    case "cultural":
      return "evolves through adoption of engineering practices (blameless postmortems, RFC processes) over sprints to quarters";
    case "social":
      return "is the slowest to change, as service boundaries, infrastructure topology, and data ownership models require coordinated migration across teams and systems";
  }
}

// ─── Subject-Type-Specific Temporal Characteristics Helpers ──────────────────

function getAiTemporalCharacteristics(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      if (horizon === "short-term") return "can experience shifts in internal representations through targeted fine-tuning or interpretability-guided adjustments";
      if (horizon === "mid-term") return "will consolidate alignment objectives into stable behavioral patterns across diverse prompts";
      return "may undergo architectural upgrades that fundamentally restructure how inputs are processed and outputs generated";
    case "behavioral":
      if (horizon === "short-term") return "will show initial benchmark score changes, though performance may vary across distribution shifts";
      if (horizon === "mid-term") return "can establish stable evaluation profiles that persist across prompt variations and edge cases";
      return "may achieve new capability plateaus with robust performance across the full evaluation test suite";
    case "cultural":
      if (horizon === "short-term") return "will show surface-level alignment with published guidelines, though conflict cases remain unresolved";
      if (horizon === "mid-term") return "can begin to incorporate diverse stakeholder values into consistent output patterns";
      return "may achieve value alignment that holds across cultural contexts and stakeholder groups";
    case "social":
      if (horizon === "short-term") return "will show minimal dependency changes due to integration requirements, though API adjustments may begin";
      if (horizon === "mid-term") return "can implement deployment pipeline improvements, though their effectiveness depends on upstream system alignment";
      return "may undergo infrastructure paradigm shifts, but only if supported by corresponding changes in model capabilities and alignment";
  }
}

function getOrgTemporalCharacteristics(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      if (horizon === "short-term") return "can experience shifts in individual awareness through feedback, coaching, or catalytic events";
      if (horizon === "mid-term") return "will consolidate new leadership perspectives into stable decision-making frameworks";
      return "may undergo leadership development transitions that fundamentally restructure how challenges are approached";
    case "behavioral":
      if (horizon === "short-term") return "will show initial process modifications, though adoption remains fragile and context-dependent";
      if (horizon === "mid-term") return "can establish new operational patterns that become standard through practice and reinforcement";
      return "may embody entirely new operational capabilities that reflect deep changes in organizational processes and tooling";
    case "cultural":
      if (horizon === "short-term") return "will show surface-level shifts in language and expressed values, though deeper assumptions remain intact";
      if (horizon === "mid-term") return "can begin to shift organizational narratives and identity as new stories gain traction";
      return "may undergo worldview transitions that redefine what the organization considers valuable and possible";
    case "social":
      if (horizon === "short-term") return "will show minimal structural change due to organizational inertia, though policy adjustments may begin";
      if (horizon === "mid-term") return "can implement structural reforms, though their effectiveness depends on alignment with individual and cultural shifts";
      return "may undergo organizational transformation, but only if supported by corresponding changes in the other three quadrants";
  }
}

function getTechTemporalCharacteristics(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      if (horizon === "short-term") return "can experience shifts in architectural understanding through design reviews and documentation";
      if (horizon === "mid-term") return "will consolidate architectural decisions into stable system models shared across the team";
      return "may undergo architectural paradigm transitions that fundamentally restructure how the system is understood and evolved";
    case "behavioral":
      if (horizon === "short-term") return "will show initial deployment pattern changes, though monitoring and alerting remain fragile";
      if (horizon === "mid-term") return "can establish new operational patterns that become reliable through automation and testing";
      return "may achieve resilient operational capabilities that reflect deep changes in system architecture and deployment practices";
    case "cultural":
      if (horizon === "short-term") return "will show adoption of new engineering rituals (postmortems, RFCs), though deeper engineering assumptions remain intact";
      if (horizon === "mid-term") return "can begin to shift engineering culture as new practices demonstrate value";
      return "may undergo engineering culture transitions that redefine quality, speed, and reliability trade-offs";
    case "social":
      if (horizon === "short-term") return "will show minimal topology changes due to integration dependencies, though service boundaries may be reassessed";
      if (horizon === "mid-term") return "can implement structural infrastructure changes, though their effectiveness depends on team coordination and operational maturity";
      return "may undergo platform paradigm shifts, but only if supported by corresponding changes in engineering culture and operational practices";
  }
}

// ─── Subject-Type-Specific Immediate Impact Helpers ──────────────────────────

function getAiImmediateImpact(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "initiate shifts in model interpretability and internal representation analysis"
        : horizon === "mid-term"
          ? "consolidate new alignment verification capabilities"
          : "transform the foundational architecture from which model behavior emerges";
    case "behavioral":
      return horizon === "short-term"
        ? "produce measurable changes in benchmark scores, though these may require tuning to maintain"
        : horizon === "mid-term"
          ? "establish evaluation patterns that operate with decreasing manual oversight"
          : "achieve new capability levels as stable operational performance";
    case "cultural":
      return horizon === "short-term"
        ? "introduce new transparency practices and stakeholder engagement processes"
        : horizon === "mid-term"
          ? "shift the public narrative around AI capabilities and limitations"
          : "transform the trust framework that shapes how stakeholders interact with the system";
    case "social":
      return horizon === "short-term"
        ? "initiate infrastructure adjustments, though systemic effects will be limited by integration dependencies"
        : horizon === "mid-term"
          ? "implement deployment pipeline changes that begin to reshape the operational landscape"
          : "reconfigure the infrastructure architecture that constrains and enables model serving";
  }
}

function getOrgImmediateImpact(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "initiate shifts in individual awareness and decision-making patterns"
        : horizon === "mid-term"
          ? "consolidate new leadership frameworks into stable organizational thinking"
          : "transform the foundational leadership mindset from which the organization operates";
    case "behavioral":
      return horizon === "short-term"
        ? "produce observable changes in process execution, though these may require conscious effort to maintain"
        : horizon === "mid-term"
          ? "establish new operational routines that run with decreasing management oversight"
          : "embed new operational capabilities as organizational muscle memory";
    case "cultural":
      return horizon === "short-term"
        ? "introduce new language and narratives into organizational discourse"
        : horizon === "mid-term"
          ? "shift the shared stories that define organizational identity and purpose"
          : "transform the cultural worldview that shapes what the organization considers possible and desirable";
    case "social":
      return horizon === "short-term"
        ? "initiate structural adjustments, though systemic effects will be limited by organizational inertia"
        : horizon === "mid-term"
          ? "implement structural reforms that begin to reshape the organizational landscape"
          : "reconfigure the organizational architecture that constrains and enables collective behavior";
  }
}

function getTechImmediateImpact(quadrant: Quadrant, horizon: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "initiate shifts in architectural documentation and design clarity"
        : horizon === "mid-term"
          ? "consolidate new architectural decision patterns into stable system models"
          : "transform the foundational architectural paradigm from which the system evolves";
    case "behavioral":
      return horizon === "short-term"
        ? "produce measurable changes in system behavior and reliability metrics, though these may require ongoing monitoring"
        : horizon === "mid-term"
          ? "establish operational patterns that become self-sustaining through automation and testing"
          : "achieve new operational resilience as a stable characteristic of the system";
    case "cultural":
      return horizon === "short-term"
        ? "introduce new engineering practices into team workflows"
        : horizon === "mid-term"
          ? "shift the engineering culture toward new quality and collaboration standards"
          : "transform the engineering paradigm that shapes how the team builds and operates the system";
    case "social":
      return horizon === "short-term"
        ? "initiate structural infrastructure changes, though systemic effects will be limited by service coupling"
        : horizon === "mid-term"
          ? "implement infrastructure reforms that begin to reshape the deployment landscape"
          : "reconfigure the platform architecture that constrains and enables service development";
  }
}

// ─── Subject-Type-Specific Intervention Trajectory Helpers ───────────────────

function getAiInterventionTrajectory(quadrant: Quadrant, horizon: string, _intervention: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "create immediate shifts in how the model's internal representations are understood and evaluated"
        : horizon === "mid-term"
          ? "embed new alignment verification into stable evaluation pipelines"
          : "contribute to architectural evolution in how model behavior is generated and controlled";
    case "behavioral":
      return horizon === "short-term"
        ? "produce measurable changes in benchmark performance, though these may require ongoing tuning"
        : horizon === "mid-term"
          ? "establish evaluation patterns that become self-sustaining through automated testing"
          : "reconfigure the behavioral test suite available for model validation";
    case "cultural":
      return horizon === "short-term"
        ? "seed new transparency practices into the stakeholder engagement process"
        : horizon === "mid-term"
          ? "shift the public narrative from its current trajectory toward a new trust framework"
          : "establish a new alignment paradigm that redefines stakeholder relationships with the system";
    case "social":
      return horizon === "short-term"
        ? "begin the process of infrastructure adjustment, though full effects will take longer to materialize"
        : horizon === "mid-term"
          ? "implement deployment changes that reshape the conditions within which models are served"
          : "create infrastructure arrangements that sustain and amplify the changes initiated in the other quadrants";
  }
}

function getOrgInterventionTrajectory(quadrant: Quadrant, horizon: string, _intervention: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "create immediate shifts in how individuals understand and engage with organizational challenges"
        : horizon === "mid-term"
          ? "embed new perspectives into stable organizational thinking frameworks"
          : "contribute to leadership evolution in how the organization approaches complexity";
    case "behavioral":
      return horizon === "short-term"
        ? "produce measurable changes in process execution, though these may require ongoing oversight"
        : horizon === "mid-term"
          ? "establish operational patterns that become self-sustaining through routine and reinforcement"
          : "reconfigure the operational capabilities available to the organization";
    case "cultural":
      return horizon === "short-term"
        ? "seed new narratives into the organizational conversation"
        : horizon === "mid-term"
          ? "shift the organizational story from its current trajectory toward a new shared understanding"
          : "establish a new cultural paradigm that redefines the organization's identity and purpose";
    case "social":
      return horizon === "short-term"
        ? "begin the process of structural adjustment, though full effects will take longer to materialize"
        : horizon === "mid-term"
          ? "implement structural changes that reshape the conditions within which teams operate"
          : "create organizational arrangements that sustain and amplify the changes initiated in the other quadrants";
  }
}

function getTechInterventionTrajectory(quadrant: Quadrant, horizon: string, _intervention: string): string {
  switch (quadrant) {
    case "intentional":
      return horizon === "short-term"
        ? "create immediate shifts in how the system architecture is understood and documented"
        : horizon === "mid-term"
          ? "embed architectural decisions into stable design patterns and team mental models"
          : "contribute to architectural evolution in how the system is designed and extended";
    case "behavioral":
      return horizon === "short-term"
        ? "produce measurable changes in system behavior and reliability metrics, though these may require ongoing monitoring"
        : horizon === "mid-term"
          ? "establish operational patterns that become self-sustaining through automation"
          : "reconfigure the operational capabilities available to the platform";
    case "cultural":
      return horizon === "short-term"
        ? "seed new engineering practices into team workflows"
        : horizon === "mid-term"
          ? "shift the engineering culture from its current trajectory toward new quality standards"
          : "establish a new engineering paradigm that redefines how the team builds and operates systems";
    case "social":
      return horizon === "short-term"
        ? "begin the process of infrastructure restructuring, though full effects will take longer to materialize"
        : horizon === "mid-term"
          ? "implement infrastructure changes that reshape the conditions within which services operate"
          : "create platform arrangements that sustain and amplify the changes initiated in the other quadrants";
  }
}

// ─── Subject-Type-Specific Quadrant Manifestation Helpers ────────────────────

function getAiQuadrantManifestation(quadrant: Quadrant, situation: string): string {
  switch (quadrant) {
    case "intentional":
      return `the internal representation patterns, decision boundaries, and alignment characteristics of the AI system in relation to "${situation}". This includes model architecture considerations, interpretability findings, and the evolution of how the system processes and responds to inputs`;
    case "behavioral":
      return `the measurable outputs, benchmark results, error patterns, and performance metrics associated with "${situation}". This includes evaluation scores, latency metrics, failure modes, and any externally observable behavior that can be tracked and quantified`;
    case "cultural":
      return `the stakeholder perceptions, trust frameworks, and ethical guidelines that shape how the AI system's role in "${situation}" is understood. This includes transparency requirements, value alignment concerns, and the narratives that stakeholders hold about the system's capabilities and limitations`;
    case "social":
      return `the infrastructure architecture, deployment pipelines, dependency chains, and integration patterns that shape the operational context in which "${situation}" unfolds. This includes API contracts, service boundaries, scaling constraints, and the technical systems that enable or limit AI capabilities`;
  }
}

function getOrgQuadrantManifestation(quadrant: Quadrant, situation: string): string {
  switch (quadrant) {
    case "intentional":
      return `the individual experiences, beliefs, and sense-making patterns of team members and leaders in relation to "${situation}". This includes shifts in leadership perspective, changes in how individuals interpret organizational challenges, and the evolution of personal commitment to organizational goals`;
    case "behavioral":
      return `the observable process patterns, operational metrics, and performance outcomes associated with "${situation}". This includes workflow efficiency, cycle times, quality metrics, and any externally verifiable operational data that can be tracked and quantified`;
    case "cultural":
      return `the shared organizational narratives, collective values, and cultural norms that shape how the group understands "${situation}". This includes organizational identity, shared assumptions about how work gets done, and the stories that the organization tells itself about its challenges and capabilities`;
    case "social":
      return `the organizational structures, reporting relationships, incentive systems, and governance frameworks that shape the context in which "${situation}" unfolds. This includes team boundaries, decision rights, resource allocation processes, and the structural systems that enable or constrain organizational action`;
  }
}

function getTechQuadrantManifestation(quadrant: Quadrant, situation: string): string {
  switch (quadrant) {
    case "intentional":
      return `the architectural understanding, design decisions, and mental models that the engineering team holds about "${situation}". This includes documented architecture decision records, design rationale, threat models, and the evolution of how the system is conceptualized and understood`;
    case "behavioral":
      return `the observable system behavior, performance metrics, reliability data, and operational outcomes associated with "${situation}". This includes latency, error rates, throughput, resource utilization, and any measurable system characteristics that can be monitored and quantified`;
    case "cultural":
      return `the engineering practices, team norms, and quality standards that shape how the team approaches "${situation}". This includes code review culture, testing discipline, incident response practices, and the shared engineering values that influence technical decisions`;
    case "social":
      return `the service architecture, infrastructure topology, dependency relationships, and platform constraints that shape the operational context in which "${situation}" unfolds. This includes service boundaries, data ownership, deployment patterns, and the infrastructure systems that enable or limit technical capabilities`;
  }
}

// ─── Subject-Type-Specific Trajectory Implication Helpers ────────────────────

function getAiTrajectoryImplication(quadrant: Quadrant, _trajectory: string): string {
  const qInfo = QUADRANTS[quadrant];
  switch (quadrant) {
    case "intentional":
      return `internal representation patterns are already in flux, which may accelerate or constrain planned model adjustments. Architectural understanding often precedes behavioral improvements, suggesting that ${qInfo.label.toLowerCase()} indicators may be leading signals of broader system changes`;
    case "behavioral":
      return `observable performance patterns are already established. Benchmark momentum can be difficult to redirect once entrenched, but behavioral changes are also the most immediately measurable indicators of whether a model update is having the intended effect`;
    case "cultural":
      return `stakeholder trust and perception are evolving. Cultural shifts in AI perception tend to lag behind technical improvements but lead infrastructure changes, making the ${qInfo.label.toLowerCase()} quadrant a critical bridge between model capabilities and deployment scale`;
    case "social":
      return `infrastructure conditions are already in flux. The inertia of deployment systems means that current trajectory may persist beyond the intended update window, creating both opportunities (existing pipeline momentum) and risks (resistance to architectural changes)`;
  }
}

function getOrgTrajectoryImplication(quadrant: Quadrant, _trajectory: string): string {
  const qInfo = QUADRANTS[quadrant];
  switch (quadrant) {
    case "intentional":
      return `individual awareness is already shifting in ways that may accelerate or resist the planned intervention. Leadership mindset changes often precede operational ones, suggesting that ${qInfo.label.toLowerCase()} indicators may be leading signals of broader organizational transformation`;
    case "behavioral":
      return `operational patterns are already in motion. Process momentum can be difficult to redirect once established, but behavioral changes are also the most immediately measurable indicators of whether an intervention is taking effect`;
    case "cultural":
      return `shared organizational understanding is evolving. Cultural shifts tend to lag behind individual awareness changes but lead structural changes, making the ${qInfo.label.toLowerCase()} quadrant a critical bridge between personal transformation and organizational reform`;
    case "social":
      return `structural conditions are already in flux. The inertia of organizational systems means that current trajectory may persist beyond the intended intervention window, creating both opportunities (existing momentum) and risks (resistance to redirection)`;
  }
}

function getTechTrajectoryImplication(quadrant: Quadrant, _trajectory: string): string {
  const qInfo = QUADRANTS[quadrant];
  switch (quadrant) {
    case "intentional":
      return `architectural understanding is already evolving in ways that may accelerate or complicate planned changes. Design clarity often precedes implementation improvements, suggesting that ${qInfo.label.toLowerCase()} indicators may be leading signals of broader system evolution`;
    case "behavioral":
      return `system behavior patterns are already established. Operational momentum can be difficult to redirect once configured, but behavioral changes are also the most immediately measurable indicators of whether infrastructure changes are having the intended effect`;
    case "cultural":
      return `engineering practices are evolving. Practice adoption tends to lag behind technical capability but lead infrastructure changes, making the ${qInfo.label.toLowerCase()} quadrant a critical bridge between tool capabilities and operational excellence`;
    case "social":
      return `infrastructure topology is already in flux. The inertia of distributed systems means that current architecture may persist beyond the intended migration window, creating both opportunities (existing investment momentum) and risks (resistance to topology changes)`;
  }
}

// ─── Subject-Type-Specific Intervention Fit Helpers ──────────────────────────

function getAiInterventionFit(quadrant: Quadrant, _intervention: string): string {
  switch (quadrant) {
    case "intentional":
      return "aligns with model architecture changes if it includes clear alignment objectives and interpretability targets. Purely operational interventions will have limited impact on internal representation without corresponding architectural work";
    case "behavioral":
      return "is well-suited to this quadrant if it specifies measurable targets, evaluation criteria, and concrete behavioral changes. Vague intentions without benchmark specificity will struggle to produce results in this domain";
    case "cultural":
      return "requires engagement with stakeholder trust and transparency to succeed. Interventions that ignore alignment concerns, value requirements, and public perception will encounter resistance regardless of their technical merits";
    case "social":
      return "demands attention to infrastructure conditions — deployment pipelines, dependency management, and integration patterns. Without infrastructure support, even well-designed model changes will lack the scaffolding to operate at scale";
  }
}

function getOrgInterventionFit(quadrant: Quadrant, _intervention: string): string {
  switch (quadrant) {
    case "intentional":
      return "aligns with individual development if it includes leadership coaching, feedback practices, and reflective opportunities. Purely structural interventions will have limited impact here without corresponding individual development work";
    case "behavioral":
      return "is well-suited to this quadrant if it specifies observable process changes, measurable targets, and concrete operational adjustments. Vague intentions without process specificity will struggle to produce results in this domain";
    case "cultural":
      return "requires engagement with organizational meaning-making to succeed. Interventions that ignore cultural narratives, shared values, and collective identity will encounter resistance regardless of their structural or operational merits";
    case "social":
      return "demands attention to structural conditions — reporting relationships, incentive systems, resource allocation, and governance. Without structural support, even well-intentioned individual and process changes will lack the scaffolding to sustain themselves";
  }
}

function getTechInterventionFit(quadrant: Quadrant, _intervention: string): string {
  switch (quadrant) {
    case "intentional":
      return "aligns with architectural evolution if it includes design documentation, decision records, and team mental model alignment. Purely operational interventions will have limited impact on system understanding without corresponding architectural clarity";
    case "behavioral":
      return "is well-suited to this quadrant if it specifies measurable targets, monitoring criteria, and concrete system behavior changes. Vague intentions without observability specificity will struggle to produce results in this domain";
    case "cultural":
      return "requires engagement with engineering practices to succeed. Interventions that ignore code review culture, testing discipline, and incident response practices will encounter resistance regardless of their architectural or infrastructural merits";
    case "social":
      return "demands attention to infrastructure conditions — service boundaries, data ownership, deployment pipelines, and platform constraints. Without infrastructure support, even well-designed code changes will lack the scaffolding to operate reliably at scale";
  }
}

function getInteractionEffect(quadrant: Quadrant, horizon: string): string {
  const otherQuadrants: Quadrant[] = (["intentional", "behavioral", "cultural", "social"] as Quadrant[]).filter(
    (q) => q !== quadrant
  );
  return `a ${horizon === "short-term" ? "nascent" : horizon === "mid-term" ? "developing" : "mature"} feedback relationship between ${QUADRANTS[quadrant].label.toLowerCase()} and the ${otherQuadrants.map((q) => QUADRANTS[q].label.toLowerCase()).join(", ")} quadrants. Changes in ${QUADRANTS[quadrant].label.toLowerCase()} will ${horizon === "long-term" ? "have fully cascaded into" : "begin to influence"} the other domains, creating either virtuous cycles of mutual reinforcement or vicious cycles of mutual sabotage`;
}

// ─── Temporal Dynamics Analysis ──────────────────────────────────────────────

function generateTemporalDynamicsAnalysis(
  input: AqalProjectionInput & { output_depth: OutputDepth },
  config: DepthConfig,
  subjectType: SubjectType,
  composerCtx?: ProjectionComposerContext
): string {
  if (composerCtx) {
    const composed = composeToolContent({
      toolName: "think_aqal_projection",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: 5,
      totalSteps: 5,
      thoughtType: "synthetic" as ThoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return `## Temporal Dynamics Analysis\n\n${composed}`;
  }

  const { situation, current_trajectory: _current_trajectory, intervention_planned, time_constraints } = input;

  let analysis = `## Temporal Dynamics Analysis\n\n`;
  analysis += `**Situation:** ${situation}\n\n`;

  const frameworkNote = subjectType !== "human"
    ? `**Note:** Subject type detected as '${subjectType}'. Quadrant change velocities are described in structural/architectural terms appropriate for non-human subjects.\n\n`
    : "";

  analysis += `### Quadrant Change Velocity\n\n`;
  analysis += frameworkNote;

  if (subjectType === "human") {
    analysis += `The four quadrants change at fundamentally different rates, which has profound implications for intervention design:\n\n`;
    analysis += `1. **Intentional (UL) — Fastest:** Can shift instantaneously through insight, reframing, or catalytic experience. Interior transformation is the most agile quadrant and can serve as a leading indicator of change.\n`;
    analysis += `2. **Behavioral (UR) — Fast:** Changes over weeks to months through habit formation, practice, and neuroplasticity. Behavioral change is measurable and concrete but requires sustained effort to consolidate.\n`;
    analysis += `3. **Cultural (LL) — Slow:** Evolves over months to years through sustained dialogue, shared experience, and narrative evolution. Cultural change requires the participation of the collective and cannot be mandated.\n`;
    analysis += `4. **Social (LR) — Slowest:** Transforms over years to decades through institutional evolution, policy change, and structural reform. Social systems have the greatest inertia and the longest feedback loops.\n\n`;
  } else if (subjectType === "ai-system") {
    analysis += `The four quadrants change at fundamentally different rates for an AI system:\n\n`;
    analysis += `1. **Intentional (UL) — Fastest:** Can shift with model updates, fine-tuning cycles, and architectural modifications. Internal representation changes are the most agile dimension.\n`;
    analysis += `2. **Behavioral (UR) — Fast:** Changes on a timescale of evaluation cycles — benchmark results shift after retraining or prompt adjustments. Behavioral change is measurable and concrete.\n`;
    analysis += `3. **Cultural (LL) — Slow:** Evolves as alignment guidelines, transparency reports, and stakeholder feedback are incorporated over weeks to months. Trust frameworks require sustained engagement.\n`;
    analysis += `4. **Social (LR) — Slowest:** Transforms through API contract changes, dependency updates, and deployment infrastructure modifications. Infrastructure systems have the greatest inertia.\n\n`;
  } else if (subjectType === "organization") {
    analysis += `The four quadrants change at fundamentally different rates for an organization:\n\n`;
    analysis += `1. **Intentional (UL) — Fastest:** Can shift through targeted coaching, feedback cycles, and reflective practices. Individual awareness changes are the most agile dimension.\n`;
    analysis += `2. **Behavioral (UR) — Fast:** Changes on a timescale of sprint cycles through process redesign, new tooling adoption, and routine adjustment. Process changes are measurable and concrete.\n`;
    analysis += `3. **Cultural (LL) — Slow:** Evolves over months to quarters through sustained dialogue, narrative work, and leadership modeling. Organizational culture requires collective participation.\n`;
    analysis += `4. **Social (LR) — Slowest:** Transforms through structural reorganization, incentive redesign, and governance reform. Organizational systems have the greatest inertia due to political dynamics and coordination costs.\n\n`;
  } else if (subjectType === "technical-system") {
    analysis += `The four quadrants change at fundamentally different rates for a technical system:\n\n`;
    analysis += `1. **Intentional (UL) — Fastest:** Changes with architectural decisions, design documentation updates, and team mental model alignment. Architectural understanding can shift rapidly.\n`;
    analysis += `2. **Behavioral (UR) — Fast:** Changes on a timescale of deployment/release cycles — CI/CD pipelines, test suites, and observability data reflect new behavior. System behavior is measurable and concrete.\n`;
    analysis += `3. **Cultural (LL) — Slow:** Evolves through adoption of engineering practices (blameless postmortems, RFC processes) over sprints to quarters. Engineering culture requires team-wide adoption.\n`;
    analysis += `4. **Social (LR) — Slowest:** Transforms through service boundary changes, infrastructure topology shifts, and data ownership model evolution. Platform architecture has the greatest inertia due to cross-team coordination requirements.\n\n`;
  } else {
    analysis += `The four quadrants change at fundamentally different rates, which has profound implications for intervention design.\n\n`;
  }

  if (config.includeCrossQuadrantDynamics) {
    analysis += `### Leading and Lagging Quadrants\n\n`;
    analysis += `In the context of "${situation}", the temporal asymmetry between quadrants creates both opportunities and risks:\n\n`;

    if (subjectType === "human") {
      analysis += `**Leading Quadrants:** The Intentional and Behavioral quadrants will respond most quickly to the intervention "${intervention_planned}". This creates a window of opportunity in which early wins can build momentum for the slower quadrants. However, if interior and behavioral changes outpace cultural and structural support, they risk regression — the individual who transforms interiorly but returns to an unchanged culture and system will experience dissonance that may lead to cynicism or burnout.\n\n`;
      analysis += `**Lagging Quadrants:** The Cultural and Social quadrants will take longer to respond, creating a "valley of disappointment" between the initial enthusiasm of interior/behavioral change and the eventual institutionalization of that change in culture and structure. The critical risk during this valley is premature abandonment — the perception that the intervention "isn't working" because the slower quadrants have not yet shifted.\n\n`;
      analysis += `**Temporal Synchronization:** Effective intervention design requires pacing that respects the natural velocity of each quadrant. The intentional quadrant can be addressed immediately, the behavioral quadrant should show results within weeks, the cultural quadrant requires months of sustained attention, and the social quadrant needs years of structural work to fully transform. Attempting to accelerate the slower quadrants beyond their natural pace typically produces superficial compliance without genuine transformation.\n`;
    } else {
      analysis += `**Leading Quadrants:** The Intentional and Behavioral quadrants will respond most quickly to the intervention "${intervention_planned}". This creates a window of opportunity in which early indicators can build momentum for the slower quadrants. However, if fast-changing dimensions outpace the cultural and structural support dimensions, they risk instability.\n\n`;
      analysis += `**Lagging Quadrants:** The Cultural and Social quadrants will take longer to respond, creating a gap between initial progress in fast dimensions and eventual institutionalization in slower dimensions. The critical risk during this gap is premature abandonment — the perception that the intervention "isn't working" because the slower quadrants have not yet shifted.\n\n`;
      analysis += `**Temporal Synchronization:** Effective intervention design requires pacing that respects the natural velocity of each quadrant. The intentional quadrant can be addressed immediately, the behavioral quadrant should show results within the relevant cycle time, the cultural quadrant requires sustained attention, and the social quadrant needs structural work to fully transform. Attempting to accelerate the slower quadrants beyond their natural pace typically produces superficial compliance without meaningful change.\n`;
    }
  }

  if (time_constraints) {
    analysis += `\n### Time Constraint Impact\n\n`;
    analysis += `Given the stated time constraints ("${time_constraints}"), the intervention design must account for the fact that ${time_constraints.toLowerCase().includes("urgent") || time_constraints.toLowerCase().includes("short") || time_constraints.toLowerCase().includes("immediate") ? "not all quadrants can be fully addressed within the available timeframe. Priority should be given to the quadrants with the fastest change velocity while planting seeds for longer-term transformation in slower quadrants" : "the available timeframe may be sufficient for meaningful change across all quadrants, though the depth of transformation in the slower quadrants will be proportional to the sustained attention they receive"}.`;
  }

  if (subjectType === "mixed") {
    analysis += `\n\n**Note:** This scenario spans multiple subject domains. Projections integrate perspectives from all applicable frameworks.`;
  }

  return analysis;
}

// ─── Tool Registration ───────────────────────────────────────────────────────

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_aqal_projection",
    {
      title: "AQAL Temporal Projection Analysis",
      description:
        "Generates AQAL temporal projections showing how a situation may evolve across all 4 quadrants " +
        "(Intentional, Behavioral, Cultural, Social) at three time horizons: Short-Term (<1 year), Mid-Term (1-3 years), " +
        "Long-Term (3+ years). The output follows a template-based framework that projects potential changes at different " +
        "rates per quadrant — behavioral changes tend to be fastest, cultural changes slowest. Produces structured temporal " +
        "analysis sections for each quadrant at each time horizon, helping anticipate how different dimensions of a situation " +
        "may unfold over time.",
      inputSchema: z
        .object({
          situation: z
            .string()
            .describe("The situation or challenge to analyze"),
          current_trajectory: z
            .string()
            .describe("What's already changing and how"),
          intervention_planned: z
            .string()
            .describe("What change is being attempted"),
          time_constraints: z
            .string()
            .describe("Any deadline or urgency factors"),
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
        const input: AqalProjectionInput & { output_depth: OutputDepth } = {
          situation: args.situation,
          current_trajectory: args.current_trajectory,
          intervention_planned: args.intervention_planned,
          time_constraints: args.time_constraints,
          output_depth: args.output_depth ?? "standard",
        };

        const config = DEPTH_CONFIGS[input.output_depth];
        const fullText = `${input.situation} ${input.current_trajectory} ${input.intervention_planned} ${input.time_constraints}`;
        const subjectType = detectSubjectType(input.situation, input.current_trajectory, input.intervention_planned, input.time_constraints);
        const outputMode = args.output_mode ?? 'analytical';
        const composerCtx: ProjectionComposerContext = {
          fullText,
          initialPosition: input.current_trajectory,
          outputMode,
        };

        const quadrants: Record<Quadrant, ProjectionRow> = {
          intentional: generateQuadrantAnalysis("intentional", input, config, subjectType, composerCtx),
          behavioral: generateQuadrantAnalysis("behavioral", input, config, subjectType, composerCtx),
          cultural: generateQuadrantAnalysis("cultural", input, config, subjectType, composerCtx),
          social: generateQuadrantAnalysis("social", input, config, subjectType, composerCtx),
        };

        const formattedOutput = formatAqalProjection(input.situation, quadrants, outputMode);
        const temporalDynamics = generateTemporalDynamicsAnalysis(input, config, subjectType, composerCtx);

        const epistemicStatus: EpistemicStatus = input.output_depth === 'exhaustive' ? 'well-supported' : input.output_depth === 'standard' ? 'tentative' : 'speculative';
        const suggestedFollowup: SuggestedTool[] = ['think_hierarchical', 'think_unity'];

        const metaAnalysis = `\n\n## Meta-Analysis\n\n- **Epistemic Status:** ${epistemicStatus}\n- **Suggested Follow-ups:** ${suggestedFollowup.join(', ')}`;

        let exploratorySection = '';
        if (args.output_mode === 'exploratory') {
          exploratorySection = `\n\n## Open Questions\n\n1. Which quadrant's projected trajectory is most vulnerable to disruption from external shocks, and what would cascade from that disruption?\n2. If the long-term projection for one quadrant fails to materialize, how would the other quadrants compensate or amplify the deviation?\n3. What signals should we monitor in the next 90 days that would indicate the projections are off-track?`;
        }

        const fullOutput = `${formattedOutput}\n\n---\n\n${temporalDynamics}${metaAnalysis}${exploratorySection}`;

        return {
          content: [{ type: "text", text: fullOutput }],
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error in think_aqal_projection";
        return {
          content: [
            {
              type: "text",
              text: `Error generating AQAL projection analysis: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
