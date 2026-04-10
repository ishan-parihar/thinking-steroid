import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  OutputDepth,
  OutputMode,
  EpistemicStatus,
  SuggestedTool,
  FirstPrinciplesCategory,
} from "../types.js";
import { FIRST_PRINCIPLES_CATEGORIES } from "../constants.js";
import { formatFirstPrinciples } from "../utils/formatters.js";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassifiedClaim {
  claim: string;
  category: FirstPrinciplesCategory;
  confidence: number;
  test: string;
}

interface SocraticInterrogation {
  assumption: string;
  origin: string;
  evidence: string;
  liberation: string;
}

interface ReconstructionOption {
  title: string;
  description: string;
  starting_facts: string[];
  bypassed_assumptions: string[];
}

interface ConstraintMap {
  trulyImpossible: string[];
  merelyDifficult: string[];
  actuallyFlexible: string[];
}

interface FirstPrinciplesDecomposition {
  target: string;
  claims: ClassifiedClaim[];
  socraticInterrogation: SocraticInterrogation[];
  constraintMap: ConstraintMap;
  reconstructionOptions: ReconstructionOption[];
  reconstructionBlueprint?: string[];
  epistemic_status: EpistemicStatus;
  suggested_followup: SuggestedTool[];
}

// ─── Decomposition Engine ────────────────────────────────────────────────────

function depthToClaimCount(depth: OutputDepth): number {
  switch (depth) {
    case "essential":
      return 4;
    case "standard":
      return 7;
    case "exhaustive":
      return 10;
  }
}

function depthToOptionCount(depth: OutputDepth): number {
  switch (depth) {
    case "essential":
      return 2;
    case "standard":
      return 2;
    case "exhaustive":
      return 3;
  }
}

/**
 * Extracts individual claims from the problem description and current beliefs.
 */
function extractClaims(problem: string, beliefs: string): string[] {
  const sentences = [problem, beliefs]
    .join(". ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return sentences;
}

/**
 * Classifies a claim into one of the 6 first-principles categories.
 * Uses keyword heuristics and structural analysis of the claim text.
 */
function classifyClaim(claim: string, beliefs: string): ClassifiedClaim {
  const lower = claim.toLowerCase();
  const beliefsLower = beliefs.toLowerCase();

  // Heuristic classification based on linguistic markers and content analysis
  const scores: Record<FirstPrinciplesCategory, number> = {
    "physical-law": 0,
    "logical-necessity": 0,
    "irreducible-fact": 0,
    "inherited-assumption": 0,
    "contextual-constraint": 0,
    "social-convention": 0,
  };

  // Physical law indicators
  const physicalKeywords = [
    "energy", "mass", "speed of light", "thermodynam", "entropy",
    "gravity", "conservation", "cannot exceed", "physically impossible",
    "fundamental constant", "quantum", "relativity", "mathematics",
    "logarithmic", "exponential limit", "finite resource",
  ];
  for (const kw of physicalKeywords) {
    if (lower.includes(kw)) scores["physical-law"] += 3;
  }

  // Logical necessity indicators
  const logicalKeywords = [
    "must be", "necessarily", "contradiction", "if and only if",
    "tautolog", "self-evident", "by definition", "logically follows",
    "cannot both", "mutually exclusive", "implies that",
  ];
  for (const kw of logicalKeywords) {
    if (lower.includes(kw)) scores["logical-necessity"] += 3;
  }

  // Inherited assumption indicators
  const inheritedKeywords = [
    "everyone knows", "traditionally", "it's understood", "conventional wisdom",
    "common sense", "that's just how", "always been", "the way things are",
    "naturally", "obviously", "clearly", "of course", "obvious that",
    "accepted that", "standard practice", "the norm", "typically",
  ];
  for (const kw of inheritedKeywords) {
    if (lower.includes(kw)) scores["inherited-assumption"] += 3;
  }

  // Social convention indicators
  const socialKeywords = [
    "social norm", "etiquette", "culture", "society expects",
    "professional", "appropriate", "acceptable", "taboo",
    "convention", "custom", "tradition", "policy", "rule of thumb",
    "best practice", "industry standard", "how it's done",
  ];
  for (const kw of socialKeywords) {
    if (lower.includes(kw)) scores["social-convention"] += 3;
  }

  // Contextual constraint indicators
  const contextualKeywords = [
    "currently", "right now", "with our current", "given our",
    "limited by", "resource constraint", "budget", "time constraint",
    "technical limitation", "infrastructure", "at this stage",
    "for now", "at present", "in this context",
  ];
  for (const kw of contextualKeywords) {
    if (lower.includes(kw)) scores["contextual-constraint"] += 3;
  }

  // Irreducible fact: short, concrete, observation-like claims
  if (claim.length < 80 && !lower.includes("should") && !lower.includes("must") && !lower.includes("because")) {
    scores["irreducible-fact"] += 2;
  }

  // Check if claim appears verbatim in beliefs (indicates it's a held belief, more likely assumption)
  if (beliefsLower.includes(lower.substring(0, Math.min(30, lower.length)))) {
    scores["inherited-assumption"] += 1;
  }

  // If no strong signal, default based on claim structure
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    // Default classification based on claim properties
    if (claim.includes("because") || claim.includes("therefore") || claim.includes("so ")) {
      scores["irreducible-fact"] += 1;
    } else if (claim.includes("should") || claim.includes("need") || claim.includes("require")) {
      scores["inherited-assumption"] += 1;
    } else if (claim.includes("cannot") || claim.includes("impossible") || claim.includes("limit")) {
      scores["contextual-constraint"] += 1;
    } else {
      scores["irreducible-fact"] += 1;
    }
  }

  // Select the highest-scoring category
  let bestCategory: FirstPrinciplesCategory = "irreducible-fact";
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as FirstPrinciplesCategory;
    }
  }

  // Confidence based on signal strength
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = maxScore > 0 ? Math.min(0.95, 0.4 + (maxScore / totalScore) * 0.55) : 0.45;

  const categoryDef = FIRST_PRINCIPLES_CATEGORIES[bestCategory];

  return {
    claim,
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    test: categoryDef.test,
  };
}

/**
 * Generates Socratic interrogation for inherited assumptions and social conventions.
 */
function generateSocraticInterrogation(
  claims: ClassifiedClaim[],
): SocraticInterrogation[] {
  const targets = claims.filter(
    (c) => c.category === "inherited-assumption" || c.category === "social-convention",
  );

  return targets.map((t) => {
    const assumption = t.claim;

    const originTemplates = [
      `This belief likely originates from ${getOriginContext(assumption)} — a pattern transmitted through cultural osmosis rather than deliberate examination.`,
      `This assumption appears to have been inherited from ${getOriginContext(assumption)}, accepted without the scrutiny we would apply to a novel claim.`,
      `The genealogy of this belief traces to ${getOriginContext(assumption)}, where it was encoded into common practice before anyone asked whether it was true.`,
    ];

    const evidenceTemplates = [
      `Supporting evidence: ${getSupportingEvidence(assumption)}. Contradicting evidence: ${getContradictingEvidence(assumption)}.`,
      `The case for this belief rests on ${getSupportingEvidence(assumption)}, but ${getContradictingEvidence(assumption)} suggests a more complex picture.`,
    ];

    const liberationTemplates = [
      `If this assumption is false, we immediately gain the freedom to ${getLiberationOutcome(assumption)}. This opens solution spaces that were invisible while the assumption held.`,
      `Removing this constraint reveals that ${getLiberationOutcome(assumption)} becomes not only possible but potentially optimal. The assumption was acting as a hidden ceiling.`,
    ];

    return {
      assumption,
      origin: pickByHash(originTemplates, assumption + "origin"),
      evidence: pickByHash(evidenceTemplates, assumption + "evidence"),
      liberation: pickByHash(liberationTemplates, assumption + "liberation"),
    };
  });
}

function getOriginContext(claim: string): string {
  const lower = claim.toLowerCase();
  if (lower.includes("business") || lower.includes("market") || lower.includes("profit") || lower.includes("cost"))
    return "industry norms and competitive mimicry";
  if (lower.includes("education") || lower.includes("learn") || lower.includes("school"))
    return "educational tradition and institutional inertia";
  if (lower.includes("technology") || lower.includes("software") || lower.includes("code") || lower.includes("system"))
    return "engineering convention and legacy thinking";
  if (lower.includes("health") || lower.includes("medical") || lower.includes("diet") || lower.includes("exercise"))
    return "medical orthodoxy and health folklore";
  if (lower.includes("social") || lower.includes("relationship") || lower.includes("family") || lower.includes("people"))
    return "social conditioning and intergenerational transmission";
  if (lower.includes("government") || lower.includes("policy") || lower.includes("law") || lower.includes("regulation"))
    return "institutional precedent and bureaucratic path dependency";
  return "historical precedent and cultural transmission";
}

function getSupportingEvidence(claim: string): string {
  const lower = claim.toLowerCase();
  if (lower.includes("cost") || lower.includes("expensive") || lower.includes("budget"))
    return "historical cost data and current market prices";
  if (lower.includes("time") || lower.includes("slow") || lower.includes("long"))
    return "observed timelines from past iterations";
  if (lower.includes("risk") || lower.includes("danger") || lower.includes("unsafe"))
    return "documented failure cases and safety records";
  if (lower.includes("quality") || lower.includes("standard") || lower.includes("professional"))
    return "industry benchmarks and certification requirements";
  return "anecdotal experience and collective consensus";
}

function getContradictingEvidence(claim: string): string {
  const lower = claim.toLowerCase();
  if (lower.includes("impossible") || lower.includes("cannot"))
    return "edge cases and breakthrough examples that violated the same constraint";
  if (lower.includes("always") || lower.includes("never"))
    return "counter-examples from different contexts or time periods";
  if (lower.includes("everyone") || lower.includes("all") || lower.includes("nobody"))
    return "outliers and dissenters who achieved different results";
  if (lower.includes("should") || lower.includes("must") || lower.includes("need"))
    return "alternative approaches that bypass the assumed requirement";
  return "isolated cases where the pattern did not hold under scrutiny";
}

function getLiberationOutcome(claim: string): string {
  const lower = claim.toLowerCase();
  if (lower.includes("cost") || lower.includes("expensive") || lower.includes("budget"))
    return "restructuring the cost basis entirely rather than optimizing within it";
  if (lower.includes("time") || lower.includes("slow") || lower.includes("long"))
    return "radically compressing timelines through parallel rather than sequential approaches";
  if (lower.includes("risk") || lower.includes("danger"))
    return "reframing the risk model to address root causes rather than managing symptoms";
  if (lower.includes("quality") || lower.includes("standard"))
    return "redefining quality criteria from first principles rather than matching existing benchmarks";
  if (lower.includes("technology") || lower.includes("system"))
    return "architecting from the ground up without legacy constraints";
  return "exploring the full space of possibilities without this artificial constraint";
}

function pickByHash(templates: string[], seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return templates[Math.abs(hash) % templates.length];
}

/**
 * Generates reconstruction options starting from irreducible facts and physical laws only.
 */
function generateReconstructionOptions(
  claims: ClassifiedClaim[],
  socratic: SocraticInterrogation[],
  count: number,
): ReconstructionOption[] {
  const facts = claims.filter(
    (c) => c.category === "irreducible-fact" || c.category === "physical-law" || c.category === "logical-necessity",
  );
  const assumptions = claims.filter(
    (c) => c.category === "inherited-assumption" || c.category === "social-convention",
  );
  const constraints = claims.filter(
    (c) => c.category === "contextual-constraint",
  );

  const factList = facts.map((f) => f.claim);
  const assumptionList = assumptions.map((a) => a.claim);

  const optionTemplates: ReconstructionOption[] = [
    {
      title: "Ground-Up Reconstruction",
      description: `Start exclusively from the ${factList.length} identified irreducible fact(s) and physical law(s), discarding all ${assumptionList.length} inherited assumption(s). Build a solution that satisfies only the hard constraints, treating everything else as negotiable. This approach typically reveals that the perceived difficulty of the problem was inflated by conventional assumptions that are not actually required.`,
      starting_facts: factList.length > 0 ? factList.slice(0, 3) : ["No irreducible facts identified — the entire problem space may be constructed from assumptions."],
      bypassed_assumptions: assumptionList.length > 0 ? assumptionList.slice(0, 3) : ["No inherited assumptions identified to bypass."],
    },
    {
      title: "Constraint Relaxation Approach",
      description: `Take the current approach and systematically relax each contextual constraint (${constraints.map((c) => c.claim).slice(0, 2).join("; ") || "identified constraints"}). For each relaxed constraint, explore what solution becomes available. The goal is not to ignore real constraints but to distinguish between 'this is hard because the universe says so' and 'this is hard because we organized around a particular convention.'`,
      starting_facts: [...factList.slice(0, 2), ...constraints.map((c) => c.claim).slice(0, 1)],
      bypassed_assumptions: assumptionList.length > 0 ? [assumptionList[0]] : ["Assumption set empty"],
    },
    {
      title: "Inversion Method",
      description: `Instead of asking 'how do we solve this problem,' ask 'what would make this problem trivially easy?' Then work backward from that state to identify which assumptions are preventing us from creating those conditions. This inversion reveals that many 'hard' problems are hard only because we accepted a particular framing that made the solution space small.`,
      starting_facts: factList.slice(0, 2),
      bypassed_assumptions: assumptionList.slice(0, 3),
    },
  ];

  return optionTemplates.slice(0, count);
}

/**
 * Generates the constraint map separating truly impossible from merely difficult.
 */
function generateConstraintMap(claims: ClassifiedClaim[]): ConstraintMap {
  return {
    trulyImpossible: claims
      .filter((c) => c.category === "physical-law" || c.category === "logical-necessity")
      .map((c) => c.claim),
    merelyDifficult: claims
      .filter((c) => c.category === "contextual-constraint" || c.category === "social-convention")
      .map((c) => c.claim),
    actuallyFlexible: claims
      .filter((c) => c.category === "inherited-assumption")
      .map((c) => c.claim),
  };
}

/**
 * Determines epistemic status based on claim distribution.
 */
function determineEpistemicStatus(claims: ClassifiedClaim[]): EpistemicStatus {
  const hardConstraints = claims.filter(
    (c) => c.category === "physical-law" || c.category === "logical-necessity",
  ).length;
  const assumptions = claims.filter(
    (c) => c.category === "inherited-assumption",
  ).length;
  const total = claims.length;

  if (total === 0) return "speculative";

  const hardRatio = hardConstraints / total;
  const assumptionRatio = assumptions / total;

  if (hardRatio > 0.5) return "well-supported";
  if (assumptionRatio > 0.5) return "speculative";
  return "tentative";
}

/**
 * Generates a step-by-step reconstruction blueprint for exhaustive depth.
 */
function generateReconstructionBlueprint(
  claims: ClassifiedClaim[],
  constraintMap: ConstraintMap,
  options: ReconstructionOption[],
): string[] {
  return [
    `Step 1 — Inventory: List every element of the current approach. There are ${claims.length} distinct claims identified in this analysis. Document each one with its current justification.`,
    `Step 2 — Classification: Tag each claim using the 6 first-principles categories. ${constraintMap.trulyImpossible.length} claim(s) are truly impossible to violate (physical/logical). ${constraintMap.actuallyFlexible.length} claim(s) are inherited assumptions with no empirical basis. ${constraintMap.merelyDifficult.length} claim(s) are contextual or conventional constraints.`,
    `Step 3 — Elimination: Remove every inherited assumption and social convention from the design. What remains is the irreducible problem skeleton. This is typically much smaller than expected.`,
    `Step 4 — Ground-Up Design: Starting from the remaining irreducible facts and physical laws only, design a solution that satisfies only these constraints. Do not reintroduce any eliminated assumption without explicit justification.`,
    `Step 5 — Constraint Testing: For each contextual constraint that was retained, ask: 'Could this be solved with more resources, different technology, or organizational change?' If yes, mark it as a solvable engineering problem, not a fundamental limitation.`,
    `Step 6 — Validation: Compare the ground-up design against the original approach. Where do they differ? Each difference traces to an assumption that was challenged. Document whether each assumption was correctly challenged or should be reinstated.`,
    `Step 7 — Iteration: The first reconstruction will feel wrong because it violates convention. This discomfort is the signal that the process is working. Iterate until the design feels natural from first principles, even if it still feels unconventional.`,
    `Step 8 — Implementation: Build the first-principles design as a prototype. The proof is not in the argument but in the artifact. Test it against reality and measure outcomes against the conventional approach.`,
  ];
}

/**
 * Main decomposition function.
 */
function decompose(params: {
  problem_or_system: string;
  current_beliefs: string;
  decomposition_target?: string;
  output_depth: OutputDepth;
  output_mode: OutputMode;
}): FirstPrinciplesDecomposition {
  const { problem_or_system, current_beliefs, decomposition_target, output_depth, output_mode } = params;

  const target = decomposition_target || "Full Problem";
  const claimCount = depthToClaimCount(output_depth);
  const optionCount = depthToOptionCount(output_depth);

  const rawClaims = extractClaims(problem_or_system, current_beliefs);
  const selectedClaims = rawClaims.slice(0, claimCount);

  // Pad with derived claims if not enough sentences found
  while (selectedClaims.length < claimCount) {
    const idx = selectedClaims.length;
    selectedClaims.push(
      `The approach to "${problem_or_system.substring(0, 60)}" assumes that current methods are adequate for the challenge at hand.`,
    );
  }

  const claims = selectedClaims.map((c) => classifyClaim(c, current_beliefs));
  const socraticInterrogation = generateSocraticInterrogation(claims);
  const constraintMap = generateConstraintMap(claims);
  const reconstructionOptions = generateReconstructionOptions(claims, socraticInterrogation, optionCount);

  const epistemic_status = determineEpistemicStatus(claims);

  const suggested_followup: SuggestedTool[] = ["think_metacognitive", "think_causal"];
  if (output_depth === "exhaustive") {
    suggested_followup.push("think_sequential");
  }

  const reconstructionBlueprint =
    output_depth === "exhaustive"
      ? generateReconstructionBlueprint(claims, constraintMap, reconstructionOptions)
      : undefined;

  return {
    target,
    claims,
    socraticInterrogation,
    constraintMap,
    reconstructionOptions,
    reconstructionBlueprint,
    epistemic_status,
    suggested_followup,
  };
}

// ─── Tool Registration ───────────────────────────────────────────────────────

const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * Registers the `think_first_principles` tool on the given MCP server.
 */
export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_first_principles",
    {
      title: "First Principles Decomposition",
      description:
        "Decomposes problems into irreducible facts, separates inherited assumptions from bedrock constraints, " +
        "and generates reconstruction options from first principles. Based on Socratic questioning and Elon Musk's " +
        "reasoning approach. Best for breaking free from analogy-based reasoning, challenging inherited assumptions, " +
        "and identifying what is truly impossible vs. merely conventional.\n\n" +
        "Claims are classified into 6 categories: irreducible-fact (atomic observations), inherited-assumption " +
        "(unexamined beliefs from culture/tradition), contextual-constraint (current but not universal limits), " +
        "physical-law (fundamental constraints), social-convention (collective agreements, not necessities), " +
        "and logical-necessity (conclusions that follow necessarily from premises).\n\n" +
        "Socratic interrogation applies 3 levels of questioning to each inherited assumption and social convention: " +
        "origin tracing, evidence testing, and liberation analysis (what becomes possible if the assumption is false).\n\n" +
        "Use this tool when you need to break free from conventional thinking, challenge deeply held assumptions, " +
        "or rebuild a solution from the ground up based only on what is actually true.",
      inputSchema: z
        .object({
          problem_or_system: z
            .string()
            .min(20)
            .describe(
              "The problem, system, or assumption set to decompose. " +
                "Should be specific enough to enable focused decomposition but broad enough to contain multiple claims and assumptions."
            ),
          current_beliefs: z
            .string()
            .min(15)
            .describe(
              "What is currently believed to be true about this problem. " +
                "These beliefs will be decomposed, classified, and interrogated. " +
                "Include both explicit beliefs and implicit assumptions you want challenged."
            ),
          decomposition_target: z
            .string()
            .optional()
            .describe(
              "Specific aspect to focus the decomposition on. " +
                "If omitted, the entire problem will be decomposed."
            ),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard")
            .describe(
              "Controls the depth of decomposition: 'essential' (4 claims, 2 options) for quick assessment, " +
                "'standard' (7 claims, 2 options) for thorough analysis, 'exhaustive' (10 claims, 3 options + blueprint) for comprehensive examination."
            ),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output presentation mode: 'executive' for concise summaries, " +
                "'analytical' for full detailed output (default), 'exploratory' for detailed output with open questions."
            ),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          problem_or_system,
          current_beliefs,
          decomposition_target,
          output_depth,
          output_mode,
        } = args;

        const decomposition = decompose({
          problem_or_system,
          current_beliefs,
          decomposition_target,
          output_depth,
          output_mode,
        });

        const markdown_output = formatFirstPrinciples(
          problem_or_system,
          decomposition,
          output_mode,
        );

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
