import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { OutputDepth, AqalProjectionInput, ProjectionRow, Quadrant, EpistemicStatus, SuggestedTool, OutputMode } from "../types.js";
import { QUADRANTS } from "../constants.js";
import { formatAqalProjection } from "../utils/formatters.js";

// ─── Tool Annotations ────────────────────────────────────────────────────────

const TOOL_ANNOTATIONS = {
  readOnlyHint: true as const,
  destructiveHint: false as const,
  idempotentHint: true as const,
  openWorldHint: false as const,
};

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
  config: DepthConfig
): ProjectionRow {
  const { situation, current_trajectory, intervention_planned, time_constraints } = input;

  return {
    situation_summary: generateSituationSummary(quadrant, situation, current_trajectory),
    solution_summary: generateSolutionSummary(quadrant, intervention_planned, time_constraints),
    short_term: generateTemporalProjection(quadrant, "short-term", situation, intervention_planned, current_trajectory, config),
    mid_term: generateTemporalProjection(quadrant, "mid-term", situation, intervention_planned, current_trajectory, config),
    long_term: generateTemporalProjection(quadrant, "long-term", situation, intervention_planned, current_trajectory, config),
  };
}

function generateSituationSummary(
  quadrant: Quadrant,
  situation: string,
  currentTrajectory: string
): string {
  const qInfo = QUADRANTS[quadrant];
  return `In the ${qInfo.full_label} quadrant, the situation "${situation}" manifests as ${getQuadrantSpecificManifestation(quadrant, situation)}. The current trajectory ("${currentTrajectory}") indicates that ${getTrajectoryImplication(quadrant, currentTrajectory)}. This quadrant's epistemology — ${qInfo.epistemology.toLowerCase()} — reveals dimensions of the situation that other quadrants cannot access.`;
}

function generateSolutionSummary(
  quadrant: Quadrant,
  interventionPlanned: string,
  timeConstraints: string
): string {
  const qInfo = QUADRANTS[quadrant];
  return `Addressing the situation from the ${qInfo.full_label} perspective, the planned intervention "${interventionPlanned}" ${assessInterventionFit(quadrant, interventionPlanned)}. ${timeConstraints ? `Time constraints ("${timeConstraints}") ${getTimeConstraintImpact(quadrant, timeConstraints)}.` : "In the absence of explicit time constraints, this quadrant can proceed at its natural pace of change."} The solution approach must honor this quadrant's unique mode of knowing and acting.`;
}

function generateTemporalProjection(
  quadrant: Quadrant,
  horizon: "short-term" | "mid-term" | "long-term",
  situation: string,
  interventionPlanned: string,
  currentTrajectory: string,
  config: DepthConfig
): string {
  const qInfo = QUADRANTS[quadrant];
  const temporalCharacteristics = getTemporalCharacteristics(quadrant, horizon);

  const base = `Over the ${horizon === "short-term" ? "<1 year" : horizon === "mid-term" ? "1-3 year" : "3+ year"} horizon, the ${qInfo.label} quadrant ${temporalCharacteristics}.`;

  if (config.temporalDetail === "basic") {
    return `${base} The planned intervention "${interventionPlanned}" will ${getImmediateImpact(quadrant, horizon)} in this domain.`;
  }

  const elaboration = generateTemporalElaboration(quadrant, horizon, situation, interventionPlanned, currentTrajectory, config);
  return `${base}\n\n${elaboration}`;
}

function generateTemporalElaboration(
  quadrant: Quadrant,
  horizon: string,
  situation: string,
  interventionPlanned: string,
  currentTrajectory: string,
  config: DepthConfig
): string {
  const qInfo = QUADRANTS[quadrant];
  const changeVelocity = getChangeVelocity(quadrant);

  let content = `Given that the ${qInfo.label} quadrant ${changeVelocity}, the ${horizon} projection for "${situation}" should account for ${getProjectionConsideration(quadrant, horizon)}. `;

  content += `The intervention "${interventionPlanned}" will ${getInterventionTrajectory(quadrant, horizon, interventionPlanned)}. `;

  if (config.temporalDetail === "comprehensive") {
    content += `\n\nKey milestones to monitor include: ${getMilestones(quadrant, horizon)}. `;
    content += `Potential deviations from the projected trajectory include: ${getDeviationRisks(quadrant, horizon)}. `;
    content += `The interaction between the current trajectory ("${currentTrajectory}") and the planned intervention creates ${getInteractionEffect(quadrant, horizon)}.`;
  }

  return content;
}

// ─── Quadrant-Specific Content Generators ────────────────────────────────────

function getQuadrantSpecificManifestation(quadrant: Quadrant, situation: string): string {
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

function getTrajectoryImplication(quadrant: Quadrant, _trajectory: string): string {
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

function assessInterventionFit(quadrant: Quadrant, _intervention: string): string {
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

function getTimeConstraintImpact(quadrant: Quadrant, constraints: string): string {
  const velocity = getChangeVelocity(quadrant);
  if (constraints.toLowerCase().includes("urgent") || constraints.toLowerCase().includes("immediate") || constraints.toLowerCase().includes("short")) {
    return `may create tension in the ${quadrant} quadrant, which ${velocity}. Urgency in this domain risks superficial compliance without genuine transformation`;
  }
  return `provides a temporal frame within which the ${quadrant} quadrant's natural pace of change (${velocity}) can be assessed against external expectations`;
}

function getChangeVelocity(quadrant: Quadrant): string {
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

function getTemporalCharacteristics(quadrant: Quadrant, horizon: string): string {
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

function getImmediateImpact(quadrant: Quadrant, horizon: string): string {
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

function getProjectionConsideration(quadrant: Quadrant, horizon: string): string {
  const velocity = getChangeVelocity(quadrant);
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

function getInterventionTrajectory(quadrant: Quadrant, horizon: string, _intervention: string): string {
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

function getMilestones(quadrant: Quadrant, horizon: string): string {
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

function getDeviationRisks(quadrant: Quadrant, horizon: string): string {
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

function getInteractionEffect(quadrant: Quadrant, horizon: string): string {
  const otherQuadrants: Quadrant[] = (["intentional", "behavioral", "cultural", "social"] as Quadrant[]).filter(
    (q) => q !== quadrant
  );
  return `a ${horizon === "short-term" ? "nascent" : horizon === "mid-term" ? "developing" : "mature"} feedback relationship between ${QUADRANTS[quadrant].label.toLowerCase()} and the ${otherQuadrants.map((q) => QUADRANTS[q].label.toLowerCase()).join(", ")} quadrants. Changes in ${QUADRANTS[quadrant].label.toLowerCase()} will ${horizon === "long-term" ? "have fully cascaded into" : "begin to influence"} the other domains, creating either virtuous cycles of mutual reinforcement or vicious cycles of mutual sabotage`;
}

// ─── Temporal Dynamics Analysis ──────────────────────────────────────────────

function generateTemporalDynamicsAnalysis(
  input: AqalProjectionInput & { output_depth: OutputDepth },
  config: DepthConfig
): string {
  const { situation, current_trajectory: _current_trajectory, intervention_planned, time_constraints } = input;

  let analysis = `## Temporal Dynamics Analysis\n\n`;
  analysis += `**Situation:** ${situation}\n\n`;

  analysis += `### Quadrant Change Velocity\n\n`;
  analysis += `The four quadrants change at fundamentally different rates, which has profound implications for intervention design:\n\n`;
  analysis += `1. **Intentional (UL) — Fastest:** Can shift instantaneously through insight, reframing, or catalytic experience. Interior transformation is the most agile quadrant and can serve as a leading indicator of change.\n`;
  analysis += `2. **Behavioral (UR) — Fast:** Changes over weeks to months through habit formation, practice, and neuroplasticity. Behavioral change is measurable and concrete but requires sustained effort to consolidate.\n`;
  analysis += `3. **Cultural (LL) — Slow:** Evolves over months to years through sustained dialogue, shared experience, and narrative evolution. Cultural change requires the participation of the collective and cannot be mandated.\n`;
  analysis += `4. **Social (LR) — Slowest:** Transforms over years to decades through institutional evolution, policy change, and structural reform. Social systems have the greatest inertia and the longest feedback loops.\n\n`;

  if (config.includeCrossQuadrantDynamics) {
    analysis += `### Leading and Lagging Quadrants\n\n`;
    analysis += `In the context of "${situation}", the temporal asymmetry between quadrants creates both opportunities and risks:\n\n`;
    analysis += `**Leading Quadrants:** The Intentional and Behavioral quadrants will respond most quickly to the intervention "${intervention_planned}". This creates a window of opportunity in which early wins can build momentum for the slower quadrants. However, if interior and behavioral changes outpace cultural and structural support, they risk regression — the individual who transforms interiorly but returns to an unchanged culture and system will experience dissonance that may lead to cynicism or burnout.\n\n`;
    analysis += `**Lagging Quadrants:** The Cultural and Social quadrants will take longer to respond, creating a "valley of disappointment" between the initial enthusiasm of interior/behavioral change and the eventual institutionalization of that change in culture and structure. The critical risk during this valley is premature abandonment — the perception that the intervention "isn't working" because the slower quadrants have not yet shifted.\n\n`;
    analysis += `**Temporal Synchronization:** Effective intervention design requires pacing that respects the natural velocity of each quadrant. The intentional quadrant can be addressed immediately, the behavioral quadrant should show results within weeks, the cultural quadrant requires months of sustained attention, and the social quadrant needs years of structural work to fully transform. Attempting to accelerate the slower quadrants beyond their natural pace typically produces superficial compliance without genuine transformation.\n`;
  }

  if (time_constraints) {
    analysis += `\n### Time Constraint Impact\n\n`;
    analysis += `Given the stated time constraints ("${time_constraints}"), the intervention design must account for the fact that ${time_constraints.toLowerCase().includes("urgent") || time_constraints.toLowerCase().includes("short") || time_constraints.toLowerCase().includes("immediate") ? "not all quadrants can be fully addressed within the available timeframe. Priority should be given to the quadrants with the fastest change velocity (Intentional and Behavioral) while planting seeds for longer-term Cultural and Social transformation" : "the available timeframe may be sufficient for meaningful change across all quadrants, though the depth of transformation in the Cultural and Social quadrants will be proportional to the sustained attention they receive"}.`;
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
        "Integral AQAL analysis with temporal projections. Maps how a situation evolves across all 4 quadrants (Intentional, Behavioral, Cultural, Social) at three time horizons: Short-Term (<1 year), Mid-Term (1-3 years), Long-Term (3+ years). Recognizes that different quadrants change at different rates — behavioral changes fastest, cultural changes slowest.",
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

        const quadrants: Record<Quadrant, ProjectionRow> = {
          intentional: generateQuadrantAnalysis("intentional", input, config),
          behavioral: generateQuadrantAnalysis("behavioral", input, config),
          cultural: generateQuadrantAnalysis("cultural", input, config),
          social: generateQuadrantAnalysis("social", input, config),
        };

        const formattedOutput = formatAqalProjection(input.situation, quadrants, args.output_mode ?? 'analytical');
        const temporalDynamics = generateTemporalDynamicsAnalysis(input, config);

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
