import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  DEVELOPMENTAL_LEVELS,
  LINES_OF_DEVELOPMENT,
  CORE_DRIVES,
  QUADRANTS,
  SHADOW_FRAMEWORKS,
} from "../constants.js";
import { formatUnity } from "../utils/formatters.js";
import { composeToolContent } from "../utils/content-pipeline.js";
import type { EpistemicStatus, SuggestedTool, ThoughtType } from "../types.js";

const OUTPUT_DEPTH_ENUM = z.enum(["essential", "standard", "exhaustive"]);

function scaleDepth(depth: string, base: string, expanded: string, comprehensive: string): string {
  switch (depth) {
    case "essential":
      return base;
    case "exhaustive":
      return comprehensive;
    default:
      return expanded;
  }
}

function generateLoDSResponse(
  query: string,
  developmentalContext: string,
  behavioralPatterns: string,
  depth: string,
): string {
  const fullText = `${query} ${developmentalContext} ${behavioralPatterns}`;
  const composerAttempt = composeToolContent({
    toolName: "think_unity",
    text: fullText,
    initialPosition: query,
    mode: "analytical",
    stepNumber: 1,
    totalSteps: 8,
    thoughtType: "developmental" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = `The Levels of Development Subsystem (LoDS) maps the developmental altitude implicit in the query and behavioral patterns. The behavioral data ("${behavioralPatterns.slice(0, 150)}") suggests operation at a developmental stage characterized by specific cognitive complexity, perspective-taking range, and meaning-making depth. The developmental context provided ("${developmentalContext.slice(0, 150)}") further situates the system within the eight-stage spectrum from archaic to super-integral. The leading edge of development — the next available stage — represents capacities that the system is beginning to access but has not yet stabilized.`;

  const expanded = [
    `The Levels of Development Subsystem (LoDS) maps the developmental altitude implicit in the behavioral data and query context.`,
    ``,
    `**Current Stage Assessment:**`,
    ``,
    `The behavioral patterns ("${behavioralPatterns.slice(0, 200)}") reveal a specific configuration of cognitive complexity, emotional range, and meaning-making capacity. This configuration maps onto a particular developmental altitude within the eight-stage spectrum. The system's current stage determines: (a) what it can perceive and what remains invisible, (b) the range of perspectives it can genuinely take versus those it can only conceptually acknowledge, and (c) the types of problems it can solve and the types that exceed its current structural capacity.`,
    ``,
    `**Leading Edge Identification:**`,
    ``,
    `The developmental context ("${developmentalContext.slice(0, 200)}") provides information about the system's growth trajectory. The leading edge — the next stage beyond the current altitude — is not yet stabilized but is accessible in glimpses, under optimal conditions, or through conscious effort. The gap between the current stage and the leading edge represents the system's zone of proximal development in the developmental domain.`,
    ``,
    `**Transcend and Include Dynamics:**`,
    ``,
    `Each developmental stage transcends and includes the capacities of all previous stages. The query ("${query.slice(0, 150)}") may reveal which stage capacities are currently active, which are underutilized, and which are being challenged by circumstances that require higher-order functioning. When a system is operating at the edge of its developmental capacity, the behavioral data typically shows increased variability, creative experimentation, and occasional regressions under stress.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Stage-by-Stage Capacity Profile:**`,
    ``,
    Object.entries(DEVELOPMENTAL_LEVELS)
      .map(([key, stage]) => {
        const isLikely = behavioralPatterns.toLowerCase().includes(key) || developmentalContext.toLowerCase().includes(key);
        return `- **${stage.label}:** ${isLikely ? "Behavioral data suggests active engagement with this stage's capacities." : "This stage's capacities may be included but not currently at the leading edge of the system's development."}`;
      })
      .join("\n"),
    ``,
    `**Query-Specific Developmental Reading:**`,
    ``,
    `The specific query posed ("${query.slice(0, 200)}") itself carries developmental information. The complexity of the question, the range of perspectives it implicitly requests, and the level of abstraction it operates at all serve as indicators of the developmental altitude from which the query originates. A query that can hold multiple contradictory perspectives simultaneously, for instance, suggests postmodern or integral-stage thinking. A query focused on empirical evidence and logical consistency suggests modern-rational altitude. The LoDS reads the query itself as a developmental data point.`,
    ``,
    `**Developmental Stress Indicators:**`,
    ``,
    `When the behavioral patterns show evidence of the system being asked to function beyond its current developmental capacity — for example, when a mythic-stage structure is required to navigate postmodern-complexity environments — the data typically reveals characteristic stress patterns: cognitive overload, emotional flooding, rigid regression to earlier-stage solutions, or the deployment of sophisticated-sounding but structurally inadequate coping strategies. The presence or absence of these patterns in the behavioral data informs the accuracy of the stage assessment.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function generateLiDSResponse(
  query: string,
  developmentalContext: string,
  behavioralPatterns: string,
  depth: string,
): string {
  const fullText = `${query} ${developmentalContext} ${behavioralPatterns}`;
  const composerAttempt = composeToolContent({
    toolName: "think_unity",
    text: fullText,
    initialPosition: query,
    mode: "analytical",
    stepNumber: 2,
    totalSteps: 8,
    thoughtType: "diagnostic" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = `The Lines of Development Subsystem (LiDS) recognizes that development is not uniform across all domains. The behavioral data ("${behavioralPatterns.slice(0, 150)}") reveals a unique profile across the seven developmental lines: cognitive, emotional, intrapersonal, moral, spiritual, kinesthetic, and willpower. Each line develops relatively independently, creating an asymmetric developmental profile that no single stage score could capture. The query context suggests which lines are most actively engaged and which may represent growth edges.`;

  const expanded = [
    `The Lines of Development Subsystem (LiDS) maps the multi-dimensional developmental profile of the system, recognizing that development is not uniform across domains.`,
    ``,
    `**Line-by-Line Assessment:**`,
    ``,
    Object.entries(LINES_OF_DEVELOPMENT)
      .map(([key, line]) => {
        const isRelevant =
          behavioralPatterns.toLowerCase().includes(key) ||
          developmentalContext.toLowerCase().includes(key);
        return `**${line.label} Line:** ${line.description.slice(0, 150)}. ${isRelevant ? "The behavioral data shows direct engagement with this line's developmental tasks." : "This line's development is inferred from the broader behavioral pattern rather than direct evidence."}`;
      })
      .join("\n\n"),
    ``,
    `**Asymmetric Profile Analysis:**`,
    ``,
    `The most critical insight of the LiDS is the recognition of asymmetric development — the phenomenon where a system may be highly developed in some lines and relatively undeveloped in others. The behavioral data ("${behavioralPatterns.slice(0, 200)}") may reveal such asymmetry: high cognitive capacity paired with limited emotional regulation, strong willpower with underdeveloped intrapersonal awareness, or advanced moral reasoning with minimal spiritual development. These asymmetries are not defects but the normal condition of human development.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Line Interactions and Compensatory Patterns:**`,
    ``,
    `Lines do not develop in isolation. A highly developed cognitive line may compensate for an underdeveloped emotional line by intellectualizing affective experience. A strong willpower line may mask intrapersonal deficits through relentless activity. The behavioral data should be read for these compensatory patterns — where one line's strength is being used to cover another line's vulnerability. The query itself ("${query.slice(0, 150)}") may indicate which lines the system is most confident in (those it uses to frame the question) and which it is least confident in (those it avoids or delegates to others).`,
    ``,
    `**Developmental Line Shadow:**`,
    ``,
    `Each line has its own characteristic shadow manifestation. The cognitive line's shadow is intellectualization; the emotional line's shadow is reactive affectivity; the intrapersonal line's shadow is obsessive self-analysis; the moral line's shadow is self-righteousness; the spiritual line's shadow is spiritual bypassing; the kinesthetic line's shadow is somatic dissociation; the willpower line's shadow is rigid control. The behavioral data reveals which line shadows are most active based on the pattern of strengths and blind spots.`,
    ``,
    `**Profile Coherence:**`,
    ``,
    `The overall developmental profile is not simply the sum of individual line scores. The pattern of relationships between lines — which lines support each other, which create tension, which compensate for each other — constitutes the system's unique developmental signature. The query and behavioral data together provide enough information to sketch this profile, even if precise line-by-line scoring would require more extensive assessment.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function generateSoCSResponse(
  query: string,
  developmentalContext: string,
  behavioralPatterns: string,
  stateIndicators: string,
  depth: string,
): string {
  const fullText = `${query} ${developmentalContext} ${behavioralPatterns} ${stateIndicators}`;
  const composerAttempt = composeToolContent({
    toolName: "think_unity",
    text: fullText,
    initialPosition: query,
    mode: "analytical",
    stepNumber: 3,
    totalSteps: 8,
    thoughtType: "perspectival" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = `The States of Consciousness Subsystem (SoCS) maps the range of conscious states available to the system — from gross waking awareness through subtle, causal, witness, and non-dual states. Unlike developmental stages, which are permanent acquisitions, states are temporary experiences accessible at any developmental altitude. The behavioral data ("${behavioralPatterns.slice(0, 150)}") and state indicators ${stateIndicators ? `("${stateIndicators.slice(0, 150)}")` : "(not provided)"} reveal which states the system regularly accesses and which remain unavailable.`;

  const expanded = [
    `The States of Consciousness Subsystem (SoCS) maps the range of conscious states available to the system.`,
    ``,
    `**State Access Profile:**`,
    ``,
    `States are distinct from stages. A person at any developmental stage can access any state of consciousness, though the interpretation and integration of that state experience will be filtered through the current stage's structure. The behavioral data ("${behavioralPatterns.slice(0, 200)}") reveals the system's typical state repertoire:`,
    ``,
    `- **Gross State:** The default waking state of sensory-motor perception. All systems have access to this state; the question is the quality of attention within it — whether the system operates on autopilot or with sustained present-moment awareness.`,
    `- **Subtle State:** The dream state and the state of deep meditation, imagination, and visualization. Access to the subtle state is indicated by ${stateIndicators?.includes("dream") || stateIndicators?.includes("visual") ? "the provided state indicators mentioning dream or imagery content" : "creative capacity, dream recall, meditative experience, or the ability to hold mental imagery with clarity"}.`,
    `- **Causal State:** The formless state of pure awareness without content. Access to the causal state is indicated by experiences of emptiness, silence, or the recognition of awareness itself as distinct from its contents. ${stateIndicators?.includes("emptiness") || stateIndicators?.includes("silence") ? "The state indicators suggest causal state access." : "No direct evidence of causal state access in the provided data."}`,
    `- **Witness State:** The meta-aware state of observing one's own experience. Access to the witness state is indicated by the capacity for self-observation, mindfulness, and the ability to notice one's own thoughts and emotions without full identification. ${behavioralPatterns.includes("notice") || behavioralPatterns.includes("observe") || behavioralPatterns.includes("aware") ? "The behavioral data suggests witness state capacity." : "The behavioral data does not provide direct evidence of witness state access."}`,
    `- **Non-Dual State:** The state of subject-object collapse, in which the distinction between observer and observed dissolves. This is the rarest and most elusive state to identify from behavioral data alone, as its defining characteristic is the absence of the observing stance itself. ${stateIndicators?.includes("non-dual") || stateIndicators?.includes("unity") ? "The state indicators suggest non-dual experience." : "Non-dual state access cannot be reliably assessed from behavioral data alone."}`,
    ``,
    `**State-Stage Interaction:**`,
    ``,
    `The relationship between states and stages is crucial: states provide temporary experiences of what stages make permanently available. A system that accesses the witness state temporarily through meditation but has not stabilized the intrapersonal line at the corresponding developmental stage will lose the witness perspective under stress. The developmental context ("${developmentalContext.slice(0, 150)}") informs this interaction — it tells us which state experiences the system has the structural capacity to integrate and which remain fleeting.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**State Cultivation Patterns:**`,
    ``,
    `The behavioral data reveals whether the system actively cultivates access to non-gross states. Practices such as meditation, contemplation, dream work, creative visualization, and contemplative prayer are state-cultivation technologies. The presence or absence of these practices in the behavioral pattern informs the SoCS assessment of state availability. ${stateIndicators ? `The state indicators ("${stateIndicators.slice(0, 200)}") provide direct evidence of the system's state experience profile.` : `The absence of explicit state indicators means the SoCS must infer state access from behavioral proxies — creative output, reflective capacity, emotional regulation under stress, and the system's relationship to its own experience.`}`,
    ``,
    `**State Shadow:**`,
    ``,
    `Each state has a shadow manifestation. The gross state shadow is dissociation from bodily experience; the subtle state shadow is inflation through identification with archetypal or visionary contents; the causal state shadow is nihilistic withdrawal from relative reality; the witness state shadow is detached spectatorship that avoids engagement; the non-dual state shadow is the premature claim of enlightenment that bypasses developmental work. The behavioral data may reveal which state shadows are active based on the pattern of the system's relationship to its own experience.`,
    ``,
    `**State Coherence and the Query:**`,
    ``,
    `The query itself ("${query.slice(0, 150)}") carries state information. A query posed from the gross state is concrete, specific, and action-oriented. A query from the subtle state is imaginative, symbolic, and open to multiple interpretations. A query from the witness state is meta-cognitive, observing the process of inquiry itself. A query from the non-dual state dissolves the distinction between querier and queried. The SoCS reads the texture of the query as a state indicator.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function generateDriSResponse(
  _query: string,
  developmentalContext: string,
  behavioralPatterns: string,
  activeDrives: string,
  depth: string,
): string {
  const fullText = `${_query} ${developmentalContext} ${behavioralPatterns} ${activeDrives}`;
  const composerAttempt = composeToolContent({
    toolName: "think_unity",
    text: fullText,
    initialPosition: _query,
    mode: "analytical",
    stepNumber: 4,
    totalSteps: 8,
    thoughtType: "diagnostic" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = `The Drives Subsystem (DriS) analyzes the four core drives — agency, communion, eros, and agape — and evaluates their balance, expression, and pathological distortions. The behavioral data ("${behavioralPatterns.slice(0, 150)}") and active drives information ${activeDrives ? `("${activeDrives.slice(0, 150)}")` : "(not provided)"} reveal the current drive configuration: which drives are overemphasized, which are suppressed, and how their pathological expressions manifest in the system's functioning.`;

  const expanded = [
    `The Drives Subsystem (DriS) analyzes the four core drives and their dynamic equilibrium within the system.`,
    ``,
    `**Drive Configuration Analysis:**`,
    ``,
    Object.entries(CORE_DRIVES)
      .map(([key, drive]) => {
        const isRelevant =
          activeDrives?.toLowerCase().includes(key) ||
          behavioralPatterns.toLowerCase().includes(key) ||
          behavioralPatterns.toLowerCase().includes(drive.label.toLowerCase());
        return `**${drive.label}:** ${drive.description.slice(0, 150)}. ${isRelevant ? "This drive appears active in the behavioral data." : "This drive's expression is inferred from the broader behavioral pattern."} Pathological expression: ${drive.pathological_expression.slice(0, 150)}.`;
      })
      .join("\n\n"),
    ``,
    `**Drive Balance Assessment:**`,
    ``,
    `Health is not the maximization of any single drive but the dynamic interplay of all four. The behavioral data reveals the current drive balance: ${activeDrives ? `The active drives identified are: ${activeDrives}. The question is whether these drives are in dynamic equilibrium or whether some are dominating at the expense of others.` : `The absence of explicit drive identification means the DriS must infer drive configuration from behavioral patterns — overemphasized drives reveal themselves through their pathological expressions, while suppressed drives reveal themselves through their absence where they would naturally be expected.`}`,
    ``,
    `**Complementary Opposite Dynamics:**`,
    ``,
    `Agency and communion are complementary opposites — each requires the other for healthy expression. Agency without communion is isolation; communion without agency is enmeshment. Similarly, eros and agape form a complementary pair — eros without agape is destructive consumption; agape without eros is stagnant preservation. The behavioral data should be read for evidence of these complementary dynamics: is the system overdeveloping one pole while suppressing its opposite?`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Drive Pathology Mapping:**`,
    ``,
    `Each drive, when chronically overemphasized or suppressed, produces characteristic pathological expressions. The behavioral data ("${behavioralPatterns.slice(0, 200)}") should be mapped against the pathological profiles:`,
    ``,
    Object.entries(CORE_DRIVES)
      .map(([, drive]) => `- **${drive.label} pathology:** ${drive.pathological_expression.slice(0, 200)}`)
      .join("\n"),
    ``,
    `**Developmental Modulation of Drives:**`,
    ``,
    `The expression of each drive is modulated by the system's developmental stage. Agency at the magic-mythic stage looks different from agency at the integral stage — the same fundamental drive expresses through increasingly complex and differentiated forms as development proceeds. The developmental context ("${developmentalContext.slice(0, 150)}") informs how to interpret the drive data: the same behavioral pattern may represent healthy drive expression at one stage and pathological distortion at another.`,
    ``,
    `**Drive Recovery Patterns:**`,
    ``,
    `When a suppressed drive begins to reassert itself, it typically does so in its pathological form first — the long-denied agency emerges as aggression, the suppressed communion as codependency, the starved eros as addiction, the neglected agape as boundaryless enabling. This is not because the drive is inherently pathological but because it has been deprived of development and must grow through its earlier, cruder forms before reaching mature expression. The behavioral data may reveal drive recovery in progress.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function generateQuaSResponse(
  query: string,
  developmentalContext: string,
  behavioralPatterns: string,
  relationalContext: string,
  depth: string,
): string {
  const fullText = `${query} ${developmentalContext} ${behavioralPatterns} ${relationalContext}`;
  const composerAttempt = composeToolContent({
    toolName: "think_unity",
    text: fullText,
    initialPosition: query,
    mode: "analytical",
    stepNumber: 5,
    totalSteps: 8,
    thoughtType: "perspectival" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = `The Quadrants Subsystem (QuaS) ensures comprehensive analysis across all four dimensions of reality: intentional (interior individual), behavioral (exterior individual), cultural (interior collective), and social (exterior collective). The behavioral data ("${behavioralPatterns.slice(0, 150)}") and relational context ("${relationalContext.slice(0, 150)}") reveal which quadrants are currently receiving attention and which represent blind spots. A complete analysis requires all four quadrants; any single-quadrant approach is necessarily reductive.`;

  const expanded = [
    `The Quadrants Subsystem (QuaS) maps phenomena across all four dimensions of reality.`,
    ``,
    `**Quadrant Coverage Assessment:**`,
    ``,
    Object.entries(QUADRANTS)
      .map(([key, quadrant]) => {
        const isRelevant =
          behavioralPatterns.toLowerCase().includes(key) ||
          relationalContext.toLowerCase().includes(key) ||
          relationalContext.toLowerCase().includes(quadrant.label.toLowerCase());
        return `**${quadrant.full_label}:** ${quadrant.description.slice(0, 150)}. Epistemology: ${quadrant.epistemology.slice(0, 150)}. ${isRelevant ? "This quadrant appears active in the provided data." : "This quadrant may represent a blind spot in the current analysis."}`;
      })
      .join("\n\n"),
    ``,
    `**Quadrant Blind Spot Analysis:**`,
    ``,
    `The most valuable function of the QuaS is to identify which quadrants are being ignored. The behavioral data ("${behavioralPatterns.slice(0, 200)}") and relational context ("${relationalContext.slice(0, 200)}") reveal the current quadrant emphasis. Systems tend to operate within their preferred quadrants — individuals favor the intentional and behavioral quadrants, while organizations favor the cultural and social. The blind spots are precisely those quadrants that the system's preferred perspective renders invisible.`,
    ``,
    `**Cross-Quadrant Causality:**`,
    ``,
    `Events in any quadrant have effects in all other quadrants. The query ("${query.slice(0, 150)}") may implicitly focus on one quadrant while its causes and effects span all four. The QuaS traces these cross-quadrant causal pathways: how interior shifts (intentional) manifest as behavioral changes, how cultural narratives shape social structures, how social systems constrain individual possibilities, and how behavioral patterns reinforce or transform cultural meanings.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Quadrantal Shadow:**`,
    ``,
    `Each quadrant has its own characteristic shadow. The intentional shadow is the disowned interior experience — thoughts, feelings, and self-aspects the system cannot acknowledge. The behavioral shadow is the disowned exterior pattern — the behaviors, neurochemical states, and physical realities the system denies. The cultural shadow is the collective blind spot — shared meanings and assumptions that the group cannot examine because they form the invisible background of all examination. The social shadow is the systemic blind spot — structural arrangements that produce effects the system cannot trace back to their source.`,
    ``,
    `**Quadrant Integration:**`,
    ``,
    `The QuaS does not merely identify quadrants and their blind spots — it maps the relationships between them. The developmental context ("${developmentalContext.slice(0, 150)}") reveals the system's current capacity for quadrantal integration: can it hold all four perspectives simultaneously, or does it collapse into single-quadrant reductionism? The ability to see a phenomenon from all four quadrants without collapsing their differences into a single explanatory framework is itself a developmental achievement characteristic of integral-stage thinking.`,
    ``,
    `**Relational Context Through the Quadrantal Lens:**`,
    ``,
    `The relational context ("${relationalContext.slice(0, 200)}") is read through all four quadrants simultaneously: the interior experience of each participant (intentional), their observable interaction patterns (behavioral), the shared meanings and assumptions that shape the relationship (cultural), and the structural factors that enable or constrain the relationship (social). This four-dimensional reading reveals aspects of the relational dynamic that any single-quadrant analysis would miss.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function generateShWSResponse(
  query: string,
  developmentalContext: string,
  behavioralPatterns: string,
  shadowIndicators: string,
  depth: string,
): string {
  const fullText = `${query} ${developmentalContext} ${behavioralPatterns} ${shadowIndicators}`;
  const composerAttempt = composeToolContent({
    toolName: "think_unity",
    text: fullText,
    initialPosition: query,
    mode: "analytical",
    stepNumber: 6,
    totalSteps: 8,
    thoughtType: "corrective" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = `The Shadow Work Subsystem (ShWS) identifies the disowned, repressed, and unrecognized aspects of the system's experience. The behavioral data ("${behavioralPatterns.slice(0, 150)}") and shadow indicators ${shadowIndicators ? `("${shadowIndicators.slice(0, 150)}")` : "(not provided)"} reveal the current shadow configuration: what the system cannot see about itself, where its projections land, and which defense mechanisms are most active. The shadow is not a defect but a structural feature of consciousness — every structure has a shadow, defined as everything it cannot yet recognize.`;

  const expanded = [
    `The Shadow Work Subsystem (ShWS) applies multiple shadow frameworks to the behavioral data.`,
    ``,
    `**Shadow Identification:**`,
    ``,
    `The shadow is identified through several characteristic markers in the behavioral data:`,
    ``,
    `- **Contradiction Pattern:** Gaps between the system's self-description and its observable behavior. Where the system says one thing and does another, shadow material is likely operating.`,
    `- **Trigger Pattern:** Disproportionate emotional reactions to specific stimuli. The intensity of the reaction is proportional to the degree of unconscious identification with the projected content.`,
    `- **Repetition Pattern:** Behavioral patterns that recur despite negative consequences. The repetition compulsion is the shadow's most persistent signature.`,
    `- **Projection Pattern:** Qualities the system attributes to others that it cannot recognize in itself. ${shadowIndicators ? `The shadow indicators ("${shadowIndicators.slice(0, 150)}") suggest specific projection patterns.` : "No explicit shadow indicators were provided; projection patterns must be inferred from behavioral contradictions."}`,
    ``,
    `**Multi-Framework Shadow Reading:**`,
    ``,
    Object.entries(SHADOW_FRAMEWORKS)
      .map(([key, framework]) => {
        const isRelevant =
          shadowIndicators?.toLowerCase().includes(key) ||
          behavioralPatterns.toLowerCase().includes(key);
        return `**${framework.label}:** ${framework.key_concepts[0]}. ${isRelevant ? "The behavioral data shows direct resonance with this framework's shadow concepts." : "This framework provides a lens for interpreting the shadow dynamics even without direct evidence."}`;
      })
      .join("\n\n"),
    ``,
    `**Shadow and Development:**`,
    ``,
    `The developmental context ("${developmentalContext.slice(0, 150)}") determines the shadow's content and structure. At each developmental stage, different material becomes shadow. The shadow is not a fixed set of disowned qualities but a dynamic configuration that reorganizes as the system develops. What is shadow at one stage may be integrated at the next, while new shadow material emerges at the leading edge.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Shadow Dynamics in the Query:**`,
    ``,
    `The query itself ("${query.slice(0, 200)}") carries shadow information. What the system chooses to ask about reveals what it is attending to; what it does not ask about reveals what remains in shadow. The framing of the question — its assumptions, its blind spots, its areas of certainty and uncertainty — maps the boundary between the system's conscious awareness and its shadow. The ShWS reads the query as a shadow text, looking for the gaps, the avoided topics, the areas of excessive certainty (which often mask unconscious doubt), and the questions that are not being asked.`,
    ``,
    `**Shadow Integration Indicators:**`,
    ``,
    `The behavioral data may reveal whether the system is actively engaging with its shadow or actively avoiding it. Indicators of shadow engagement include: increased self-reflection, willingness to consider uncomfortable truths about oneself, openness to feedback that contradicts self-image, and the capacity to hold contradictory self-aspects without premature resolution. Indicators of shadow avoidance include: defensiveness when challenged, projection of unwanted qualities onto others, rigid adherence to self-narrative, and the use of sophisticated frameworks (including this one) to explain away rather than examine shadow material.`,
    ``,
    `**Collective and Systemic Shadow:**`,
    ``,
    `The ShWS recognizes that shadow is not only individual but collective and systemic. The behavioral data and shadow indicators may reveal collective shadow patterns — shared blind spots, group projections, and systemic defense mechanisms that operate at the level of the group, organization, or culture. These collective shadows are often more resistant to awareness than individual shadows because they are reinforced by the entire social system and lack the internal contradiction that makes individual shadow visible.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function generateDialogue(
  lodSResponse: string,
  lidSResponse: string,
  soCSResponse: string,
  driSResponse: string,
  quaSResponse: string,
  shWSResponse: string,
  depth: string,
): string {
  const fullText = `${lodSResponse} ${lidSResponse} ${soCSResponse} ${driSResponse} ${quaSResponse} ${shWSResponse}`;
  const composerAttempt = composeToolContent({
    toolName: "think_unity",
    text: fullText,
    initialPosition: lodSResponse,
    mode: "analytical",
    stepNumber: 7,
    totalSteps: 8,
    thoughtType: "synthetic" as ThoughtType,
    previousOutputs: [lodSResponse, lidSResponse, soCSResponse, driSResponse, quaSResponse, shWSResponse],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const dialogue = [
    `**LoDS to LiDS:** "You describe an asymmetric developmental profile, but I see the asymmetry differently. From the altitude perspective, the pattern you identify as a 'strong cognitive / weak emotional' split may actually be a stage-level phenomenon — the current developmental structure simply hasn't yet stabilized the emotional line at the same altitude. What you read as a line deficit, I read as a developmental trajectory."`,
    ``,
    `**LiDS responds to LoDS:** "The asymmetry is real and not reducible to stage. A person can be at the integral stage cognit while being at the mythic stage emotionally — this is not a temporary developmental lag but a structural feature of the lines' relative independence. Your altitude model risks flattening the genuine multi-dimensionality of the developmental landscape."`,
    ``,
    `**SoCS enters:** "Both of you are describing stage-level phenomena — permanent acquisitions. But what about states? The behavioral data may reveal state experiences that neither your altitude model nor your line model can account for. A person at any stage, with any line profile, can access non-dual awareness temporarily. This state experience, even if unintegrated, changes the system in ways that stage and line models miss."`,
    ``,
    `**DriS challenges SoCS:** "State experiences don't drive behavior — drives do. What determines whether a system acts from agency or communion, eros or agape, is not which state it's accessing but which drives are dominant. Your state analysis is interesting but misses the motivational engine beneath all behavior. The system doesn't act because it's in the subtle state — it acts because eros is pulling it toward growth or agape is holding it in acceptance."`,
    ``,
    `**SoCS responds to DriS:** "You conflate state and drive, but they're distinct. A system can access the witness state and experience all four drives with equal clarity, without being captured by any single one. The state determines the quality of awareness within which drives operate. A drive analyzed from the gross state looks fundamentally different from the same drive analyzed from the witness state."`,
    ``,
    `**QuaS mediates:** "You're all describing different quadrants of the same territory. LoDS and LiDS focus on the intentional and behavioral quadrants — individual development. SoCS spans all four quadrants but emphasizes the intentional. DriS operates primarily in the intentional and behavioral. But what about the cultural and social quadrants? The behavioral data and relational context reveal collective patterns that no individual-focused subsystem can fully account for."`,
    ``,
    `**ShWS interrupts:** "Every subsystem I've been listening to is describing what the system CAN see about itself. My job is to point out what NONE of you can see. The LoDS's confidence in its stage assessment is itself a potential shadow — the arrogance of the map-maker who confuses the map with the territory. The LiDS's multi-dimensional pride may be a defense against the simpler truth that some lines are underdeveloped because the system doesn't want to develop them. The SoCS's state reports may be spiritual bypassing. The DriS's drive analysis may be intellectualization. The QuaS's quadrant comprehensiveness may be the very defense mechanism that prevents deep engagement with any single quadrant."`,
    ``,
    `**LoDS to ShWS:** "Your shadow reading of my reading is itself a shadow reading — and that's the point. The shadow is infinite regress. But your critique is valid: every subsystem, including you, operates from a particular developmental altitude, and that altitude determines what the subsystem can and cannot see. The LoDS acknowledges its own shadow — the stages it cannot yet access are the stages whose data it cannot properly interpret."`,
    ``,
    `**LiDS adds:** "And the lines I cannot assess in myself are the lines whose shadow manifestations I'm most likely to enact unconsciously. The ShWS is right to point this out. But the value of the multi-system approach is precisely that each subsystem's shadow is another subsystem's data. What the LoDS misses, the LiDS catches. What the LiDS misses, the ShWS illuminates."`,
    ``,
    `**QuaS concludes the dialogue:** "This is the value of the quadrantal approach applied to the subsystems themselves. Each subsystem is a perspective — a quadrant of analysis, if you will. The LoDS is the developmental altitude perspective. The LiDS is the multi-dimensional profile perspective. The SoCS is the state-experience perspective. The DriS is the motivational perspective. The QuaS is the comprehensive perspective. The ShWS is the blind-spot perspective. None is complete. Together, they create a stereoscopic vision — depth perception through the parallax of multiple perspectives. The tension between them is not a problem to be resolved but the very mechanism that produces insight no single perspective could generate."`,
  ].join("\n");

  if (depth === "essential") {
    return [
      `The six subsystems engage in dialogue, each challenging the others' blind spots: LoDS questions LiDS's line autonomy claims; LiDS resists LoDS's altitude reductionism; SoCS introduces state-level phenomena that both miss; DriS challenges SoCS on motivational primacy; QuaS points out the collective blind spots; ShWS reveals that every subsystem's confidence in its own analysis is itself shadow material. The value lies not in any single perspective but in the parallax created by holding all six simultaneously.`,
    ].join("\n");
  }

  return dialogue;
}

function generateSynthesis(
  query: string,
  _lodSResponse: string,
  _lidSResponse: string,
  _soCSResponse: string,
  _driSResponse: string,
  _quaSResponse: string,
  _shWSResponse: string,
  depth: string,
): string {
  const fullText = `${query} ${_lodSResponse} ${_lidSResponse} ${_soCSResponse} ${_driSResponse} ${_quaSResponse} ${_shWSResponse}`;
  const composerAttempt = composeToolContent({
    toolName: "think_unity",
    text: fullText,
    initialPosition: query,
    mode: "analytical",
    stepNumber: 8,
    totalSteps: 8,
    thoughtType: "synthetic" as ThoughtType,
    previousOutputs: [_lodSResponse, _lidSResponse, _soCSResponse, _driSResponse, _quaSResponse, _shWSResponse],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = [
    `The Unity Multi-System Analysis engaged six subsystems — LoDS, LiDS, SoCS, DriS, QuaS, and ShWS — in response to the query: "${query.slice(0, 150)}".`,
    ``,
    `**Convergent Insights:** All subsystems converge on the observation that the behavioral data reveals a system operating at the edge of its current capacity. The LoDS identifies the developmental altitude, the LiDS maps the asymmetric profile, the SoCS reveals state access patterns, the DriS exposes drive imbalances, the QuaS identifies quadrant blind spots, and the ShWS illuminates what none of the others can see. Together, they create a multi-dimensional portrait that no single lens could produce.`,
    ``,
    `**Emergent Understanding:** The synthesis that emerges from the inter-system dialogue is not the average of the six perspectives but the pattern of relationships between them. The tension between LoDS and LiDS reveals the fundamental question of developmental theory: is development primarily a matter of altitude or of multi-dimensional profile? The answer, as the dialogue suggests, is both — and the relationship between the two is itself the most interesting data point.`,
  ].join("\n");

  const expanded = [
    base,
    ``,
    `**Key Emergent Patterns:**`,
    ``,
    `1. **The Altitude-Line-State-Drive-Quadrant-Shadow Matrix:** The six subsystems do not describe six different things — they describe the same system from six different angles. The developmental altitude (LoDS) determines which lines (LiDS) are available for stabilization, which states (SoCS) can be meaningfully integrated, which drives (DriS) can express maturely, which quadrants (QuaS) can be held simultaneously, and what constitutes the shadow (ShWS) at this particular configuration.`,
    ``,
    `2. **Shadow as Meta-Perspective:** The ShWS occupies a unique position in the system — it is the subsystem that analyzes the shadow of all the others, including itself. This creates a productive infinite regress: the ShWS's analysis has a shadow, which would require a meta-ShWS to analyze, and so on. Rather than being a logical problem, this regress is a feature — it ensures that the analysis never closes, never claims finality, and always leaves room for what has not yet been seen.`,
    ``,
    `3. **The Dialogue as the Product:** The most valuable output of the Unity analysis is not any individual subsystem's response but the inter-system dialogue itself. It is in the space between perspectives — where LoDS challenges LiDS, where ShWS challenges everyone — that the emergent insights appear. These insights are not available to any single subsystem because they are properties of the relationship between subsystems, not of any subsystem in isolation.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Developmental Implications of the Synthesis:**`,
    ``,
    `The synthesis reveals that the system's primary developmental task may not be advancing along any single dimension but integrating the dimensions that are already active. The LiDS's asymmetric profile, the DriS's drive imbalances, and the QuaS's quadrant blind spots all point to the same underlying dynamic: the system has developed certain capacities to a high degree while leaving others underdeveloped. The next stage of development may not require new capacities so much as integration of existing ones.`,
    ``,
    `**The Role of State Experience in Integration:**`,
    ``,
    `The SoCS's contribution to the synthesis is critical: state experiences provide temporary access to the integrated perspective that the system is working toward developmentally. A non-dual state experience, for instance, provides a direct taste of what it would feel like if all the lines, drives, and quadrants were fully integrated. This state experience, even if fleeting, serves as a compass — it shows the system the direction of integration, even if the developmental work of getting there must proceed stage by stage, line by line.`,
    ``,
    `**Shadow as the Engine of Development:**`,
    ``,
    `The ShWS's final insight in the synthesis is that shadow is not the enemy of development but its engine. The tension between what the system can see and what it cannot see — between its conscious self-model and its behavioral reality — is the motivational force that drives development forward. Without shadow, there would be no reason to grow. The shadow is the gap between the system's current configuration and its potential, and it is precisely this gap that the Unity analysis illuminates from six different angles simultaneously.`,
    ``,
    `**Query as Developmental Catalyst:**`,
    ``,
    `The act of posing the query ("${query.slice(0, 200)}") is itself a developmental act. The system that asks this question is already operating at an altitude that can hold multiple perspectives simultaneously — the very capacity that the Unity analysis demonstrates. The query is both a product of the system's current developmental configuration and a catalyst for its next stage of growth. By requesting this multi-system analysis, the system has already begun the process of integration that the analysis describes.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_unity",
    {
      title: "Unity Multi-System Analysis",
      description:
        "Generates a multi-lens analysis applying 6 analytical subsystems and synthesizing their outputs. Subsystems: " +
        "LoDS (Levels), LiDS (Lines), SoCS (States), DriS (Drives), QuaS (Quadrants), ShWS (Shadow). Each subsystem " +
        "produces a structured analysis following its respective framework, and the tool generates an inter-system " +
        "synthesis section that cross-references findings across all lenses. The output follows a template-based framework " +
        "that organizes results by subsystem and then produces an integrated summary.",
      inputSchema: z.object({
        query: z.string().describe("The central question or phenomenon being analyzed"),
        developmental_context: z.string().describe("Developmental background and trajectory of the system"),
        state_indicators: z.string().optional().describe("Observable indicators of consciousness states (meditation practice, dream reports, altered states, etc.)"),
        behavioral_patterns: z.string().describe("Specific behavioral patterns and observable data"),
        relational_context: z.string().describe("The relational and interpersonal context in which the system operates"),
        shadow_indicators: z.string().optional().describe("Observable shadow indicators (projections, contradictions, triggers, defense mechanisms)"),
        active_drives: z.string().optional().describe("Which core drives appear most active (agency, communion, eros, agape)"),
        output_depth: OUTPUT_DEPTH_ENUM.default("standard").describe("Depth of analysis: essential (brief), standard (moderate), exhaustive (comprehensive)"),
        output_mode: z.enum(["executive", "analytical", "exploratory"]).default("analytical").describe("Output presentation mode: 'executive' for concise summaries, 'analytical' for full detailed output (default), 'exploratory' with open questions."),
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const {
          query,
          developmental_context,
          state_indicators,
          behavioral_patterns,
          relational_context,
          shadow_indicators,
          active_drives,
          output_depth,
          output_mode,
        } = args;

        const depth = output_depth ?? "standard";
        const states = state_indicators ?? "";
        const shadows = shadow_indicators ?? "";
        const drives = active_drives ?? "";

        const lodSResponse = generateLoDSResponse(query, developmental_context, behavioral_patterns, depth);
        const lidSResponse = generateLiDSResponse(query, developmental_context, behavioral_patterns, depth);
        const soCSResponse = generateSoCSResponse(query, developmental_context, behavioral_patterns, states, depth);
        const driSResponse = generateDriSResponse(query, developmental_context, behavioral_patterns, drives, depth);
        const quaSResponse = generateQuaSResponse(query, developmental_context, behavioral_patterns, relational_context, depth);
        const shWSResponse = generateShWSResponse(query, developmental_context, behavioral_patterns, shadows, depth);

        const dialogue = generateDialogue(
          lodSResponse,
          lidSResponse,
          soCSResponse,
          driSResponse,
          quaSResponse,
          shWSResponse,
          depth,
        );

        const synthesis = generateSynthesis(
          query,
          lodSResponse,
          lidSResponse,
          soCSResponse,
          driSResponse,
          quaSResponse,
          shWSResponse,
          depth,
        );

        const subsystemResponses = [
          { name: "lodS", label: "LoDS — Levels of Development", response: lodSResponse },
          { name: "lidS", label: "LiDS — Lines of Development", response: lidSResponse },
          { name: "soCS", label: "SoCS — States of Consciousness", response: soCSResponse },
          { name: "driS", label: "DriS — Drives", response: driSResponse },
          { name: "quaS", label: "QuaS — Quadrants", response: quaSResponse },
          { name: "shWS", label: "ShWS — Shadow Work", response: shWSResponse },
        ];

        const epistemicStatus: EpistemicStatus = depth === 'exhaustive' ? 'well-supported' : depth === 'standard' ? 'tentative' : 'speculative';
        const suggestedFollowup: SuggestedTool[] = [];

        const formatted = formatUnity(query, subsystemResponses, dialogue, synthesis, output_mode, epistemicStatus, suggestedFollowup);

        return {
          content: [{ type: "text" as const, text: formatted }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error generating Unity analysis: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
