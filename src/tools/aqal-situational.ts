import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { QuadrantAnalysis, OutputDepth, Quadrant, EpistemicStatus, SuggestedTool, OutputMode, PsychographProfile, LineOfDevelopment, DevelopmentalLevel, SubjectType } from "../types.js";
import { formatAqalSituational } from "../utils/formatters.js";
import { LINES_OF_DEVELOPMENT, DEVELOPMENTAL_LEVELS } from "../constants.js";
import { composeToolContent } from "../utils/content-pipeline.js";
import type { ThoughtType } from "../types.js";

function detectSubjectType(
  situation: string,
  stakeholders: string,
  observableData: string,
  reportedExperience: string,
  culturalContext: string,
  systemicContext: string,
): SubjectType {
  const combined = `${situation} ${stakeholders} ${observableData} ${reportedExperience} ${culturalContext} ${systemicContext}`.toLowerCase();
  const aiSignals = ["model", "agent", "ai ", "neural", "training", "inference", "prompt", "llm", "language model", "algorithm", "generation", "token"];
  const orgSignals = ["team", "organization", "company", "department", "management", "culture", "workflow", "velocity", "sprint", "standup", "silo", "stakeholder"];
  const techSignals = ["api", "microservice", "database", "pipeline", "deployment", "infrastructure", "server", "container", "kubernetes", "docker", "cloud", "monolith"];
  const aiScore = aiSignals.filter(s => combined.includes(s)).length;
  const orgScore = orgSignals.filter(s => combined.includes(s)).length;
  const techScore = techSignals.filter(s => combined.includes(s)).length;

  // Check for mixed: two or more scores within 1 of max AND >= 2
  const scores = [aiScore, orgScore, techScore];
  const maxScore = Math.max(...scores);
  if (maxScore >= 2) {
    const nearMax = scores.filter(s => maxScore - s <= 1).length;
    if (nearMax >= 2) return "mixed";
  }

  if (aiScore >= 2 && aiScore >= orgScore && aiScore >= techScore) return "ai-system";
  if (orgScore >= 2 && orgScore >= aiScore && orgScore >= techScore) return "organization";
  if (techScore >= 2 && techScore >= aiScore && techScore >= orgScore) return "technical-system";
  return "human";
}

// ─── Composer Context ────────────────────────────────────────────────────────

interface AqalComposerContext {
  fullText: string;
  initialPosition: string;
  outputMode: OutputMode;
}

// ─── Composer Helper ─────────────────────────────────────────────────────────

function tryComposeQuadrant(
  quadrant: Quadrant,
  composerCtx?: AqalComposerContext,
  stepNumber?: number,
  totalSteps?: number,
  thoughtTypeMap?: Record<Quadrant, ThoughtType>
): string | null {
  if (!composerCtx) return null;
  const thoughtType = thoughtTypeMap?.[quadrant] ?? "diagnostic";
  const composed = composeToolContent({
    toolName: "think_aqal_situational",
    text: composerCtx.fullText,
    initialPosition: composerCtx.initialPosition,
    mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
    subMode: "deductive",
    stepNumber: stepNumber ?? 1,
    totalSteps: totalSteps ?? 4,
    thoughtType,
    previousOutputs: [],
  });
  return composed.length > 200 ? composed : null;
}

// ─── Sentence Extraction Helper ──────────────────────────────────────────────

function extractSentences(text: string, min: number, max: number): string[] {
  // Split by sentence boundaries (. ! ? followed by space or newline)
  const raw = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && !s.startsWith('#') && !s.startsWith('*'));

  if (raw.length >= min) return raw.slice(0, max);
  // If not enough sentence-boundary splits, try by newlines
  const byLines = text
    .split('\n')
    .map(l => l.replace(/^[-*]\s*/, '').trim())
    .filter(l => l.length > 15);
  if (byLines.length >= min) return byLines.slice(0, max);
  return [];
}

// ─── Quadrant Analysis Engine ────────────────────────────────────────────────

function generateQuadrantAnalysis(params: {
  quadrant: Quadrant;
  situation: string;
  stakeholders: string;
  observableData: string;
  reportedExperience: string;
  culturalContext: string;
  systemicContext: string;
  depth: OutputDepth;
  subjectType: SubjectType;
  composerCtx?: AqalComposerContext;
  stepNumber?: number;
  totalSteps?: number;
}): QuadrantAnalysis {
  const { quadrant, situation, stakeholders, observableData, reportedExperience, culturalContext, systemicContext, depth, subjectType, composerCtx } = params;

  const depthModifier = depth === "essential" ? "concisely" : depth === "exhaustive" ? "with maximum granularity and multi-layered depth" : "with balanced thoroughness";

  const thoughtTypeMap: Record<Quadrant, ThoughtType> = {
    intentional: "perspectival",
    behavioral: "perspectival",
    cultural: "perspectival",
    social: "perspectival",
  };

  const quadrantGenerators: Record<Quadrant, () => QuadrantAnalysis> = {
    intentional: () => {
      const composed = tryComposeQuadrant("intentional", composerCtx, 1, 4, thoughtTypeMap);
      return {
        context_summary: composed ?? `From the interior-individual perspective, the situation "${situation}" involves subjective experiences of ${stakeholders || "the individuals involved"}. The reported experience — "${reportedExperience}" — reveals the phenomenological landscape: how people are making sense of events from within their own consciousness. This quadrant examines the beliefs, values, emotional states, self-narratives, and meaning-making processes that shape individual responses to the situation. At ${depth} depth, we ${depthModifier} explore the layers of subjective interpretation that filter and color each person's experience.`,
        solution_summary: `Address the intentional dimension by facilitating shifts in self-awareness, emotional regulation, and meaning-making frameworks. Interventions at this level include reflective practices, cognitive reframing, values clarification, and the cultivation of meta-awareness — the capacity to observe one own thought and emotional patterns rather than being identified with them.`,
        strategies: generateStrategies("intentional", depth, subjectType, composerCtx),
        second_order_effects: generateSecondOrderEffects("intentional", depth, subjectType, composerCtx),
      };
    },
    behavioral: () => {
      const composed = tryComposeQuadrant("behavioral", composerCtx, 2, 4, thoughtTypeMap);
      return {
        context_summary: composed ?? `From the exterior-individual perspective, the situation manifests in observable, measurable phenomena. The observable data — "${observableData}" — provides the empirical baseline: behaviors, performance metrics, physiological indicators, and other third-person data points. This quadrant examines what can be objectively measured about the individuals involved, independent of their subjective reports. At ${depth} depth, we ${depthModifier} analyze the behavioral patterns, their frequency, intensity, and correlation with environmental triggers.`,
        solution_summary: `Address the behavioral dimension through evidence-based interventions targeting observable patterns. This includes behavioral modification techniques, skills training, environmental redesign to shape behavior, and the establishment of measurement systems that provide objective feedback on progress.`,
        strategies: generateStrategies("behavioral", depth, subjectType, composerCtx),
        second_order_effects: generateSecondOrderEffects("behavioral", depth, subjectType, composerCtx),
      };
    },
    cultural: () => {
      const composed = tryComposeQuadrant("cultural", composerCtx, 3, 4, thoughtTypeMap);
      return {
        context_summary: composed ?? `From the interior-collective perspective, the situation is embedded in a web of shared meanings, values, and worldviews. The cultural context — "${culturalContext}" — defines the interpretive lens through which the group makes sense of events. This quadrant examines the intersubjective agreements, unwritten norms, collective narratives, and shared identity constructs that shape how "we" understand and respond to the situation. At ${depth} depth, we ${depthModifier} map the cultural layers from surface-level norms to deep worldview assumptions.`,
        solution_summary: `Address the cultural dimension through dialogue, shared meaning-making processes, and the intentional evolution of collective values. Interventions include facilitated sensemaking sessions, narrative work that reshapes the group's story about itself, and the cultivation of cultural conditions that support desired behavioral and structural changes.`,
        strategies: generateStrategies("cultural", depth, subjectType, composerCtx),
        second_order_effects: generateSecondOrderEffects("cultural", depth, subjectType, composerCtx),
      };
    },
    social: () => {
      const composed = tryComposeQuadrant("social", composerCtx, 4, 4, thoughtTypeMap);
      return {
        context_summary: composed ?? `From the exterior-collective perspective, the situation is shaped by objective systems, structures, and institutional arrangements. The systemic context — "${systemicContext}" — defines the architectural constraints and enablers that govern collective behavior. This quadrant examines the laws, policies, organizational structures, economic arrangements, technological infrastructure, and other inter-objective systems that create the conditions within which individuals and cultures operate. At ${depth} depth, we ${depthModifier} analyze the structural leverage points and systemic feedback loops.`,
        solution_summary: `Address the social dimension through structural interventions: policy changes, organizational redesign, process reengineering, and the modification of systemic incentives and constraints. Interventions target the architecture of collective life rather than the individuals within it.`,
        strategies: generateStrategies("social", depth, subjectType, composerCtx),
        second_order_effects: generateSecondOrderEffects("social", depth, subjectType, composerCtx),
      };
    },
  };

  return quadrantGenerators[quadrant]();
}

function getStrategiesForSubjectType(quadrant: Quadrant, depth: OutputDepth, subjectType: SubjectType): string[] {
  if (subjectType === "ai-system") return getAiSystemStrategies(quadrant, depth);
  if (subjectType === "organization") return getOrganizationStrategies(quadrant, depth);
  if (subjectType === "technical-system") return getTechnicalSystemStrategies(quadrant, depth);
  if (subjectType === "mixed") {
    const ai = getAiSystemStrategies(quadrant, depth);
    const org = getOrganizationStrategies(quadrant, depth);
    const merged = [...new Set([...ai, ...org])];
    return merged.slice(0, 8);
  }
  return [];
}

function generateStrategies(quadrant: Quadrant, depth: OutputDepth, subjectType: SubjectType, composerCtx?: AqalComposerContext): string[] {
  let composedStrategies: string[] = [];
  if (composerCtx) {
    const composed = composeToolContent({
      toolName: "think_aqal_situational",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: 5,
      totalSteps: 6,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
    if (composed.length > 100) {
      // Try to parse bullet lines first
      const parsedLines = composed.split('\n').filter(l => l.trim().length > 0 && l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, ''));
      if (parsedLines.length > 0) {
        composedStrategies = parsedLines;
      } else {
        // Composed content is prose — extract sentences with relaxed threshold
        const sentenceStrategies = extractSentences(composed, 1, 5);
        if (sentenceStrategies.length > 0) {
          composedStrategies = sentenceStrategies;
        } else {
          // Prose exists but couldn't be split — use the trimmed content as a single strategy
          const trimmed = composed.trim().slice(0, 500);
          if (trimmed.length > 20) {
            composedStrategies = [trimmed];
          }
        }
      }
      // Prefix composed items to distinguish from template content
      composedStrategies = composedStrategies.map(s => s.startsWith("Analysis: ") ? s : `Analysis: ${s}`);
    }
  }

  const typeStrategies = getStrategiesForSubjectType(quadrant, depth, subjectType);

  const strategySets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: [
        "Implement daily reflective practice to increase self-awareness of thought and emotional patterns.",
        "Engage in values clarification to align actions with deeper purpose and identity.",
        "Map current meaning-making frameworks to identify which interpretive lenses are shaping responses to the situation.",
      ],
      standard: [
        "Implement daily reflective practice to increase self-awareness of thought and emotional patterns.",
        "Engage in values clarification to align actions with deeper purpose and identity.",
        "Develop meta-awareness through mindfulness or contemplative practices that create distance between stimulus and response.",
        "Reframe limiting narratives by identifying cognitive distortions and constructing more adaptive self-stories.",
      ],
      exhaustive: [
        "Implement daily reflective practice to increase self-awareness of thought and emotional patterns.",
        "Engage in values clarification to align actions with deeper purpose and identity.",
        "Develop meta-awareness through mindfulness or contemplative practices that create distance between stimulus and response.",
        "Reframe limiting narratives by identifying cognitive distortions and constructing more adaptive self-stories.",
        "Conduct a developmental self-assessment to identify the current stage of meaning-making and the next available growth edge.",
        "Establish emotional regulation protocols that address both immediate reactivity and underlying emotional patterns.",
        "Create a personal practice of perspective-taking that systematically explores situations from multiple developmental vantage points.",
      ],
    },
    behavioral: {
      essential: [
        "Establish baseline metrics for key behavioral indicators relevant to the situation.",
        "Design environmental cues and structures that support desired behavioral patterns.",
        "Identify the most frequent and impactful behavioral patterns that define the current situation.",
      ],
      standard: [
        "Establish baseline metrics for key behavioral indicators relevant to the situation.",
        "Design environmental cues and structures that support desired behavioral patterns.",
        "Implement a feedback loop system that provides real-time data on behavioral performance.",
        "Apply behavioral science principles (implementation intentions, habit stacking, friction reduction) to shape target behaviors.",
      ],
      exhaustive: [
        "Establish baseline metrics for key behavioral indicators relevant to the situation.",
        "Design environmental cues and structures that support desired behavioral patterns.",
        "Implement a feedback loop system that provides real-time data on behavioral performance.",
        "Apply behavioral science principles (implementation intentions, habit stacking, friction reduction) to shape target behaviors.",
        "Conduct a functional behavioral analysis to identify the antecedents, behaviors, and consequences maintaining current patterns.",
        "Develop a skills training program that addresses any capability gaps preventing desired behavioral change.",
        "Create a behavioral experiment protocol that tests alternative approaches with measurable outcomes and clear success criteria.",
      ],
    },
    cultural: {
      essential: [
        "Facilitate group dialogue sessions to surface and examine shared assumptions and narratives.",
        "Identify the dominant cultural story about the situation and explore alternative narratives.",
        "Assess the group's shared identity and how it shapes collective responses to the situation.",
      ],
      standard: [
        "Facilitate group dialogue sessions to surface and examine shared assumptions and narratives.",
        "Identify the dominant cultural story about the situation and explore alternative narratives.",
        "Map the group's developmental stage and design interventions that stretch collective meaning-making capacity.",
        "Create rituals and practices that reinforce desired cultural values and make them experientially real rather than abstractly stated.",
      ],
      exhaustive: [
        "Facilitate group dialogue sessions to surface and examine shared assumptions and narratives.",
        "Identify the dominant cultural story about the situation and explore alternative narratives.",
        "Map the group's developmental stage and design interventions that stretch collective meaning-making capacity.",
        "Create rituals and practices that reinforce desired cultural values and make them experientially real rather than abstractly stated.",
        "Conduct a cultural shadow analysis to identify disowned aspects of the group's identity that are being projected onto individuals or external groups.",
        "Design a sensemaking infrastructure — ongoing processes for the group to collectively interpret events, update its worldview, and adapt its identity.",
        "Establish cross-cultural dialogue with external groups to broaden the collective perspective and challenge echo-chamber dynamics.",
      ],
    },
    social: {
      essential: [
        "Map the key systemic structures (policies, processes, hierarchies) that shape the situation.",
        "Identify leverage points where structural changes would produce the greatest systemic impact.",
        "Analyze resource allocation patterns to identify which structures receive support and which are starved.",
      ],
      standard: [
        "Map the key systemic structures (policies, processes, hierarchies) that shape the situation.",
        "Identify leverage points where structural changes would produce the greatest systemic impact.",
        "Redesign incentive structures to align individual behavior with desired collective outcomes.",
        "Implement governance mechanisms that ensure accountability, transparency, and adaptability in the face of changing conditions.",
      ],
      exhaustive: [
        "Map the key systemic structures (policies, processes, hierarchies) that shape the situation.",
        "Identify leverage points where structural changes would produce the greatest systemic impact.",
        "Redesign incentive structures to align individual behavior with desired collective outcomes.",
        "Implement governance mechanisms that ensure accountability, transparency, and adaptability in the face of changing conditions.",
        "Conduct a network analysis to identify informal power structures, information flows, and bottlenecks that formal structures obscure.",
        "Design a change architecture that sequences structural interventions to build momentum while managing resistance.",
        "Establish a systems monitoring framework that tracks leading indicators of systemic health and triggers adaptive responses before crises emerge.",
      ],
    },
  };

  // Merge: composed (if any) + type-specific + fallback, deduplicated
  const fallbackStrategies = strategySets[quadrant][depth];
  const allItems = [...composedStrategies, ...typeStrategies, ...fallbackStrategies];
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of allItems) {
    // Normalize for dedup: strip "Analysis: " prefix when comparing
    const normalized = item.replace(/^Analysis: /, '').trim().toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(item);
    }
  }
  return unique;
}

function getAiSystemStrategies(quadrant: Quadrant, depth: OutputDepth): string[] {
  const sets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: ["Conduct an interpretability analysis to understand internal representations driving observed behavior.", "Audit training data for systematic biases that manifest as output blind spots."],
      standard: ["Conduct an interpretability analysis to understand internal representations driving observed behavior.", "Audit training data for systematic biases that manifest as output blind spots.", "Implement alignment verification tests against intended objectives.", "Review reward function for proxy optimization and specification gaming vulnerabilities."],
      exhaustive: ["Conduct an interpretability analysis to understand internal representations driving observed behavior.", "Audit training data for systematic biases that manifest as output blind spots.", "Implement alignment verification tests against intended objectives.", "Review reward function for proxy optimization and specification gaming vulnerabilities.", "Deploy mechanistic interpretability tools to trace decision pathways through model layers.", "Establish red-teaming protocols to discover emergent failure modes outside training distribution.", "Create an observability pipeline that monitors for distribution shift and capability drift."],
    },
    behavioral: {
      essential: ["Establish evaluation benchmarks that measure actual task performance, not proxy metrics.", "Implement automated regression testing for critical output behaviors."],
      standard: ["Establish evaluation benchmarks that measure actual task performance, not proxy metrics.", "Implement automated regression testing for critical output behaviors.", "Deploy continuous monitoring for output quality degradation across diverse input distributions.", "Create behavioral test suites targeting known failure modes and edge cases."],
      exhaustive: ["Establish evaluation benchmarks that measure actual task performance, not proxy metrics.", "Implement automated regression testing for critical output behaviors.", "Deploy continuous monitoring for output quality degradation across diverse input distributions.", "Create behavioral test suites targeting known failure modes and edge cases.", "Implement adversarial testing to probe robustness under manipulation attempts.", "Establish multi-dimensional evaluation covering safety, helpfulness, and truthfulness trade-offs.", "Design canary tests that detect subtle behavioral drift before it becomes user-visible."],
    },
    cultural: {
      essential: ["Document the system's value alignment specifications and compare against actual behavior.", "Establish cross-functional review of system outputs for cultural bias and representation gaps."],
      standard: ["Document the system's value alignment specifications and compare against actual behavior.", "Establish cross-functional review of system outputs for cultural bias and representation gaps.", "Create transparency reports that communicate system capabilities and limitations to stakeholders.", "Develop stakeholder feedback loops that surface alignment concerns from diverse perspectives."],
      exhaustive: ["Document the system's value alignment specifications and compare against actual behavior.", "Establish cross-functional review of system outputs for cultural bias and representation gaps.", "Create transparency reports that communicate system capabilities and limitations to stakeholders.", "Develop stakeholder feedback loops that surface alignment concerns from diverse perspectives.", "Constitue an external review board for ongoing alignment assessment.", "Implement value learning protocols that incorporate diverse cultural perspectives into system behavior.", "Establish governance processes for managing emergent capabilities that were not explicitly designed."],
    },
    social: {
      essential: ["Map the system's dependency graph to identify cascade failure risks.", "Implement access controls and usage policies that constrain high-risk deployment scenarios."],
      standard: ["Map the system's dependency graph to identify cascade failure risks.", "Implement access controls and usage policies that constrain high-risk deployment scenarios.", "Establish deployment pipelines with automated safety gates and rollback capabilities.", "Design monitoring infrastructure that tracks system-level health indicators across all deployment contexts."],
      exhaustive: ["Map the system's dependency graph to identify cascade failure risks.", "Implement access controls and usage policies that constrain high-risk deployment scenarios.", "Establish deployment pipelines with automated safety gates and rollback capabilities.", "Design monitoring infrastructure that tracks system-level health indicators across all deployment contexts.", "Architect redundancy into critical system components to prevent single points of failure.", "Implement formal verification for safety-critical system properties.", "Establish incident response procedures for alignment failures and unexpected behavior."],
    },
  };
  return sets[quadrant][depth];
}

function getOrganizationStrategies(quadrant: Quadrant, depth: OutputDepth): string[] {
  const sets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: ["Conduct individual leadership coaching to increase awareness of decision-making blind spots.", "Facilitate personal reflection on how individual incentives shape organizational behavior."],
      standard: ["Conduct individual leadership coaching to increase awareness of decision-making blind spots.", "Facilitate personal reflection on how individual incentives shape organizational behavior.", "Implement 360-degree feedback processes that reveal gaps between self-perception and impact.", "Create psychological safety interventions that enable honest self-assessment at all levels."],
      exhaustive: ["Conduct individual leadership coaching to increase awareness of decision-making blind spots.", "Facilitate personal reflection on how individual incentives shape organizational behavior.", "Implement 360-degree feedback processes that reveal gaps between self-perception and impact.", "Create psychological safety interventions that enable honest self-assessment at all levels.", "Design executive development programs that address the gap between stated values and actual leadership behavior.", "Implement mindfulness and emotional intelligence training to reduce reactive decision-making.", "Establish peer coaching networks that provide ongoing development outside formal hierarchies."],
    },
    behavioral: {
      essential: ["Establish metrics that measure actual outcomes, not activity levels.", "Redesign workflow processes to reduce handoff friction and information loss."],
      standard: ["Establish metrics that measure actual outcomes, not activity levels.", "Redesign workflow processes to reduce handoff friction and information loss.", "Implement experiment-driven development that tests process changes before full rollout.", "Create feedback mechanisms that surface process failures before they become systemic."],
      exhaustive: ["Establish metrics that measure actual outcomes, not activity levels.", "Redesign workflow processes to reduce handoff friction and information loss.", "Implement experiment-driven development that tests process changes before full rollout.", "Create feedback mechanisms that surface process failures before they become systemic.", "Conduct value stream mapping to identify waste and bottlenecks in current processes.", "Design working agreements that make implicit norms explicit and testable.", "Implement retrospectives at multiple organizational levels to capture learning from both successes and failures."],
    },
    cultural: {
      essential: ["Facilitate organizational dialogue to surface unspoken assumptions about how work gets done.", "Identify and challenge the dominant narrative that explains failures as external rather than systemic."],
      standard: ["Facilitate organizational dialogue to surface unspoken assumptions about how work gets done.", "Identify and challenge the dominant narrative that explains failures as external rather than systemic.", "Redesign rituals and ceremonies to reward prevention and sustainability, not just crisis response.", "Create cross-team exchanges that break down silo mentalities and build shared identity."],
      exhaustive: ["Facilitate organizational dialogue to surface unspoken assumptions about how work gets done.", "Identify and challenge the dominant narrative that explains failures as external rather than systemic.", "Redesign rituals and ceremonies to reward prevention and sustainability, not just crisis response.", "Create cross-team exchanges that break down silo mentalities and build shared identity.", "Conduct cultural audits that reveal the gap between espoused and enacted values.", "Design narrative interventions that reshape the organization's story about itself and its challenges.", "Establish communities of practice that transcend formal boundaries and enable knowledge sharing."],
    },
    social: {
      essential: ["Map formal and informal power structures to identify decision-making bottlenecks.", "Redesign incentive systems to reward collaboration and long-term outcomes over individual heroics."],
      standard: ["Map formal and informal power structures to identify decision-making bottlenecks.", "Redesign incentive systems to reward collaboration and long-term outcomes over individual heroics.", "Implement governance reforms that increase transparency and accountability in resource allocation.", "Restructure team compositions to break down silos and enable cross-functional collaboration."],
      exhaustive: ["Map formal and informal power structures to identify decision-making bottlenecks.", "Redesign incentive systems to reward collaboration and long-term outcomes over individual heroics.", "Implement governance reforms that increase transparency and accountability in resource allocation.", "Restructure team compositions to break down silos and enable cross-functional collaboration.", "Conduct organizational network analysis to identify information flow patterns and bottlenecks.", "Design change architecture that sequences structural interventions to build momentum while managing resistance.", "Establish systems monitoring that tracks leading indicators of organizational health and triggers adaptive responses."],
    },
  };
  return sets[quadrant][depth];
}

function getTechnicalSystemStrategies(quadrant: Quadrant, depth: OutputDepth): string[] {
  const sets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: ["Document architectural decision records to capture rationale behind key design choices.", "Conduct architecture reviews to identify gaps between intended and actual system design."],
      standard: ["Document architectural decision records to capture rationale behind key design choices.", "Conduct architecture reviews to identify gaps between intended and actual system design.", "Implement design threat modeling to identify security assumptions that may have decayed.", "Create system mental models that help engineers understand the full scope of system behavior."],
      exhaustive: ["Document architectural decision records to capture rationale behind key design choices.", "Conduct architecture reviews to identify gaps between intended and actual system design.", "Implement design threat modeling to identify security assumptions that may have decayed.", "Create system mental models that help engineers understand the full scope of system behavior.", "Conduct failure mode analysis for all critical system components and their interactions.", "Establish architecture fitness functions that automatically validate design constraints.", "Design developer experience improvements that reduce cognitive load when working with complex systems."],
    },
    behavioral: {
      essential: ["Establish comprehensive observability with metrics, traces, and logs covering all critical paths.", "Implement automated testing that covers normal operation and known failure modes."],
      standard: ["Establish comprehensive observability with metrics, traces, and logs covering all critical paths.", "Implement automated testing that covers normal operation and known failure modes.", "Deploy chaos engineering practices to validate system resilience under failure conditions.", "Create performance baselines and alerts that detect degradation before it impacts users."],
      exhaustive: ["Establish comprehensive observability with metrics, traces, and logs covering all critical paths.", "Implement automated testing that covers normal operation and known failure modes.", "Deploy chaos engineering practices to validate system resilience under failure conditions.", "Create performance baselines and alerts that detect degradation before it impacts users.", "Implement distributed tracing to track request flow across service boundaries.", "Design synthetic monitoring that simulates real user journeys to detect functional regressions.", "Establish error budget policies that balance reliability with development velocity."],
    },
    cultural: {
      essential: ["Establish blameless postmortem practices that treat failures as learning opportunities.", "Create documentation culture that values accuracy and currency over completeness."],
      standard: ["Establish blameless postmortem practices that treat failures as learning opportunities.", "Create documentation culture that values accuracy and currency over completeness.", "Implement knowledge-sharing practices (tech talks, RFCs, design reviews) that distribute system understanding.", "Build on-call rotation culture that emphasizes learning and prevention over heroics."],
      exhaustive: ["Establish blameless postmortem practices that treat failures as learning opportunities.", "Create documentation culture that values accuracy and currency over completeness.", "Implement knowledge-sharing practices (tech talks, RFCs, design reviews) that distribute system understanding.", "Build on-call rotation culture that emphasizes learning and prevention over heroics.", "Conduct regular architecture katas that exercise team problem-solving on realistic scenarios.", "Design incident command training that builds organizational capacity for effective crisis response.", "Establish mentorship programs that transfer tribal knowledge from senior to junior engineers."],
    },
    social: {
      essential: ["Map service dependencies to identify cascade failure risks and single points of failure.", "Implement infrastructure-as-code to eliminate configuration drift and ensure reproducibility."],
      standard: ["Map service dependencies to identify cascade failure risks and single points of failure.", "Implement infrastructure-as-code to eliminate configuration drift and ensure reproducibility.", "Design deployment pipelines with automated safety gates, canary releases, and instant rollback.", "Establish capacity planning processes that anticipate scaling bottlenecks before they occur."],
      exhaustive: ["Map service dependencies to identify cascade failure risks and single points of failure.", "Implement infrastructure-as-code to eliminate configuration drift and ensure reproducibility.", "Design deployment pipelines with automated safety gates, canary releases, and instant rollback.", "Establish capacity planning processes that anticipate scaling bottlenecks before they occur.", "Architect circuit breakers and bulkheads to contain failures within service boundaries.", "Implement service mesh for standardized observability, traffic management, and security policies.", "Establish disaster recovery procedures with regular testing and documented recovery time objectives."],
    },
  };
  return sets[quadrant][depth];
}

function getEffectsForSubjectType(quadrant: Quadrant, depth: OutputDepth, subjectType: SubjectType): string[] {
  if (subjectType === "ai-system") return getAiSystemEffects(quadrant, depth);
  if (subjectType === "organization") return getOrganizationEffects(quadrant, depth);
  if (subjectType === "technical-system") return getTechnicalSystemEffects(quadrant, depth);
  if (subjectType === "mixed") {
    const ai = getAiSystemEffects(quadrant, depth);
    const org = getOrganizationEffects(quadrant, depth);
    const merged = [...new Set([...ai, ...org])];
    return merged.slice(0, 8);
  }
  return [];
}

function generateSecondOrderEffects(quadrant: Quadrant, depth: OutputDepth, subjectType: SubjectType, composerCtx?: AqalComposerContext): string[] {
  let composedEffects: string[] = [];
  if (composerCtx) {
    const composed = composeToolContent({
      toolName: "think_aqal_situational",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: 6,
      totalSteps: 6,
      thoughtType: "prospective",
      previousOutputs: [],
    });
    if (composed.length > 100) {
      const parsedLines = composed.split('\n').filter(l => l.trim().length > 0 && l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, ''));
      if (parsedLines.length > 0) {
        composedEffects = parsedLines;
      } else {
        const sentenceEffects = extractSentences(composed, 1, 4);
        if (sentenceEffects.length > 0) {
          composedEffects = sentenceEffects;
        } else {
          const trimmed = composed.trim().slice(0, 500);
          if (trimmed.length > 20) {
            composedEffects = [trimmed];
          }
        }
      }
      composedEffects = composedEffects.map(s => s.startsWith("Analysis: ") ? s : `Analysis: ${s}`);
    }
  }

  const typeEffects = getEffectsForSubjectType(quadrant, depth, subjectType);

  const effectSets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: [
        "Increased self-awareness may initially produce discomfort as previously unconscious patterns surface into awareness.",
        "Shifts in individual meaning-making can create temporary misalignment with existing cultural narratives.",
      ],
      standard: [
        "Increased self-awareness may initially produce discomfort as previously unconscious patterns surface into awareness.",
        "Shifts in individual meaning-making can create temporary misalignment with existing cultural narratives.",
        "Enhanced meta-awareness may change the individual's relationship to authority, potentially challenging existing hierarchies.",
        "Values clarification can create tension between newly clarified personal values and organizational expectations.",
      ],
      exhaustive: [
        "Increased self-awareness may initially produce discomfort as previously unconscious patterns surface into awareness.",
        "Shifts in individual meaning-making can create temporary misalignment with existing cultural narratives.",
        "Enhanced meta-awareness may change the individual's relationship to authority, potentially challenging existing hierarchies.",
        "Values clarification can create tension between newly clarified personal values and organizational expectations.",
        "Developmental growth may create a 'meaning gap' where the individual has outgrown their current context but not yet found a new one.",
        "Emotional regulation improvements can shift group dynamics as the individual no longer participates in familiar dysfunctional patterns.",
        "Perspective-taking expansion may produce existential uncertainty as the individual recognizes the complexity and ambiguity of previously held certainties.",
      ],
    },
    behavioral: {
      essential: [
        "New behavioral patterns may face resistance from environmental structures optimized for old patterns.",
        "Measurement systems can create unintended gaming behavior if not designed with awareness of Goodhart's Law.",
      ],
      standard: [
        "New behavioral patterns may face resistance from environmental structures optimized for old patterns.",
        "Measurement systems can create unintended gaming behavior if not designed with awareness of Goodhart's Law.",
        "Behavioral changes in key individuals can trigger cascading adjustments in the behavior of those around them.",
        "Skills development can create expectations that the environment must evolve to utilize the new capabilities.",
      ],
      exhaustive: [
        "New behavioral patterns may face resistance from environmental structures optimized for old patterns.",
        "Measurement systems can create unintended gaming behavior if not designed with awareness of Goodhart's Law.",
        "Behavioral changes in key individuals can trigger cascading adjustments in the behavior of those around them.",
        "Skills development can create expectations that the environment must evolve to utilize the new capabilities.",
        "Environmental redesign may displace existing routines that, while suboptimal, provided psychological stability.",
        "Feedback loop implementation can create information overload if the system is not designed for cognitive manageability.",
        "Behavioral experiments that fail may produce learned helplessness if not framed as learning opportunities rather than performance failures.",
      ],
    },
    cultural: {
      essential: [
        "Shifting cultural narratives may produce identity disruption for those strongly invested in the old story.",
        "New rituals can feel inauthentic if not organically developed from within the group's existing meaning structures.",
      ],
      standard: [
        "Shifting cultural narratives may produce identity disruption for those strongly invested in the old story.",
        "New rituals can feel inauthentic if not organically developed from within the group's existing meaning structures.",
        "Dialogue processes that surface hidden assumptions can create temporary conflict before deeper understanding emerges.",
        "Cultural evolution can create a values gap between early adopters and those still operating within the old paradigm.",
      ],
      exhaustive: [
        "Shifting cultural narratives may produce identity disruption for those strongly invested in the old story.",
        "New rituals can feel inauthentic if not organically developed from within the group's existing meaning structures.",
        "Dialogue processes that surface hidden assumptions can create temporary conflict before deeper understanding emerges.",
        "Cultural evolution can create a values gap between early adopters and those still operating within the old paradigm.",
        "Shadow retrieval at the cultural level can unleash repressed collective emotions that require skilled facilitation to process.",
        "Sensemaking infrastructure may become bureaucratized over time, turning living dialogue into mechanical process.",
        "Cross-cultural dialogue can destabilize the group's sense of coherence before a more inclusive identity can form.",
      ],
    },
    social: {
      essential: [
        "Structural changes will produce winners and losers, creating political dynamics that must be managed.",
        "New governance mechanisms may be perceived as additional bureaucracy rather than enabling frameworks.",
      ],
      standard: [
        "Structural changes will produce winners and losers, creating political dynamics that must be managed.",
        "New governance mechanisms may be perceived as additional bureaucracy rather than enabling frameworks.",
        "Incentive realignment can produce unexpected behavioral adaptations as individuals optimize for the new reward structure.",
        "Process changes may temporarily reduce efficiency as the system transitions from old to new operating modes.",
      ],
      exhaustive: [
        "Structural changes will produce winners and losers, creating political dynamics that must be managed.",
        "New governance mechanisms may be perceived as additional bureaucracy rather than enabling frameworks.",
        "Incentive realignment can produce unexpected behavioral adaptations as individuals optimize for the new reward structure.",
        "Process changes may temporarily reduce efficiency as the system transitions from old to new operating modes.",
        "Network analysis revelations may expose informal power structures that resist formalization or change.",
        "Change architecture that sequences interventions too slowly may lose momentum; too quickly may overwhelm adaptive capacity.",
        "Systems monitoring can create a surveillance culture if not balanced with trust and psychological safety, producing the opposite of intended transparency.",
      ],
    },
  };

  const fallbackEffects = effectSets[quadrant][depth];
  const allItems = [...composedEffects, ...typeEffects, ...fallbackEffects];
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of allItems) {
    const normalized = item.replace(/^Analysis: /, '').trim().toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(item);
    }
  }
  return unique;
}

function getAiSystemEffects(quadrant: Quadrant, depth: OutputDepth): string[] {
  const sets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: ["Interpretability analysis may reveal unexpected internal representations that require redesign.", "Training data audits can surface biases that necessitate costly retraining efforts."],
      standard: ["Interpretability analysis may reveal unexpected internal representations that require redesign.", "Training data audits can surface biases that necessitate costly retraining efforts.", "Alignment verification may expose capability gaps that reduce short-term performance.", "Reward function review can identify optimization targets that conflict with stated objectives."],
      exhaustive: ["Interpretability analysis may reveal unexpected internal representations that require redesign.", "Training data audits can surface biases that necessitate costly retraining efforts.", "Alignment verification may expose capability gaps that reduce short-term performance.", "Reward function review can identify optimization targets that conflict with stated objectives.", "Mechanistic interpretability may uncover decision pathways that are difficult to modify without degrading performance.", "Red-teaming discoveries may necessitate architectural changes that delay deployment timelines.", "Distribution shift monitoring can produce false positives that create alert fatigue."],
    },
    behavioral: {
      essential: ["New evaluation benchmarks may reveal performance degradation on edge cases previously unmeasured.", "Automated regression tests can constrain model iteration velocity."],
      standard: ["New evaluation benchmarks may reveal performance degradation on edge cases previously unmeasured.", "Automated regression tests can constrain model iteration velocity.", "Continuous monitoring infrastructure creates operational overhead and requires dedicated maintenance.", "Behavioral test suites may produce test-suite overfitting where the model optimizes for test performance."],
      exhaustive: ["New evaluation benchmarks may reveal performance degradation on edge cases previously unmeasured.", "Automated regression tests can constrain model iteration velocity.", "Continuous monitoring infrastructure creates operational overhead and requires dedicated maintenance.", "Behavioral test suites may produce test-suite overfitting where the model optimizes for test performance.", "Adversarial testing can discover vulnerabilities that require architectural fixes, not just prompt engineering.", "Multi-dimensional evaluation may reveal irreducible trade-offs between safety, helpfulness, and capability.", "Canary test maintenance becomes a growing burden as the test suite expands."],
    },
    cultural: {
      essential: ["Transparency reports may create public scrutiny that constrains development flexibility.", "Stakeholder feedback can surface conflicting value requirements that are difficult to reconcile."],
      standard: ["Transparency reports may create public scrutiny that constrains development flexibility.", "Stakeholder feedback can surface conflicting value requirements that are difficult to reconcile.", "External review boards may slow development cycles with additional approval steps.", "Value learning from diverse perspectives can produce outputs that no single stakeholder group fully endorses."],
      exhaustive: ["Transparency reports may create public scrutiny that constrains development flexibility.", "Stakeholder feedback can surface conflicting value requirements that are difficult to reconcile.", "External review boards may slow development cycles with additional approval steps.", "Value learning from diverse perspectives can produce outputs that no single stakeholder group fully endorses.", "Governance processes for emergent capabilities may need to evolve faster than organizational structures can adapt.", "Alignment documentation can become outdated as system behavior evolves, creating a false sense of understanding.", "Cultural bias audits may reveal systemic issues in the training ecosystem that are beyond any single team's control."],
    },
    social: {
      essential: ["Dependency mapping may reveal critical vulnerabilities in third-party services.", "Access controls can create friction for legitimate use cases that need rapid experimentation."],
      standard: ["Dependency mapping may reveal critical vulnerabilities in third-party services.", "Access controls can create friction for legitimate use cases that need rapid experimentation.", "Deployment safety gates may slow iteration cycles and reduce developer velocity.", "Monitoring infrastructure requires significant investment in tooling, expertise, and ongoing maintenance."],
      exhaustive: ["Dependency mapping may reveal critical vulnerabilities in third-party services.", "Access controls can create friction for legitimate use cases that need rapid experimentation.", "Deployment safety gates may slow iteration cycles and reduce developer velocity.", "Monitoring infrastructure requires significant investment in tooling, expertise, and ongoing maintenance.", "Redundancy architecture increases system complexity and operational costs.", "Formal verification may prove infeasible for large-scale systems, creating a gap between safety aspirations and achievable guarantees.", "Incident response procedures tested in controlled environments may not translate to real-world failure scenarios."],
    },
  };
  return sets[quadrant][depth];
}

function getOrganizationEffects(quadrant: Quadrant, depth: OutputDepth): string[] {
  const sets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: ["Leadership coaching may initially reduce decision-making speed as leaders question established patterns.", "360-degree feedback can surface uncomfortable truths that damage existing relationships."],
      standard: ["Leadership coaching may initially reduce decision-making speed as leaders question established patterns.", "360-degree feedback can surface uncomfortable truths that damage existing relationships.", "Psychological safety interventions may initially increase conflict as suppressed issues surface.", "Executive development programs can create expectations that the organization cannot fulfill."],
      exhaustive: ["Leadership coaching may initially reduce decision-making speed as leaders question established patterns.", "360-degree feedback can surface uncomfortable truths that damage existing relationships.", "Psychological safety interventions may initially increase conflict as suppressed issues surface.", "Executive development programs can create expectations that the organization cannot fulfill.", "Mindfulness training may be perceived as placing individual responsibility on systemic problems.", "Peer coaching networks can become echo chambers that reinforce existing biases rather than challenging them.", "Increased self-awareness at the top can create dissonance with organizational structures that don't support new ways of leading."],
    },
    behavioral: {
      essential: ["Outcome-based metrics may incentivize short-term results at the expense of long-term health.", "Process redesign can create temporary productivity dips during transition."],
      standard: ["Outcome-based metrics may incentivize short-term results at the expense of long-term health.", "Process redesign can create temporary productivity dips during transition.", "Experiment-driven development requires cultural buy-in that may not exist in command-and-control organizations.", "Feedback mechanisms may surface problems faster than the organization has capacity to address them."],
      exhaustive: ["Outcome-based metrics may incentivize short-term results at the expense of long-term health.", "Process redesign can create temporary productivity dips during transition.", "Experiment-driven development requires cultural buy-in that may not exist in command-and-control organizations.", "Feedback mechanisms may surface problems faster than the organization has capacity to address them.", "Value stream mapping may reveal waste that threatens established roles and political arrangements.", "Working agreements can become bureaucratic overhead if not actively maintained.", "Multi-level retrospectives may produce more action items than the organization can realistically implement."],
    },
    cultural: {
      essential: ["Surfacing unspoken assumptions can create identity disruption for those invested in the current narrative.", "Challenging dominant narratives may be perceived as disloyalty rather than constructive criticism."],
      standard: ["Surfacing unspoken assumptions can create identity disruption for those invested in the current narrative.", "Challenging dominant narratives may be perceived as disloyalty rather than constructive criticism.", "Rewarding prevention over crisis response may reduce visibility for those who excel at heroics.", "Cross-team exchanges can reveal incompatible working styles that create new friction points."],
      exhaustive: ["Surfacing unspoken assumptions can create identity disruption for those invested in the current narrative.", "Challenging dominant narratives may be perceived as disloyalty rather than constructive criticism.", "Rewarding prevention over crisis response may reduce visibility for those who excel at heroics.", "Cross-team exchanges can reveal incompatible working styles that create new friction points.", "Cultural audits may reveal value gaps that leadership is unwilling or unable to address.", "Narrative interventions can backfire if perceived as inauthentic or imposed from above.", "Communities of practice may create new silos that replace the old ones."],
    },
    social: {
      essential: ["Power structure mapping may expose informal hierarchies that resist formal change.", "Incentive redesign will produce winners and losers, creating political resistance."],
      standard: ["Power structure mapping may expose informal hierarchies that resist formal change.", "Incentive redesign will produce winners and losers, creating political resistance.", "Governance reforms may be perceived as additional bureaucracy rather than enabling frameworks.", "Team restructuring can disrupt established relationships and tacit knowledge networks."],
      exhaustive: ["Power structure mapping may expose informal hierarchies that resist formal change.", "Incentive redesign will produce winners and losers, creating political resistance.", "Governance reforms may be perceived as additional bureaucracy rather than enabling frameworks.", "Team restructuring can disrupt established relationships and tacit knowledge networks.", "Network analysis revelations may create anxiety among those whose informal influence is threatened.", "Change architecture that moves too slowly loses momentum; too quickly overwhelms adaptive capacity.", "Systems monitoring can create surveillance culture if not balanced with trust and autonomy."],
    },
  };
  return sets[quadrant][depth];
}

function getTechnicalSystemEffects(quadrant: Quadrant, depth: OutputDepth): string[] {
  const sets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: ["Architecture reviews may uncover design debt that requires significant refactoring investment.", "Decision records can expose inconsistencies in past architectural choices."],
      standard: ["Architecture reviews may uncover design debt that requires significant refactoring investment.", "Decision records can expose inconsistencies in past architectural choices.", "Threat modeling may reveal security assumptions that require fundamental redesign.", "System mental models can become outdated as the system evolves, creating false confidence."],
      exhaustive: ["Architecture reviews may uncover design debt that requires significant refactoring investment.", "Decision records can expose inconsistencies in past architectural choices.", "Threat modeling may reveal security assumptions that require fundamental redesign.", "System mental models can become outdated as the system evolves, creating false confidence.", "Failure mode analysis may reveal interaction patterns that are too complex to fully model.", "Architecture fitness functions can constrain innovation by enforcing outdated design constraints.", "Developer experience improvements may require organizational changes that are politically difficult."],
    },
    behavioral: {
      essential: ["Comprehensive observability creates data volume that can overwhelm teams without proper tooling.", "Automated test suites can become brittle and slow to maintain as the system grows."],
      standard: ["Comprehensive observability creates data volume that can overwhelm teams without proper tooling.", "Automated test suites can become brittle and slow to maintain as the system grows.", "Chaos engineering may reveal vulnerabilities that require architectural changes, not just operational fixes.", "Performance baselines can create complacency if thresholds are not regularly reviewed."],
      exhaustive: ["Comprehensive observability creates data volume that can overwhelm teams without proper tooling.", "Automated test suites can become brittle and slow to maintain as the system grows.", "Chaos engineering may reveal vulnerabilities that require architectural changes, not just operational fixes.", "Performance baselines can create complacency if thresholds are not regularly reviewed.", "Distributed tracing adds latency and complexity to service communication.", "Synthetic monitoring can produce false positives that create alert fatigue.", "Error budget policies may create tension between reliability and feature velocity teams."],
    },
    cultural: {
      essential: ["Blameless postmortems may initially feel unnatural in cultures accustomed to accountability-through-blame.", "Documentation culture requires sustained investment that competes with feature development."],
      standard: ["Blameless postmortems may initially feel unnatural in cultures accustomed to accountability-through-blame.", "Documentation culture requires sustained investment that competes with feature development.", "Knowledge-sharing practices take time away from immediate delivery pressures.", "On-call culture focused on learning may feel less urgent than heroics-based response."],
      exhaustive: ["Blameless postmortems may initially feel unnatural in cultures accustomed to accountability-through-blame.", "Documentation culture requires sustained investment that competes with feature development.", "Knowledge-sharing practices take time away from immediate delivery pressures.", "On-call culture focused on learning may feel less urgent than heroics-based response.", "Architecture katas may be perceived as academic exercises disconnected from daily work.", "Incident command training may reveal gaps in organizational readiness that leadership is unprepared to address.", "Mentorship programs require time investment that may not show immediate return."],
    },
    social: {
      essential: ["Service dependency mapping may reveal single points of failure that require costly redundancy.", "Infrastructure-as-code adoption has a learning curve that temporarily reduces deployment velocity."],
      standard: ["Service dependency mapping may reveal single points of failure that require costly redundancy.", "Infrastructure-as-code adoption has a learning curve that temporarily reduces deployment velocity.", "Deployment pipeline safety gates add latency to the release process.", "Capacity planning may reveal infrastructure gaps that require significant investment."],
      exhaustive: ["Service dependency mapping may reveal single points of failure that require costly redundancy.", "Infrastructure-as-code adoption has a learning curve that temporarily reduces deployment velocity.", "Deployment pipeline safety gates add latency to the release process.", "Capacity planning may reveal infrastructure gaps that require significant investment.", "Circuit breakers and bulkheads add complexity that must be managed and understood.", "Service mesh introduces a new infrastructure layer that becomes a critical dependency itself.", "Disaster recovery testing may reveal recovery capabilities that are far below stated objectives."],
    },
  };
  return sets[quadrant][depth];
}

// ─── Psychograph Generation Engine ────────────────────────────────────────────

function generatePsychograph(params: {
  situation: string;
  stakeholders: string;
  observableData: string;
  reportedExperience: string;
  culturalContext: string;
  systemicContext: string;
  lines: LineOfDevelopment[];
  depth: OutputDepth;
  subjectType: SubjectType;
}): PsychographProfile[] {
  const { situation, stakeholders, observableData, reportedExperience, culturalContext, systemicContext, lines, depth, subjectType } = params;

  const fullText = `${situation} ${stakeholders} ${observableData} ${reportedExperience} ${culturalContext} ${systemicContext}`.toLowerCase();

  // Line-specific signal keywords
  const lineSignals: Record<LineOfDevelopment, { keywords: string[]; levelBoost: number }> = {
    cognitive: { keywords: ["analyze", "logic", "reason", "rational", "evidence", "data", "systematic", "complex", "abstract", "model", "framework", "theory"], levelBoost: 0 },
    emotional: { keywords: ["feel", "emotion", "affect", "stress", "anxiety", "anger", "fear", "joy", "sad", "overwhelm", "burnout", "frustrat", "passion", "empathy", "compassion"], levelBoost: 0 },
    intrapersonal: { keywords: ["self-aware", "reflect", "introspect", "mindful", "identity", "meaning", "purpose", "growth", "develop", "insight", "meta-aware"], levelBoost: 0 },
    moral: { keywords: ["ethic", "moral", "justice", "fair", "right", "wrong", "value", "principled", "duty", "obligation", "integrity", "responsibility", "accountability"], levelBoost: 0 },
    spiritual: { keywords: ["spiritual", "transcend", "sacred", "meaning", "purpose", "existential", "connected", "unity", "wholeness", "awakening", "consciousness"], levelBoost: 0 },
    kinesthetic: { keywords: ["body", "physical", "embodied", "somatic", "action", "movement", "habit", "practice", "rhythm", "flow", "tension", "relax"], levelBoost: 0 },
    willpower: { keywords: ["discipline", "commit", "persist", "resist", "will", "determination", "focus", "goal", "achieve", "overcome", "habit", "routine", "consistency"], levelBoost: 0 },
  };

  // Count keyword matches per line
  for (const line of Object.keys(lineSignals) as LineOfDevelopment[]) {
    lineSignals[line].levelBoost = lineSignals[line].keywords.filter(kw => fullText.includes(kw)).length;
  }

  const developmentalOrder: DevelopmentalLevel[] = ["archaic", "magic", "magic-mythic", "mythic", "modern-rational", "postmodern", "integral", "super-integral"];
  const baseLevelIndex = 4; // modern-rational (center point)
  const maxBoost = Math.max(...Object.values(lineSignals).map(s => s.levelBoost), 1);

  const isNonHuman = subjectType !== "human";

  // Generate profiles for each requested line
  const profiles: PsychographProfile[] = lines.map((line) => {
    const lineInfo = LINES_OF_DEVELOPMENT[line];
    const signalCount = lineSignals[line].levelBoost;

    // Normalize to -1 to +1 range, map to level shift
    const normalizedSignal = signalCount / maxBoost;
    const levelShift = Math.round((normalizedSignal - 0.5) * 2); // -1, 0, or +1
    let targetIndex = Math.max(0, Math.min(7, baseLevelIndex + levelShift));

    // Confidence = 0.35 + (signalCount / maxPossible) * 0.45
    let confidence = 0.35 + (signalCount / Math.max(maxBoost, 3)) * 0.45;

    // Subject type adjustments for non-human subjects
    if (isNonHuman) {
      if (line === "cognitive" || line === "willpower") {
        confidence = Math.min(0.95, confidence + 0.05);
      } else if (line === "emotional" || line === "spiritual" || line === "kinesthetic") {
        confidence = Math.max(0.10, confidence - 0.10);
        // Also push level down one step for these lines in non-human subjects
        targetIndex = Math.max(0, targetIndex - 1);
      }
    }

    const matchedKeywords = lineSignals[line].keywords.filter(kw => fullText.includes(kw));
    const keywordSummary = matchedKeywords.slice(0, 3).join(", ") || "no explicit signals detected — baseline assessment applies";

    return {
      line,
      estimated_level: developmentalOrder[targetIndex] as DevelopmentalLevel,
      confidence: Math.round(confidence * 100) / 100,
      indicators: [
        `The ${line} line shows ${signalCount} signal(s) in the input: ${keywordSummary}.`,
        `Context suggests ${lineInfo.label.toLowerCase()} functioning characterized by ${getLineIndicator(line, "present")}.`,
        `Potential shadow pattern: ${getLineIndicator(line, "shadow")} — monitor for this in behavioral data.`,
      ],
    };
  });

  // Ensure minimum 15pp spread between highest and lowest confidence
  const confidences = profiles.map(p => p.confidence);
  const minConf = Math.min(...confidences);
  const maxConf = Math.max(...confidences);
  const spread = maxConf - minConf;

  if (spread < 0.15 && profiles.length > 1) {
    // Stretch: expand by 0.10 on each end
    const targetMin = Math.max(0.10, minConf - 0.10);
    const targetMax = Math.min(0.95, maxConf + 0.10);
    const range = maxConf - minConf || 0.01; // avoid division by zero

    for (const profile of profiles) {
      if (range > 0) {
        const normalized = (profile.confidence - minConf) / range;
        profile.confidence = Math.round((targetMin + normalized * (targetMax - targetMin)) * 100) / 100;
      } else {
        // All identical — create spread around center
        const idx = profiles.indexOf(profile);
        const offset = (idx / (profiles.length - 1) - 0.5) * 0.20;
        profile.confidence = Math.round(Math.max(0.10, Math.min(0.95, 0.50 + offset)) * 100) / 100;
      }
    }
  }

  return profiles;
}

function getLineIndicator(line: LineOfDevelopment, type: "present" | "shadow" | "discrepancy"): string {
  const indicators: Record<LineOfDevelopment, Record<string, string>> = {
    cognitive: {
      present: "engage in systematic rational analysis and evidence-based reasoning",
      shadow: "intellectualization used to avoid emotional processing",
      discrepancy: "a gap between stated rational understanding and actual decision-making patterns",
    },
    emotional: {
      present: "demonstrate awareness and regulation of affective states in service of relational goals",
      shadow: "emotional reactivity that overrides longer-term considerations",
      discrepancy: "a mismatch between expressed emotional awareness and observable emotional responses",
    },
    intrapersonal: {
      present: "show capacity for self-reflection and meta-awareness of own patterns",
      shadow: "obsessive self-analysis that substitutes for genuine action or connection",
      discrepancy: "self-reported self-awareness that does not align with behavioral blind spots",
    },
    moral: {
      present: "reason from principles that extend beyond self-interest or group loyalty",
      shadow: "moral self-righteousness used to justify exclusion or judgment of others",
      discrepancy: "stated moral principles that conflict with actual behavioral choices",
    },
    spiritual: {
      present: "access meaning and purpose that transcends immediate personal concerns",
      shadow: "spiritual bypassing — using transcendent language to avoid psychological work",
      discrepancy: "professed spiritual values that are not embodied in concrete relational patterns",
    },
    kinesthetic: {
      present: "demonstrate embodied awareness and somatic intelligence in action",
      shadow: "dissociation from bodily experience in favor of purely mental functioning",
      discrepancy: "intellectual understanding of embodied principles without physical integration",
    },
    willpower: {
      present: "sustain intentional action toward chosen ends despite internal and external resistance",
      shadow: "rigid willfulness and control that refuses to adapt to changing circumstances",
      discrepancy: "stated intentions and commitments that are not consistently enacted",
    },
  };
  return indicators[line][type];
}

function generatePsychographAnalysis(profiles: PsychographProfile[]): {
  table: string;
  unevenDevelopmentAnalysis: string;
  leadingEdge: string;
  laggingConstraint: string;
} {
  const developmentalOrder: DevelopmentalLevel[] = [
    "archaic", "magic", "magic-mythic", "mythic", "modern-rational", "postmodern", "integral", "super-integral",
  ];

  const levelRank = (level: DevelopmentalLevel): number => developmentalOrder.indexOf(level);

  const sorted = [...profiles].sort((a, b) => levelRank(b.estimated_level) - levelRank(a.estimated_level));
  const leading = sorted[0];
  const lagging = sorted[sorted.length - 1];

  const tableRows = profiles.map((p) => [
    capitalizeFirst(p.line),
    DEVELOPMENTAL_LEVELS[p.estimated_level].label,
    `${Math.round(p.confidence * 100)}%`,
    p.indicators.slice(0, 2).join("; "),
  ]);

  const table = buildMarkdownTable(
    ["Line", "Estimated Level", "Confidence", "Key Indicators"],
    tableRows,
  );

  const levelSpread = levelRank(leading.estimated_level) - levelRank(lagging.estimated_level);
  const spreadDescription = levelSpread >= 4
    ? "a very wide developmental gap"
    : levelSpread >= 2
      ? "a moderate developmental gap"
      : "a relatively narrow developmental spread";

  const unevenDevelopmentAnalysis = `The psychograph profile reveals ${spreadDescription} between the most and least developed lines. ` +
    `The ${capitalizeFirst(leading.line)} line (${DEVELOPMENTAL_LEVELS[leading.estimated_level].label}) operates at a significantly higher developmental altitude than the ${capitalizeFirst(lagging.line)} line (${DEVELOPMENTAL_LEVELS[lagging.estimated_level].label}). ` +
    `This unevenness is a normal feature of human development — no individual or group develops all lines equally. ` +
    `However, when the gap between lines is substantial, it creates characteristic patterns: the leading line provides the individual or group with sophisticated capacities in one domain while the lagging line creates a developmental bottleneck that limits overall effectiveness. ` +
    `The situation analyzed here likely shows evidence of this asymmetry, where strengths in ${leading.line} functioning are partially undermined by limitations in ${lagging.line} capacity.`;

  const leadingEdge = `The ${capitalizeFirst(leading.line)} line emerges as the leading edge of development in this situation. ` +
    `At the ${DEVELOPMENTAL_LEVELS[leading.estimated_level].label} level, this line provides the primary source of developmental resources and adaptive capacity. ` +
    `Individuals or groups can leverage this strength as an entry point for growth — using the meta-awareness and complexity available in the ${leading.line} line to bring attention and intention to the less developed lines.`;

  const laggingConstraint = `The ${capitalizeFirst(lagging.line)} line represents the lagging constraint — the developmental bottleneck that limits the overall effectiveness of interventions. ` +
    `At the ${DEVELOPMENTAL_LEVELS[lagging.estimated_level].label} level, this line operates with less complexity and adaptability than the rest of the system. ` +
    `Any comprehensive intervention strategy must include support for ${lagging.line} line development, as neglecting this dimension will cause the system to default to its least developed capacity under stress.`;

  return { table, unevenDevelopmentAnalysis, leadingEdge, laggingConstraint };
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildMarkdownTable(headers: string[], rows: string[][]): string {
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

// ─── Tool Registration ───────────────────────────────────────────────────────

const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_aqal_situational",
    {
      title: "AQAL Situational Analysis",
      description:
        "Generates a structured AQAL analysis across four quadrants following the Integral AQAL (All Quadrants, All Levels) framework. " +
        "Output covers: Intentional/Subjective (interior individual — thoughts, feelings, self-identity), Behavioral/Objective " +
        "(exterior individual — observable behavior, metrics, physical processes), Cultural/Inter-subjective (interior collective — " +
        "shared values, worldviews, collective meaning), and Social/Inter-objective (exterior collective — systems, institutions, " +
        "structures, infrastructure).\n\n" +
        "Each quadrant produces: a context summary synthesizing input data through that quadrant's perspective, a solution summary " +
        "identifying intervention approaches for that dimension, actionable strategies scaled by output depth, and a map of second-order " +
        "effects showing potential downstream consequences of quadrant-specific interventions.\n\n" +
        "The output also includes a 2×2 quadrant overview table for quick reference and cross-quadrant dynamics analysis examining how " +
        "changes in one quadrant may relate to changes in others.\n\n" +
        "Use this tool when facing complex situations where single-perspective analysis is insufficient — organizational change, " +
        "conflict resolution, strategic planning, policy analysis, or any context where interior and exterior, individual and " +
        "collective dimensions should all be considered.",
      inputSchema: z
        .object({
          situation: z
            .string()
            .describe(
              "A clear description of the situation to analyze. Should capture the essential facts, " +
                "context, and why the situation matters."
            ),
          stakeholders: z
            .string()
            .describe(
              "The individuals, groups, or entities involved in or affected by the situation. " +
                "Can be a comma-separated list or narrative description."
            ),
          observable_data: z
            .string()
            .describe(
              "Third-person, objective data about the situation — measurable behaviors, performance metrics, " +
                "physical indicators, or any empirically observable phenomena."
            ),
          reported_experience: z
            .string()
            .describe(
              "First-person accounts of the situation — how people describe their inner experience, " +
                "feelings, perceptions, and meaning-making. This is the phenomenological data."
            ),
          cultural_context: z
            .string()
            .describe(
              "The shared values, norms, narratives, and worldview assumptions of the group or community " +
                "involved. What does 'we' believe about this situation?"
            ),
          systemic_context: z
            .string()
            .describe(
              "The structural, institutional, and systemic factors shaping the situation — policies, " +
                "processes, hierarchies, economic arrangements, technological infrastructure, and other " +
                "inter-objective conditions."
            ),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard")
            .describe(
              "Controls the depth of each quadrant analysis: 'essential' for a focused overview, " +
                "'standard' for balanced thoroughness, 'exhaustive' for maximum granularity."
            ),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output presentation mode: 'executive' for concise summaries, " +
                "'analytical' for full detailed output (default), 'exploratory' with open questions."
            ),
          assess_lines: z
            .boolean()
            .default(false)
            .describe(
              "When true, generate a psychograph-style multi-line developmental assessment " +
                "for each line of development (cognitive, emotional, intrapersonal, moral, " +
                "spiritual, kinesthetic, willpower)."
            ),
          lines_to_assess: z
            .array(
              z.enum(["cognitive", "emotional", "intrapersonal", "moral", "spiritual", "kinesthetic", "willpower"])
            )
            .optional()
            .describe(
              "Specific lines of development to assess. Defaults to all 7 lines when assess_lines is true."
            ),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          situation,
          stakeholders,
          observable_data,
          reported_experience,
          cultural_context,
          systemic_context,
          output_depth,
          output_mode,
          assess_lines,
          lines_to_assess,
        } = args;

        const fullText = `${situation} ${stakeholders} ${observable_data} ${reported_experience} ${cultural_context} ${systemic_context}`;
        const subjectType = detectSubjectType(situation, stakeholders, observable_data, reported_experience, cultural_context, systemic_context);
        const om = output_mode ?? 'analytical';
        const composerCtx: AqalComposerContext = {
          fullText,
          initialPosition: situation,
          outputMode: om,
        };

        const quadrants: Record<Quadrant, QuadrantAnalysis> = {
          intentional: generateQuadrantAnalysis({
            quadrant: "intentional",
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            depth: output_depth,
            subjectType,
            composerCtx,
            stepNumber: 1,
            totalSteps: 4,
          }),
          behavioral: generateQuadrantAnalysis({
            quadrant: "behavioral",
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            depth: output_depth,
            subjectType,
            composerCtx,
            stepNumber: 2,
            totalSteps: 4,
          }),
          cultural: generateQuadrantAnalysis({
            quadrant: "cultural",
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            depth: output_depth,
            subjectType,
            composerCtx,
            stepNumber: 3,
            totalSteps: 4,
          }),
          social: generateQuadrantAnalysis({
            quadrant: "social",
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            depth: output_depth,
            subjectType,
            composerCtx,
            stepNumber: 4,
            totalSteps: 4,
          }),
        };

        const epistemicStatus: EpistemicStatus = output_depth === 'exhaustive' ? 'well-supported' : output_depth === 'standard' ? 'tentative' : 'speculative';
        const suggestedFollowup: SuggestedTool[] = ['think_aqal_projection', 'think_hierarchical'];

        let markdown_output = formatAqalSituational(situation, {
          intentional: quadrants.intentional,
          behavioral: quadrants.behavioral,
          cultural: quadrants.cultural,
          social: quadrants.social,
        }, output_mode, epistemicStatus, suggestedFollowup);

        if (subjectType === "mixed") {
          markdown_output = "**Subject Classification:** This scenario spans multiple domains (ai-system + organization). Analysis integrates perspectives from both frameworks.\n\n" + markdown_output;
        }

        if (assess_lines) {
          const lines = lines_to_assess && lines_to_assess.length > 0
            ? lines_to_assess
            : (Object.keys(LINES_OF_DEVELOPMENT) as LineOfDevelopment[]);

          const psychographProfiles = generatePsychograph({
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            lines,
            depth: output_depth,
            subjectType,
          });

          const analysis = generatePsychographAnalysis(psychographProfiles);

          const psychographSection = [
            "",
            "## Psychograph: Lines of Development Analysis",
            "",
            analysis.table,
            "",
            "### Uneven Development Patterns",
            "",
            analysis.unevenDevelopmentAnalysis,
            "",
            `**Leading Edge:** ${analysis.leadingEdge}`,
            "",
            `**Lagging Constraint:** ${analysis.laggingConstraint}`,
          ].join("\n");

          markdown_output = markdown_output + psychographSection;
        }

        return {
          content: [{ type: "text", text: markdown_output }],
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
