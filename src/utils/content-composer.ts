import type { ThinkingMode, ReasoningSubMode, ThoughtType } from "../types.js";
import type { ProblemStructure } from "../types.js";
import type { RetrievedPatterns } from "./graph-engine.js";

// ─── Composition Context ─────────────────────────────────────────────────────

export interface CompositionContext {
  structure: ProblemStructure;
  patterns: RetrievedPatterns;
  stepNumber: number;
  totalSteps: number;
  mode: ThinkingMode;
  subMode: ReasoningSubMode;
  thoughtType: ThoughtType;
  previousOutputs: string[];
  toolName: string;
}

export interface GrammarRule {
  id: string;
  thoughtTypes: ThoughtType[];
  modes: ThinkingMode[];
  stepRange: [number, number];
  template: string;
  slots: Record<string, (ctx: CompositionContext) => string>;
  /** If empty/undefined, matches all tools. If non-empty, matches only listed tools. */
  tools?: string[];
}

// ─── Tool-Agnostic Rules (Fallback for all tools) ────────────────────────────

const RULE_DECOMPOSITION_ENTITY: GrammarRule = {
  id: "decomposition-entity",
  thoughtTypes: ["deconstructive"],
  modes: ["analytical", "critical", "strategic", "creative"],
  stepRange: [0, 1],
  template: "The {subject} involves {count} distinct causal factors operating at {level}: {factors}.",
  slots: {
    subject: (ctx) => ctx.structure.entities[0] ?? "problem space",
    count: (ctx) => String(Math.min(ctx.structure.relationships.length + 1, 5)),
    level: (ctx) => {
      if (ctx.mode === "analytical") return "multiple abstraction layers";
      if (ctx.mode === "critical") return "surface and hidden layers";
      if (ctx.mode === "strategic") return "systemic and operational layers";
      return "interconnected layers";
    },
    factors: (ctx) =>
      ctx.patterns.causal.slice(0, 3).map((p) => p.structure.cause).join(", ") ||
      "multiple interacting variables",
  },
};

const RULE_CAUSAL_MAPPING: GrammarRule = {
  id: "causal-mapping",
  thoughtTypes: ["relational"],
  modes: ["analytical", "strategic"],
  stepRange: [1, 3],
  template:
    "The primary causal pathway runs from {cause} through {mechanism} to {effect}. This pattern maps to the {patternName} dynamic, where {description}.",
  slots: {
    cause: (ctx) =>
      ctx.patterns.causal[0]?.structure.cause ??
      ctx.structure.entities[0] ??
      "the initial condition",
    mechanism: (ctx) =>
      ctx.patterns.causal[0]?.structure.mechanism ?? "a feedback process",
    effect: (ctx) =>
      ctx.patterns.causal[0]?.structure.effect ??
      ctx.structure.entities[1] ??
      "the observed outcome",
    patternName: (ctx) =>
      ctx.patterns.causal[0]?.id.replace(/-/g, " ") ?? "recognized causal",
    description: (ctx) =>
      ctx.patterns.causal[0]?.description ??
      "interconnected elements produce emergent behavior",
  },
};

const RULE_EVIDENCE_CHALLENGE: GrammarRule = {
  id: "evidence-challenge",
  thoughtTypes: ["diagnostic", "corrective"],
  modes: ["critical", "analytical"],
  stepRange: [2, 4],
  template:
    'The claim "{claim}" rests on the assumption that {assumption}. However, {reality}. The cost of this assumption being wrong is {cost}.',
  slots: {
    claim: (ctx) => ctx.structure.claims[0] ?? "the stated position",
    assumption: (ctx) =>
      ctx.patterns.assumptions[0]?.assumption ??
      ctx.structure.implicit_assumptions[0] ??
      "the underlying premise holds",
    reality: (ctx) =>
      ctx.patterns.assumptions[0]?.reality ?? "the situation is more nuanced",
    cost: (ctx) =>
      ctx.patterns.assumptions[0]?.cost_if_wrong ??
      "significant strategic misallocation",
  },
};

const RULE_SHADOW_SURFACE: GrammarRule = {
  id: "shadow-surface",
  thoughtTypes: ["perspectival"],
  modes: ["critical", "creative", "analytical", "strategic"],
  stepRange: [3, 5],
  template:
    "What the {subject} cannot see about itself is that {shadow}. This manifests as {manifestation}. The underlying dynamic protects against {fear}, which means addressing it requires {integration}.",
  slots: {
    subject: (ctx) => {
      const st = ctx.structure.subject_type;
      if (st === "human") return "person";
      if (st === "organization") return "organization";
      if (st === "ai-system") return "system";
      return "system";
    },
    shadow: (ctx) =>
      ctx.patterns.shadows[0]?.shadow ??
      "certain dynamics remain invisible to those within it",
    manifestation: (ctx) =>
      ctx.patterns.shadows[0]?.manifests_as.slice(0, 2).join(" and ") ??
      "observable patterns that contradict stated intentions",
    fear: (ctx) =>
      ctx.patterns.shadows[0]?.root_fear ?? "unacknowledged vulnerability",
    integration: (ctx) =>
      ctx.patterns.shadows[0]?.integration_path ??
      "deliberate attention to the invisible",
  },
};

const RULE_LEVERAGE_INTERVENTION: GrammarRule = {
  id: "leverage-intervention",
  thoughtTypes: ["diagnostic", "prospective"],
  modes: ["strategic", "analytical"],
  stepRange: [4, 6],
  template:
    "A high-leverage intervention (Meadows rank {rank}) is to {intervention}. This works because it addresses {mechanism}. The risk is {risk}, which must be mitigated by {mitigation}.",
  slots: {
    rank: (ctx) =>
      String(ctx.patterns.leveragePoints[0]?.meadows_rank ?? "N/A"),
    intervention: (ctx) =>
      ctx.patterns.leveragePoints[0]?.intervention ??
      "increase visibility into system dynamics",
    mechanism: (ctx) =>
      ctx.patterns.causal[0]?.structure.mechanism ??
      "the underlying feedback structure",
    risk: (ctx) =>
      ctx.patterns.leveragePoints[0]?.risk ??
      "unintended consequences from system complexity",
    mitigation: () =>
      "careful monitoring of feedback loops and willingness to adjust course",
  },
};

const RULE_EDGE_CASE: GrammarRule = {
  id: "edge-case-analysis",
  thoughtTypes: ["diagnostic"],
  modes: ["critical"],
  stepRange: [3, 5],
  template:
    "At the boundary of this analysis, {edgeCase} challenges the core reasoning. If {uncertainty} proves true, the conclusion shifts toward {alternative}.",
  slots: {
    edgeCase: (ctx) => ctx.structure.uncertainties[0] ?? "an unexamined variable",
    uncertainty: (ctx) =>
      ctx.structure.uncertainties[1] ??
      ctx.structure.uncertainties[0] ??
      "the primary unknown",
    alternative: (ctx) =>
      ctx.structure.claims[1] ??
      ctx.patterns.assumptions[0]?.reality ??
      "a fundamentally different interpretation",
  },
};

const RULE_SECOND_ORDER: GrammarRule = {
  id: "second-order-mapping",
  thoughtTypes: ["prospective"],
  modes: ["strategic", "creative", "analytical", "critical"],
  stepRange: [4, 6],
  template:
    "The second-order effect of {primaryAction} is {secondaryEffect}. This cascade occurs because {mechanism}, creating a {loopType} dynamic.",
  slots: {
    primaryAction: (ctx) => ctx.structure.claims[0] ?? "the proposed intervention",
    secondaryEffect: (ctx) =>
      ctx.patterns.causal[1]?.structure.effect ??
      "unintended systemic consequences",
    mechanism: (ctx) =>
      ctx.patterns.causal[1]?.structure.mechanism ??
      ctx.patterns.causal[0]?.structure.mechanism ??
      "cascading feedback effects",
    loopType: (ctx) => {
      if (ctx.subMode === "deductive") return "reinforcing";
      if (ctx.subMode === "inductive") return "balancing";
      return "complex";
    },
  },
};

const RULE_BOUNDED_CONCLUSION: GrammarRule = {
  id: "bounded-conclusion",
  thoughtTypes: ["synthetic"],
  modes: ["analytical", "critical", "strategic", "creative"],
  stepRange: [5, 7],
  template:
    "Taken together, the evidence supports a {confidence} conclusion: {synthesis}. The strongest signal is {signal}, while {weakness} remains the primary uncertainty.",
  slots: {
    confidence: (ctx) => {
      if (ctx.stepNumber <= 2) return "tentative";
      if (ctx.stepNumber <= 4) return "moderate";
      return "cautiously confident";
    },
    synthesis: (ctx) =>
      ctx.structure.claims[0] ??
      "the analyzed position has merit with significant caveats",
    signal: (ctx) =>
      ctx.patterns.causal[0]?.description ??
      ctx.structure.relationships[0] ??
      "the primary causal relationship identified",
    weakness: (ctx) =>
      ctx.structure.uncertainties[0] ?? "the most significant unknown",
  },
};

const RULE_ASSUMPTION_SURFACE: GrammarRule = {
  id: "assumption-surface",
  thoughtTypes: ["deconstructive"],
  modes: ["analytical", "critical", "strategic", "creative"],
  stepRange: [0, 2],
  template:
    "Beneath the surface of {subject}, {count} hidden assumptions operate unseen: {assumptions}. If {keyAssumption} proves false, the entire framing collapses — the cost of this being wrong is {costIfWrong}.",
  slots: {
    subject: (ctx) => ctx.structure.entities[0] ?? "the problem space",
    count: (ctx) => String(Math.max(ctx.structure.implicit_assumptions.length, 1)),
    assumptions: (ctx) =>
      ctx.structure.implicit_assumptions.slice(0, 3).join("; ") ||
      ctx.patterns.assumptions.slice(0, 2).map((a) => a.assumption).join("; ") ||
      "unexamined premises that shape the analysis",
    keyAssumption: (ctx) =>
      ctx.structure.implicit_assumptions[0] ??
      ctx.patterns.assumptions[0]?.assumption ??
      "the foundational premise",
    costIfWrong: (ctx) =>
      ctx.patterns.assumptions[0]?.cost_if_wrong ??
      "cascading error through every downstream inference",
  },
};

const RULE_COUNTER_SPECIFIC: GrammarRule = {
  id: "counter-specific",
  thoughtTypes: ["corrective"],
  modes: ["critical"],
  stepRange: [2, 4],
  template:
    "A domain-specific counter-argument challenges this via {counterPattern}. If {uncertainty} holds, the reasoning shifts toward {alternative}. The mechanism {mechanism} reveals a vulnerability in the original chain.",
  slots: {
    counterPattern: (ctx) =>
      ctx.patterns.causal
        .filter((p) => p.structure.cause !== p.structure.effect)
        .slice(0, 2)
        .map((p) => `reversing ${p.structure.cause} → ${p.structure.effect}`)
        .join(" and ") ||
      "inverting the presumed causal direction",
    uncertainty: (ctx) =>
      ctx.structure.uncertainties[0] ??
      ctx.structure.uncertainties[1] ??
      "an unexamined variable",
    alternative: (ctx) =>
      ctx.structure.claims[1] ??
      ctx.patterns.assumptions[0]?.reality ??
      "a competing explanation that accounts for the same data",
    mechanism: (ctx) =>
      ctx.patterns.causal[0]?.structure.mechanism ??
      "the hidden feedback process",
  },
};

const RULE_CASCADE_PREDICTION: GrammarRule = {
  id: "cascade-prediction",
  thoughtTypes: ["prospective"],
  modes: ["strategic", "creative", "analytical", "critical"],
  stepRange: [4, 6],
  template:
    "At cascade depth {depth}, {primaryAction} triggers {uniqueEffect} through the {relationship} pathway. Unlike earlier stages, this order introduces {novelDynamic}, creating a {loopType} feedback pattern distinct from the initial response.",
  slots: {
    depth: (ctx) => String(ctx.stepNumber - 3),
    primaryAction: (ctx) => ctx.structure.claims[0] ?? "the initiating intervention",
    uniqueEffect: (ctx) => {
      const relIdx = ctx.stepNumber % Math.max(ctx.structure.relationships.length, 1);
      return ctx.structure.relationships[relIdx] ??
        ctx.patterns.causal[ctx.stepNumber % Math.max(ctx.patterns.causal.length, 1)]?.structure.effect ??
        "emergent systemic behavior";
    },
    relationship: (ctx) =>
      ctx.structure.relationships[ctx.stepNumber % Math.max(ctx.structure.relationships.length, 1)] ??
      "interconnected dependency",
    novelDynamic: (ctx) => {
      const dynamics = [
        "temporal lag between cause and effect",
        "threshold crossing that changes system rules",
        "resource depletion that limits future options",
        "adaptation by other actors that counters the intervention",
        "information asymmetry that distorts decision-making",
      ];
      return dynamics[ctx.stepNumber % dynamics.length];
    },
    loopType: (ctx) => {
      if (ctx.stepNumber % 2 === 0) return "reinforcing";
      return "balancing";
    },
  },
};

const RULE_UNCERTAINTY_ACKNOWLEDGMENT: GrammarRule = {
  id: "uncertainty-acknowledgment",
  thoughtTypes: ["synthetic"],
  modes: ["analytical", "critical", "strategic", "creative"],
  stepRange: [5, 7],
  template:
    "Honest assessment requires acknowledging that {uncertainty} remains unresolved. The assumption that {assumption} carries a cost of {costIfWrong} if violated. Given {unknownCount} unresolved variables, the conclusion holds only within {boundary}.",
  slots: {
    uncertainty: (ctx) =>
      ctx.structure.uncertainties[0] ??
      ctx.structure.uncertainties[1] ??
      "a critical unknown",
    assumption: (ctx) =>
      ctx.structure.implicit_assumptions[0] ??
      ctx.patterns.assumptions[0]?.assumption ??
      "the working premise",
    costIfWrong: (ctx) =>
      ctx.patterns.assumptions[0]?.cost_if_wrong ??
      "systemic misallocation of resources and credibility",
    unknownCount: (ctx) =>
      String(ctx.structure.uncertainties.length + ctx.structure.implicit_assumptions.length),
    boundary: (ctx) => {
      if (ctx.structure.uncertainties.length <= 1) return "narrow but well-defined conditions";
      if (ctx.structure.uncertainties.length <= 3) return "moderate constraints that limit generalizability";
      return "a narrow band of conditions that may not persist";
    },
  },
};

// ─── Tool-Specific Rules ─────────────────────────────────────────────────────

// ── think_sequential ──────────────────────────────────────────────────────

const RULE_SEQ_STEP_PROGRESSION: GrammarRule = {
  id: "seq-step-progression",
  thoughtTypes: ["deconstructive", "relational"],
  modes: ["analytical", "strategic"],
  stepRange: [0, 3],
  template: "Step {currentStep} of {totalSteps}: {stepFocus}. This builds on the prior claim that {priorClaim}, advancing the reasoning chain through {progressionMechanism}.",
  slots: {
    currentStep: (ctx) => String(ctx.stepNumber),
    totalSteps: (ctx) => String(ctx.totalSteps),
    stepFocus: (ctx) => ctx.structure.entities[ctx.stepNumber % Math.max(ctx.structure.entities.length, 1)] ?? "the next logical component",
    priorClaim: (ctx) => ctx.structure.claims[Math.max(0, ctx.stepNumber - 1)] ?? ctx.structure.claims[0] ?? "the initial framing",
    progressionMechanism: (ctx) => {
      if (ctx.subMode === "deductive") return "deductive narrowing from general to specific";
      if (ctx.subMode === "inductive") return "inductive pattern accumulation";
      if (ctx.subMode === "abductive") return "abductive inference toward the best explanation";
      return "structural analogy to known cases";
    },
  },
  tools: ["think_sequential"],
};

const RULE_SEQ_CONFIDENCE_CALIBRATION: GrammarRule = {
  id: "seq-confidence-calibration",
  thoughtTypes: ["synthetic", "diagnostic"],
  modes: ["analytical", "critical"],
  stepRange: [2, 5],
  template: "Confidence at step {step}: {level}. This rating is anchored by {anchor}, while {destabilizer} prevents higher certainty. The sub-mode {subMode} constrains how far confidence can extend.",
  slots: {
    step: (ctx) => String(ctx.stepNumber),
    level: (ctx) => {
      const ratio = ctx.stepNumber / Math.max(ctx.totalSteps, 1);
      if (ratio < 0.3) return "low — early in the chain, limited evidence";
      if (ratio < 0.6) return "moderate — intermediate support with gaps";
      return "moderate-high — cumulative evidence with residual uncertainty";
    },
    anchor: (ctx) => ctx.patterns.causal[0]?.description ?? "the strongest established causal link",
    destabilizer: (ctx) => ctx.structure.uncertainties[0] ?? "the largest remaining unknown",
    subMode: (ctx) => ctx.subMode,
  },
  tools: ["think_sequential"],
};

const RULE_SEQ_ASSUMPTION_CHAIN: GrammarRule = {
  id: "seq-assumption-chain",
  thoughtTypes: ["deconstructive"],
  modes: ["critical", "analytical"],
  stepRange: [1, 4],
  template: "This step carries {chainLength} inherited assumptions from prior reasoning: {assumptions}. If assumption {criticalIdx} fails, steps {affectedSteps} become invalid — the cascading cost is {cost}.",
  slots: {
    chainLength: (ctx) => String(Math.min(ctx.stepNumber + 1, ctx.structure.implicit_assumptions.length + 1)),
    assumptions: (ctx) =>
      ctx.structure.implicit_assumptions.slice(0, 3).join("; ") ||
      "unexamined premises inherited from the chain",
    criticalIdx: (ctx) => String(Math.min(ctx.stepNumber, ctx.structure.implicit_assumptions.length)),
    affectedSteps: (ctx) => `step ${ctx.stepNumber} and all subsequent steps through ${ctx.totalSteps}`,
    cost: (ctx) => ctx.patterns.assumptions[0]?.cost_if_wrong ?? "invalidation of the entire downstream chain",
  },
  tools: ["think_sequential"],
};

const RULE_SEQ_COUNTER_GENERATION: GrammarRule = {
  id: "seq-counter-generation",
  thoughtTypes: ["corrective"],
  modes: ["critical"],
  stepRange: [2, 5],
  template: "Steel-manning the counter-position: {counterArgument}. This challenges the current step by {attackVector}. The vulnerability it exposes is {vulnerability}, requiring {response}.",
  slots: {
    counterArgument: (ctx) => ctx.structure.claims[1] ?? "an alternative interpretation of the same evidence",
    attackVector: (ctx) => {
      if (ctx.subMode === "deductive") return "questioning the general principle";
      if (ctx.subMode === "inductive") return "providing counter-examples";
      if (ctx.subMode === "abductive") return "offering a simpler explanation";
      return "demonstrating structural disanalogy";
    },
    vulnerability: (ctx) => ctx.structure.uncertainties[0] ?? "a gap between evidence and conclusion",
    response: (_ctx) => "strengthening the evidentiary base or narrowing the claim's scope",
  },
  tools: ["think_sequential"],
};

const RULE_SEQ_SYNTHESIS: GrammarRule = {
  id: "seq-synthesis",
  thoughtTypes: ["synthetic"],
  modes: ["analytical", "strategic"],
  stepRange: [4, 7],
  template: "Synthesizing steps 1 through {step}: the reasoning chain converges on {convergence}. The chain's integrity depends on {weakestLink}, and the epistemic status is {epistemic}.",
  slots: {
    step: (ctx) => String(ctx.stepNumber),
    convergence: (ctx) => ctx.structure.claims[0] ?? "a coherent but qualified conclusion",
    weakestLink: (ctx) => ctx.structure.uncertainties[0] ?? ctx.structure.implicit_assumptions[0] ?? "the least-supported inference",
    epistemic: (ctx) => {
      if (ctx.stepNumber <= 2) return "tentative — chain too short for strong claims";
      if (ctx.stepNumber <= 4) return "provisional — moderate support with identifiable gaps";
      return "well-supported — cumulative evidence with acknowledged boundary conditions";
    },
  },
  tools: ["think_sequential"],
};

// ── think_polarity ────────────────────────────────────────────────────────

const RULE_POLARITY_TENSION_AMPLIFICATION: GrammarRule = {
  id: "polarity-tension-amplification",
  thoughtTypes: ["perspectival", "deconstructive"],
  modes: ["critical", "creative"],
  stepRange: [0, 3],
  template: "The tension between {poleA} and {poleB} defines the core dilemma: over-indexing on {poleA} produces {overA}, while neglecting it produces {neglectA}. This is not a problem to solve but a polarity to manage.",
  slots: {
    poleA: (ctx) => ctx.structure.entities[0] ?? "the first pole",
    poleB: (ctx) => ctx.structure.entities[1] ?? "the opposing pole",
    overA: (ctx) => ctx.patterns.shadows[0]?.shadow ?? "diminishing returns and backlash",
    neglectA: (ctx) => ctx.structure.uncertainties[0] ?? "erosion of the underlying capacity",
  },
  tools: ["think_polarity"],
};

const RULE_POLARITY_INTEGRATION_SPECTRUM: GrammarRule = {
  id: "polarity-integration-spectrum",
  thoughtTypes: ["relational"],
  modes: ["strategic", "analytical"],
  stepRange: [2, 5],
  template: "On the integration spectrum, the current position is {position}, evidenced by {evidence}. Moving toward {direction} requires {action}, which would shift the balance from {current} to {target}.",
  slots: {
    position: (ctx) => ctx.structure.claims[0] ?? "skewed toward one pole",
    evidence: (ctx) => ctx.structure.claims[0] ?? "observable behavioral patterns",
    direction: (ctx) => ctx.structure.entities[1] ?? "the underweighted pole",
    action: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "deliberate rebalancing of priorities",
    current: (_ctx) => "reactive oscillation between extremes",
    target: (_ctx) => "integrated management of both poles simultaneously",
  },
  tools: ["think_polarity"],
};

const RULE_POLARITY_ARCHETYPE_DETECTION: GrammarRule = {
  id: "polarity-archetype-detection",
  thoughtTypes: ["diagnostic"],
  modes: ["critical", "analytical"],
  stepRange: [1, 4],
  template: "The {archetype} archetype is active: {pattern}. This manifests as {symptom}, where attempts to fix {problem} through {fix} inadvertently worsen {worsening}. The leverage point is {leverage}.",
  slots: {
    archetype: (_ctx) => "Fixes That Fail",
    pattern: (ctx) => ctx.patterns.causal[0]?.description ?? "a short-term fix creates long-term dependency",
    symptom: (ctx) => ctx.structure.relationships[0] ?? "increasing effort producing diminishing results",
    problem: (ctx) => ctx.structure.entities[0] ?? "the presenting problem",
    fix: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "applying more of the same solution",
    worsening: (ctx) => ctx.patterns.causal[0]?.structure.effect ?? "the underlying systemic condition",
    leverage: (_ctx) => "shifting from symptomatic relief to addressing root causes",
  },
  tools: ["think_polarity"],
};

const RULE_POLARITY_CIRCULAR_CAUSALITY: GrammarRule = {
  id: "polarity-circular-causality",
  thoughtTypes: ["relational", "corrective"],
  modes: ["critical"],
  stepRange: [3, 5],
  template: "Circular causality detected: {loopDescription}. Each pole reinforces the other through {mechanism}, creating a {loopType} pattern. Breaking the cycle requires {intervention}.",
  slots: {
    loopDescription: (ctx) => ctx.patterns.causal[0]?.description ?? "mutual reinforcement between opposing forces",
    mechanism: (ctx) => ctx.patterns.causal[0]?.structure.mechanism ?? "feedback that amplifies the tension",
    loopType: (ctx) => {
      if (ctx.subMode === "deductive") return "self-reinforcing escalation";
      return "self-balancing oscillation";
    },
    intervention: (_ctx) => "introducing a meta-level perspective that holds both poles simultaneously",
  },
  tools: ["think_polarity"],
};

const RULE_POLARITY_TRANSCENDENCE: GrammarRule = {
  id: "polarity-transcendence",
  thoughtTypes: ["synthetic"],
  modes: ["strategic", "creative"],
  stepRange: [4, 7],
  template: "Transcending the {poleA} vs {poleB} dichotomy: the integrated approach is {integration}. This preserves the rewards of {rewardA} while avoiding {trapA}, and captures {rewardB} while preventing {trapB}.",
  slots: {
    poleA: (ctx) => ctx.structure.entities[0] ?? "the first position",
    poleB: (ctx) => ctx.structure.entities[1] ?? "the opposing position",
    integration: (ctx) => ctx.structure.claims[0] ?? "a framework that leverages both poles dynamically",
    rewardA: (_ctx) => "the strengths of the first approach",
    trapA: (_ctx) => "its characteristic blind spots",
    rewardB: (_ctx) => "the strengths of the opposing approach",
    trapB: (_ctx) => "its characteristic excesses",
  },
  tools: ["think_polarity"],
};

// ── think_aqal_situational ────────────────────────────────────────────────

const RULE_AQAL_INTENTIONAL_QUADRANT: GrammarRule = {
  id: "aqal-intentional-quadrant",
  thoughtTypes: ["deconstructive", "perspectival"],
  modes: ["analytical", "critical"],
  stepRange: [0, 2],
  template: "Upper-Left (Intentional): The subjective experience of {subject} involves {interior}. The identity narrative is {identity}, with meaning-making at {meaningMaking} — this shapes how the situation is perceived from within.",
  slots: {
    subject: (ctx) => ctx.structure.entities[0] ?? "the actor",
    interior: (ctx) => ctx.structure.subject_type === "human" ? "beliefs, values, and emotional responses" : "internal states and self-conception",
    identity: (ctx) => ctx.structure.claims[0] ?? "the role the system believes it plays",
    meaningMaking: (ctx) => ctx.patterns.assumptions[0]?.assumption ?? "the interpretive lens through which events are understood",
  },
  tools: ["think_aqal_situational"],
};

const RULE_AQAL_BEHAVIORAL_QUADRANT: GrammarRule = {
  id: "aqal-behavioral-quadrant",
  thoughtTypes: ["relational", "diagnostic"],
  modes: ["analytical"],
  stepRange: [1, 3],
  template: "Upper-Right (Behavioral): Observable patterns include {behavior}, measurable as {metric}. The third-person data shows {data}, with {pattern} as the dominant behavioral signature.",
  slots: {
    behavior: (ctx) => ctx.structure.relationships[0] ?? "specific observable actions",
    metric: (ctx) => ctx.patterns.causal[0]?.structure.mechanism ?? "performance indicators and behavioral metrics",
    data: (ctx) => ctx.structure.claims[0] ?? "empirical evidence of what actually happens",
    pattern: (ctx) => ctx.patterns.causal[0]?.description ?? "the recurring behavioral pattern",
  },
  tools: ["think_aqal_situational"],
};

const RULE_AQAL_CULTURAL_QUADRANT: GrammarRule = {
  id: "aqal-cultural-quadrant",
  thoughtTypes: ["perspectival"],
  modes: ["critical", "creative"],
  stepRange: [2, 4],
  template: "Lower-Left (Cultural): Shared values and worldview assumptions include {values}, creating a collective narrative of {narrative}. The cultural shadow is {culturalShadow}, and the worldview at play is {worldview}.",
  slots: {
    values: (ctx) => ctx.structure.implicit_assumptions.slice(0, 2).join(" and ") || "shared norms that govern behavior",
    narrative: (ctx) => ctx.structure.claims[0] ?? "the story the group tells about itself",
    culturalShadow: (ctx) => ctx.patterns.shadows[0]?.shadow ?? "what the culture refuses to acknowledge",
    worldview: (ctx) => ctx.structure.subject_type === "organization" ? "the organizational paradigm" : "the shared interpretive framework",
  },
  tools: ["think_aqal_situational"],
};

const RULE_AQAL_SOCIAL_QUADRANT: GrammarRule = {
  id: "aqal-social-quadrant",
  thoughtTypes: ["relational", "diagnostic"],
  modes: ["strategic", "analytical"],
  stepRange: [1, 3],
  template: "Lower-Right (Social): The structural context includes {structures}, governed by {systems}. Infrastructure constraints are {constraints}, and the inter-objective dynamics create {dynamics}.",
  slots: {
    structures: (ctx) => ctx.structure.entities.slice(0, 2).join(" and ") || "organizational and institutional structures",
    systems: (ctx) => ctx.patterns.causal[0]?.description ?? "policies, processes, and power dynamics",
    constraints: (ctx) => ctx.structure.uncertainties[0] ?? "resource, technological, and temporal limits",
    dynamics: (_ctx) => "emergent properties from the interaction of multiple systems",
  },
  tools: ["think_aqal_situational"],
};

const RULE_AQAL_CROSS_QUADRANT_DYNAMICS: GrammarRule = {
  id: "aqal-cross-quadrant-dynamics",
  thoughtTypes: ["relational", "synthetic"],
  modes: ["strategic", "critical"],
  stepRange: [3, 5],
  template: "Cross-quadrant dynamics: {quadrantPair} are coupled through {couplingMechanism}. A change in {source} ripples to {target}, creating {rippleEffect}. Interventions must address both quadrants simultaneously.",
  slots: {
    quadrantPair: (ctx) => {
      if (ctx.stepNumber % 2 === 0) return "Interior states and Exterior systems";
      return "Individual behaviors and Cultural narratives";
    },
    couplingMechanism: (ctx) => ctx.patterns.causal[0]?.structure.mechanism ?? "structural feedback between dimensions",
    source: (ctx) => ctx.structure.entities[0] ?? "the initiating quadrant",
    target: (ctx) => ctx.structure.entities[1] ?? "the affected quadrant",
    rippleEffect: (ctx) => ctx.patterns.causal[0]?.description ?? "unintended consequences across quadrant boundaries",
  },
  tools: ["think_aqal_situational"],
};

// ── think_aqal_projection ─────────────────────────────────────────────────

const RULE_AQAL_PROJ_SHORT_TERM: GrammarRule = {
  id: "aqal-proj-short-term",
  thoughtTypes: ["prospective"],
  modes: ["strategic", "analytical"],
  stepRange: [0, 2],
  template: "Short-term projection (<1 year): {subject} will likely {trajectory}. The fastest-changing quadrant is {fastQuadrant}, showing {immediateChange}. Time pressure factors: {urgency}.",
  slots: {
    subject: (ctx) => ctx.structure.entities[0] ?? "the system",
    trajectory: (ctx) => ctx.structure.claims[0] ?? "continue along current trajectory with minor adjustments",
    fastQuadrant: (_ctx) => "Behavioral — observable changes are most immediate",
    immediateChange: (ctx) => ctx.patterns.causal[0]?.structure.effect ?? "shifts in measurable outcomes",
    urgency: (ctx) => ctx.structure.uncertainties[0] ?? "external deadlines and competitive pressures",
  },
  tools: ["think_aqal_projection"],
};

const RULE_AQAL_PROJ_MID_TERM: GrammarRule = {
  id: "aqal-proj-mid-term",
  thoughtTypes: ["prospective"],
  modes: ["strategic"],
  stepRange: [2, 4],
  template: "Mid-term projection (1-3 years): {midTrajectory}. Structural changes in {slowQuadrant} begin to manifest as {structuralChange}. Cultural lag is {culturalLag}.",
  slots: {
    midTrajectory: (ctx) => ctx.structure.claims[1] ?? ctx.structure.claims[0] ?? "systemic adaptation with structural friction",
    slowQuadrant: (_ctx) => "Cultural — shared worldviews change more slowly than behaviors",
    structuralChange: (ctx) => ctx.patterns.causal[0]?.description ?? "institutional realignment and policy shifts",
    culturalLag: (_ctx) => "the gap between new structures and old cultural narratives",
  },
  tools: ["think_aqal_projection"],
};

const RULE_AQAL_PROJ_LONG_TERM: GrammarRule = {
  id: "aqal-proj-long-term",
  thoughtTypes: ["prospective"],
  modes: ["strategic", "creative"],
  stepRange: [4, 6],
  template: "Long-term projection (3+ years): {longTrajectory}. Deepest quadrant shifts in {deepestQuadrant} produce {paradigmShift}. The slowest-changing dimension determines the ultimate outcome.",
  slots: {
    longTrajectory: (ctx) => ctx.structure.claims[0] ?? "fundamental transformation or entrenched stagnation",
    deepestQuadrant: (_ctx) => "Cultural/Intentional — identity and worldview are the slowest to change",
    paradigmShift: (_ctx) => "a new operating paradigm or collapse to a simpler structure",
  },
  tools: ["think_aqal_projection"],
};

const RULE_AQAL_PROJ_RATE_OF_CHANGE: GrammarRule = {
  id: "aqal-proj-rate-of-change",
  thoughtTypes: ["relational"],
  modes: ["analytical", "critical"],
  stepRange: [3, 5],
  template: "Differential rate analysis: Behavioral changes at {behavioralRate}, Cultural at {culturalRate}. The mismatch creates {mismatchEffect}, requiring {compensation}. Interventions must respect quadrant-specific tempo.",
  slots: {
    behavioralRate: (_ctx) => "fast — weeks to months for observable change",
    culturalRate: (_ctx) => "slow — years to decades for worldview shifts",
    mismatchEffect: (_ctx) => "structural changes outpacing cultural adaptation",
    compensation: (_ctx) => "deliberate sense-making processes to close the gap",
  },
  tools: ["think_aqal_projection"],
};

const RULE_AQAL_PROJ_INTERVENTION_TIMING: GrammarRule = {
  id: "aqal-proj-intervention-timing",
  thoughtTypes: ["prospective", "diagnostic"],
  modes: ["strategic"],
  stepRange: [4, 6],
  template: "Intervention timing: {intervention} is most effective in the {timeframe} window because {rationale}. Acting too early risks {tooEarly}, while acting too late risks {tooLate}.",
  slots: {
    intervention: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "structural realignment",
    timeframe: (ctx) => ctx.stepNumber <= 2 ? "short-term" : ctx.stepNumber <= 4 ? "mid-term" : "long-term",
    rationale: (ctx) => ctx.patterns.causal[0]?.description ?? "the window when conditions are most receptive",
    tooEarly: (_ctx) => "resistance from entrenched cultural patterns",
    tooLate: (_ctx) => "the problem has crystallized beyond easy intervention",
  },
  tools: ["think_aqal_projection"],
};

// ── think_hierarchical ────────────────────────────────────────────────────

const RULE_HIER_STAGE_TRANSITION: GrammarRule = {
  id: "hier-stage-transition",
  thoughtTypes: ["deconstructive", "diagnostic"],
  modes: ["analytical", "strategic"],
  stepRange: [0, 3],
  template: "Current stage: {currentStage}. The transition to {nextStage} requires {transitionCapacity}. Evidence for this assessment: {evidence}. The stage {includePrior} — prior capacities are not discarded but integrated.",
  slots: {
    currentStage: (ctx) => ctx.structure.entities[0] ?? "the current developmental level",
    nextStage: (ctx) => ctx.structure.claims[0] ?? "the next developmental stage",
    transitionCapacity: (_ctx) => "increased cognitive complexity and perspective-taking ability",
    evidence: (ctx) => ctx.patterns.causal[0]?.description ?? ctx.structure.relationships[0] ?? "observable markers of the current stage",
    includePrior: (_ctx) => "transcends and includes",
  },
  tools: ["think_hierarchical"],
};

const RULE_HIER_LINE_DIFFERENTIATION: GrammarRule = {
  id: "hier-line-differentiation",
  thoughtTypes: ["relational"],
  modes: ["analytical", "critical"],
  stepRange: [2, 4],
  template: "Line differentiation: {strongLine} operates at {strongLevel}, while {weakLine} lags at {weakLevel}. This creates {asymmetry}. Development is not uniform — lines grow independently.",
  slots: {
    strongLine: (_ctx) => "cognitive line",
    strongLevel: (ctx) => ctx.structure.claims[0] ?? "the highest developed line",
    weakLine: (_ctx) => "emotional or moral line",
    weakLevel: (_ctx) => "one or more stages behind the leading edge",
    asymmetry: (_ctx) => "an imbalanced developmental profile with characteristic blind spots",
  },
  tools: ["think_hierarchical"],
};

const RULE_HIER_VISION_LOGIC: GrammarRule = {
  id: "hier-vision-logic",
  thoughtTypes: ["synthetic"],
  modes: ["analytical", "strategic"],
  stepRange: [4, 6],
  template: "Vision-logic substage analysis: at {substage}, the system can {capacity}. This enables {integration} across previously separated domains. The next substep is {nextSubstep}.",
  slots: {
    substage: (ctx) => {
      const substages = ["systematic", "metasystematic", "paradigmatic", "cross-paradigmatic"];
      return substages[ctx.stepNumber % substages.length];
    },
    capacity: (_ctx) => "hold multiple systems in awareness simultaneously",
    integration: (_ctx) => "cross-domain synthesis",
    nextSubstep: (_ctx) => "expanding the range of integrated perspectives",
  },
  tools: ["think_hierarchical"],
};

const RULE_HIER_QUADRANT_MANIFESTATION: GrammarRule = {
  id: "hier-quadrant-manifestation",
  thoughtTypes: ["perspectival"],
  modes: ["analytical", "critical"],
  stepRange: [1, 4],
  template: "Stage {stage} manifests across quadrants: Intentional as {intentional}, Behavioral as {behavioral}, Cultural as {cultural}, Social as {social}. Each quadrant expresses the same stage differently.",
  slots: {
    stage: (ctx) => String(ctx.stepNumber),
    intentional: (_ctx) => "subjective self-understanding and identity",
    behavioral: (_ctx) => "observable complexity of behavior",
    cultural: (_ctx) => "shared worldview and values",
    social: (_ctx) => "structural complexity of systems",
  },
  tools: ["think_hierarchical"],
};

const RULE_HIER_NEXT_EDGE: GrammarRule = {
  id: "hier-next-edge",
  thoughtTypes: ["prospective"],
  modes: ["strategic"],
  stepRange: [4, 7],
  template: "The growing edge is {growingEdge}, requiring {development}. The shadow of the current stage is {stageShadow}, and the path forward involves {path}. Growth requires {practice}.",
  slots: {
    growingEdge: (ctx) => ctx.structure.claims[0] ?? "the next developmental capacity",
    development: (_ctx) => "deliberate practice in the underdeveloped dimension",
    stageShadow: (ctx) => ctx.patterns.shadows[0]?.shadow ?? "the characteristic limitation of the current stage",
    path: (_ctx) => "exposure to perspectives one stage more complex",
    practice: (_ctx) => "sustained engagement with complexity beyond current comfort",
  },
  tools: ["think_hierarchical"],
};

// ── think_shadow ──────────────────────────────────────────────────────────

const RULE_SHADOW_JUNGIAN: GrammarRule = {
  id: "shadow-jungian",
  thoughtTypes: ["perspectival", "diagnostic"],
  modes: ["critical", "creative"],
  stepRange: [0, 3],
  template: "Jungian analysis: the shadow content is {shadow}, projected onto {projection}. The archetype at work is {archetype}, manifesting through {manifestation}. Integration requires {integration}.",
  slots: {
    shadow: (ctx) => ctx.patterns.shadows[0]?.shadow ?? "the disowned aspect of the system",
    projection: (ctx) => ctx.structure.entities[1] ?? ctx.structure.entities[0] ?? "the external target of projection",
    archetype: (_ctx) => "the underlying archetypal pattern",
    manifestation: (ctx) => ctx.patterns.shadows[0]?.manifests_as?.slice(0, 2).join(" and ") ?? "behaviors that contradict stated intentions",
    integration: (ctx) => ctx.patterns.shadows[0]?.integration_path ?? "conscious acknowledgment of the disowned content",
  },
  tools: ["think_shadow"],
};

const RULE_SHADOW_FREUDIAN: GrammarRule = {
  id: "shadow-freudian",
  thoughtTypes: ["diagnostic"],
  modes: ["critical"],
  stepRange: [1, 4],
  template: "Freudian lens: the defense mechanism is {defense}, protecting against {anxiety}. The symptom {symptom} is a compromise formation between {impulse} and {superego}.",
  slots: {
    defense: (ctx) => ctx.patterns.shadows[0]?.manifests_as?.[0] ?? "repression or rationalization",
    anxiety: (ctx) => ctx.patterns.shadows[0]?.root_fear ?? "unconscious anxiety about unacceptable content",
    symptom: (ctx) => ctx.structure.uncertainties[0] ?? "the observable dysfunction",
    impulse: (_ctx) => "the repressed drive or desire",
    superego: (_ctx) => "the internalized prohibition against it",
  },
  tools: ["think_shadow"],
};

const RULE_SHADOW_GESTALT: GrammarRule = {
  id: "shadow-gestalt",
  thoughtTypes: ["perspectival"],
  modes: ["critical", "creative"],
  stepRange: [2, 4],
  template: "Gestalt perspective: the system avoids awareness of {avoidance} by {interruption}. The figure-ground relationship shows {figure} as foreground while {ground} remains in the background. Contact is interrupted at {boundary}.",
  slots: {
    avoidance: (ctx) => ctx.patterns.shadows[0]?.shadow ?? "the uncomfortable aspect of experience",
    interruption: (ctx) => ctx.patterns.shadows[0]?.manifests_as?.[0] ?? "deflection, introjection, or projection",
    figure: (ctx) => ctx.structure.claims[0] ?? "what the system focuses on",
    ground: (ctx) => ctx.patterns.shadows[0]?.root_fear ?? "what the system ignores to maintain this focus",
    boundary: (_ctx) => "the boundary between self and environment",
  },
  tools: ["think_shadow"],
};

const RULE_SHADOW_INTEGRAL: GrammarRule = {
  id: "shadow-integral",
  thoughtTypes: ["perspectival", "synthetic"],
  modes: ["critical", "strategic"],
  stepRange: [3, 5],
  template: "Integral shadow: the {altitude} system cannot see {blindSpot} because {reason}. This shadow operates across quadrants as {quadrantShadow}, and the integration path is {path}.",
  slots: {
    altitude: (ctx) => ctx.structure.entities[0] ?? "current developmental",
    blindSpot: (ctx) => ctx.patterns.shadows[0]?.shadow ?? "its own developmental limitations",
    reason: (_ctx) => "every stage has a characteristic shadow it cannot perceive from within",
    quadrantShadow: (_ctx) => "shadow expressions in all four quadrants simultaneously",
    path: (ctx) => ctx.patterns.shadows[0]?.integration_path ?? "development to the next stage that can see what this one cannot",
  },
  tools: ["think_shadow"],
};

const RULE_SHADOW_ARCHETYPE_MATCH: GrammarRule = {
  id: "shadow-archetype-match",
  thoughtTypes: ["diagnostic", "relational"],
  modes: ["critical", "creative"],
  stepRange: [2, 5],
  template: "Dominant archetype: {archetype}. The narrative pattern is {narrativePattern}, with {characterRole} as the system's role. The archetypal warning is {warning}, and the growth path is {growthPath}.",
  slots: {
    archetype: (_ctx) => "the Hero's Journey",
    narrativePattern: (_ctx) => "a call to adventure followed by resistance and transformation",
    characterRole: (_ctx) => "the protagonist facing an unknown challenge",
    warning: (_ctx) => "do not confuse the shadow with the enemy — it is a disowned part of self",
    growthPath: (ctx) => ctx.patterns.shadows[0]?.integration_path ?? "integrating the shadow rather than fighting it",
  },
  tools: ["think_shadow"],
};

// ── think_unity ───────────────────────────────────────────────────────────

const RULE_UNITY_SUBSYSTEM_DIALOGUE: GrammarRule = {
  id: "unity-subsystem-dialogue",
  thoughtTypes: ["relational", "synthetic"],
  modes: ["analytical", "strategic"],
  stepRange: [0, 3],
  template: "Subsystem dialogue: {subsystemA} observes {observationA}. {subsystemB} counters with {observationB}. The tension between them reveals {insight}.",
  slots: {
    subsystemA: (_ctx) => "Analytical subsystem",
    observationA: (ctx) => ctx.structure.claims[0] ?? "the logical structure holds under scrutiny",
    subsystemB: (_ctx) => "Critical subsystem",
    observationB: (ctx) => ctx.structure.uncertainties[0] ?? "but the foundational assumptions remain unexamined",
    insight: (_ctx) => "the gap between logical coherence and epistemic grounding",
  },
  tools: ["think_unity"],
};

const RULE_UNITY_CONTRADICTION_RESOLUTION: GrammarRule = {
  id: "unity-contradiction-resolution",
  thoughtTypes: ["corrective", "synthetic"],
  modes: ["critical", "strategic"],
  stepRange: [2, 5],
  template: "Contradiction detected between {system1} and {system2}: {contradiction}. Resolution: {resolution}. The contradiction is {type} — apparent or fundamental.",
  slots: {
    system1: (_ctx) => "the causal analysis",
    system2: (_ctx) => "the shadow assessment",
    contradiction: (ctx) => ctx.structure.claims[0] ?? "conflicting conclusions about the same phenomenon",
    resolution: (ctx) => ctx.patterns.assumptions[0]?.reality ?? "a higher-order framework that accommodates both findings",
    type: (_ctx) => "apparent — resolvable at a higher level of integration",
  },
  tools: ["think_unity"],
};

const RULE_UNITY_SYNTHESIS: GrammarRule = {
  id: "unity-synthesis",
  thoughtTypes: ["synthetic"],
  modes: ["analytical", "strategic", "creative"],
  stepRange: [4, 7],
  template: "Grand synthesis: across {count} subsystems, the integrated finding is {synthesis}. The convergent signal is {convergent}, the divergent signal is {divergent}, and the meta-insight is {metaInsight}.",
  slots: {
    count: (_ctx) => "six",
    synthesis: (ctx) => ctx.structure.claims[0] ?? "a multi-dimensional understanding that no single subsystem could produce alone",
    convergent: (ctx) => ctx.patterns.causal[0]?.description ?? "where all subsystems agree",
    divergent: (ctx) => ctx.structure.uncertainties[0] ?? "where subsystems diverge, indicating productive tension",
    metaInsight: (_ctx) => "the process of integration itself reveals patterns invisible to any single lens",
  },
  tools: ["think_unity"],
};

const RULE_UNITY_EMERGENCE: GrammarRule = {
  id: "unity-emergence",
  thoughtTypes: ["prospective"],
  modes: ["strategic", "creative"],
  stepRange: [3, 6],
  template: "Emergent insight from subsystem interaction: {emergence}. This was not visible in any single subsystem but arose from {interaction}. The practical implication is {implication}.",
  slots: {
    emergence: (ctx) => ctx.structure.claims[1] ?? ctx.structure.claims[0] ?? "a pattern visible only through multi-lens integration",
    interaction: (_ctx) => "the dialogue between subsystems with different epistemic commitments",
    implication: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "an intervention strategy informed by the full system view",
  },
  tools: ["think_unity"],
};

const RULE_UNITY_EPISTEMIC_WEIGHTING: GrammarRule = {
  id: "unity-epistemic-weighting",
  thoughtTypes: ["diagnostic"],
  modes: ["critical", "analytical"],
  stepRange: [2, 5],
  template: "Epistemic weighting: {strongSystem} carries {weightHigh} due to {justificationHigh}, while {weakSystem} carries {weightLow} due to {justificationLow}. The overall epistemic status is {epistemic}.",
  slots: {
    strongSystem: (_ctx) => "the subsystem with strongest evidence",
    weightHigh: (_ctx) => "high confidence",
    justificationHigh: (_ctx) => "robust pattern matching and convergent evidence",
    weakSystem: (_ctx) => "the subsystem with highest uncertainty",
    weightLow: (_ctx) => "provisional confidence",
    justificationLow: (ctx) => ctx.structure.uncertainties[0] ?? "limited data and high complexity",
    epistemic: (_ctx) => "well-supported with acknowledged blind spots",
  },
  tools: ["think_unity"],
};

// ── think_causal ──────────────────────────────────────────────────────────

const RULE_CAUSAL_RELATIONSHIP_MAPPING: GrammarRule = {
  id: "causal-relationship-mapping",
  thoughtTypes: ["relational"],
  modes: ["analytical", "strategic"],
  stepRange: [0, 3],
  template: "Causal relationship: {cause} → {effect} with {polarity} polarity via {mechanism}. This {relationshipType} connects {elementCount} variables in the causal structure.",
  slots: {
    cause: (ctx) => ctx.patterns.causal[0]?.structure.cause ?? ctx.structure.entities[0] ?? "the causal driver",
    effect: (ctx) => ctx.patterns.causal[0]?.structure.effect ?? ctx.structure.entities[1] ?? "the resulting outcome",
    polarity: (ctx) => ctx.subMode === "deductive" ? "positive (+)" : "negative (−)",
    mechanism: (ctx) => ctx.patterns.causal[0]?.structure.mechanism ?? "the mediating process",
    relationshipType: (ctx) => ctx.subMode === "deductive" ? "reinforcing relationship" : "balancing relationship",
    elementCount: (ctx) => String(ctx.structure.relationships.length || ctx.patterns.causal.length),
  },
  tools: ["think_causal"],
};

const RULE_CAUSAL_CYCLE_DETECTION: GrammarRule = {
  id: "causal-cycle-detection",
  thoughtTypes: ["diagnostic"],
  modes: ["analytical", "critical"],
  stepRange: [2, 4],
  template: "{cycleType} cycle detected: {cycleDescription}. This is a {archetypeName} archetype pattern, where {behaviorPattern}.",
  slots: {
    cycleType: (ctx) => ctx.subMode === "deductive" ? "Reinforcing (R)" : "Balancing (B)",
    cycleDescription: (ctx) => ctx.patterns.causal[0]?.description ?? "a feedback loop that amplifies or stabilizes the system",
    archetypeName: (_ctx) => "a recognized systems archetype",
    behaviorPattern: (_ctx) => "the system exhibits characteristic dynamics of this pattern",
  },
  tools: ["think_causal"],
};

const RULE_CAUSAL_LEVERAGE_RANKING: GrammarRule = {
  id: "causal-leverage-ranking",
  thoughtTypes: ["diagnostic", "prospective"],
  modes: ["strategic", "analytical"],
  stepRange: [3, 6],
  template: "Meadows leverage point #{rank}: {intervention}. This targets {target}, with effectiveness rated {effectiveness}. The risk is {risk}, requiring {mitigation}.",
  slots: {
    rank: (ctx) => String(ctx.patterns.leveragePoints[0]?.meadows_rank ?? "6"),
    intervention: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "change the rules of the system",
    target: (ctx) => ctx.patterns.causal[0]?.structure.mechanism ?? "the feedback structure",
    effectiveness: (_ctx) => "high — structural intervention",
    risk: (ctx) => ctx.patterns.leveragePoints[0]?.risk ?? "system resistance to change",
    mitigation: (_ctx) => "gradual implementation with feedback monitoring",
  },
  tools: ["think_causal"],
};

const RULE_CAUSAL_ARCHETYPE_INTERVENTION: GrammarRule = {
  id: "causal-archetype-intervention",
  thoughtTypes: ["corrective"],
  modes: ["critical", "strategic"],
  stepRange: [3, 5],
  template: "Breaking the {archetype} pattern: the key is to {breakAction}. Currently, {symptom} reinforces the archetype. Shifting to {alternativeStructure} disrupts the cycle at {leveragePoint}.",
  slots: {
    archetype: (_ctx) => "the dominant systems pattern",
    breakAction: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "address the root cause rather than symptoms",
    symptom: (ctx) => ctx.patterns.causal[0]?.structure.effect ?? "the observable dysfunction",
    alternativeStructure: (_ctx) => "a feedback structure that produces the desired outcome",
    leveragePoint: (ctx) => `Meadows rank ${ctx.patterns.leveragePoints[0]?.meadows_rank ?? "N/A"}`,
  },
  tools: ["think_causal"],
};

const RULE_CAUSAL_MULTI_LOOP: GrammarRule = {
  id: "causal-multi-loop",
  thoughtTypes: ["relational", "synthetic"],
  modes: ["analytical", "strategic"],
  stepRange: [4, 7],
  template: "Multi-loop analysis: {loopCount} interacting loops create {dynamic}. The dominant loop at this stage is {dominantLoop}, but {emergingLoop} is gaining influence. The system behavior is {behavior}.",
  slots: {
    loopCount: (ctx) => String(Math.max(ctx.patterns.causal.length, 2)),
    dynamic: (_ctx) => "complex non-linear behavior",
    dominantLoop: (ctx) => ctx.subMode === "deductive" ? "the reinforcing growth engine" : "the balancing constraint",
    emergingLoop: (ctx) => ctx.subMode === "deductive" ? "the emerging balancing constraint" : "the emerging reinforcing dynamic",
    behavior: (ctx) => ctx.patterns.causal[0]?.description ?? "the net result of competing feedback forces",
  },
  tools: ["think_causal"],
};

// ── think_cynefin ─────────────────────────────────────────────────────────

const RULE_CYNEFIN_DOMAIN_CLASSIFICATION: GrammarRule = {
  id: "cynefin-domain-classification",
  thoughtTypes: ["deconstructive", "diagnostic"],
  modes: ["analytical", "strategic"],
  stepRange: [0, 2],
  template: "The situation classifies as {domain} with {confidence}% confidence. Signal: {signal}. This means the appropriate response is {response}, not {wrongResponse}.",
  slots: {
    domain: (ctx) => ctx.structure.entities[0] ?? "Complex",
    confidence: (ctx) => {
      if (ctx.structure.uncertainties.length <= 1) return "85";
      if (ctx.structure.uncertainties.length <= 3) return "70";
      return "55";
    },
    signal: (ctx) => ctx.patterns.causal[0]?.description ?? "unpredictable cause-effect relationships",
    response: (ctx) => {
      const domain = ctx.structure.entities[0]?.toLowerCase() ?? "";
      if (domain.includes("clear")) return "Sense-Categorize-Respond (best practices)";
      if (domain.includes("complicated")) return "Sense-Analyze-Respond (expert analysis)";
      if (domain.includes("complex")) return "Probe-Sense-Respond (safe-to-fail experiments)";
      return "Act-Sense-Respond (immediate action)";
    },
    wrongResponse: (_ctx) => "applying best practices to a complex problem",
  },
  tools: ["think_cynefin"],
};

const RULE_CYNEFIN_RESPONSE_STRATEGY: GrammarRule = {
  id: "cynefin-response-strategy",
  thoughtTypes: ["prospective"],
  modes: ["strategic"],
  stepRange: [2, 4],
  template: "In the {domain} domain, the strategy is {strategy}. This means {action} rather than {counterAction}. The time pressure is {timePressure}, and the stakes are {stakes}.",
  slots: {
    domain: (ctx) => ctx.structure.initial_position ?? "Complex",
    strategy: (ctx) => {
      if (ctx.structure.initial_position?.toLowerCase().includes("complex")) return "probe-sense-respond";
      return "analyze and respond";
    },
    action: (_ctx) => "running multiple small experiments to discover patterns",
    counterAction: (_ctx) => "seeking a single correct answer before acting",
    timePressure: (ctx) => ctx.structure.uncertainties[0] ?? "moderate — time for experimentation",
    stakes: (ctx) => ctx.patterns.assumptions[0]?.cost_if_wrong ?? "the consequences of misclassification",
  },
  tools: ["think_cynefin"],
};

const RULE_CYNEFIN_BOUNDARY_ANALYSIS: GrammarRule = {
  id: "cynefin-boundary-analysis",
  thoughtTypes: ["perspectival", "diagnostic"],
  modes: ["critical"],
  stepRange: [3, 5],
  template: "Boundary analysis: the situation sits near the {adjacentDomain} border. If {trigger} occurs, it shifts into {newDomain}. Watch for {warningSigns} as early indicators.",
  slots: {
    adjacentDomain: (ctx) => {
      if (ctx.structure.initial_position?.toLowerCase().includes("complex")) return "Chaotic";
      return "Complex";
    },
    trigger: (ctx) => ctx.structure.uncertainties[0] ?? "a critical threshold is crossed",
    newDomain: (ctx) => ctx.structure.initial_position?.toLowerCase().includes("complex") ? "Chaotic" : "Complex",
    warningSigns: (ctx) => ctx.patterns.causal[0]?.structure.effect ?? "accelerating feedback and loss of predictability",
  },
  tools: ["think_cynefin"],
};

const RULE_CYNEFIN_CATEGORICAL_SHIFT: GrammarRule = {
  id: "cynefin-categorical-shift",
  thoughtTypes: ["corrective"],
  modes: ["critical"],
  stepRange: [2, 4],
  template: "Category error detected: treating {situation} as {wrongCategory} when evidence points to {rightCategory}. This error leads to {consequence}. Correct by {correction}.",
  slots: {
    situation: (ctx) => ctx.structure.entities[0] ?? "the current situation",
    wrongCategory: (_ctx) => "a Complicated problem",
    rightCategory: (ctx) => ctx.structure.initial_position ?? "a Complex problem",
    consequence: (_ctx) => "over-analysis when experimentation is needed, or vice versa",
    correction: (_ctx) => "shifting from expert analysis to safe-to-fail probes",
  },
  tools: ["think_cynefin"],
};

const RULE_CYNEFIN_DECOMPOSITION: GrammarRule = {
  id: "cynefin-decomposition",
  thoughtTypes: ["deconstructive"],
  modes: ["analytical", "strategic"],
  stepRange: [4, 6],
  template: "Decomposing the situation: {componentA} is {domainA}, {componentB} is {domainB}, and {componentC} is {domainC}. Each sub-component requires a different response strategy: {strategies}.",
  slots: {
    componentA: (ctx) => ctx.structure.entities[0] ?? "the first aspect",
    domainA: (_ctx) => "Complicated",
    componentB: (ctx) => ctx.structure.entities[1] ?? "the second aspect",
    domainB: (_ctx) => "Complex",
    componentC: (_ctx) => "the operational context",
    domainC: (_ctx) => "Clear",
    strategies: (_ctx) => "expert analysis for Complicated, experimentation for Complex, best practices for Clear",
  },
  tools: ["think_cynefin"],
};

// ── think_scenario ────────────────────────────────────────────────────────

const RULE_SCENARIO_GENERATION: GrammarRule = {
  id: "scenario-generation",
  thoughtTypes: ["deconstructive", "prospective"],
  modes: ["strategic", "creative"],
  stepRange: [0, 3],
  template: "Scenario {scenarioName}: driven by {uncertaintyA} ({stateA}) and {uncertaintyB} ({stateB}). The narrative arc is {narrative}, with {keyEvent} as the pivotal moment.",
  slots: {
    scenarioName: (ctx) => {
      const names = ["Robust Growth", "Constrained Adaptation", "Disruptive Shift", "Fragmented Response"];
      return names[ctx.stepNumber % names.length];
    },
    uncertaintyA: (ctx) => ctx.structure.uncertainties[0] ?? "the first critical uncertainty",
    stateA: (ctx) => ctx.subMode === "deductive" ? "favorable resolution" : "unfavorable resolution",
    uncertaintyB: (ctx) => ctx.structure.uncertainties[1] ?? ctx.structure.uncertainties[0] ?? "the second critical uncertainty",
    stateB: (_ctx) => "high regulatory adoption",
    narrative: (ctx) => ctx.structure.claims[0] ?? "a plausible future trajectory",
    keyEvent: (_ctx) => "the triggering event that sets the scenario in motion",
  },
  tools: ["think_scenario"],
};

const RULE_SCENARIO_CONSEQUENCE_CASCADE: GrammarRule = {
  id: "scenario-consequence-cascade",
  thoughtTypes: ["prospective", "relational"],
  modes: ["strategic", "analytical"],
  stepRange: [2, 5],
  template: "Consequence cascade in {scenario}: 1st order → {firstOrder}. 2nd order → {secondOrder}. 3rd order → {thirdOrder}. The cascade accelerates through {accelerator}.",
  slots: {
    scenario: (ctx) => ctx.structure.claims[0] ?? "the scenario",
    firstOrder: (ctx) => ctx.patterns.causal[0]?.structure.effect ?? "the immediate consequence",
    secondOrder: (ctx) => ctx.patterns.causal[1]?.structure.effect ?? "the adaptive response",
    thirdOrder: (_ctx) => "the systemic transformation that reshapes the landscape",
    accelerator: (ctx) => ctx.patterns.causal[0]?.structure.mechanism ?? "the mechanism that amplifies effects across orders",
  },
  tools: ["think_scenario"],
};

const RULE_SCENARIO_PREMORTEM: GrammarRule = {
  id: "scenario-premortem",
  thoughtTypes: ["diagnostic", "corrective"],
  modes: ["critical"],
  stepRange: [3, 5],
  template: "Pre-mortem: the strategy has failed because {failureCause}. The warning signs we ignored were {warningSigns}. The critical assumption that proved false was {falseAssumption}. To prevent this, {prevention}.",
  slots: {
    failureCause: (ctx) => ctx.structure.uncertainties[0] ?? "an unexamined risk materialized",
    warningSigns: (ctx) => ctx.patterns.shadows[0]?.manifests_as?.[0] ?? ctx.structure.relationships[0] ?? "early indicators that were rationalized away",
    falseAssumption: (ctx) => ctx.structure.implicit_assumptions[0] ?? "the foundational premise of the strategy",
    prevention: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "build monitoring for the specific failure mode",
  },
  tools: ["think_scenario"],
};

const RULE_SCENARIO_EARLY_WARNINGS: GrammarRule = {
  id: "scenario-early-warnings",
  thoughtTypes: ["diagnostic"],
  modes: ["strategic", "analytical"],
  stepRange: [3, 6],
  template: "Early warning signals: {signal} indicates movement toward {scenario}. Monitor {metric} — if it crosses {threshold}, shift to {response}. The time window for intervention is {window}.",
  slots: {
    signal: (ctx) => ctx.patterns.causal[0]?.structure.cause ?? "a leading indicator",
    scenario: (ctx) => ctx.structure.claims[0] ?? "an undesirable scenario",
    metric: (ctx) => ctx.patterns.causal[0]?.structure.effect ?? "a measurable variable",
    threshold: (_ctx) => "a predefined trigger point",
    response: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "a contingency plan",
    window: (ctx) => ctx.structure.uncertainties[0] ?? "the period between signal detection and scenario manifestation",
  },
  tools: ["think_scenario"],
};

const RULE_SCENARIO_ROBUST_STRATEGY: GrammarRule = {
  id: "scenario-robust-strategy",
  thoughtTypes: ["synthetic"],
  modes: ["strategic"],
  stepRange: [5, 7],
  template: "Robust strategy across scenarios: {strategy} performs well in {scenarioCount} of {totalScenarios} scenarios. The no-regret moves are {noRegret}. The option value lies in {optionValue}.",
  slots: {
    strategy: (ctx) => ctx.structure.claims[0] ?? "the proposed strategic direction",
    scenarioCount: (_ctx) => "3",
    totalScenarios: (_ctx) => "4",
    noRegret: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "actions that benefit the organization regardless of which future unfolds",
    optionValue: (_ctx) => "maintaining flexibility to pivot as early warning signals emerge",
  },
  tools: ["think_scenario"],
};

// ── think_metacognitive ───────────────────────────────────────────────────

const RULE_META_LADDER_AUDIT: GrammarRule = {
  id: "meta-ladder-audit",
  thoughtTypes: ["deconstructive"],
  modes: ["critical", "analytical"],
  stepRange: [0, 3],
  template: "Ladder of Inference audit: Data selected: {data}. Interpretation: {interpretation}. Assumption: {assumption}. Conclusion: {conclusion}. The leap from rung {fromRung} to {toRung} requires {verification}.",
  slots: {
    data: (ctx) => ctx.structure.entities[0] ?? "the observable facts",
    interpretation: (ctx) => ctx.structure.claims[0] ?? "the meaning assigned to the data",
    assumption: (ctx) => ctx.structure.implicit_assumptions[0] ?? "the belief underlying the interpretation",
    conclusion: (ctx) => ctx.structure.claims[1] ?? ctx.structure.claims[0] ?? "the action or judgment derived",
    fromRung: (ctx) => String(Math.min(ctx.stepNumber, 3)),
    toRung: (ctx) => String(Math.min(ctx.stepNumber + 1, 7)),
    verification: (_ctx) => "returning to observable data to confirm the inference",
  },
  tools: ["think_metacognitive"],
};

const RULE_META_BIAS_DETECTION: GrammarRule = {
  id: "meta-bias-detection",
  thoughtTypes: ["diagnostic"],
  modes: ["critical"],
  stepRange: [2, 5],
  template: "Bias alert: {biasType} detected with {severity} severity. Manifestation: {manifestation}. This distorts {cognitiveProcess} by {distortion}. Counter: {countermeasure}.",
  slots: {
    biasType: (_ctx) => "confirmation bias",
    severity: (_ctx) => "high",
    manifestation: (ctx) => ctx.structure.claims[0] ?? "selective evidence gathering",
    cognitiveProcess: (_ctx) => "the evaluation of competing hypotheses",
    distortion: (_ctx) => "overweighting confirming evidence and discounting disconfirming data",
    countermeasure: (_ctx) => "actively seeking disconfirming evidence and using structured devil's advocacy",
  },
  tools: ["think_metacognitive"],
};

const RULE_META_BLIND_SPOT: GrammarRule = {
  id: "meta-blind-spot",
  thoughtTypes: ["perspectival"],
  modes: ["critical", "creative"],
  stepRange: [3, 5],
  template: "Blind spot: the reasoning has not considered {blindSpot}. The unasked question is {unasked}. The perspective missing is {missingPerspective}. Addressing this requires {action}.",
  slots: {
    blindSpot: (ctx) => ctx.structure.uncertainties[0] ?? "an entire dimension of the problem",
    unasked: (ctx) => ctx.structure.implicit_assumptions[0] ?? "what would change if the opposite were true?",
    missingPerspective: (ctx) => ctx.structure.subject_type === "human" ? "the emotional dimension" : "the stakeholder who loses from this analysis",
    action: (_ctx) => "stepping outside the current reasoning frame",
  },
  tools: ["think_metacognitive"],
};

const RULE_META_RECURSIVE_LOOP: GrammarRule = {
  id: "meta-recursive-loop",
  thoughtTypes: ["corrective"],
  modes: ["critical"],
  stepRange: [2, 4],
  template: "Recursive loop detected: the reasoning is {loopPattern}. This creates a self-reinforcing cycle where {reinforcement}. Breaking out requires {breakout}.",
  slots: {
    loopPattern: (_ctx) => "confirming its own premises through circular selection of evidence",
    reinforcement: (_ctx) => "each step finds evidence that supports the previous step's conclusion",
    breakout: (_ctx) => "introducing an external perspective or contradictory data source",
  },
  tools: ["think_metacognitive"],
};

const RULE_META_RECONSTRUCTION: GrammarRule = {
  id: "meta-reconstruction",
  thoughtTypes: ["synthetic"],
  modes: ["analytical", "strategic"],
  stepRange: [5, 7],
  template: "Bias-corrected reasoning: removing {bias} changes the conclusion from {original} to {corrected}. The confidence adjustment is {adjustment}. The revised epistemic status is {epistemic}.",
  slots: {
    bias: (_ctx) => "the identified cognitive distortion",
    original: (ctx) => ctx.structure.claims[0] ?? "the original conclusion",
    corrected: (ctx) => ctx.patterns.assumptions[0]?.reality ?? "a more nuanced position with wider error bars",
    adjustment: (_ctx) => "reducing confidence by one level",
    epistemic: (_ctx) => "tentative — the corrected reasoning acknowledges greater uncertainty",
  },
  tools: ["think_metacognitive"],
};

// ── think_first_principles ────────────────────────────────────────────────

const RULE_FP_CLAIM_CLASSIFICATION: GrammarRule = {
  id: "fp-claim-classification",
  thoughtTypes: ["deconstructive"],
  modes: ["analytical", "critical"],
  stepRange: [0, 3],
  template: "Claim classification: \"{claim}\" is classified as {category}. This means it {justification}. The {count} {type} elements in this claim require {action}.",
  slots: {
    claim: (ctx) => ctx.structure.claims[0] ?? "the proposition under analysis",
    category: (_ctx) => "inherited assumption",
    justification: (_ctx) => "it reflects cultural convention rather than empirical necessity",
    count: (ctx) => String(ctx.structure.entities.length),
    type: (_ctx) => "factual",
    action: (_ctx) => "independent verification",
  },
  tools: ["think_first_principles"],
};

const RULE_FP_SOCRATIC_INTERROGATION: GrammarRule = {
  id: "fp-socratic-interrogation",
  thoughtTypes: ["corrective"],
  modes: ["critical"],
  stepRange: [2, 4],
  template: "Socratic interrogation of \"{assumption}\": Origin — {origin}. Evidence — {evidence}. If false — {ifFalse}. This assumption is {status}.",
  slots: {
    assumption: (ctx) => ctx.structure.implicit_assumptions[0] ?? ctx.patterns.assumptions[0]?.assumption ?? "the underlying premise",
    origin: (ctx) => ctx.structure.claims[0] ?? "cultural inheritance or conventional wisdom",
    evidence: (ctx) => ctx.patterns.causal[0]?.description ?? "limited or circumstantial",
    ifFalse: (_ctx) => "the entire analytical structure would need rebuilding from verified facts",
    status: (_ctx) => "unverified — requires decomposition to irreducible components",
  },
  tools: ["think_first_principles"],
};

const RULE_FP_CONSTRAINT_MAPPING: GrammarRule = {
  id: "fp-constraint-mapping",
  thoughtTypes: ["relational"],
  modes: ["analytical", "strategic"],
  stepRange: [1, 3],
  template: "Constraint analysis: {physicalConstraints} are irreducible physical laws. {socialConstraints} are social conventions, not necessities. {contextualConstraints} are current but not universal limits.",
  slots: {
    physicalConstraints: (ctx) => ctx.structure.entities[0] ?? "Energy and information constraints",
    socialConstraints: (ctx) => ctx.structure.implicit_assumptions[0] ?? "Organizational norms and industry standards",
    contextualConstraints: (ctx) => ctx.structure.uncertainties[0] ?? "Resource availability and temporal limits",
  },
  tools: ["think_first_principles"],
};

const RULE_FP_RECONSTRUCTION: GrammarRule = {
  id: "fp-reconstruction",
  thoughtTypes: ["prospective"],
  modes: ["strategic", "creative"],
  stepRange: [4, 6],
  template: "First-principles reconstruction: starting from {irreducible}, the new approach is {newApproach}. This bypasses {convention} and achieves {improvement} because {reason}.",
  slots: {
    irreducible: (ctx) => ctx.structure.entities[0] ?? "the verified fundamental constraints",
    newApproach: (ctx) => ctx.structure.claims[0] ?? "a solution built from verified components only",
    convention: (_ctx) => "the inherited assumptions that were discarded",
    improvement: (ctx) => ctx.patterns.leveragePoints[0]?.intervention ?? "a more efficient or effective outcome",
    reason: (_ctx) => "the solution is not constrained by unexamined premises",
  },
  tools: ["think_first_principles"],
};

const RULE_FP_LIBERATION_ANALYSIS: GrammarRule = {
  id: "fp-liberation-analysis",
  thoughtTypes: ["synthetic"],
  modes: ["creative", "strategic"],
  stepRange: [4, 7],
  template: "Liberation analysis: if {assumption} is false, {newPossibility} becomes possible. Removing this constraint opens {optionCount} design spaces previously considered impossible.",
  slots: {
    assumption: (ctx) => ctx.structure.implicit_assumptions[0] ?? "the most limiting inherited assumption",
    newPossibility: (ctx) => ctx.structure.claims[1] ?? ctx.structure.claims[0] ?? "a fundamentally different approach",
    optionCount: (ctx) => String(Math.max(ctx.structure.entities.length, 2)),
  },
  tools: ["think_first_principles"],
};

// ── think_navigator ───────────────────────────────────────────────────────

const RULE_NAV_DAG_CONSTRUCTION: GrammarRule = {
  id: "nav-dag-construction",
  thoughtTypes: ["deconstructive"],
  modes: ["analytical", "strategic"],
  stepRange: [0, 2],
  template: "DAG node {nodeId}: {task} depends on {dependencies}. The thinking tool is {tool}, with {parallelism}. Total nodes in reasoning graph: {totalNodes}.",
  slots: {
    nodeId: (ctx) => String(ctx.stepNumber),
    task: (ctx) => ctx.structure.claims[0] ?? "the current reasoning step",
    dependencies: (ctx) => {
      if (ctx.stepNumber === 0) return "none (root node)";
      return `node ${ctx.stepNumber - 1}`;
    },
    tool: (ctx) => ctx.structure.subject_type ?? "the appropriate thinking tool",
    parallelism: (ctx) => ctx.subMode === "deductive" ? "sequential (dependency chain)" : "potential for parallel execution",
    totalNodes: (ctx) => String(ctx.totalSteps),
  },
  tools: ["think_navigator"],
};

const RULE_NAV_PARALLEL_GROUPING: GrammarRule = {
  id: "nav-parallel-grouping",
  thoughtTypes: ["relational"],
  modes: ["analytical", "strategic"],
  stepRange: [2, 4],
  template: "Parallel execution group: [{groupNodes}] can run concurrently because {justification}. Estimated throughput gain: {gain}. Sequential dependencies: {sequential}.",
  slots: {
    groupNodes: (ctx) => `nodes ${ctx.stepNumber}-${Math.min(ctx.stepNumber + 2, ctx.totalSteps - 1)}`,
    justification: (_ctx) => "no shared state or cross-dependencies between these reasoning steps",
    gain: (ctx) => `${Math.min(ctx.stepNumber + 1, 3)}x with parallel sub-agents`,
    sequential: (ctx) => ctx.patterns.causal[0]?.structure.mechanism ?? "the dependency chain that must execute in order",
  },
  tools: ["think_navigator"],
};

const RULE_NAV_REPLANNING: GrammarRule = {
  id: "nav-replanning",
  thoughtTypes: ["corrective"],
  modes: ["critical", "strategic"],
  stepRange: [3, 5],
  template: "Replanning triggered: {trigger} invalidates nodes {affectedNodes}. New path: {newPath}. The reasoning graph adapts by {adaptation}. Node quality threshold: {quality}.",
  slots: {
    trigger: (ctx) => ctx.structure.uncertainties[0] ?? "a node output failed quality threshold",
    affectedNodes: (ctx) => `${ctx.stepNumber} and downstream dependents`,
    newPath: (ctx) => ctx.structure.claims[0] ?? "an alternative reasoning sequence",
    adaptation: (_ctx) => "replacing failed nodes and re-evaluating dependency chains",
    quality: (_ctx) => "0.7 minimum confidence for node acceptance",
  },
  tools: ["think_navigator"],
};

const RULE_NAV_TERMINATION: GrammarRule = {
  id: "nav-termination",
  thoughtTypes: ["synthetic"],
  modes: ["strategic", "analytical"],
  stepRange: [5, 7],
  template: "Termination synthesis: {completedNodes} of {totalNodes} completed. Coverage: {coverage}. The integrated answer is {synthesis}. Remaining gaps: {gaps}. Recommendation: {recommendation}.",
  slots: {
    completedNodes: (ctx) => String(ctx.stepNumber),
    totalNodes: (ctx) => String(ctx.totalSteps),
    coverage: (ctx) => `${Math.round((ctx.stepNumber / Math.max(ctx.totalSteps, 1)) * 100)}% of reasoning graph`,
    synthesis: (ctx) => ctx.structure.claims[0] ?? "the accumulated reasoning chain output",
    gaps: (ctx) => ctx.structure.uncertainties[0] ?? "nodes that exceeded quality threshold",
    recommendation: (ctx) => ctx.stepNumber >= ctx.totalSteps ? "terminate — sufficient coverage achieved" : "continue — more nodes needed",
  },
  tools: ["think_navigator"],
};

const RULE_NAV_DEPENDENCY_ANALYSIS: GrammarRule = {
  id: "nav-dependency-analysis",
  thoughtTypes: ["diagnostic"],
  modes: ["analytical"],
  stepRange: [1, 4],
  template: "Dependency analysis: {criticalPath} is the critical path through the reasoning DAG. Bottleneck: {bottleneck}. Risk: {risk}. Optimization: {optimization}.",
  slots: {
    criticalPath: (ctx) => `nodes 0 → ${ctx.stepNumber} → ${ctx.totalSteps - 1}`,
    bottleneck: (ctx) => ctx.patterns.causal[0]?.structure.mechanism ?? "the thinking tool with longest execution time",
    risk: (ctx) => ctx.structure.uncertainties[0] ?? "cascade failure if a critical node underperforms",
    optimization: (_ctx) => "parallelize non-critical path nodes and pre-fetch context for dependent nodes",
  },
  tools: ["think_navigator"],
};

// ─── ALL RULES ───────────────────────────────────────────────────────────────

const ALL_RULES: GrammarRule[] = [
  // Tool-agnostic fallbacks (12 rules)
  RULE_DECOMPOSITION_ENTITY,
  RULE_CAUSAL_MAPPING,
  RULE_EVIDENCE_CHALLENGE,
  RULE_SHADOW_SURFACE,
  RULE_LEVERAGE_INTERVENTION,
  RULE_EDGE_CASE,
  RULE_SECOND_ORDER,
  RULE_BOUNDED_CONCLUSION,
  RULE_ASSUMPTION_SURFACE,
  RULE_COUNTER_SPECIFIC,
  RULE_CASCADE_PREDICTION,
  RULE_UNCERTAINTY_ACKNOWLEDGMENT,
  // Tool-specific: think_sequential (5)
  RULE_SEQ_STEP_PROGRESSION,
  RULE_SEQ_CONFIDENCE_CALIBRATION,
  RULE_SEQ_ASSUMPTION_CHAIN,
  RULE_SEQ_COUNTER_GENERATION,
  RULE_SEQ_SYNTHESIS,
  // Tool-specific: think_polarity (5)
  RULE_POLARITY_TENSION_AMPLIFICATION,
  RULE_POLARITY_INTEGRATION_SPECTRUM,
  RULE_POLARITY_ARCHETYPE_DETECTION,
  RULE_POLARITY_CIRCULAR_CAUSALITY,
  RULE_POLARITY_TRANSCENDENCE,
  // Tool-specific: think_aqal_situational (5)
  RULE_AQAL_INTENTIONAL_QUADRANT,
  RULE_AQAL_BEHAVIORAL_QUADRANT,
  RULE_AQAL_CULTURAL_QUADRANT,
  RULE_AQAL_SOCIAL_QUADRANT,
  RULE_AQAL_CROSS_QUADRANT_DYNAMICS,
  // Tool-specific: think_aqal_projection (5)
  RULE_AQAL_PROJ_SHORT_TERM,
  RULE_AQAL_PROJ_MID_TERM,
  RULE_AQAL_PROJ_LONG_TERM,
  RULE_AQAL_PROJ_RATE_OF_CHANGE,
  RULE_AQAL_PROJ_INTERVENTION_TIMING,
  // Tool-specific: think_hierarchical (5)
  RULE_HIER_STAGE_TRANSITION,
  RULE_HIER_LINE_DIFFERENTIATION,
  RULE_HIER_VISION_LOGIC,
  RULE_HIER_QUADRANT_MANIFESTATION,
  RULE_HIER_NEXT_EDGE,
  // Tool-specific: think_shadow (5)
  RULE_SHADOW_JUNGIAN,
  RULE_SHADOW_FREUDIAN,
  RULE_SHADOW_GESTALT,
  RULE_SHADOW_INTEGRAL,
  RULE_SHADOW_ARCHETYPE_MATCH,
  // Tool-specific: think_unity (5)
  RULE_UNITY_SUBSYSTEM_DIALOGUE,
  RULE_UNITY_CONTRADICTION_RESOLUTION,
  RULE_UNITY_SYNTHESIS,
  RULE_UNITY_EMERGENCE,
  RULE_UNITY_EPISTEMIC_WEIGHTING,
  // Tool-specific: think_causal (5)
  RULE_CAUSAL_RELATIONSHIP_MAPPING,
  RULE_CAUSAL_CYCLE_DETECTION,
  RULE_CAUSAL_LEVERAGE_RANKING,
  RULE_CAUSAL_ARCHETYPE_INTERVENTION,
  RULE_CAUSAL_MULTI_LOOP,
  // Tool-specific: think_cynefin (5)
  RULE_CYNEFIN_DOMAIN_CLASSIFICATION,
  RULE_CYNEFIN_RESPONSE_STRATEGY,
  RULE_CYNEFIN_BOUNDARY_ANALYSIS,
  RULE_CYNEFIN_CATEGORICAL_SHIFT,
  RULE_CYNEFIN_DECOMPOSITION,
  // Tool-specific: think_scenario (5)
  RULE_SCENARIO_GENERATION,
  RULE_SCENARIO_CONSEQUENCE_CASCADE,
  RULE_SCENARIO_PREMORTEM,
  RULE_SCENARIO_EARLY_WARNINGS,
  RULE_SCENARIO_ROBUST_STRATEGY,
  // Tool-specific: think_metacognitive (5)
  RULE_META_LADDER_AUDIT,
  RULE_META_BIAS_DETECTION,
  RULE_META_BLIND_SPOT,
  RULE_META_RECURSIVE_LOOP,
  RULE_META_RECONSTRUCTION,
  // Tool-specific: think_first_principles (5)
  RULE_FP_CLAIM_CLASSIFICATION,
  RULE_FP_SOCRATIC_INTERROGATION,
  RULE_FP_CONSTRAINT_MAPPING,
  RULE_FP_RECONSTRUCTION,
  RULE_FP_LIBERATION_ANALYSIS,
  // Tool-specific: think_navigator (5)
  RULE_NAV_DAG_CONSTRUCTION,
  RULE_NAV_PARALLEL_GROUPING,
  RULE_NAV_REPLANNING,
  RULE_NAV_TERMINATION,
  RULE_NAV_DEPENDENCY_ANALYSIS,
];

// ─── Rule Selection ──────────────────────────────────────────────────────────

/**
 * Selects the best matching grammar rule for the given context.
 *
 * Filtering priority (in order):
 * 1. Tool match — rule.tools must include ctx.toolName (or rule.tools is empty = all tools)
 * 2. Thought type match
 * 3. Mode match
 * 4. Step range match
 */
export function selectRule(ctx: CompositionContext, rules: GrammarRule[]): GrammarRule {
  const matched = rules.filter(
    (rule) =>
      // 1. Tool match: empty tools = all tools match; non-empty = must include ctx.toolName
      (!rule.tools || rule.tools.length === 0 || rule.tools.includes(ctx.toolName)) &&
      // 2. Thought type
      rule.thoughtTypes.includes(ctx.thoughtType as ThoughtType) &&
      // 3. Mode
      rule.modes.includes(ctx.mode) &&
      // 4. Step range
      ctx.stepNumber >= rule.stepRange[0] &&
      ctx.stepNumber <= rule.stepRange[1],
  );

  if (matched.length === 0) return RULE_BOUNDED_CONCLUSION;
  if (matched.length === 1) return matched[0];
  // Prefer tool-specific rules over tool-agnostic ones when both match
  const toolSpecific = matched.filter((r) => r.tools && r.tools.length > 0 && r.tools.includes(ctx.toolName));
  if (toolSpecific.length > 0) {
    return toolSpecific[ctx.stepNumber % toolSpecific.length];
  }
  return matched[ctx.stepNumber % matched.length];
}

// ─── Composition ─────────────────────────────────────────────────────────────

export function composeFromRule(rule: GrammarRule, ctx: CompositionContext): string {
  let result = rule.template;
  for (const [key, resolver] of Object.entries(rule.slots)) {
    const value = resolver(ctx);
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

export function withSubModeFrame(
  content: string,
  subMode: ReasoningSubMode,
  structure: ProblemStructure,
  stepNumber: number,
  patterns: RetrievedPatterns,
): string {
  const claim = structure.claims[stepNumber % Math.max(structure.claims.length, 1)] ?? structure.claims[0] ?? "the stated position";
  const uncertainty = structure.uncertainties[stepNumber % Math.max(structure.uncertainties.length, 1)] ?? structure.uncertainties[0] ?? "an unknown variable";
  const causalPattern = patterns.causal[stepNumber % Math.max(patterns.causal.length, 1)]?.structure;
  const assumption = patterns.assumptions[stepNumber % Math.max(patterns.assumptions.length, 1)]?.assumption
    ?? structure.implicit_assumptions[0]
    ?? "the working premise";
  const domain = structure.primary_domain ?? "a related domain";

  switch (subMode) {
    case "deductive":
      return `${content} — Reasoning: If "${claim}" holds and ${assumption} is true, the conclusion follows for step ${stepNumber}; any violation of ${uncertainty} would break the chain.`;
    case "inductive": {
      const instanceCount = patterns.causal.length;
      const counterNote = patterns.assumptions.length > 0
        ? `though ${patterns.assumptions[0]?.assumption ?? "one assumption"} warrants scrutiny`
        : "with no obvious counter-examples";
      return `${content} — Reasoning: ${instanceCount} observed causal patterns support "${claim}", ${counterNote}, strengthening the generalization at step ${stepNumber}.`;
    }
    case "abductive": {
      const mechanism = causalPattern?.mechanism ?? "the observed mechanism";
      const alternative = structure.claims[(stepNumber + 1) % Math.max(structure.claims.length, 1)] ?? "a competing explanation";
      return `${content} — Reasoning: "${claim}" best explains the evidence via ${mechanism} at step ${stepNumber}; it would be falsified if ${uncertainty} disproves ${alternative}.`;
    }
    case "analogical": {
      const matchFeature = causalPattern?.cause ?? structure.entities[0] ?? "the primary factor";
      const breakPoint = uncertainty;
      return `${content} — Reasoning: "${claim}" maps to ${domain} through shared ${matchFeature} dynamics; the analogy weakens where ${breakPoint} diverges from known cases.`;
    }
  }
}

// ─── Boilerplate Detection Gate ──────────────────────────────────────────────

const BOILERPLATE_PHRASES = [
  "taken together, the evidence supports",
  "if the general principle holds in this specific context",
  "what the system cannot see about itself",
  "a high-leverage intervention (meadows rank",
  "rests on the assumption that the underlying premise holds",
  "if the general principle holds",
  "the conclusion follows necessarily",
  "this pattern matches historical cases",
  "the best explanation is the one that accounts for",
  "this situation is structurally similar to known cases",
];

const BOILERPLATE_THRESHOLD = 0.6; // 60% of phrases flagged = boilerplate

/**
 * Detects if output text is dominated by generic boilerplate phrases.
 * Returns true if >60% of known boilerplate phrases appear in the text.
 */
export function isBoilerplate(text: string): boolean {
  const lower = text.toLowerCase();
  const matchedCount = BOILERPLATE_PHRASES.filter((phrase) =>
    lower.includes(phrase),
  ).length;
  return matchedCount / BOILERPLATE_PHRASES.length > BOILERPLATE_THRESHOLD;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function composeStepContent(params: {
  structure: ProblemStructure;
  patterns: RetrievedPatterns;
  mode: ThinkingMode;
  subMode: ReasoningSubMode;
  stepNumber: number;
  totalSteps: number;
  thoughtType: ThoughtType;
  previousOutputs: string[];
  toolName: string;
}): string {
  const ctx: CompositionContext = {
    structure: params.structure,
    patterns: params.patterns,
    stepNumber: params.stepNumber,
    totalSteps: params.totalSteps,
    mode: params.mode,
    subMode: params.subMode,
    thoughtType: params.thoughtType,
    previousOutputs: params.previousOutputs,
    toolName: params.toolName,
  };

  const rule = selectRule(ctx, ALL_RULES);
  let content = composeFromRule(rule, ctx);

  // Boilerplate gate: if output is dominated by generic phrases, return empty
  // to force tool-specific fallback templates to activate
  if (isBoilerplate(content)) {
    return "";
  }

  return withSubModeFrame(content, params.subMode, params.structure, params.stepNumber, params.patterns);
}
