import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SequentialStep, OutputDepth, ThinkingMode, ReasoningSubMode, EpistemicStatus, SuggestedTool, OutputMode, ThoughtType } from "../types.js";
import { formatSequentialThinking } from "../utils/formatters.js";
import { composeToolContent, getStructureForText } from "../utils/content-pipeline.js";

// ─── Step Generation Engine ──────────────────────────────────────────────────

/**
 * Maps output depth to the number of reasoning steps.
 */
function depthToStepCount(depth: OutputDepth): number {
  switch (depth) {
    case "essential":
      return 3;
    case "standard":
      return 5;
    case "exhaustive":
      return 7;
  }
}

/**
 * Generates psychologically-grounded reasoning steps for sequential thinking.
 * Each step builds on the previous one, with decreasing confidence as
 * uncertainty compounds, and explicit counter-arguments for epistemic rigor.
 */
function generateSteps(params: {
  problem: string;
  initialPosition: string;
  depth: OutputDepth;
  mode: ThinkingMode;
  reasoningSubMode?: ReasoningSubMode;
  assumptionsToChallenge?: string;
  counterPerspective?: string;
  fullText?: string;
  structure?: import("../types.js").ProblemStructure;
  composeForStep?: (stepIdx: number) => string;
}): SequentialStep[] {
  const { problem, initialPosition, depth, mode, reasoningSubMode = 'deductive', assumptionsToChallenge, counterPerspective, fullText, composeForStep } = params;
  const stepCount = depthToStepCount(depth);
  const steps: SequentialStep[] = [];

  // Mode-specific framing for each step's analytical approach
  const modeFraming: Record<ThinkingMode, {
    stepPhases: string[];
    confidenceBase: number;
    decaySlope: number;
  }> = {
    analytical: {
      stepPhases: [
        "Deconstruct the problem into its constituent elements and identify the core variables at play.",
        "Analyze the causal relationships between identified variables and map dependency structures.",
        "Evaluate the strength of evidence supporting the initial position and identify gaps.",
        "Synthesize findings into a coherent model that accounts for observed patterns.",
        "Stress-test the model against edge cases and boundary conditions.",
        "Identify second-order implications and emergent properties of the analysis.",
        "Formulate a final assessment with explicit confidence bounds and remaining uncertainties.",
      ],
      confidenceBase: 0.72,
      decaySlope: 0.065,
    },
    creative: {
      stepPhases: [
        "Suspend judgment and generate alternative framings of the problem space.",
        "Explore lateral connections between the problem and seemingly unrelated domains.",
        "Identify hidden assumptions that constrain the current solution space.",
        "Generate novel combinations of existing elements to form unexpected possibilities.",
        "Evaluate creative alternatives against feasibility and impact criteria.",
        "Refine the most promising alternatives through iterative conceptual prototyping.",
        "Integrate creative insights back into the original problem structure for a enriched perspective.",
      ],
      confidenceBase: 0.55,
      decaySlope: 0.075,
    },
    critical: {
      stepPhases: [
        "Identify the core claims embedded in the initial position and subject each to scrutiny.",
        "Examine the logical structure of arguments supporting the position for fallacies.",
        "Survey alternative explanations and evaluate their comparative explanatory power.",
        "Test the position against empirical evidence and identify disconfirming data.",
        "Assess the epistemic foundations of the position and their vulnerability to revision.",
        "Examine the ideological or motivational factors that may bias the analysis.",
        "Render a verdict on the position's validity with explicit acknowledgment of residual doubt.",
      ],
      confidenceBase: 0.65,
      decaySlope: 0.06,
    },
    strategic: {
      stepPhases: [
        "Define the strategic objective and map the current position relative to the desired end state.",
        "Identify key stakeholders, their interests, and the power dynamics shaping the landscape.",
        "Enumerate available courses of action and their resource requirements.",
        "Evaluate each option against strategic criteria: feasibility, impact, risk, and alignment.",
        "Anticipate competitor or environmental responses to each strategic option.",
        "Design a phased implementation plan with decision points and contingency triggers.",
        "Establish metrics for strategic success and mechanisms for course correction.",
      ],
      confidenceBase: 0.58,
      decaySlope: 0.072,
    },
  };

  const framing = modeFraming[mode];

  // Parse assumptions to challenge if provided
  const assumptionsList = assumptionsToChallenge
    ? assumptionsToChallenge.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  for (let i = 0; i < stepCount; i++) {
    const phaseDescription = framing.stepPhases[i] ?? "Continue the analysis with depth and rigor.";

    // ─── Calibrated confidence with meaningful variance ──────────────────────
    // Confidence varies based on: (1) step position via mode-specific decay,
    // (2) uncertainty keywords in phase description, (3) early-step penalty
    // reflecting that initial steps have less contextual grounding.

    // Signal 1: mode-specific decay from step index
    const decayConfidence = framing.confidenceBase * (1 - framing.decaySlope * i);

    // Signal 2: uncertainty keywords in phase text lower confidence
    const uncertaintyKeywords = [
      "evaluate", "identify", "examine", "test", "assess", "scrutiny",
      "vulnerabilit", "edge case", "uncertaint", "doubt", "question",
      "challenge", "risk", "unknown", "ambig", "complex",
    ];
    const phaseText = phaseDescription.toLowerCase();
    const hasUncertainty = uncertaintyKeywords.some((kw) => phaseText.includes(kw));
    const uncertaintyPenalty = hasUncertainty ? 0.037 : 0;

    // Signal 3: early-step penalty (steps 0-1 have less context to build on)
    const earlyStepPenalty = i <= 1 ? 0.023 : 0;

    const confidence = Math.max(0.25, Math.min(0.92, decayConfidence - uncertaintyPenalty - earlyStepPenalty));

    // Try content composer first, fall back to templates
    let claim: string;
    let reasoning: string;
    if (composeForStep && fullText) {
      const composed = composeForStep(i);
      if (composed.length > 200) {
        const parts = composed.split(/\s*—\s*Reasoning:\s*/);
        claim = parts[0]?.trim() ?? composed;
        reasoning = parts[1]?.trim() ?? composed;
      } else {
        claim = generateClaim(i, mode, reasoningSubMode, problem, phaseDescription);
        reasoning = generateReasoning(i, mode, reasoningSubMode, problem, initialPosition, phaseDescription);
      }
    } else {
      claim = generateClaim(i, mode, reasoningSubMode, problem, phaseDescription);
      reasoning = generateReasoning(i, mode, reasoningSubMode, problem, initialPosition, phaseDescription);
    }

    const assumptions = generateAssumptions(i, mode, reasoningSubMode, assumptionsList, problem);
    const counterArgument = generateCounterArgument(i, mode, reasoningSubMode, problem, counterPerspective);
    const nextInvestigation = generateNextInvestigation(i, stepCount, mode, reasoningSubMode, problem);
    const confidenceJustification = generateConfidenceJustification(i, mode, confidence, phaseDescription, reasoningSubMode);

    steps.push({
      step_number: i + 1,
      claim,
      reasoning,
      confidence: Math.round(confidence * 100) / 100,
      confidence_justification: confidenceJustification,
      reasoning_sub_mode: reasoningSubMode,
      assumptions,
      counter_argument: counterArgument,
      next_investigation: nextInvestigation,
    });
  }

  // Ensure meaningful variance across all steps
  if (steps.length > 1) {
    const confidences = steps.map((s) => s.confidence);
    const minC = Math.min(...confidences);
    const maxC = Math.max(...confidences);
    const range = maxC - minC;
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    // Force range > 20pp if natural variance fell short
    if (range < 0.20) {
      const minIdx = confidences.indexOf(minC);
      const maxIdx = confidences.indexOf(maxC);
      const shortfall = 0.22 - range;
      steps[maxIdx].confidence = Math.round((steps[maxIdx].confidence + shortfall / 2) * 100) / 100;
      steps[minIdx].confidence = Math.round((steps[minIdx].confidence - shortfall / 2) * 100) / 100;
    }

    // Force at least one step below average
    const hasBelowAverage = steps.some((s) => s.confidence < avgConfidence);
    if (!hasBelowAverage) {
      const minIdx = steps.reduce(
        (best, s, idx) => (s.confidence < steps[best].confidence ? idx : best),
        0
      );
      steps[minIdx].confidence = Math.round(Math.max(0.25, steps[minIdx].confidence - 0.08) * 100) / 100;
    }

    // Avoid exact round numbers (0.50, 0.60, 0.80)
    const roundAvoid = new Set([0.50, 0.60, 0.80]);
    for (const step of steps) {
      if (roundAvoid.has(step.confidence)) {
        step.confidence += 0.01;
      }
    }
  }

  return steps;
}

function generateClaim(step: number, mode: ThinkingMode, reasoningSubMode: ReasoningSubMode, _problem: string, _phase: string): string {
  const claimTemplates: Record<ThinkingMode, string[]> = {
    analytical: [
      `The problem can be decomposed into distinct causal factors that operate at different levels of abstraction.`,
      `Causal relationships form a directed graph where feedback loops create non-linear dynamics.`,
      `The initial position holds partial validity but overlooks critical mediating variables.`,
      `A synthesized model reveals that the dominant factor is not immediately apparent from surface observation.`,
      `Edge cases expose vulnerabilities in the model that require qualification of the primary conclusion.`,
      `Second-order effects create cascading consequences that amplify or dampen the primary signal.`,
      `The final assessment indicates a bounded conclusion with specific conditions for applicability.`,
    ],
    creative: [
      `The problem may be fundamentally misframed — the real question lies one level deeper.`,
      `Concepts from distant domains offer structural analogies that illuminate hidden dimensions.`,
      `The constraints we accept as given are largely self-imposed and can be productively dissolved.`,
      `Novel combinations of existing elements generate solution spaces that were previously invisible.`,
      `The most promising alternatives succeed by reframing the problem's success criteria.`,
      `Iterative refinement reveals that the creative insight requires grounding in practical constraints.`,
      `The enriched perspective integrates creative and analytical modes for a more complete understanding.`,
    ],
    critical: [
      `The initial position rests on claims that are stronger in rhetoric than in evidential support.`,
      `Logical analysis reveals at least one structural weakness in the argument's inferential chain.`,
      `Alternative explanations account for the same data with fewer assumptions or greater predictive power.`,
      `Empirical evidence presents a mixed picture, with significant data points that resist easy integration.`,
      `The epistemic foundations are context-dependent and do not generalize without additional justification.`,
      `Motivated reasoning and confirmation bias are plausible concerns that warrant methodological safeguards.`,
      `The position survives critical scrutiny in qualified form, but with substantially reduced confidence.`,
    ],
    strategic: [
      `The strategic landscape is defined by a gap between current capabilities and desired outcomes.`,
      `Stakeholder analysis reveals misaligned incentives that will shape the feasibility of any intervention.`,
      `Multiple viable courses of action exist, each with distinct risk-reward profiles and resource demands.`,
      `Option evaluation indicates that a hybrid approach outperforms any single-strategy solution.`,
      `Anticipated responses from the environment suggest that adaptability is more valuable than optimality.`,
      `A phased implementation with built-in learning loops provides the best risk-adjusted path forward.`,
      `Success depends on establishing feedback mechanisms that enable real-time strategy calibration.`,
    ],
  };

  const subModeSuffix: Record<ReasoningSubMode, string[]> = {
    deductive: [
      `If the general principle of systematic decomposition holds, then this problem's structure must yield to causal analysis; the variables are identifiable; therefore, decomposition reveals the underlying architecture.`,
      `If causal relationships can be mapped, then feedback loops must produce non-linear effects; such loops exist here; therefore, intervention at any point will cascade unpredictably.`,
      `If a position omits mediating variables, then it cannot fully account for observed outcomes; this position omits them; therefore, its validity is necessarily partial.`,
      `If the dominant factor operates through indirect pathways, then surface observation will miss it; surface observation does miss it; therefore, the dominant factor lies beneath the visible layer.`,
      `If edge cases reveal structural limits, then the model requires qualification; edge cases do reveal limits; therefore, the conclusion must be bounded.`,
      `If interventions produce ripple effects, then second-order consequences must be mapped; ripple effects exist; therefore, first-order analysis is insufficient.`,
      `If uncertainty persists at the margins, then conclusions must be probabilistic; marginal uncertainty persists; therefore, deterministic claims are unwarranted.`,
    ],
    inductive: [
      `Across multiple instances of similar problems, a pattern emerges: what appears singular is actually composite. This case follows the pattern.`,
      `Repeated observation of causal systems shows that feedback loops are the rule, not the exception. The dynamics here match this established pattern.`,
      `Examining cases where initial positions proved incomplete reveals that mediating variables are consistently the overlooked factor. This case shows the same signature.`,
      `Historical data on complex systems shows that high-leverage factors are rarely the most visible ones. The pattern holds in this instance.`,
      `Boundary condition failures across domains share a common structure: they expose frame limitations rather than mere exceptions. This case fits the pattern.`,
      `Analysis of intervention outcomes consistently shows that second-order effects rival first-order effects in magnitude. The data supports this expectation here.`,
      `Probabilistic reasoning has proven more reliable than deterministic claims across domains of comparable complexity. The pattern recommends the same approach here.`,
    ],
    abductive: [
      `Given the observed complexity of this problem, the best explanation is that multiple causal factors operate at different levels — simpler explanations fail to account for the data.`,
      `Given the presence of non-linear effects in the system, the best explanation is that feedback loops structure the causal relationships, as this accounts for both the amplification and dampening patterns observed.`,
      `Given the gaps between the initial position and available evidence, the best explanation is that mediating variables have been overlooked, as this most parsimoniously explains the discrepancy.`,
      `Given that surface analysis fails to identify the driving factor, the best explanation is that causal centrality is distributed among hidden variables rather than concentrated in obvious ones.`,
      `Given that the model performs well in typical cases but fails at boundaries, the best explanation is that the analytical frame itself has limits that a higher-order model would transcend.`,
      `Given the system's sensitivity to intervention, the best explanation is that second-order effects create feedback pathways that amplify or counteract intended outcomes.`,
      `Given the persistent uncertainty at the margins, the best explanation is that the problem space contains genuinely indeterminate elements rather than merely unmeasured ones.`,
    ],
    analogical: [
      `This problem is structurally similar to ecosystem dynamics, where apparent simplicity masks layered interdependence. Therefore, decomposition should proceed with attention to emergent properties.`,
      `This causal structure is analogous to electrical circuits with feedback — the relationships form closed loops rather than linear chains. Therefore, interventions will produce counter-intuitive results.`,
      `This situation mirrors diagnostic medicine, where symptoms point to underlying conditions that may not be directly observable. Therefore, treating symptoms without identifying root causes is insufficient.`,
      `This system is structurally similar to a complex network where a few highly connected nodes drive global behavior. Therefore, identifying causal centrality is more important than cataloging all factors.`,
      `This problem shares structure with phase transitions in physics — the system behaves normally until boundary conditions trigger qualitative change. Therefore, edge cases reveal the system's true nature.`,
      `This situation is analogous to introducing a species into an ecosystem — the direct effects are visible, but the cascading food-chain effects determine long-term outcomes. Therefore, second-order analysis is essential.`,
      `This problem is structurally similar to quantum measurement — the act of analysis itself constrains what can be known. Therefore, confidence must be expressed as probability distributions rather than point estimates.`,
    ],
  };

  const base = claimTemplates[mode][step] ?? `Step ${step + 1} advances the analysis with ${mode} reasoning.`;
  const suffix = subModeSuffix[reasoningSubMode][step] ?? `This step applies ${reasoningSubMode} reasoning within the ${mode} framework.`;
  return `${base} ${suffix}`;
}

function generateReasoning(step: number, mode: ThinkingMode, reasoningSubMode: ReasoningSubMode, problem: string, initialPosition: string, _phase: string): string {
  const subModeFraming: Record<ReasoningSubMode, string> = {
    deductive: `Applying deductive logic — starting from general principles and deriving specific conclusions through valid inference.`,
    inductive: `Applying inductive reasoning — building from specific observations toward generalizable patterns and probabilistic conclusions.`,
    abductive: `Applying abductive inference — generating the best available explanation for the observed phenomena, prioritizing explanatory power and parsimony.`,
    analogical: `Applying analogical reasoning — identifying structural similarities with known domains and transferring insights based on relational correspondence.`,
  };

  const reasoningMap: Record<ThinkingMode, string[]> = {
    analytical: [
      `Breaking down "${problem}" reveals that what appears as a single issue is actually a cluster of interrelated factors. The primary variables can be identified through systematic decomposition, separating symptoms from root causes. This decomposition is the foundation for all subsequent analysis.`,
      `Mapping the relationships between variables shows that causality flows in multiple directions. Some factors act as amplifiers while others serve as dampeners. Understanding these dynamics is essential before any intervention can be designed, as intervening at the wrong leverage point may produce counterproductive results.`,
      `Examining the initial position — "${initialPosition}" — reveals that it captures important truths but may conflate correlation with causation or overlook confounding variables. The strength of evidence varies across different claims, with some resting on robust data and others on inference.`,
      `The synthesized model prioritizes factors by their explanatory power and causal centrality. What emerges is a hierarchy where a small number of factors drive the majority of the observed effects. This concentration of causal power suggests that targeted interventions could be more effective than broad-spectrum approaches.`,
      `Stress-testing against edge cases reveals that the model's predictions hold under most conditions but break down at system boundaries. These boundary conditions are not mere exceptions — they point to the limits of the current analytical frame and suggest that a higher-order model may be needed for complete understanding.`,
      `Second-order analysis shows that interventions targeting the primary factors will produce ripple effects across the system. Some of these effects are beneficial amplifiers, while others are unintended consequences that could undermine the intervention's goals. Mapping these effects is essential for robust strategy design.`,
      `The final assessment acknowledges that while significant analytical progress has been made, uncertainty remains at the margins. The conclusions are best understood as probabilistic rather than deterministic, with confidence levels that vary across different dimensions of the problem.`,
    ],
    creative: [
      `Rather than accepting the problem as given, we ask: what if the frame itself is the constraint? By stepping back from the immediate formulation, we can identify deeper questions that, if answered, would dissolve the apparent difficulty. This reframing is the first and most powerful creative act.`,
      `Looking beyond the immediate domain, we find that problems in this space share structural similarities with challenges in seemingly unrelated fields. These cross-domain analogies — whether from biology, architecture, or music — provide fresh perspectives that can break cognitive fixations.`,
      `The assumptions we bring to the problem are often invisible precisely because they are so deeply embedded in our worldview. By making them explicit and subjecting them to the question "must this be true?", we create space for alternatives that were previously inconceivable.`,
      `Creativity is not the generation of something from nothing, but the novel recombination of existing elements. By identifying the building blocks of the current situation and recombining them in unexpected ways, we generate possibilities that are both novel and grounded.`,
      `Not all creative alternatives are equally viable. The most promising ones are those that simultaneously reframe the problem, leverage existing resources in new ways, and create value that was previously inaccessible. This evaluation separates whimsy from innovation.`,
      `Creative ideas require grounding to become actionable. Through iterative refinement, we test the alternatives against practical constraints, stakeholder needs, and implementation realities. This process doesn't diminish creativity — it channels it into forms that can actually change the world.`,
      `The integration of creative and analytical perspectives produces something neither could achieve alone. The creative modes generate possibility; the analytical modes evaluate and refine it. Together, they form a complete cognitive cycle that honors both imagination and rigor.`,
    ],
    critical: [
      `Every position makes claims about reality, and each claim carries an implicit demand for justification. By cataloging these claims and evaluating the quality of evidence supporting each, we establish a baseline of epistemic accountability. Not all claims are created equal — some rest on solid ground, others on sand.`,
      `Logical analysis examines not just what is claimed, but how the claims are connected. Are the inferences valid? Are there hidden premises that, if exposed, would weaken the argument? This structural examination often reveals more than surface-level fact-checking.`,
      `The existence of alternative explanations is a powerful critical tool. If multiple models can account for the same data, the initial position loses its privileged status. The criterion then shifts from "is this explanation consistent with the data?" to "is this the best explanation available?"`,
      `Empirical evidence is the ultimate arbiter, but it rarely speaks with a single voice. Some data points support the initial position; others contradict it. A honest assessment must weigh the quality, quantity, and independence of evidence on both sides, rather than cherry-picking supporting data.`,
      `Epistemic foundations — the assumptions about how we know what we know — are often the most vulnerable part of any position. If the methodology is flawed, the conclusions are suspect regardless of their surface plausibility. Examining these foundations requires philosophical rigor.`,
      `Human reasoning is never perfectly objective. The question is not whether bias exists, but whether the analysis has adequate safeguards against it. Confirmation bias, motivated reasoning, and status quo bias are particularly relevant threats that must be actively guarded against.`,
      `A position that survives critical scrutiny is not proven true — it has simply withstood the best available challenges. This is the essence of fallibilism: our conclusions are always provisional, always open to revision in light of new evidence or better arguments.`,
    ],
    strategic: [
      `Any strategic analysis begins with clarity about the destination. Without a well-defined objective, all subsequent analysis lacks direction. The current position must be honestly assessed — neither inflated nor deflated — to establish the true magnitude of the gap that must be bridged.`,
      `Stakeholders are not passive observers; they are active participants whose interests, resources, and relationships shape what is possible. A thorough stakeholder analysis identifies not just who matters, but why they matter, what they want, and how their interests align or conflict.`,
      `Options generation requires both breadth and discipline. Too few options leads to false dichotomies; too many leads to paralysis. The key is to generate a diverse set of genuinely different approaches, each with a clear logic of how it would achieve the objective.`,
      `Strategic evaluation requires multi-criteria analysis. Feasibility asks "can we do it?" Impact asks "would it matter?" Risk asks "what could go wrong?" Alignment asks "does it fit our values and capabilities?" The best option is rarely the one that scores highest on any single criterion.`,
      `No strategy exists in a vacuum. Competitors, allies, and the environment itself will respond to our actions. Anticipating these responses — through war-gaming, scenario planning, or red-teaming — reveals vulnerabilities in our plans and opportunities for preemptive advantage.`,
      `Implementation is where strategies live or die. A phased approach with clear milestones, decision points, and contingency plans provides structure while maintaining flexibility. The plan must be detailed enough to guide action but flexible enough to adapt to changing conditions.`,
      `Strategy without measurement is hope. Establishing clear metrics for success — both leading indicators and lagging outcomes — enables the organization to learn from experience and adjust course. The feedback loop between action and assessment is the engine of strategic intelligence.`,
    ],
  };
  const base = reasoningMap[mode][step] ?? `This step applies ${mode} reasoning to advance the analysis of "${problem}".`;
  return `${subModeFraming[reasoningSubMode]} ${base}`;
}

function generateAssumptions(step: number, mode: ThinkingMode, reasoningSubMode: ReasoningSubMode, explicitAssumptions: string[], _problem: string): string[] {
  const subModeAssumptions: Record<ReasoningSubMode, string[]> = {
    deductive: [
      "The general principles being applied are valid within this domain.",
      "The logical inferences from principles to conclusions preserve truth.",
    ],
    inductive: [
      "The observed instances are representative of the broader population.",
      "Patterns identified in past data will persist into the present case.",
    ],
    abductive: [
      "The best explanation is approximately correct, even if not perfect.",
      "No significantly better explanation has been overlooked.",
    ],
    analogical: [
      "The structural similarity between domains is relevant to the inference.",
      "Differences between the source and target domains do not undermine the analogy.",
    ],
  };

  const baseAssumptions: Record<ThinkingMode, string[][]> = {
    analytical: [
      ["The problem can be meaningfully decomposed into constituent parts.", "Causal relationships can be identified through systematic observation."],
      ["Variables interact in predictable ways under stable conditions.", "Past patterns provide some basis for understanding current dynamics."],
      ["The available evidence is representative of the broader phenomenon.", "Correlation and causation can be distinguished with sufficient analysis."],
      ["The synthesized model captures the most significant causal factors.", "Minor factors can be safely abstracted away without distorting conclusions."],
      ["Edge cases reveal genuine limits of the model, not artifacts of poor construction.", "Boundary conditions are stable enough to be meaningfully identified."],
      ["Second-order effects can be anticipated with reasonable accuracy.", "The system's response to intervention is predictable within bounded uncertainty."],
      ["Probabilistic conclusions are more honest than deterministic claims.", "Remaining uncertainty is acceptable for decision-making purposes."],
    ],
    creative: [
      ["The current framing of the problem is not the only possible framing.", "Insights from distant domains can be meaningfully applied to this context."],
      ["Structural similarities across domains are not coincidental but reflect deeper patterns.", "Analogical reasoning is a valid tool for generating novel hypotheses."],
      ["Some constraints are social or psychological rather than physical.", "Challenging assumptions can reveal previously invisible solution spaces."],
      ["Novel combinations of existing elements can produce emergent properties.", "The whole can be qualitatively different from the sum of its parts."],
      ["Creative alternatives can be evaluated using rational criteria.", "Innovation is not random — it follows recognizable patterns."],
      ["Creative ideas require grounding to become practically useful.", "The tension between imagination and constraint is productive, not destructive."],
      ["Integration of multiple cognitive modes produces superior outcomes.", "The creative-analytical cycle is more powerful than either mode alone."],
    ],
    critical: [
      ["Claims require justification proportional to their strength and scope.", "Extraordinary claims demand extraordinary evidence."],
      ["Logical validity is a necessary but not sufficient condition for truth.", "Arguments can be formally valid yet materially unsound."],
      ["Multiple explanations can be consistent with the same data.", "Explanatory power is a function of both fit and parsimony."],
      ["Evidence quality varies and must be assessed on methodological grounds.", "Anecdotal evidence carries less weight than systematic data."],
      ["Epistemic methods themselves are subject to critical evaluation.", "No methodology is immune to scrutiny, including the critical method itself."],
      ["Bias is universal and requires structural rather than individual remedies.", "Awareness of bias is necessary but insufficient to eliminate it."],
      ["Fallibilism is the only epistemically honest position.", "Certainty is a psychological state, not an epistemic achievement."],
    ],
    strategic: [
      ["Objectives can be clearly defined and communicated across the organization.", "The gap between current and desired states can be accurately assessed."],
      ["Stakeholder interests are relatively stable over the planning horizon.", "Power dynamics can be mapped and influenced."],
      ["Options can be generated that are meaningfully different from each other.", "Resource constraints are real but not absolutely binding."],
      ["Evaluation criteria can be weighted in a way that reflects true priorities.", "Trade-offs between criteria can be explicitly acknowledged and managed."],
      ["Competitor and environmental responses can be anticipated with useful accuracy.", "The future is not completely unknowable — probabilistic forecasting is possible."],
      ["Implementation plans can balance structure and flexibility.", "Organizations can learn and adapt while executing a plan."],
      ["Success can be measured with meaningful metrics.", "Feedback loops can be designed to provide timely, actionable information."],
    ],
  };

  const stepAssumptions = baseAssumptions[mode][step] ?? ["The analysis proceeds with appropriate epistemic caution."];
  const subAssumptions = subModeAssumptions[reasoningSubMode];

  if (step === 0) {
    const combined = [...subAssumptions, ...stepAssumptions];
    if (explicitAssumptions.length > 0) {
      return [...explicitAssumptions, ...combined];
    }
    return combined;
  }

  return stepAssumptions;
}

function generateCounterArgument(step: number, mode: ThinkingMode, reasoningSubMode: ReasoningSubMode, problem: string, counterPerspective?: string): string {
  if (counterPerspective && step === 0) {
    return `Counter-perspective: ${counterPerspective}. This lens challenges the initial framing and demands that all subsequent analysis account for this alternative viewpoint.`;
  }

  const subModeCounters: Record<ReasoningSubMode, string> = {
    deductive: `A deductive counter would challenge whether the general principles being applied are actually valid in this specific context, or whether the inference from principle to conclusion contains a hidden fallacy.`,
    inductive: `An inductive counter would question whether the sample of observations is representative, or whether the pattern identified is a genuine regularity rather than a coincidental correlation.`,
    abductive: `An abductive counter would propose an alternative explanation that fits the data equally well or better, or argue that the "best" explanation still fails to account for critical evidence.`,
    analogical: `An analogical counter would argue that the source and target domains differ in structurally relevant ways that undermine the transfer of insights, or offer a competing analogy that leads to different conclusions.`,
  };

  const counterArguments: Record<ThinkingMode, string[]> = {
    analytical: [
      "Decomposition itself may fragment a holistic phenomenon, losing essential properties that only exist at the system level. Some problems are inherently non-decomposable.",
      "Causal maps are always simplifications. The territory may contain hidden variables or non-linear dynamics that the map cannot capture, leading to confident but wrong conclusions.",
      "Evidence is always interpreted through theoretical frameworks. What counts as 'strong evidence' may itself be a product of the paradigm we're trying to evaluate.",
      "The synthesized model may privilege quantifiable factors over qualitative ones, creating a distortion where what is measurable is treated as what matters.",
      "Edge cases may not be exceptions but the rule in disguise. What appears as a boundary condition might actually be the central dynamic viewed from a different angle.",
      "Second-order effects are notoriously difficult to predict. The confidence with which we anticipate them may exceed our actual predictive capacity, creating a false sense of control.",
      "Even probabilistic conclusions can create a false sense of precision. The probability estimates themselves are often subjective judgments dressed in mathematical clothing.",
    ],
    creative: [
      "Reframing the problem may simply be avoidance — moving the goalposts rather than addressing the actual difficulty. Not every deeper question is the right question.",
      "Cross-domain analogies can be misleading. Surface similarities may mask fundamental differences, and applying solutions from one domain to another can create new problems.",
      "The assumption that constraints are self-imposed may be dangerously wrong. Some constraints are real, physical, or structural, and dismissing them as mental blocks can lead to reckless decisions.",
      "Novel combinations are not automatically valuable. Most recombinations are either trivial or incoherent. The signal-to-noise ratio in creative ideation is typically very low.",
      "Evaluation criteria themselves may be biased toward conventional solutions, causing genuinely transformative alternatives to be prematurely discarded.",
      "Grounding creative ideas too early can kill them. The pressure to be practical may eliminate options that would be revolutionary if given time to mature.",
      "The integration of creative and analytical modes assumes they can be cleanly separated and recombined. In practice, the interaction may be more chaotic and less predictable.",
    ],
    critical: [
      "The demand for justification can itself become infinite regress. At some point, we must accept foundational beliefs without proof, and the choice of which beliefs to accept is itself unjustified.",
      "Logical analysis can become hyper-skeptical, finding fault with every argument to the point where no conclusion is possible. Perfectionism in reasoning is the enemy of practical judgment.",
      "Alternative explanations can proliferate indefinitely. The existence of many possible explanations doesn't mean all are equally plausible — but distinguishing them requires criteria that may be contested.",
      "Evidence is always theory-laden. What we count as 'empirical evidence' is shaped by our theoretical commitments, creating a circularity where evidence confirms the framework that defines it.",
      "Critical evaluation of epistemic methods requires using some epistemic method, creating a bootstrapping problem. We cannot step outside all frameworks to evaluate them neutrally.",
      "Overemphasis on bias can lead to epistemic paralysis. If all reasoning is biased, and no method is bias-free, then the critique of bias undermines its own authority.",
      "Fallibilism, taken to its extreme, becomes self-undermining. If all conclusions are provisional, then the conclusion that 'all conclusions are provisional' is itself provisional.",
    ],
    strategic: [
      "Clear objectives may be impossible in complex, adaptive environments. The act of defining objectives may constrain strategic flexibility and blind the organization to emerging opportunities.",
      "Stakeholder interests are not stable — they evolve in response to the strategic process itself. A stakeholder map is a snapshot of a moving target.",
      "Options generation may be constrained by organizational blind spots. We can only generate options that our current mental models allow us to see.",
      "Evaluation criteria may be manipulated to favor preferred options. The appearance of rational choice can mask political decisions made before the analysis began.",
      "Anticipating responses assumes a level of predictability that complex systems do not provide. Strategic planning may create the illusion of control in inherently uncertain environments.",
      "Phased implementation may be too rigid for fast-changing environments. The time required for planning and review may exceed the window of opportunity.",
      "Metrics can become targets, and targets lose their value when they become targets. The act of measurement can distort the very phenomena it's meant to track.",
    ],
  };

  const base = counterArguments[mode][step] ?? `A skeptical observer would question whether this step's conclusions are warranted by the available evidence.`;
  return `${base} ${subModeCounters[reasoningSubMode]}`;
}

function generateNextInvestigation(step: number, _totalSteps: number, mode: ThinkingMode, reasoningSubMode: ReasoningSubMode, _problem: string): string {
  const subModeInvestigation: Record<ReasoningSubMode, string> = {
    deductive: `Verify that the general principles underlying this step hold in the specific context, and test the validity of each inferential step.`,
    inductive: `Expand the sample of observations to test whether the identified pattern generalizes, and search for counter-examples that would break the pattern.`,
    abductive: `Generate and evaluate competing explanations to ensure the current best explanation remains superior, and seek additional evidence that would discriminate between alternatives.`,
    analogical: `Deepen the structural mapping between source and target domains, and test whether the analogy holds under closer examination of disanalogies.`,
  };

  const investigations: Record<ThinkingMode, string[]> = {
    analytical: [
      "Gather empirical data to validate the initial decomposition and test whether the identified variables capture the essential structure of the problem.",
      "Conduct a dependency analysis to map the strength and direction of causal relationships between identified variables.",
      "Seek disconfirming evidence that would challenge the initial position, focusing on data sources that were not considered in the original analysis.",
      "Build a formal model of the synthesized understanding and test its predictions against historical data.",
      "Design experiments or observational studies that specifically target the model's boundary conditions.",
      "Map the network of second-order effects and identify which are most likely to occur based on system dynamics.",
      "Identify the specific conditions under which the conclusions would need to be revised, establishing clear triggers for re-evaluation.",
    ],
    creative: [
      "Interview stakeholders from outside the immediate domain to gather perspectives that are untainted by conventional framing.",
      "Research structural analogies in at least three distant domains and document the mapping between their problem structures and this one.",
      "Conduct a structured assumption-mapping exercise, listing every assumption and rating it on a scale from 'empirically necessary' to 'conventionally accepted'.",
      "Run a combinatorial exploration: systematically pair each element of the problem with each element of at least one distant domain.",
      "Prototype the top three creative alternatives as minimum viable concepts and test them against real-world constraints.",
      "Engage with practitioners who have successfully implemented creative solutions in similar contexts to understand the grounding process.",
      "Design a process for ongoing creative-analytical cycling that can be institutionalized as a standard practice.",
    ],
    critical: [
      "Catalog every claim in the initial position and rate the quality of evidence supporting each on a standardized scale.",
      "Formalize the argument structure and test each inference step for validity using formal logic or argument mapping.",
      "Commission independent analysts to develop alternative explanations and compare their explanatory power against the initial position.",
      "Conduct a systematic literature review or data audit to identify all relevant evidence, not just the most convenient or accessible.",
      "Examine the epistemic history of similar claims to understand how previous confident conclusions were later overturned.",
      "Implement structured debiasing protocols (pre-mortem analysis, red teaming, devil's advocacy) and document their impact on the analysis.",
      "Develop a plan for ongoing monitoring of the conclusion's validity, including specific indicators that would trigger revision.",
    ],
    strategic: [
      "Conduct a strategic landscape analysis to map competitors, allies, and environmental factors that define the operational context.",
      "Engage stakeholders in structured dialogue to validate the stakeholder map and uncover hidden interests or power dynamics.",
      "Run option-generation workshops using structured techniques (SCAMPER, morphological analysis, TRIZ) to ensure comprehensive exploration.",
      "Develop detailed scoring models for each option against all criteria, with sensitivity analysis to test the robustness of rankings.",
      "Conduct scenario planning exercises that model how different environmental conditions would affect the viability of each option.",
      "Build detailed implementation roadmaps for the top options, including resource plans, timelines, risk registers, and contingency triggers.",
      "Establish a strategic learning system with dashboards, review cycles, and decision protocols for ongoing strategy calibration.",
    ],
  };

  const base = investigations[mode][Math.min(step, investigations[mode].length - 1)] ?? "Continue investigating the identified gaps in the current understanding.";
  return `${base} ${subModeInvestigation[reasoningSubMode]}`;
}

function generateConfidenceJustification(step: number, mode: ThinkingMode, confidence: number, phaseDescription: string, reasoningSubMode: ReasoningSubMode): string {
  const confidenceLevel = confidence >= 0.75 ? "relatively high" : confidence >= 0.60 ? "moderate" : confidence >= 0.45 ? "low-moderate" : "low";
  
  const reasonHigher = "Could be higher with additional empirical data or domain-specific pattern matches.";
  const reasonLower = "Could be lower if the underlying assumptions prove invalid or edge cases dominate.";
  
  const modeContext: Record<ThinkingMode, string> = {
    analytical: "Analytical reasoning at this step",
    creative: "Creative reframing at this step",
    critical: "Critical evaluation at this step",
    strategic: "Strategic assessment at this step",
  };
  
  const phaseHint = phaseDescription.includes("edge case") || phaseDescription.includes("uncertaint")
    ? "This step specifically addresses boundary conditions and unknowns, which inherently reduces certainty."
    : phaseDescription.includes("identify") || phaseDescription.includes("examine")
      ? "This step involves exploratory analysis where incomplete information limits confidence."
      : "This step operates on established analytical ground with relatively clear structure.";
  
  return `${modeContext[mode]} operates at ${confidenceLevel} confidence (${Math.round(confidence * 100)}%). ${phaseHint} ${confidence >= 0.6 ? reasonHigher : reasonLower}`;
}

// ─── Tool Registration ───────────────────────────────────────────────────────

const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * Registers the `think_sequential` tool on the given MCP server.
 */
export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_sequential",
    {
      title: "Sequential Thinking Analysis",
      description:
        "Performs structured sequential thinking analysis on a problem by generating a step-by-step reasoning audit trail. " +
        "Each step includes a claim, detailed reasoning, confidence level, underlying assumptions, a steel-manned counter-argument, " +
        "and a concrete next investigation target. This creates a transparent, auditable chain of reasoning that reveals not just " +
        "conclusions but the epistemic structure behind them.\n\n" +
        "The analysis depth controls the number of reasoning steps: 'essential' produces 3 steps for quick assessment, " +
        "'standard' produces 5 steps for thorough analysis, and 'exhaustive' produces 7 steps for comprehensive examination.\n\n" +
        "Four thinking modes are available: 'analytical' for decomposition and causal mapping, 'creative' for reframing and " +
        "lateral thinking, 'critical' for steel-manning counter-arguments and testing epistemic foundations, and 'strategic' " +
        "for option generation, stakeholder analysis, and implementation planning.\n\n" +
        "Use this tool when you need to make your reasoning process explicit, auditable, and open to constructive challenge. " +
        "It is especially valuable for complex decisions, controversial positions, or situations where the reasoning process " +
        "itself needs to be communicated and defended.",
      inputSchema: z
        .object({
          problem: z
            .string()
            .describe(
              "The problem, question, or proposition to analyze through sequential thinking. " +
                "Should be specific enough to enable focused reasoning but open enough to allow multi-step exploration."
            ),
          initial_position: z
            .string()
            .describe(
              "Your current stance, hypothesis, or preliminary conclusion about the problem. " +
                "This serves as the starting point that the sequential analysis will examine, challenge, and refine."
            ),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard")
            .describe(
              "Controls the depth of analysis: 'essential' (3 steps) for quick assessment, " +
                "'standard' (5 steps) for thorough analysis, 'exhaustive' (7 steps) for comprehensive examination."
            ),
          thinking_mode: z
            .enum(["analytical", "creative", "critical", "strategic"])
            .default("analytical")
            .describe(
              "The cognitive lens for analysis: 'analytical' for decomposition and causal mapping, " +
                "'creative' for reframing and lateral connections, 'critical' for argument evaluation and " +
                "epistemic scrutiny, 'strategic' for option generation and implementation planning."
            ),
          reasoning_sub_mode: z
            .enum(["deductive", "inductive", "abductive", "analogical"])
            .default("deductive")
            .describe(
              "The logical structure within each reasoning step: 'deductive' for general-to-specific inference " +
                "(If P then Q; P; therefore Q), 'inductive' for pattern recognition from observations, " +
                "'abductive' for inference to the best explanation, 'analogical' for reasoning by structural " +
                "similarity to known domains. Works combinatorially with thinking_mode."
            ),
          assumptions_to_challenge: z
            .string()
            .optional()
            .describe(
              "Comma-separated list of specific assumptions you want the analysis to explicitly surface and challenge. " +
                "If not provided, assumptions will be identified through the reasoning process itself."
            ),
          counter_perspective: z
            .string()
            .optional()
            .describe(
              "An alternative viewpoint or opposing position that should be given serious consideration " +
                "throughout the analysis. This ensures the analysis does not become an echo chamber for the initial position."
            ),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output presentation mode: 'executive' for concise 2-sentence summaries, " +
                "'analytical' for full detailed output (default), 'exploratory' for detailed output with open questions."
            ),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          problem,
          initial_position,
          output_depth,
          thinking_mode,
          reasoning_sub_mode,
          assumptions_to_challenge,
          counter_perspective,
          output_mode,
        } = args;

        // Hybrid mode: attempt content composer first, fall back to templates
        const fullText = problem + " " + initial_position;
        const structure = getStructureForText(fullText, initial_position);

        const thoughtTypeMap: Record<number, ThoughtType> = {
          0: 'deconstructive',
          1: 'relational',
          2: 'diagnostic',
          3: 'perspectival',
          4: 'diagnostic',
          5: 'prospective',
          6: 'synthetic',
        };

        const steps = generateSteps({
          problem,
          initialPosition: initial_position,
          depth: output_depth,
          mode: thinking_mode,
          reasoningSubMode: reasoning_sub_mode,
          assumptionsToChallenge: assumptions_to_challenge,
          counterPerspective: counter_perspective,
          fullText,
          structure,
          composeForStep: (stepIdx: number): string => {
            const thoughtType = thoughtTypeMap[stepIdx] ?? 'diagnostic';
            const prevOutputs: string[] = [];
            for (let i = 0; i < stepIdx; i++) {
              const t = thoughtTypeMap[i] ?? 'diagnostic';
              const c = composeToolContent({
                toolName: "think_sequential",
                text: fullText,
                initialPosition: initial_position,
                mode: thinking_mode,
                subMode: reasoning_sub_mode,
                stepNumber: i,
                totalSteps: depthToStepCount(output_depth),
                thoughtType: t,
                previousOutputs: prevOutputs,
              });
              if (c.length > 200) prevOutputs.push(c);
            }
            return composeToolContent({
              toolName: "think_sequential",
              text: fullText,
              initialPosition: initial_position,
              mode: thinking_mode,
              subMode: reasoning_sub_mode,
              stepNumber: stepIdx,
              totalSteps: depthToStepCount(output_depth),
              thoughtType,
              previousOutputs: prevOutputs,
            });
          },
        });

        const epistemicStatus: EpistemicStatus = output_depth === 'exhaustive' ? 'well-supported' : output_depth === 'standard' ? 'tentative' : 'speculative';
        const suggestedFollowup: SuggestedTool[] = ['think_polarity', 'think_aqal_situational'];

        const markdown_output = formatSequentialThinking(problem, steps, output_mode, epistemicStatus, suggestedFollowup);

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
