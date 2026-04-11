import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  OutputDepth,
  OutputMode,
  EpistemicStatus,
  SuggestedTool,
  CynefinDomain,
  ThoughtType,
} from "../types.js";
import { CYNEFIN_RESPONSES, CHARACTER_LIMIT } from "../constants.js";
import { composeToolContent } from "../utils/content-pipeline.js";

function enforceLimit(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return text.substring(0, CHARACTER_LIMIT - 200) + "\n\n---\n*Output truncated due to size limit.*";
}

// ─── Domain Detection Engine ─────────────────────────────────────────────────

interface DomainSignal {
  domain: CynefinDomain;
  keywords: string[];
  weight: number;
}

const DOMAIN_SIGNALS: DomainSignal[] = [
  {
    domain: "clear",
    keywords: [
      "best practice", "procedure", "standard", "routine", "checklist",
      "protocol", "obvious", "clear-cut", "well-known", "established",
      "documented", "prescribed", "template", "sop", "standard operating",
      "well-understood", "predictable", "repeatable", "known solution",
      "everyone knows", "textbook", "straightforward", "simple",
      "tried and tested", "proven method", "follow the steps",
    ],
    weight: 1.0,
  },
  {
    domain: "complicated",
    keywords: [
      "expert", "analyze", "evaluate", "investigate", "diagnose",
      "requires expertise", "specialist", "multiple options", "trade-off",
      "assess", "research", "study", "compare", "good practice",
      "analysis", "investigation", "consult", "expert opinion",
      "needs analysis", "several approaches", "depends on",
      "requires judgment", "professional", "technical assessment",
      "deep dive", "thorough analysis", "feasibility",
    ],
    weight: 1.0,
  },
  {
    domain: "complex",
    keywords: [
      "experiment", "emerge", "unpredictable", "novel", "unknown",
      "uncertainty", "evolving", "adaptive", "probe", "test",
      "pattern", "unprecedented", "exploratory", "iterative",
      "safe-to-fail", "emergent", "context-dependent", "no playbook",
      "uncharted", "shifting landscape", "organic growth",
      "cultural change", "human dynamics", "feedback loop",
      "wicked problem", "interconnected", "nonlinear",
    ],
    weight: 1.0,
  },
  {
    domain: "chaotic",
    keywords: [
      "crisis", "emergency", "immediate", "urgent", "disaster",
      "collapse", "panic", "turbulent", "breakdown", "catastrophe",
      "act now", "right now", "bleeding", "fire", "out of control",
      "no time", "critical incident", "system failure", "black swan",
      "stabilize immediately", "contain", "stop the damage",
      "unraveling", "free fall", "tipping point", "meltdown",
    ],
    weight: 1.0,
  },
  {
    domain: "disorder",
    keywords: [
      "unclear", "ambiguous", "competing views", "conflicting",
      "don't know where to start", "mixed signals", "paradox",
      "contradictory", "confusion", "multiple interpretations",
      "no consensus", "disagreement", "polarized", "uncertain",
      "not sure what domain", "hard to classify", "it depends",
      "depends on who you ask", "mixed picture", "gray area",
    ],
    weight: 1.0,
  },
];

// Context modifiers that amplify or dampen specific domain signals
const CONTEXT_MODIFIERS: {
  condition: (text: string) => boolean;
  boost: Partial<Record<CynefinDomain, number>>;
}[] = [
  {
    condition: (text) => /time.*pressure|deadline|rush|hurried/i.test(text),
    boost: { chaotic: 0.15, clear: 0.05 },
  },
  {
    condition: (text) => /high.*stake|critical|consequence|risk.*high|severe/i.test(text),
    boost: { complicated: 0.1, complex: 0.1 },
  },
  {
    condition: (text) => /team|group|organization|culture|people.*dynamic/i.test(text),
    boost: { complex: 0.15, disorder: 0.1 },
  },
  {
    condition: (text) => /technical|engineering|system.*design|architecture|code/i.test(text),
    boost: { complicated: 0.15, clear: 0.05 },
  },
  {
    condition: (text) => /new.*market|startup|innovation|disrupt/i.test(text),
    boost: { complex: 0.15, chaotic: 0.05 },
  },
];

interface ClassificationResult {
  domain: CynefinDomain;
  confidence: number;
  matchingSignals: string[];
  conflictingSignals: { from: CynefinDomain; to: CynefinDomain; count: number }[];
  signalCounts: Record<CynefinDomain, number>;
}

function classifyDomain(
  situation: string,
  decisionContext: string,
  timePressure: "low" | "medium" | "high",
  stakes: "low" | "medium" | "high"
): ClassificationResult {
  const combinedText = `${situation} ${decisionContext}`.toLowerCase();
  const signalCounts: Record<CynefinDomain, number> = {
    clear: 0,
    complicated: 0,
    complex: 0,
    chaotic: 0,
    disorder: 0,
  };
  const matchingSignals: string[] = [];

  for (const signal of DOMAIN_SIGNALS) {
    for (const keyword of signal.keywords) {
      if (combinedText.includes(keyword)) {
        signalCounts[signal.domain] += signal.weight;
        matchingSignals.push(keyword);
      }
    }
  }

  for (const modifier of CONTEXT_MODIFIERS) {
    if (modifier.condition(combinedText)) {
      for (const [domain, boost] of Object.entries(modifier.boost)) {
        signalCounts[domain as CynefinDomain] += boost;
      }
    }
  }

  if (timePressure === "high") {
    signalCounts.chaotic += 0.1;
    signalCounts.clear += 0.05;
  }

  if (stakes === "high") {
    signalCounts.complicated += 0.1;
    signalCounts.complex += 0.05;
  }

  const entries = Object.entries(signalCounts) as [CynefinDomain, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [topDomain, topScore] = sorted[0];
  const secondScore = sorted[1][1];

  const conflicts: { from: CynefinDomain; to: CynefinDomain; count: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[i][1] > 0 && sorted[j][1] > 0) {
        conflicts.push({
          from: sorted[i][0],
          to: sorted[j][0],
          count: Math.round(Math.min(sorted[i][1], sorted[j][1]) * 100) / 100,
        });
      }
    }
  }

  let confidence = 0.5;
  confidence += topScore * 0.1;
  if (secondScore > 0) {
    confidence -= (secondScore / Math.max(topScore, 1)) * 0.1;
  }
  if (conflicts.length > 2) {
    confidence -= 0.05 * Math.min(conflicts.length - 2, 3);
  }

  confidence = Math.max(0.3, Math.min(0.95, confidence));
  confidence = Math.round(confidence * 100) / 100;

  return {
    domain: topDomain,
    confidence,
    matchingSignals,
    conflictingSignals: conflicts,
    signalCounts,
  };
}

// ─── Supporting Characteristics Generator ────────────────────────────────────

function generateCharacteristics(
  domain: CynefinDomain,
  situation: string,
  timePressure: string,
  stakes: string
): string[] {
  const fullText = `${situation}`;
  const composerAttempt = composeToolContent({
    toolName: "think_cynefin",
    text: fullText,
    initialPosition: situation,
    mode: "analytical",
    stepNumber: 2,
    totalSteps: 4,
    thoughtType: "analytical" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) {
    return composerAttempt.split("\n").filter((line) => line.trim().length > 0);
  }

  const baseCharacteristics: Record<CynefinDomain, string[]> = {
    clear: [
      "Cause-and-effect relationships are obvious and agreed upon by all parties",
      "Best practices or standard operating procedures already exist for this type of situation",
      "The situation is stable and predictable — patterns repeat reliably",
      "No specialized expertise is needed; anyone trained on the procedure can handle it",
      "Outcomes are highly replicable across similar contexts",
      "Decision criteria are binary or categorical — right or wrong answers exist",
      "The situation has been encountered before with consistent results",
    ],
    complicated: [
      "Multiple valid approaches exist, each with distinct trade-offs",
      "Expert analysis is required to evaluate options and recommend a path",
      "Cause-and-effect relationships exist but require investigation to uncover",
      "The situation is analyzable but not immediately obvious to non-experts",
      "Good practices (not best practices) apply — context determines the optimal choice",
      "Different experts may recommend different but equally valid solutions",
      "The problem can be broken down and solved through systematic analysis",
    ],
    complex: [
      "Cause-and-effect can only be understood in retrospect, not in advance",
      "No single expert has the answer — solutions emerge through experimentation",
      "The situation is dynamic and evolving — what works today may not work tomorrow",
      "Human dynamics, culture, or adaptive behavior play a central role",
      "Safe-to-fail probes are the appropriate way to gather information",
      "Patterns emerge from the interaction of many elements and cannot be predicted",
      "Context is critical — solutions from one setting may not transfer to another",
    ],
    chaotic: [
      "No discernible cause-and-effect patterns are visible in the current moment",
      "The situation demands immediate action — there is no time for analysis",
      "Turbulence and rapid change characterize the environment",
      "Standard procedures and expert analysis are both too slow to be useful",
      "The primary goal is to establish stability, not to understand the situation",
      "Novel responses are required — nothing from past experience directly applies",
      "Communication must be direct and unambiguous — command-and-control is appropriate",
    ],
    disorder: [
      "Multiple stakeholders hold conflicting interpretations of what is happening",
      "It is not yet clear which Cynefin domain this situation belongs to",
      "The situation contains elements that could belong to several domains simultaneously",
      "There is no consensus on what the actual problem is, let alone the solution",
      "Different parts of the situation may require entirely different response modes",
      "Decision-makers are likely falling back on their personal preferences rather than situational fit",
      "The primary risk is acting from the wrong domain framework entirely",
    ],
  };

  const characteristics = baseCharacteristics[domain];

  if (timePressure === "high") {
    characteristics.unshift(
      "High time pressure constrains the response window and limits analysis options"
    );
  }

  if (stakes === "high") {
    characteristics.unshift(
      "High stakes increase the consequence of both action and inaction"
    );
  }

  return characteristics.slice(0, 7);
}

// ─── Boundary Case Analysis (for exhaustive depth) ──────────────────────────

function generateBoundaryAnalysis(
  domain: CynefinDomain,
  situation: string
): string {
  const fullText = `${situation}`;
  const composerAttempt = composeToolContent({
    toolName: "think_cynefin",
    text: fullText,
    initialPosition: situation,
    mode: "analytical",
    stepNumber: 3,
    totalSteps: 4,
    thoughtType: "prospective" as ThoughtType,
    previousOutputs: [],
  });
  if (composerAttempt.length >= 50) return composerAttempt;

  const adjacentDomains: Record<CynefinDomain, CynefinDomain[]> = {
    clear: ["complicated", "chaotic"],
    complicated: ["clear", "complex"],
    complex: ["complicated", "chaotic"],
    chaotic: ["complex", "disorder"],
    disorder: ["complex", "chaotic"],
  };

  const adjacent = adjacentDomains[domain];
  const boundaryText: string[] = [];

  for (const adj of adjacent) {
    const adjConfig = CYNEFIN_RESPONSES[adj];
    const whatWouldShift = getBoundaryShift(domain, adj, situation);
    boundaryText.push(
      `**Boundary with ${adjConfig.domain}:**\n${whatWouldShift}`
    );
  }

  return boundaryText.join("\n\n");
}

function getBoundaryShift(
  from: CynefinDomain,
  to: CynefinDomain,
  situation: string
): string {
  const shifts: Record<string, string> = {
    "clear-to-complicated":
      "If the situation turns out to have hidden complexity — multiple valid solutions with trade-offs that aren't immediately obvious — it shifts into the Complicated domain. Watch for: expert disagreement, context-dependent outcomes, or situations where the 'standard procedure' produces unexpected results.",
    "clear-to-chaotic":
      "If the established best practice suddenly stops working — the system breaks down in an unprecedented way — the situation can collapse directly into Chaos. This is the 'cliff edge' of the Clear domain. Watch for: system failures, cascading breakdowns, or when following procedure makes things worse.",
    "complicated-to-clear":
      "If analysis reveals that what seemed complex is actually a known pattern with an established solution, the situation simplifies into Clear. This is the goal of knowledge management — converting complicated problems into clear procedures. Watch for: emergence of standard practices, consensus among experts, or repeated successful application of a single approach.",
    "complicated-to-complex":
      "If expert analysis consistently fails to predict outcomes, or if the act of analyzing changes the system being analyzed, the situation is Complex, not Complicated. Watch for: human dynamics that resist prediction, adaptive stakeholders who change behavior in response to interventions, or patterns that only make sense in retrospect.",
    "complex-to-complicated":
      "If sufficient experimentation and pattern recognition converge on reliable cause-and-effect relationships, the situation moves from Complex to Complicated. This is how complex domains mature — through accumulated learning. Watch for: emerging best practices, predictive models gaining accuracy, or experts developing reliable heuristics.",
    "complex-to-chaotic":
      "If the system's adaptive capacity is overwhelmed — feedback loops break down, coordination fails, or external shocks exceed the system's ability to absorb — Complex situations can tip into Chaos. Watch for: loss of trust, breakdown of communication channels, or rapid escalation of conflicts.",
    "chaotic-to-complex":
      "Once immediate action has established a baseline of stability, the Chaotic situation transitions to Complex — now you can probe, sense, and respond. Watch for: emergence of new patterns, people beginning to make sense of what happened, or the formation of informal coordination structures.",
    "chaotic-to-disorder":
      "If the immediate crisis passes but leaves behind confusion about what actually happened and what domain the situation is now in, it enters Disorder. Watch for: competing narratives about the crisis, disagreement about whether stability has been achieved, or analysis paralysis replacing decisive action.",
    "disorder-to-complex":
      "If decomposition reveals that most parts of the situation involve adaptive, unpredictable elements with emergent patterns, the overall classification leans toward Complex. This is the most common resolution for organizational challenges.",
    "disorder-to-chaotic":
      "If decomposition reveals that parts of the situation require immediate action to prevent further deterioration, the dominant frame is Chaotic. In Disorder, always check for Chaotic elements first — they demand priority.",
  };

  const key = `${from}-to-${to}`;
  return (
    shifts[key] ||
    `Boundary with ${to}: Monitor for shifts in predictability, available expertise, and the need for immediate action vs. deliberation.`
  );
}

// ─── Misclassification Warning Generator ─────────────────────────────────────

function generateMisclassificationWarning(
  domain: CynefinDomain,
  situation: string
): string {
  const baseWarning = CYNEFIN_RESPONSES[domain].warning_if_misclassified;

  const specificWarnings: Record<CynefinDomain, string> = {
    clear: `${baseWarning}\n\n**Specific risk for this situation:** Applying a complicated analysis framework would waste time and resources on a problem that already has a known solution. The danger is not just inefficiency — over-analysis can actually introduce errors by second-guessing proven procedures.`,
    complicated: `${baseWarning}\n\n**Specific risk for this situation:** Treating this as a Clear situation would mean applying an oversimplified best practice where nuanced expert judgment is required. The cost is suboptimal outcomes — the solution might work, but it won't be the best fit for the specific context.`,
    complex: `${baseWarning}\n\n**Specific risk for this situation:** The most common error here is treating complexity as a complicated problem — hiring experts to analyze what can only be learned through direct experimentation. This creates the illusion of progress while the actual situation continues evolving untouched by the analysis.`,
    chaotic: `${baseWarning}\n\n**Specific risk for this situation:** Any delay caused by analysis, consultation, or experimentation directly increases damage. In chaotic situations, a good-enough action taken immediately is always superior to a perfect plan developed over time.`,
    disorder: `${baseWarning}\n\n**Specific risk for this situation:** While you remain in Disorder, every decision you make reflects your personal or organizational preferences, not the situation's actual demands. A leader who defaults to command-and-control will treat everything as chaotic; one who defaults to analysis will treat everything as complicated. The first priority is classification itself.`,
  };

  return specificWarnings[domain];
}

// ─── Epistemic Status Calculator ─────────────────────────────────────────────

function calculateEpistemicStatus(confidence: number): EpistemicStatus {
  if (confidence > 0.7) return "well-supported";
  if (confidence >= 0.4) return "tentative";
  return "speculative";
}

// ─── Suggested Follow-up Calculator ──────────────────────────────────────────

function calculateSuggestedFollowups(
  domain: CynefinDomain,
  depth: OutputDepth,
  confidence: number
): SuggestedTool[] {
  const baseTools = [...CYNEFIN_RESPONSES[domain].best_tool_match] as SuggestedTool[];

  if (domain === "disorder") {
    baseTools.unshift("think_cynefin");
  }

  if (depth === "exhaustive") {
    const exhaustiveAdditions: SuggestedTool[] = [
      "think_scenario",
      "think_metacognitive",
      "think_aqal_situational",
    ];
    for (const tool of exhaustiveAdditions) {
      if (!baseTools.includes(tool)) {
        baseTools.push(tool);
      }
    }
  }

  if (confidence < 0.5 && !baseTools.includes("think_metacognitive")) {
    baseTools.unshift("think_metacognitive");
  }

  return baseTools.slice(0, depth === "exhaustive" ? 6 : 4);
}

// ─── Confidence Bar Visualization ────────────────────────────────────────────

function renderConfidenceBar(confidence: number): string {
  const filled = Math.round(confidence * 20);
  const empty = 20 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}]`;
}

// ─── Markdown Output Formatter ──────────────────────────────────────────────

function formatCynefinClassification(params: {
  situation: string;
  decisionContext: string;
  classification: ClassificationResult;
  characteristics: string[];
  timePressure: string;
  stakes: string;
  depth: OutputDepth;
  mode: OutputMode;
  knownVariables?: string;
}): string {
  const {
    situation,
    decisionContext,
    classification,
    characteristics,
    timePressure,
    stakes,
    depth,
    knownVariables,
  } = params;

  const domainConfig = CYNEFIN_RESPONSES[classification.domain];
  const epistemicStatus = calculateEpistemicStatus(classification.confidence);
  const suggestedFollowups = calculateSuggestedFollowups(
    classification.domain,
    depth,
    classification.confidence
  );

  const truncate = (s: string, max: number) =>
    s.length > max ? s.substring(0, max) + "..." : s;

  const mode = params.mode;

  const fullText = `${situation} ${decisionContext} ${knownVariables ?? ""}`;
  const toolComposerAttempt = composeToolContent({
    toolName: "think_cynefin",
    text: fullText,
    initialPosition: situation,
    mode: "analytical",
    stepNumber: 4,
    totalSteps: 4,
    thoughtType: "corrective" as ThoughtType,
    previousOutputs: [],
  });

  let output = `## Cynefin Domain Classification

**Situation:** ${truncate(situation, 120)}
**Decision Context:** ${truncate(decisionContext, 100)}

### Classification
**Domain:** ${domainConfig.domain}
**Confidence:** ${renderConfidenceBar(classification.confidence)} ${(classification.confidence * 100).toFixed(0)}%
**Time Pressure:** ${timePressure} | **Stakes:** ${stakes}
`;

  if (knownVariables) {
    output += `\n**Known Variables:** ${knownVariables}\n`;
  }

  if (mode === 'executive') {
    output += `
### Recommended Action
**Approach:** ${domainConfig.approach}
**Leadership Stance:** ${domainConfig.leadership_stance}
**Best-Matched Tools:** ${domainConfig.best_tool_match.join(", ")}

### ⚠️ Misclassification Warning
${toolComposerAttempt.length >= 50 ? toolComposerAttempt + "\n\n" + generateMisclassificationWarning(classification.domain, situation) : generateMisclassificationWarning(classification.domain, situation)}

### Meta-Analysis
Epistemic Status: ${epistemicStatus}
Suggested Follow-up: ${suggestedFollowups.join(", ")}
`;
    return output;
  }

  output += `
### Supporting Characteristics
${characteristics.map((c) => `- ${c}`).join("\n")}

### Recommended Response Pattern
**Approach:** ${domainConfig.approach}
**Leadership Stance:** ${domainConfig.leadership_stance}
**Best-Matched Tools:** ${domainConfig.best_tool_match.join(", ")}
${toolComposerAttempt.length >= 50 ? "\n### Tool Recommendations\n" + toolComposerAttempt : ""}

### ⚠️ Misclassification Warning
${toolComposerAttempt.length >= 50 ? toolComposerAttempt + "\n\n" + generateMisclassificationWarning(classification.domain, situation) : generateMisclassificationWarning(classification.domain, situation)}

### Meta-Analysis
Epistemic Status: ${epistemicStatus}
Suggested Follow-up: ${suggestedFollowups.join(", ")}
`;

  if (classification.domain === "disorder") {
    output += `
### Decomposition Strategy
Since this situation is classified as **Disorder**, the recommended action is to break it into classifiable parts:

1. **Identify distinct elements** — List each sub-situation, stakeholder concern, or decision point separately
2. **Classify each element** — Apply Cynefin classification to each part independently
3. **Route each element** — Apply the appropriate response pattern (Sense-Categorize-Respond, etc.) per domain
4. **Reassess periodically** — Elements may shift domains as actions unfold

${domainConfig.action_pattern}
`;
  }

  if (depth === "exhaustive") {
    output += `
### Boundary Analysis
The following analysis explores what would push this situation into an adjacent Cynefin domain. Monitoring these boundaries helps detect domain shifts early.

${generateBoundaryAnalysis(classification.domain, situation)}
`;
  }

  return enforceLimit(output);
}

// ─── Tool Registration ───────────────────────────────────────────────────────

const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * Registers the `think_cynefin` tool on the given MCP server.
 */
export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_cynefin",
    {
      title: "Cynefin Framework Classification",
      description:
        "Classifies situations using the Cynefin framework into Clear, Complicated, Complex, Chaotic, or Disorder domains. " +
        "Prescribes the appropriate response pattern (Sense-Categorize-Respond, Sense-Analyze-Respond, Probe-Sense-Respond, " +
        "Act-Sense-Respond, or Decompose-Classify-Route). Essential for choosing the right thinking tools for the right " +
        "situation — prevents category errors like applying best practices to complex problems or over-analyzing simple ones.\n\n" +
        "The classification is based on signal analysis of the situation description, contextual modifiers for time pressure " +
        "and stakes, and keyword matching against domain-specific indicators. Confidence scores reflect how clearly the " +
        "situation maps to a single domain.\n\n" +
        "Use this tool before any major decision to ensure your response strategy matches the actual nature of the situation. " +
        "It is especially valuable when you're unsure whether to analyze, experiment, act immediately, or follow a procedure.",
      inputSchema: z
        .object({
          situation_description: z
            .string()
            .min(30)
            .describe(
              "Description of the situation to classify. Should include context, actors, and " +
                "observable dynamics. Minimum 30 characters to ensure sufficient signal for classification."
            ),
          decision_context: z
            .string()
            .min(15)
            .describe(
              "The specific decision that needs to be made based on this classification. " +
                "What are you trying to decide or do? Minimum 15 characters."
            ),
          time_pressure: z
            .enum(["low", "medium", "high"])
            .default("medium")
            .describe(
              "How urgent the situation is. 'high' shifts classification toward chaotic/clear domains. " +
                "'low' allows for more analytical approaches."
            ),
          stakes: z
            .enum(["low", "medium", "high"])
            .default("medium")
            .describe(
              "Consequence severity of getting this decision wrong. 'high' shifts toward " +
                "complicated/complex domains due to increased need for careful analysis."
            ),
          known_variables: z
            .string()
            .optional()
            .describe(
              "Comma-separated list of known factors, variables, or constraints in the situation. " +
                "Helps refine the classification by identifying what is already understood."
            ),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard")
            .describe(
              "Controls output detail: 'essential' gives core classification only, 'standard' adds " +
                "characteristics and warnings, 'exhaustive' includes boundary analysis with adjacent domains."
            ),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output framing: 'executive' focuses on action recommendations, 'analytical' provides " +
                "full reasoning transparency, 'exploratory' emphasizes alternative interpretations."
            ),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          situation_description,
          decision_context,
          time_pressure,
          stakes,
          known_variables,
          output_depth,
          output_mode,
        } = args;

        const classification = classifyDomain(
          situation_description,
          decision_context,
          time_pressure,
          stakes
        );

        const characteristics = generateCharacteristics(
          classification.domain,
          situation_description,
          time_pressure,
          stakes
        );

        const output = formatCynefinClassification({
          situation: situation_description,
          decisionContext: decision_context,
          classification,
          characteristics,
          timePressure: time_pressure,
          stakes,
          depth: output_depth,
          mode: output_mode,
          knownVariables: known_variables,
        });

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
