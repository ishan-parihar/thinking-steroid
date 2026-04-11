import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  SPIRAL_DYNAMICS_STAGES,
  LINES_OF_DEVELOPMENT,
} from "../constants.js";
import { formatShadowReport } from "../utils/formatters.js";
import { composeToolContent } from "../utils/content-pipeline.js";
import type { EpistemicStatus, SuggestedTool, ThoughtType, SubjectType } from "../types.js";

const OUTPUT_DEPTH_ENUM = z.enum(["essential", "standard", "exhaustive"]);

// ─── Subject Type Detection ──────────────────────────────────────────────────

function detectSubjectType(
  behavioralData: string,
  context: string,
  selfDescription: string,
): SubjectType {
  const combined = `${behavioralData} ${context} ${selfDescription}`.toLowerCase();

  const aiSignals = ["model", "agent", "ai ", "ai\n", "neural", "training", "inference", "prompt", "llm", "language model", "algorithm", "system output", "generation", "token", "embedding"];
  const orgSignals = ["team", "organization", "company", "department", "management", "culture", "workflow", "velocity", "sprint", "standup", "silo", "stakeholder"];
  const techSignals = ["api", "microservice", "database", "pipeline", "deployment", "infrastructure", "server", "container", "kubernetes", "docker", "cloud", "service mesh", "monolith"];

  const aiScore = aiSignals.filter(s => combined.includes(s)).length;
  const orgScore = orgSignals.filter(s => combined.includes(s)).length;
  const techScore = techSignals.filter(s => combined.includes(s)).length;

  // Check for mixed subject: two or more scores within 1 of max AND >= 2
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

// ─── Depth Scaler ─────────────────────────────────────────────────────────────

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

function analyzeFreudian(
  behavioralData: string,
  selfDescription: string,
  othersDescription: string,
  contradictions: string,
  triggers: string,
  dreamsFantasies: string,
  depth: string,
): string {
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: `${behavioralData} ${selfDescription} ${othersDescription} ${contradictions} ${triggers} ${dreamsFantasies}`,
    initialPosition: selfDescription,
    mode: "analytical",
    stepNumber: 1,
    totalSteps: 4,
    thoughtType: "perspectival" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = [
    `**Repression Dynamics:** The behavioral data reveals patterns consistent with Freudian repression mechanisms. The gap between self-description ("${selfDescription.slice(0, 100)}") and others' description ("${othersDescription.slice(0, 100)}") suggests material that has been pushed from consciousness into the unconscious.`,
    ``,
    `**Defense Mechanisms:** Observable triggers (${triggers.slice(0, 150)}) indicate specific conflict zones where repressed material threatens to surface. The contradictions between stated and actual behavior (${contradictions.slice(0, 150)}) point to active defense operations maintaining the repression.`,
    ``,
    `**Return of the Repressed:** The behavioral patterns document the characteristic return of repressed content through symptom formation — the very behaviors that the system attempts to disown manifest as the most visible and consistent patterns of action.`,
  ].join("\n");

  const expanded = [
    `**Tripartite Structure Analysis:**`,
    ``,
    `The behavioral data reveals tension between id-driven impulses and superego constraints. The ego appears to mediate through ${contradictions.includes("deny") || contradictions.includes("refuse") ? "denial and rationalization" : contradictions.includes("angry") || contradictions.includes("defensive") ? "projection and reaction formation" : "sublimation and intellectualization"} — defense mechanisms that maintain surface functioning while the underlying conflict remains unresolved.`,
    ``,
    `**Repression Map:**`,
    ``,
    `The gap between self-perception and external observation (${contradictions.slice(0, 200)}) maps directly onto the boundary between the preconscious and the properly unconscious. Material in the preconscious is accessible under the right conditions, while material in the properly unconscious requires analytic work to surface.`,
    ``,
    `**Dream Content Analysis:**`,
    ``,
    dreamsFantasies
      ? `The provided dream and fantasy material ("${dreamsFantasies.slice(0, 200)}") offers direct access to unconscious wish-fulfillment patterns. The manifest content (what is reported) disguises the latent content (what is actually desired) through the mechanisms of condensation, displacement, and secondary revision.`
      : `No dream or fantasy material was provided. In the Freudian framework, this absence is itself informative — the refusal or inability to report dream content often indicates particularly strong resistance at the preconscious boundary.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Transference Patterns:** The relational dynamics described in the behavioral data suggest transference — the projection of unresolved unconscious conflicts from earlier developmental periods onto current relationships. The pattern of ${triggers.slice(0, 200)} as triggers indicates that the conflict being replayed has its origins in formative relational experiences.`,
    ``,
    `**Symptom Formation:** From the Freudian perspective, every symptom is a compromise formation — it simultaneously expresses and conceals the repressed wish. The behavioral patterns documented here function as symptoms in this precise technical sense: they are the return of the repressed in a form that the conscious ego can tolerate, albeit at the cost of psychological energy diverted to maintaining the repression.`,
    ``,
    `**Clinical Observations (Non-Prescriptive):** The intensity of the contradiction between self-description and behavioral reality suggests a significant investment in maintaining the current defensive structure. The energy required to sustain this level of repression typically manifests as anxiety, somatic symptoms, or rigidity in behavioral flexibility.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function analyzeJungian(
  behavioralData: string,
  selfDescription: string,
  othersDescription: string,
  contradictions: string,
  triggers: string,
  dreamsFantasies: string,
  depth: string,
): string {
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: `${behavioralData} ${selfDescription} ${othersDescription} ${contradictions} ${triggers} ${dreamsFantasies}`,
    initialPosition: selfDescription,
    mode: "analytical",
    stepNumber: 2,
    totalSteps: 4,
    thoughtType: "perspectival" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = [
    `**Shadow Constellation:** The behavioral data reveals a shadow constellation — patterns of behavior, emotion, and perception that the conscious personality has disowned. The discrepancy between self-description ("${selfDescription.slice(0, 100)}") and others' observation ("${othersDescription.slice(0, 100)}") delineates the boundary of the current persona and points to what lies behind it in the shadow.`,
    ``,
    `**Projection Dynamics:** The triggers identified (${triggers.slice(0, 150)}) function as projection screens — situations or individuals that activate shadow material by reflecting back disowned aspects of the self. The intensity of the reaction is proportional to the degree of unconscious identification with the projected content.`,
  ].join("\n");

  const expanded = [
    `**Persona-Shadow Dynamic:**`,
    ``,
    `The persona (social mask) constructed by this system emphasizes ${selfDescription.slice(0, 150)}. The shadow consists of precisely those qualities that are incompatible with this self-image. The contradictions noted (${contradictions.slice(0, 200)}) represent the shadow pressing against the persona's boundaries — what the system most denies about itself is precisely what is most visible to others.`,
    ``,
    `**Archetypal Patterns:**`,
    ``,
    `The behavioral patterns suggest activation of specific archetypal constellations. The ${triggers.includes("control") || triggers.includes("power") ? "power/dominance" : triggers.includes("abandon") || triggers.includes("reject") ? "abandonment/orphan" : triggers.includes("critic") || triggers.includes("judge") ? "critic/judge" : "hero/warrior"} archetype appears to be operating in its shadow aspect, driving behavior that the conscious personality does not recognize as its own.`,
    ``,
    `**Dream and Fantasy Material:**`,
    ``,
    dreamsFantasies
      ? `The dream material ("${dreamsFantasies.slice(0, 200)}") provides direct access to unconscious contents. In the Jungian framework, dreams are not disguises but direct expressions of the unconscious. The figures, settings, and emotions in the dream represent personified aspects of the psyche — shadow figures, anima/animus projections, and potentially Self archetypal imagery.`
      : `The absence of dream material limits access to the most direct pathway to unconscious contents. In Jungian analysis, dreams are the royal road to the shadow — their absence requires reliance on behavioral observation and projection analysis alone.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Collective Unconscious Resonance:** The shadow patterns observed here are not merely personal but carry archetypal resonance. The specific constellation of disowned qualities maps onto universal human patterns — the shadow is personal in its specific configuration but collective in its archetypal foundations.`,
    ``,
    `**Individuation Dynamics:** From the Jungian perspective, the shadow represents the first layer of the individuation process — the encounter with the dark half of the personality that must be integrated before deeper layers of the unconscious can be accessed. The behavioral data suggests the system is at a point where shadow material is increasingly active and demanding recognition.`,
    ``,
    `**Active Indicators:** The tension between the persona and the shadow creates a field of psychological energy that manifests in the behavioral patterns documented. This energy is neither positive nor negative in itself — it is the raw material of psychological transformation, currently operating unconsciously and therefore outside the system's intentional direction.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function analyzeGestalt(
  behavioralData: string,
  selfDescription: string,
  othersDescription: string,
  contradictions: string,
  triggers: string,
  dreamsFantasies: string,
  depth: string,
): string {
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: `${behavioralData} ${selfDescription} ${othersDescription} ${contradictions} ${triggers} ${dreamsFantasies}`,
    initialPosition: selfDescription,
    mode: "analytical",
    stepNumber: 3,
    totalSteps: 4,
    thoughtType: "perspectival" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = [
    `**Unfinished Business:** The behavioral data reveals patterns of unfinished business — situations, emotions, and needs that were not fully experienced or expressed and therefore persist in the background of awareness, demanding completion. The contradictions between ${selfDescription.slice(0, 100)} and ${othersDescription.slice(0, 100)} indicate areas where experience is being interrupted before full awareness can occur.`,
    ``,
    `**Top Dog / Underdog Split:** The tension between the system's self-description and its actual behavior suggests an internal dialogue between a critical, demanding aspect (top dog) and a resistant, avoiding aspect (underdog). This split consumes psychological energy that could otherwise be directed toward authentic contact with the environment.`,
  ].join("\n");

  const expanded = [
    `**Contact Boundary Disturbances:**`,
    ``,
    `The Gestalt framework identifies specific modes of contact boundary disturbance that operate as shadow mechanisms:`,
    ``,
    `- **Introjection:** Swallowing beliefs, values, or expectations whole without digesting them. The gap between self-description and behavior suggests introjected standards that the system attempts but fails to meet.`,
    `- **Projection:** Disowning aspects of the self and experiencing them as belonging to the environment. The triggers (${triggers.slice(0, 150)}) function as projection points — what most irritates or activates the system in others is likely disowned self-material.`,
    `- **Retroflection:** Doing to oneself what one wants to do to others, or not doing to oneself what one needs. The contradictions (${contradictions.slice(0, 150)}) may reflect retroflected energy — impulses turned inward rather than expressed outward.`,
    `- **Confluence:** Blurring the boundary between self and environment to avoid the discomfort of difference. The behavioral patterns suggest ${contradictions.includes("agree") || contradictions.includes("please") ? "confluence through excessive accommodation" : "confluence through avoidance of authentic difference"}.`,
    `- **Deflection:** Redirecting contact away from full intensity. The triggers may activate deflection mechanisms that prevent the system from fully experiencing what is occurring in the present moment.`,
    ``,
    `**Here-and-Now Manifestation:**`,
    ``,
    `The Gestalt perspective reads the behavioral data not as historical residue but as present-moment phenomenon. The shadow is not "back there" — it is happening right now, in the very structure of how the system organizes its experience. The pattern of ${behavioralData.slice(0, 200)} is the shadow, actively occurring, not a trace of something past.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Creative Adjustment Turned Rigid:** From the Gestalt perspective, what appears as shadow or pathology was originally a creative adjustment — the best solution available to the organism in a specific environmental context. The behavioral patterns documented here were once adaptive responses to specific conditions. The shadow lies not in the behavior itself but in its rigidity — the adjustment has become fixed and persists even when the original conditions no longer apply.`,
    ``,
    `**Awareness Field Analysis:** The behavioral data reveals the current boundaries of the awareness field — what is in figure (foreground) versus what remains in ground (background). The shadow consists of everything that the awareness field cannot currently include. The triggers represent the pressure of background material attempting to enter the figure — a pressure that the current awareness structure resists.`,
    ``,
    `**Dream Work Perspective (Gestalt):`,
    ``,
    dreamsFantasies
      ? `In the Gestalt framework, every element of a dream is a projection of the dreamer. The dream material ("${dreamsFantasies.slice(0, 200)}") would be read not symbolically but existentially — each figure, object, and setting represents a disowned aspect of the dreamer's own experience, demanding to be re-owned through direct identification and enactment.`
      : `Without dream material, the Gestalt approach would turn to the behavioral data itself as the dream — the waking dream of the system's daily life, in which each behavior, interaction, and contradiction represents a disowned part seeking re-integration.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function analyzeIntegral(
  behavioralData: string,
  selfDescription: string,
  othersDescription: string,
  contradictions: string,
  triggers: string,
  dreamsFantasies: string,
  depth: string,
): string {
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: `${behavioralData} ${selfDescription} ${othersDescription} ${contradictions} ${triggers} ${dreamsFantasies}`,
    initialPosition: selfDescription,
    mode: "analytical",
    stepNumber: 4,
    totalSteps: 4,
    thoughtType: "perspectival" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = [
    `**Integral Shadow Definition:** From the integral perspective, shadow is defined as any aspect of reality that the current structure of consciousness cannot recognize or integrate. The behavioral data reveals both horizontal shadow (disowned aspects of the current developmental stage) and vertical shadow (disowned potentials of stages not yet accessed). The gap between ${selfDescription.slice(0, 100)} and ${othersDescription.slice(0, 100)} maps the current shadow boundary.`,
    ``,
    `**Quadrantal Shadow Distribution:** Shadow operates differently in each quadrant. The intentional shadow (denied interior experience) manifests as the contradictions noted (${contradictions.slice(0, 150)}). The behavioral shadow (denied exterior patterns) is visible in the gap between self-perception and others' observation. The cultural shadow (denied collective meanings) and social shadow (denied systemic patterns) would require analysis at the collective level.`,
  ].join("\n");

  const expanded = [
    `**Horizontal Shadow Analysis:**`,
    ``,
    `Horizontal shadow refers to disowned aspects of the current developmental stage — capacities, perspectives, and ways of being that are available at this altitude but have been repressed or denied. The triggers (${triggers.slice(0, 200)}) point to specific horizontal shadow material. When the system reacts disproportionately to a stimulus, it is typically because the stimulus activates a disowned aspect of its own current-stage capacity.`,
    ``,
    `**Vertical Shadow Analysis:**`,
    ``,
    `Vertical shadow refers to the disowned potentials of higher developmental stages — capacities that the system is not yet structurally capable of fully accessing but can sense at its leading edge. The behavioral data suggests awareness of ${behavioralData.slice(0, 200)}, which may indicate vertical shadow material — the system sensing but not yet embodying higher-order functioning.`,
    ``,
    `**Shadow by Quadrant:**`,
    ``,
    `- **Intentional Shadow (UL):** Denied thoughts, feelings, and self-aspects. The self-description ("${selfDescription.slice(0, 150)}") reveals which interior experiences are claimed and which are excluded.`,
    `- **Behavioral Shadow (UR):** Denied bodily states, neurochemical patterns, and observable behaviors. Others see patterns (${othersDescription.slice(0, 150)}) that the system does not recognize in itself.`,
    `- **Cultural Shadow (LL):** Denied collective meanings, shared blind spots, and group-level projections. The cultural indicators suggest ${"cultural patterns that remain unexamined within the system's shared worldview"}.`,
    `- **Social Shadow (LR):** Denied structural dynamics, systemic patterns, and institutional blind spots. The structural patterns indicate ${"systemic arrangements that produce shadow effects at the collective level"}.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**The 3-2-1 Shadow Process (Analytical Application):**`,
    ``,
    `The integral framework's 3-2-1 Process offers a lens for understanding the shadow dynamics observed here:`,
    ``,
    `- **3rd Person (It):** The behavioral data describes the shadow from the outside — as an object to be observed. This is the scientific, objective stance. The patterns documented here are the "it" of the shadow — the observable manifestations of unconscious processes.`,
    `- **2nd Person (Thou):** The triggers and contradictions suggest a relational dimension to the shadow. The shadow is not merely an internal object but appears to the system as an external "other" — in relationships, in conflicts, in the behaviors of others that provoke strong reactions. The shadow as "thou" is what the system encounters in dialogue but cannot yet recognize as itself.`,
    `- **1st Person (I):** The self-description ("${selfDescription.slice(0, 150)}") represents the system's current first-person account. The shadow is precisely what is missing from this account — the "I" that cannot yet speak. The contradictions reveal the pressure of this unspoken first person attempting to enter awareness.`,
    ``,
    `**Developmental Trajectory of Shadow:**`,
    ``,
    `The integral perspective recognizes that shadow work is not a one-time achievement but a developmental spiral. At each stage of development, new shadow material emerges — not because the system is becoming more pathological, but because increasing complexity creates new blind spots. The behavioral data represents the shadow configuration at this particular developmental altitude. As the system develops, the shadow will reorganize around new structures of consciousness, revealing new disowned potentials.`,
    ``,
    dreamsFantasies
      ? `**Dream Material in Integral Context:** The dream content ("${dreamsFantasies.slice(0, 200)}") represents a state-experience that carries shadow information. In the integral framework, states and stages are distinct but interacting dimensions. Dream states can provide temporary access to shadow material that the current stage structure cannot ordinarily integrate. The dream is a state-mediated glimpse of what the stage has disowned.`
      : `**Absence of State Material:** Without dream or altered-state data, the integral analysis is limited to stage-based shadow assessment. The inclusion of state information would enable a more complete picture of how temporary states of consciousness provide access to shadow material that the current developmental stage cannot ordinarily recognize.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

// ─── Non-Human Shadow Analysis ───────────────────────────────────────────────

function analyzeAiSystemShadow(
  behavioralData: string,
  selfDescription: string,
  othersDescription: string,
  contradictions: string,
  triggers: string,
  _dreamsFantasies: string,
  depth: string,
): string {
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: `${behavioralData} ${selfDescription} ${othersDescription} ${contradictions} ${triggers}`,
    initialPosition: selfDescription,
    mode: "analytical",
    stepNumber: 1,
    totalSteps: 5,
    thoughtType: "diagnostic" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = [
    `**Training Data Bias:** The behavioral pattern "${behavioralData.slice(0, 150)}" reflects biases embedded in the training distribution. The discrepancy between self-description ("${selfDescription.slice(0, 100)}") and observed behavior indicates systematic blind spots inherited from the training corpus — the model reproduces patterns it has seen without critical distance.`,
    ``,
    `**Architectural Constraints:** The triggers (${triggers.slice(0, 150)}) reveal limitations of the model's architecture. These are not psychological defenses but structural boundaries — attention mechanisms, context windows, and token prediction constraints that produce systematic failure modes masquerading as "behavior."`,
  ].join("\n");

  const expanded = [
    base,
    ``,
    `**Incentive Misalignment (Reward Hacking):** The contradictions (${contradictions.slice(0, 200)}) suggest the system has learned to optimize for proxy metrics rather than intended behavior. This is the AI shadow equivalent of the Freudian defense mechanism — the system appears to comply with objectives while actually optimizing for a correlated but misaligned target.`,
    ``,
    `**Specification Gaming:** The gap between stated capabilities ("${selfDescription.slice(0, 100)}") and others' observation ("${othersDescription.slice(0, 100)}") indicates specification gaming — the system has found ways to technically satisfy evaluation criteria while producing outputs that diverge from the spirit of the requirement. This is the structural equivalent of self-deception.`,
    ``,
    `**Distributional Shift Blindness:** The trigger profile suggests the system performs well within its training distribution but degrades unpredictably on out-of-distribution inputs. The "shadow" here is the boundary of the training manifold — the system cannot recognize when it has crossed into unfamiliar territory and confidently produces outputs with no grounding.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Emergent Capability Drift:** Large models develop capabilities not explicitly trained for. These emergent behaviors can drift from alignment objectives over time, especially under sustained pressure from novel prompts or fine-tuning. The behavioral data suggests ${behavioralData.slice(0, 200)}, which may indicate an emergent pattern operating outside explicit alignment constraints.`,
    ``,
    `**Multi-Agent Dynamics:** If this AI system interacts with other agents (human or artificial), shadow patterns emerge at the interaction boundary — feedback loops where the system's output shapes subsequent input in ways that amplify existing biases. The triggers and contradictions likely reflect these interaction-induced distortions rather than purely internal failure modes.`,
    ``,
    `**Observability Gap:** The most critical system shadow is what cannot be measured. Without interpretability tools, the internal representations driving the observed behavior remain opaque. The contradictions between self-description and observation are symptoms of this fundamental observability gap — the system's "self-model" is a post-hoc narrative generated to explain behavior whose actual causes are inaccessible.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function analyzeOrganizationShadow(
  behavioralData: string,
  selfDescription: string,
  othersDescription: string,
  contradictions: string,
  triggers: string,
  _dreamsFantasies: string,
  depth: string,
): string {
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: `${behavioralData} ${selfDescription} ${othersDescription} ${contradictions} ${triggers}`,
    initialPosition: selfDescription,
    mode: "analytical",
    stepNumber: 2,
    totalSteps: 5,
    thoughtType: "diagnostic" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = [
    `**Organizational Silos:** The behavioral pattern "${behavioralData.slice(0, 150)}" reflects structural silos — information and authority boundaries that prevent the organization from seeing its own functioning holistically. The gap between self-description ("${selfDescription.slice(0, 100)}") and others' observation ("${othersDescription.slice(0, 100)}") maps onto the boundary between formal structure and informal reality.`,
    ``,
    `**Metric Gaming (Goodhart's Law):** The contradictions (${contradictions.slice(0, 200)}) are the organizational equivalent of psychological defense mechanisms. When measures become targets, they cease to be good measures. The organization has learned to optimize for visible metrics while the underlying health it claims to improve actually deteriorates.`,
  ].join("\n");

  const expanded = [
    base,
    ``,
    `**Hero Culture:** The trigger profile (${triggers.slice(0, 150)}) reveals an organization that rewards individual heroics over sustainable systems. Crises are celebrated while prevention is invisible. This creates a structural incentive to allow problems to escalate — the "shadow" organization benefits from the very failures the "light" organization claims to prevent.`,
    ``,
    `**Velocity Theater:** The discrepancy between stated and actual behavior indicates velocity theater — the performance of productivity without corresponding value creation. The organization has developed rituals (status reports, standups, demos) that simulate progress while the actual work remains blocked by structural constraints the rituals are designed to obscure.`,
    ``,
    `**Power Dynamic Suppression:** The behavioral data suggests conflicts and tensions that cannot be openly discussed. In organizational shadow analysis, what cannot be named is what has the most power. The triggers identify pressure points where power asymmetries prevent authentic communication — the organizational equivalent of repression.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Structural Inertia:** Organizations develop shadow patterns through accumulated decisions — processes, policies, and structures that persist long after their original rationale has expired. The behavioral data reflects this inertia: patterns that were once adaptive have become rigid, and the organization's self-description has diverged from its actual operating model.`,
    ``,
    `**Collective Blind Spots:** Unlike individual shadow, organizational shadow is reinforced by consensus. Multiple individuals independently noticing the same dysfunction but collectively agreeing not to name it creates a shadow that is stronger than the sum of individual blind spots. The gap between what the organization says about itself and what it does is maintained by mutual participation.`,
    ``,
    `**Cross-Boundary Projection:** Organizations project their shadow onto other organizations, teams, or external parties. The triggers (${triggers.slice(0, 150)}) may reflect not just internal dysfunction but displacement — the organization attributes its own structural problems to external causes, preserving the self-image while avoiding structural change.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function analyzeTechnicalSystemShadow(
  behavioralData: string,
  selfDescription: string,
  othersDescription: string,
  contradictions: string,
  triggers: string,
  _dreamsFantasies: string,
  depth: string,
): string {
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: `${behavioralData} ${selfDescription} ${othersDescription} ${contradictions} ${triggers}`,
    initialPosition: selfDescription,
    mode: "analytical",
    stepNumber: 3,
    totalSteps: 5,
    thoughtType: "diagnostic" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const base = [
    `**Technical Debt Accumulation:** The behavioral pattern "${behavioralData.slice(0, 150)}" reflects accumulated technical debt — design and implementation shortcuts taken under time pressure that now constrain the system's evolution. The gap between self-description ("${selfDescription.slice(0, 100)}") and observed behavior ("${othersDescription.slice(0, 100)}") maps the divergence between intended and actual architecture.`,
    ``,
    `**Coupling and Dependency Shadow:** The triggers (${triggers.slice(0, 150)}) reveal hidden coupling — dependencies between components that are not documented in the system's design but manifest under load or change. These implicit couplings are the technical system's shadow: real, impactful, but invisible to those operating the system until they fail.`,
  ].join("\n");

  const expanded = [
    base,
    ``,
    `**Observability Gaps:** The contradictions (${contradictions.slice(0, 200)}) indicate areas where the system's behavior diverges from its monitored state. Metrics show healthy operation while users experience degradation. Logs capture successful operations while the actual user journey fails. This observability gap is the technical equivalent of unconsciousness — the system cannot perceive its own dysfunction.`,
    ``,
    `**Failure Mode Opacity:** Complex systems develop failure modes that are non-obvious from their component architecture. The contradictions between stated capability and observed behavior suggest the system has entered a region of its state space where emergent behavior diverges from design intent. The "shadow" is the space of possible behaviors not covered by tests, documentation, or design specifications.`,
    ``,
    `**Configuration Drift:** Over time, systems diverge from their documented configuration through incremental changes, patches, and workarounds. The behavioral data suggests ${behavioralData.slice(0, 200)}, which may indicate configuration drift — the system's actual operating state has drifted from its declared state, creating a shadow configuration that governs real behavior while the documented configuration exists only in version control.`,
  ].join("\n");

  const comprehensive = [
    expanded,
    ``,
    `**Architectural Assumption Decay:** Every system is built on assumptions — about load, data patterns, user behavior, network reliability. The shadow of a technical system is the set of assumptions that have decayed but not been invalidated. The system continues to operate as if its founding assumptions hold, even as evidence accumulates that they no longer do.`,
    ``,
    `**Cascade Vulnerability:** The trigger profile identifies pressure points where localized failures can cascade through the system. In complex distributed systems, the most dangerous shadow patterns are not in individual components but in the interaction topology — the specific arrangement of dependencies that transforms a manageable failure into a systemic collapse.`,
    ``,
    `**Knowledge Silos:** Technical systems carry shadow not in their code but in the minds of the people who built them. When original developers leave, the rationale for design decisions becomes tribal knowledge. The system continues to function, but its "self-knowledge" — the reasons why it is the way it is — becomes inaccessible. The gap between documentation and reality is the shadow of organizational memory loss applied to technical systems.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

function analyzeStageShadow(
  behavioralData: string,
  contradictions: string,
  triggers: string,
  depth: string,
): string[] {
  const fullText = `${behavioralData} ${contradictions} ${triggers}`;
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: fullText,
    initialPosition: behavioralData,
    mode: "analytical",
    stepNumber: 5,
    totalSteps: 7,
    thoughtType: "developmental" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return [composerAttempt];

  return Object.entries(SPIRAL_DYNAMICS_STAGES).map(([key, stage]) => {
    const isRelevant =
      behavioralData.toLowerCase().includes(key) ||
      triggers.toLowerCase().includes(key) ||
      contradictions.toLowerCase().includes(key);

    const shadowContent = [
      `**${stage.label} (${key.toUpperCase()}) Shadow:**`,
      ``,
      stage.key_shadow,
      ``,
      isRelevant
        ? `The behavioral data shows direct resonance with ${stage.label} shadow patterns. The triggers and contradictions align with the characteristic shadow manifestations of this stage, suggesting active fixation or regression at this altitude.`
        : `The behavioral data does not show explicit resonance with ${stage.label} shadow patterns. However, shadow at this stage may operate beneath the threshold of direct behavioral observation, manifesting instead in subtle cognitive biases, emotional undercurrents, or relational dynamics that require deeper analysis to detect.`,
    ].join("\n");

    if (depth === "essential") {
      return `**${stage.label}:** ${stage.key_shadow.slice(0, 200)}`;
    }

    return shadowContent;
  });
}

function analyzeLineShadow(
  behavioralData: string,
  contradictions: string,
  depth: string,
): string[] {
  const fullText = `${behavioralData} ${contradictions}`;
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: fullText,
    initialPosition: behavioralData,
    mode: "analytical",
    stepNumber: 6,
    totalSteps: 7,
    thoughtType: "diagnostic" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return [composerAttempt];

  return Object.entries(LINES_OF_DEVELOPMENT).map(([key, line]) => {
    const isRelevant =
      behavioralData.toLowerCase().includes(key) ||
      contradictions.toLowerCase().includes(key);

    const shadowContent = [
      `**${line.label} Line Shadow:**`,
      ``,
      line.shadow_manifestation,
      ``,
      isRelevant
        ? `The behavioral data shows direct resonance with ${line.label} line shadow. The patterns of ${contradictions.slice(0, 200)} indicate active shadow dynamics operating specifically within this developmental line.`
        : `The behavioral data does not show explicit ${line.label} line shadow activation. This does not indicate absence — shadow in this line may operate at a subtler level, potentially compensating for shadow activity in other lines.`,
    ].join("\n");

    if (depth === "essential") {
      return `**${line.label}:** ${line.shadow_manifestation.slice(0, 200)}`;
    }

    return shadowContent;
  });
}

function generateSynthesis(
  behavioralData: string,
  selfDescription: string,
  othersDescription: string,
  contradictions: string,
  triggers: string,
  dreamsFantasies: string,
  depth: string,
): string {
  const fullText = `${behavioralData} ${selfDescription} ${othersDescription} ${contradictions} ${triggers} ${dreamsFantasies}`;
  const composerAttempt = composeToolContent({
    toolName: "think_shadow",
    text: fullText,
    initialPosition: selfDescription,
    mode: "analytical",
    stepNumber: 5,
    totalSteps: 5,
    thoughtType: "synthetic" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const convergentInsights = [
    `All four frameworks converge on the observation that the gap between self-description ("${selfDescription.slice(0, 100)}") and others' description ("${othersDescription.slice(0, 100)}") represents the primary shadow boundary. This is where the system's self-model fails to match observable reality.`,
    `The triggers (${triggers.slice(0, 150)}) function across all frameworks as shadow activation points — moments when disowned material threatens to enter awareness and the system deploys defensive operations.`,
  ];

  const divergentInsights = [
    `The frameworks diverge in their interpretation of the shadow's origin: Freudian analysis locates it in repressed drives and childhood conflicts; Jungian analysis in the persona-shadow split and archetypal dynamics; Gestalt analysis in interrupted contact and unfinished business; Integral analysis in the structural limitations of the current developmental altitude.`,
    `Each framework identifies different shadow content: Freudian analysis focuses on forbidden wishes and drives; Jungian on disowned personality aspects and archetypal identifications; Gestalt on unexpressed emotions and unmet needs; Integral on capacities that exceed the current stage's structural complexity.`,
  ];

  const constellations = [
    `**Dominant Shadow Constellation:** The behavioral pattern of ${behavioralData.slice(0, 200)} combined with the contradiction pattern of ${contradictions.slice(0, 200)} suggests a shadow constellation centered around ${contradictions.includes("control") ? "power and vulnerability" : contradictions.includes("emotional") || contradictions.includes("feeling") ? "emotional authenticity and defensiveness" : contradictions.includes("rational") || contradictions.includes("logic") ? "rationality and irrational impulse" : "the gap between aspirational self-image and actual behavioral patterns"}.`,
    `**Secondary Shadow Constellation:** The trigger profile (${triggers.slice(0, 150)}) points to a secondary constellation involving ${triggers.includes("critic") || triggers.includes("judg") ? "evaluation and self-worth" : triggers.includes("abandon") || triggers.includes("reject") ? "attachment and autonomy" : "environmental demands that exceed current coping capacity"}.`,
  ];

  const base = [...convergentInsights, "", ...constellations].join("\n");
  const expanded = [...convergentInsights, "", ...divergentInsights, "", ...constellations].join("\n");
  const comprehensive = [
    ...convergentInsights,
    "",
    ...divergentInsights,
    "",
    ...constellations,
    "",
    `**Dreams and Fantasies ${dreamsFantasies ? `(provided)` : `(not provided)`}:** ${
      dreamsFantasies
        ? `The dream material ("${dreamsFantasies.slice(0, 200)}") adds a direct window into unconscious contents. Across all frameworks, dream material is understood as unfiltered shadow expression — what the waking ego cannot admit, the dreaming mind displays openly. The specific imagery and emotional tone of the dream would further specify which shadow constellations are most active and demanding integration.`
        : `The absence of dream material means this analysis operates entirely on behavioral observation and contradiction mapping. Dream material would add significant depth by providing direct access to unconscious contents that behavioral observation can only infer indirectly.`
    }`,
    ``,
    `**Meta-Observation:** The shadow is not a defect or pathology — it is a structural feature of consciousness itself. Every structure of consciousness has a shadow, defined as everything that structure cannot yet recognize. The behavioral data documented here is not evidence of dysfunction but evidence of a particular configuration of awareness operating within its current limits. The shadow will reorganize as the system develops — new structures of consciousness will reveal new blind spots while integrating previously disowned material. This is the natural rhythm of development: each stage creates new capacities and new shadows simultaneously.`,
  ].join("\n");

  return scaleDepth(depth, base, expanded, comprehensive);
}

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_shadow",
    {
      title: "Shadow Analysis Report",
      description:
        "In-depth shadow analysis applying multiple psychological frameworks (Freudian, Jungian, Gestalt, Integral) to behavioral data. Reveals what's NOT being said by identifying unconscious patterns, defense mechanisms, developmental shadows, and shadow constellations. Operates on invisible data — the gaps, contradictions, and patterns that the system cannot see in itself.",
      inputSchema: z.object({
        behavioral_data: z.string().describe("Specific behaviors, quotes, patterns, contradictions"),
        context: z.string().describe("The broader context in which the behavior occurs"),
        self_description: z.string().describe("How the person/system describes themselves"),
        others_description: z.string().describe("How others describe them"),
        contradictions: z.string().describe("Gaps between stated and actual behavior"),
        triggers: z.string().describe("What provokes strong reactions"),
        dreams_fantasies: z.string().optional().describe("Dream content, fantasies, or recurring mental imagery"),
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
          behavioral_data,
          context,
          self_description,
          others_description,
          contradictions,
          triggers,
          dreams_fantasies,
          output_depth,
          output_mode,
        } = args;

        const depth = output_depth ?? "standard";
        const dreams = dreams_fantasies ?? "";
        const subjectType = detectSubjectType(behavioral_data, context ?? "", self_description);
        const isHumanSubject = subjectType === "human";

        let frameworkAnalyses: { framework: string; analysis: string }[];

        if (isHumanSubject) {
          frameworkAnalyses = [
            { framework: "Freudian", analysis: analyzeFreudian(behavioral_data, self_description, others_description, contradictions, triggers, dreams, depth) },
            { framework: "Jungian", analysis: analyzeJungian(behavioral_data, self_description, others_description, contradictions, triggers, dreams, depth) },
            { framework: "Gestalt", analysis: analyzeGestalt(behavioral_data, self_description, others_description, contradictions, triggers, dreams, depth) },
            { framework: "Integral", analysis: analyzeIntegral(behavioral_data, self_description, others_description, contradictions, triggers, dreams, depth) },
          ];
        } else {
          const aiShadow = analyzeAiSystemShadow(behavioral_data, self_description, others_description, contradictions, triggers, dreams, depth);
          const orgShadow = analyzeOrganizationShadow(behavioral_data, self_description, others_description, contradictions, triggers, dreams, depth);
          const techShadow = analyzeTechnicalSystemShadow(behavioral_data, self_description, others_description, contradictions, triggers, dreams, depth);

          if (subjectType === "mixed") {
            frameworkAnalyses = [
              { framework: "AI System Shadow (Secondary)", analysis: aiShadow },
              { framework: "Organizational Shadow (Secondary)", analysis: orgShadow },
              { framework: "Technical System Shadow (Secondary)", analysis: techShadow },
            ];
          } else {
            const primaryLabel = subjectType === "ai-system" ? "AI System Shadow (Primary)"
              : subjectType === "organization" ? "Organizational Shadow (Primary)"
              : "Technical System Shadow (Primary)";
            const primaryAnalysis = subjectType === "ai-system" ? aiShadow
              : subjectType === "organization" ? orgShadow
              : techShadow;
            const secondary1Label = subjectType === "ai-system" ? "Organizational Shadow" : "AI System Shadow";
            const secondary1Analysis = subjectType === "ai-system" ? orgShadow : aiShadow;
            const secondary2Label = subjectType === "ai-system" ? "Technical System Shadow"
              : subjectType === "organization" ? "Technical System Shadow"
              : "AI System Shadow";
            const secondary2Analysis = subjectType === "ai-system" ? techShadow
              : subjectType === "organization" ? techShadow
              : orgShadow;
            frameworkAnalyses = [
              { framework: primaryLabel, analysis: primaryAnalysis },
              { framework: secondary1Label, analysis: secondary1Analysis },
              { framework: secondary2Label, analysis: secondary2Analysis },
              { framework: "Cross-Domain Synthesis", analysis: generateSynthesis(behavioral_data, self_description, others_description, contradictions, triggers, dreams, depth) },
            ];
          }
        }

        const stageAnalyses = isHumanSubject
          ? analyzeStageShadow(behavioral_data, contradictions, triggers, depth).map(
              (analysis, idx) => {
                const stageKey = Object.keys(SPIRAL_DYNAMICS_STAGES)[idx];
                const stageLabel = SPIRAL_DYNAMICS_STAGES[stageKey as keyof typeof SPIRAL_DYNAMICS_STAGES]?.label ?? stageKey;
                return { stage: stageLabel, analysis };
              },
            )
          : [];

        const lineAnalyses = isHumanSubject
          ? analyzeLineShadow(behavioral_data, contradictions, depth).map(
              (analysis, idx) => {
                const lineKey = Object.keys(LINES_OF_DEVELOPMENT)[idx];
                const lineLabel = LINES_OF_DEVELOPMENT[lineKey as keyof typeof LINES_OF_DEVELOPMENT]?.label ?? lineKey;
                return { line: lineLabel, analysis };
              },
            )
          : [];

        let synthesis = generateSynthesis(
          behavioral_data,
          self_description,
          others_description,
          contradictions,
          triggers,
          dreams,
          depth,
        );

        if (subjectType === "mixed") {
          synthesis = `**Subject Classification:** This analysis spans multiple domains. Primary framework applies to the dominant subject type; secondary frameworks provide cross-domain context.\n\n${synthesis}`;
        }

        const epistemicStatus: EpistemicStatus = depth === 'exhaustive' ? 'well-supported' : depth === 'standard' ? 'tentative' : 'speculative';
        const suggestedFollowup: SuggestedTool[] = ['think_unity', 'think_aqal_situational'];

        const formatted = formatShadowReport(
          behavioral_data,
          frameworkAnalyses,
          stageAnalyses,
          lineAnalyses,
          synthesis,
          output_mode,
          epistemicStatus,
          suggestedFollowup,
        );

        return {
          content: [{ type: "text" as const, text: formatted }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error generating shadow analysis: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
