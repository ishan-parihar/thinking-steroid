import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  OutputDepth,
  OutputMode,
  EpistemicStatus,
  SuggestedTool,
  FirstPrinciplesCategory,
  ThoughtType,
  ThinkingMode,
} from "../types.js";
import { FIRST_PRINCIPLES_CATEGORIES } from "../constants.js";
import { formatFirstPrinciples } from "../utils/formatters.js";
import { composeToolContent } from "../utils/content-pipeline.js";

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
 * Extracts unique claims from the problem and beliefs text.
 * Uses sentence boundary detection, deduplicates via whitespace-only normalization,
 * filters by length (10-300 chars), and pads with sub-claims if fewer than minClaims.
 */
function extractClaims(problem: string, beliefs: string, maxClaims: number, minClaims: number = 5): string[] {
  const rawSentences = [problem, beliefs]
    .join("\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length <= 300);

  const seen = new Set<string>();
  const uniqueClaims: string[] = [];

  for (const sentence of rawSentences) {
    const normalized = sentence.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      uniqueClaims.push(sentence);
    }
  }

  if (uniqueClaims.length >= maxClaims) {
    return uniqueClaims.slice(0, maxClaims);
  }

  const derivedClaims: string[] = [];
  for (const sentence of rawSentences) {
    const parts = sentence.split(/\s*(?:;\s*|\band\b|\bbut\b|\bbecause\b|\bwhich\b|\bso\b)\s*/i);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 15 && trimmed.length <= 300) {
        const normalized = trimmed.toLowerCase().replace(/\s+/g, " ").trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          if (trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?") || trimmed.length > 30) {
            derivedClaims.push(trimmed);
          }
        }
      }
    }
    if (uniqueClaims.length + derivedClaims.length >= maxClaims) {
      break;
    }
  }

  const combined = [...uniqueClaims, ...derivedClaims].slice(0, maxClaims);

  if (combined.length < minClaims) {
    const phraseClaims: string[] = [];
    for (const sentence of rawSentences) {
      const phrases = sentence.match(/[^,.!?;:]{15,150}/g) || [];
      for (const phrase of phrases) {
        const trimmed = phrase.trim();
        if (trimmed.length > 20 && trimmed.length <= 300) {
          const normalized = trimmed.toLowerCase().replace(/\s+/g, " ").trim();
          if (!seen.has(normalized)) {
            seen.add(normalized);
            phraseClaims.push(`The problem involves the observation that ${trimmed}.`);
          }
        }
      }
      if (combined.length + phraseClaims.length >= minClaims) {
        break;
      }
    }
    return [...combined, ...phraseClaims].slice(0, Math.max(maxClaims, minClaims));
  }

  return combined;
}

function generateDefaultClaims(problem: string, count: number): string[] {
  const claims: string[] = [];
  const topicMatch = problem.match(/^[\w\s,.'-]{1,60}/);
  const topic = topicMatch ? topicMatch[0].trim() : "the stated problem";

  const defaultTemplates = [
    `The situation around ${topic} involves measurable parameters and observable constraints that define the problem space.`,
    `It is obviously true that conventional wisdom about ${topic} has shaped the current approach without deliberate examination.`,
    `The team's current resources and available budget for ${topic} are limited by existing infrastructure allocations.`,
    `The industry standard for ${topic} reflects a social norm about what counts as acceptable rather than empirical evidence of effectiveness.`,
    `Any approach to ${topic} cannot exceed the fundamental limits imposed by the core requirements — this is a physical constraint, not a preference.`,
    `A valid solution to ${topic} must necessarily satisfy the core requirements, which implies that partial solutions entail systemic failure.`,
    `Everyone naturally assumes that the traditional approach to ${topic} is inherently the safest path forward.`,
    `Current technology constraints for ${topic} are limited to what is available with present tools, but this is a temporal constraint, not a permanent one.`,
    `The culture around ${topic} expects solutions to follow customary patterns rather than novel approaches that might challenge established norms.`,
    `The mathematics of ${topic} establishes fundamental boundaries that no amount of creativity or effort can violate without changing the problem itself.`,
    `The problem structure of ${topic} implies that certain solution paths are mutually exclusive — pursuing one entails abandoning another.`,
    `The domain of ${topic} contains observable facts about current state that are independent of interpretation or belief.`,
    `It is always assumed that ${topic} must follow the established pattern, but this inherited belief has never been systematically tested.`,
    `Resource constraints currently limit what can be attempted with ${topic}, yet these are organizational choices rather than universal laws.`,
    `Social expectations around ${topic} should align with conventional benchmarks, though this norm was established under different conditions.`,
    `The logical structure implies that ${topic} entails certain non-negotiable requirements — denying them creates a contradiction within the problem framework.`,
    `Observations about ${topic} reveal concrete boundaries that exist regardless of whether stakeholders acknowledge them.`,
    `The natural assumption that ${topic} follows an obvious pattern obscures the possibility that the pattern itself is the problem.`,
  ];

  for (let i = 0; i < Math.min(count, defaultTemplates.length); i++) {
    claims.push(defaultTemplates[i]);
  }

  while (claims.length < count) {
    const idx = claims.length % defaultTemplates.length;
    const variant = defaultTemplates[idx].replace(
      /the problem|this problem|${topic}/g,
      `aspect ${claims.length + 1} of ${topic}`
    );
    claims.push(variant);
  }

  return claims.slice(0, count);
}

/**
 * Classifies a claim into one of the 6 first-principles categories.
 * Uses keyword heuristics and structural analysis of the claim text.
 */
function classifyClaim(claim: string, beliefs: string): ClassifiedClaim {
  const lower = claim.toLowerCase();
  const beliefsLower = beliefs.toLowerCase();

  const scores: Record<FirstPrinciplesCategory, number> = {
    "physical-law": 0,
    "logical-necessity": 0,
    "irreducible-fact": 0,
    "inherited-assumption": 0,
    "contextual-constraint": 0,
    "social-convention": 0,
  };

  // Physical law keywords
  const physicalKeywords = [
    "impossible", "fundamental", "law", "constant", "physics", "math",
    "cannot", "violates", "thermodynam", "entropy", "gravity", "conservation",
    "quantum", "relativity", "speed of light", "energy", "mass",
  ];
  for (const kw of physicalKeywords) {
    if (lower.includes(kw)) scores["physical-law"] += 3;
  }

  // Social convention keywords
  const socialKeywords = [
    "should", "norm", "standard", "tradition", "culture", "customary",
    "expected", "convention", "custom", "etiquette", "professional",
    "appropriate", "acceptable", "taboo", "policy", "rule of thumb",
    "best practice", "industry standard", "how it's done", "society expects",
  ];
  for (const kw of socialKeywords) {
    if (lower.includes(kw)) scores["social-convention"] += 3;
  }

  // Contextual constraint keywords
  const contextualKeywords = [
    "currently", "resource", "budget", "time", "team", "limited",
    "available", "right now", "with our current", "given our",
    "limited by", "resource constraint", "budget constraint",
    "time constraint", "technical limitation", "infrastructure",
    "at this stage", "for now", "at present", "in this context",
  ];
  for (const kw of contextualKeywords) {
    if (lower.includes(kw)) scores["contextual-constraint"] += 3;
  }

  // Inherited assumption keywords
  const inheritedKeywords = [
    "always", "everyone", "never", "obviously", "naturally",
    "inherently", "intrinsic", "everyone knows", "traditionally",
    "it's understood", "conventional wisdom", "common sense",
    "that's just how", "always been", "the way things are",
    "clearly", "of course", "obvious that", "accepted that",
    "standard practice", "the norm", "typically",
  ];
  for (const kw of inheritedKeywords) {
    if (lower.includes(kw)) scores["inherited-assumption"] += 3;
  }

  // Logical necessity keywords
  const logicalKeywords = [
    "must", "necessarily", "implies", "contradiction", "follows",
    "entails", "must be", "if and only if", "tautolog", "self-evident",
    "by definition", "logically follows", "cannot both",
    "mutually exclusive",
  ];
  for (const kw of logicalKeywords) {
    if (lower.includes(kw)) scores["logical-necessity"] += 3;
  }

  // Irreducible fact: factual statements without modal language
  if (!lower.includes("should") && !lower.includes("must") && !lower.includes("could") &&
      !lower.includes("would") && !lower.includes("might") && !lower.includes("may") &&
      !lower.includes("ought") && claim.length < 120) {
    scores["irreducible-fact"] += 2;
  }

  // Check if claim appears in beliefs (indicates held belief)
  if (beliefsLower.includes(lower.substring(0, Math.min(30, lower.length)))) {
    scores["inherited-assumption"] += 1;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    scores["inherited-assumption"] += 1;
  }

  let bestCategory: FirstPrinciplesCategory = "irreducible-fact";
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as FirstPrinciplesCategory;
    }
  }

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

function generateSocraticInterrogation(
  claims: ClassifiedClaim[],
): SocraticInterrogation[] {
  return claims.map((t) => {
    const assumption = t.claim;
    const origin = generateOriginForCategory(assumption, t.category);
    const evidence = generateEvidenceForClaim(assumption, t.category);
    const liberation = generateLiberationForClaim(assumption, t.category);

    return {
      assumption,
      origin,
      evidence,
      liberation,
    };
  });
}

function generateOriginForCategory(claim: string, category: FirstPrinciplesCategory): string {
  const shortRef = claim.length > 60 ? claim.substring(0, 60) + "..." : claim;
  const domainContext = getOriginContext(claim);

  switch (category) {
    case "physical-law":
      return `This constraint traces to the scientific tradition of identifying fundamental limits — a lineage from thermodynamics to information theory that maps the boundary between what the universe permits and what it forbids. The claim "${shortRef}" sits within this centuries-old project of distinguishing physical law from engineering limitation.`;
    case "logical-necessity":
      return `This necessity emerges from the formal tradition of deductive reasoning — a lineage from Aristotelian syllogisms through Boolean algebra that identifies which conclusions follow inescapably from their premises. The claim "${shortRef}" asserts a relationship that, if the premises hold, cannot be denied without contradiction.`;
    case "social-convention":
      return `This convention was transmitted through ${domainContext} — a pattern of collective agreement that became encoded as "the way things are done" without examination of whether the original conditions still apply. The claim "${shortRef}" reflects a social contract, not a natural law.`;
    case "inherited-assumption":
      return `This assumption was inherited from ${domainContext} — accepted not through deliberate examination but through the osmotic process of cultural transmission, where unexamined beliefs pass from one generation of practitioners to the next. The claim "${shortRef}" became embedded in standard operating procedures before anyone tested its truth value.`;
    case "contextual-constraint":
      return `This constraint arises from ${domainContext} — a set of resource, time, or capability limitations that define the current operating envelope. Unlike physical laws, these constraints are contingent on specific conditions and organizational choices. The claim "${shortRef}" describes a boundary that exists within a particular context, not universally.`;
    case "irreducible-fact":
      return `This observation is grounded in direct empirical evidence — it describes a state of affairs that can be verified through measurement or observation rather than derived from theory or convention. The claim "${shortRef}" represents a raw datum of the problem space, the kind of fact that remains true regardless of how we frame or interpret it.`;
    default:
      return `The origin of "${shortRef}" requires careful tracing of its genealogy through ${domainContext} to distinguish whether it rests on empirical observation, logical derivation, or social agreement.`;
  }
}

function generateEvidenceForClaim(claim: string, category: FirstPrinciplesCategory): string {
  const lower = claim.toLowerCase();
  const isConcrete = /measure|count|time|cost|resource|team|budget|data|metric|number|percent|rate/.test(lower);

  switch (category) {
    case "physical-law": {
      const supporting = isConcrete
        ? `measurable physical parameters and established scientific constants that can be empirically verified`
        : `theoretical frameworks and mathematical proofs in physics and mathematics that establish invariant constraints`;
      const challenging = `historical precedents where apparent physical limits were later shown to be engineering constraints — such as the sound barrier or computational limits once thought insurmountable`;
      return `Supporting: ${supporting}. Challenging: ${challenging}. The key test is whether this constraint has been violated in any documented context or whether it represents a truly universal invariant.`;
    }
    case "logical-necessity": {
      const supporting = `formal logical analysis showing that the conclusion follows necessarily from the stated premises without additional assumptions`;
      const challenging = `examination of whether the premises themselves are contingent — if any premise is negotiable, the logical necessity dissolves`;
      return `Supporting: ${supporting}. Challenging: ${challenging}. The test is whether denying the claim creates a logical contradiction, or merely an uncomfortable conclusion.`;
    }
    case "social-convention": {
      const supporting = isConcrete
        ? `documented standards, policies, or industry benchmarks that explicitly codify this expectation`
        : `widespread adoption of this practice across multiple organizations or communities`;
      const challenging = `counter-examples from different cultures, industries, or time periods where the opposite convention produced equally valid or superior outcomes`;
      return `Supporting: ${supporting}. Challenging: ${challenging}. Conventions are validated by their utility, not their universality — if the convention no longer serves its purpose, it loses its claim to authority.`;
    }
    case "inherited-assumption": {
      const supporting = isConcrete
        ? `historical precedent and repeated observation of the pattern across multiple instances`
        : `collective consensus and the weight of conventional wisdom`;
      const challenging = `the absence of deliberate testing — most inherited assumptions persist not because they've been validated but because they've never been questioned`;
      return `Supporting: ${supporting}. Challenging: ${challenging}. The defining characteristic of an inherited assumption is that its evidence base is typically anecdotal rather than empirical, maintained by social proof rather than systematic verification.`;
    }
    case "contextual-constraint": {
      const supporting = isConcrete
        ? `current resource allocations, timeline data, team capacity assessments, and budget documentation`
        : `documented limitations in the current operating environment`;
      const challenging = `the distinction between fixed constraints and organizational choices — many "constraints" are actually prioritization decisions that could be revisited`;
      return `Supporting: ${supporting}. Challenging: ${challenging}. Contextual constraints are real but negotiable — the question is whether renegotiating them costs less than working within them.`;
    }
    case "irreducible-fact": {
      const supporting = isConcrete
        ? `direct measurement, observation, or data that confirms this claim independently of interpretation`
        : `the claim's structure as a simple declarative statement about an observable state of affairs`;
      const challenging = `the possibility that the observation itself is theory-laden — even "raw facts" are filtered through conceptual frameworks`;
      return `Supporting: ${supporting}. Challenging: ${challenging}. Irreducible facts are the hardest claims to challenge because they rest on direct observation, but even observations can be reframed when the interpretive lens changes.`;
    }
    default: {
      const supporting = isConcrete
        ? `empirical data and measurable indicators`
        : `logical coherence and conceptual analysis`;
      const challenging = `the possibility that the claim rests on unstated premises`;
      return `Supporting: ${supporting}. Challenging: ${challenging}.`;
    }
  }
}

function generateLiberationForClaim(claim: string, category: FirstPrinciplesCategory): string {
  const shortRef = claim.length > 50 ? claim.substring(0, 50) : claim;

  switch (category) {
    case "physical-law":
      return `If "${shortRef}" is actually not a physical law but an engineering constraint, the entire solution space opens up to approaches that work around — rather than within — the supposed limit. History shows that many "physical limits" were actually technological plateaus. The liberation here is not violating physics but recognizing that we may be confusing the map (current technology) with the territory (actual physical law).`;
    case "logical-necessity":
      return `If "${shortRef}" does not actually follow necessarily, then the logical chain holding the problem together has a weak link. This means the apparent inevitability of certain outcomes is an illusion created by accepting premises that could be rejected. The liberation is the freedom to deny a premise — a move that restructures the entire logical landscape of the problem.`;
    case "social-convention":
      return `If "${shortRef}" is a convention rather than a requirement, we immediately gain the freedom to define new criteria of success. Every convention has originators who chose it over alternatives — we can make the same choice differently. The liberation is recognizing that "how things are done" is a historical accident, not an optimal design.`;
    case "inherited-assumption":
      return `If "${shortRef}" is false, the most immediate liberation is the removal of an invisible ceiling that has been shaping solution space without anyone's awareness. Inherited assumptions act as silent filters — they eliminate entire categories of solutions before those solutions are even conceived. Discarding this assumption reveals paths that were structurally invisible while it was in place.`;
    case "contextual-constraint":
      return `If "${shortRef}" can be renegotiated, the constraint shifts from a hard boundary to a cost-benefit decision. This transforms the problem from "how do we work within these limits" to "is it worth changing these limits." The liberation is recognizing that contextual constraints are levers, not walls — they can be pulled, pushed, or removed entirely if the return justifies the effort.`;
    case "irreducible-fact":
      return `Even irreducible facts can be reframed — not by denying the fact itself, but by changing which facts we consider relevant. The liberation here is expanding the problem frame: rather than accepting "${shortRef}" as the defining constraint, we ask what larger system this fact belongs to and whether redefining the system changes the fact's significance.`;
    default:
      return `If "${shortRef}" is challenged, the solution space expands to include approaches that were previously excluded. The specific liberation depends on which category this claim actually belongs to — a misclassification itself is a source of constraint.`;
  }
}

function getOriginContext(claim: string): string {
  const lower = claim.toLowerCase();
  const words = new Set(lower.split(/\s+/));

  const domainMappings: Array<[string[], string]> = [
    [["ai", "llm", "ml", "machine learning", "neural", "model", "training", "inference", "prompt", "token"], "machine learning paradigm and capability extrapolation"],
    [["algorithm", "computational", "optimization", "complexity", "data structure"], "algorithmic tradition and computational complexity theory"],
    [["api", "microservice", "monolith", "deployment", "ci/cd", "pipeline"], "DevOps convention and architectural legacy"],
    [["database", "sql", "query", "schema", "index", "migration"], "data management orthodoxy and relational database tradition"],
    [["cloud", "aws", "azure", "gcp", "serverless", "container", "kubernetes"], "cloud infrastructure convention and vendor ecosystem"],
    [["business", "market", "profit", "revenue", "roi", "margin"], "industry norms and competitive mimicry"],
    [["startup", "scale-up", "venture", "funding", "runway", "burn rate"], "silicon valley growth-at-all-costs mythology"],
    [["education", "learn", "school", "curriculum", "pedagog", "teaching"], "educational tradition and institutional inertia"],
    [["university", "academic", "research", "publication", "peer review"], "academic publishing tradition and institutional gatekeeping"],
    [["technology", "software", "code", "program", "development", "engineering"], "engineering convention and legacy thinking"],
    [["health", "medical", "clinical", "patient", "diagnosis", "treatment"], "medical orthodoxy and evidence-based practice tradition"],
    [["diet", "nutrition", "exercise", "fitness", "wellness"], "wellness industry convention and popular health science"],
    [["social", "relationship", "family", "community", "culture", "norm"], "social conditioning and intergenerational transmission"],
    [["government", "policy", "law", "regulation", "legislation", "compliance"], "institutional precedent and bureaucratic path dependency"],
    [["finance", "banking", "investment", "trading", "portfolio", "asset"], "financial industry convention and market efficiency dogma"],
    [["crypto", "blockchain", "defi", "web3", "tokenomics"], "cryptocurrency ideology and decentralized system mythology"],
    [["resource", "infrastructure", "tool", "equipment", "facility"], "operational convention and resource management orthodoxy"],
    [["team", "management", "leadership", "agile", "scrum", "sprint"], "corporate management tradition and productivity culture"],
    [["success", "criteria", "benchmark", "evaluation", "metric", "kpi"], "performance management tradition and metric-driven culture"],
    [["approach", "conventional", "typical", "standard", "usual", "common"], "methodological convention and peer conformity"],
    [["security", "auth", "authentication", "authorization", "encryption", "vulnerability"], "cybersecurity orthodoxy and threat-modeling tradition"],
    [["privacy", "gdpr", "data protection", "consent", "surveillance"], "privacy regulation tradition and data rights movement"],
    [["sustainability", "environmental", "climate", "carbon", "green", "renewable"], "environmental movement and sustainability framework"],
    [["diversity", "inclusion", "equity", "dei", "bias", "discrimination"], "social justice movement and organizational diversity paradigm"],
    [["creativity", "design", "art", "aesthetic", "innovation"], "creative industry convention and aesthetic tradition"],
    [["marketing", "brand", "advertising", "campaign", "funnel", "conversion"], "marketing industry playbook and consumer psychology tradition"],
    [["sales", "negotiation", "closing", "pipeline", "quota"], "sales methodology tradition and revenue operations orthodoxy"],
    [["hiring", "recruit", "interview", "talent", "candidat", "onboard"], "corporate recruitment tradition and talent acquisition orthodoxy"],
    [["psychology", "mental", "therapy", "cognitive", "behavioral", "mindfulness"], "psychological research tradition and therapeutic paradigm"],
    [["philosophy", "ethics", "moral", "virtue", "duty", "consciousness"], "philosophical inquiry tradition and epistemological framework"],
    [["science", "scientific", "empirical", "hypothesis", "experiment", "theory"], "scientific method tradition and empirical research paradigm"],
    [["religion", "spiritual", "faith", "sacred", "divine", "theology"], "theological tradition and religious institutional authority"],
    [["military", "defense", "warfare", "strategy", "tactical"], "military doctrine tradition and strategic studies paradigm"],
    [["sports", "athletic", "competition", "training", "performance"], "sports science tradition and competitive performance paradigm"],
    [["media", "journalism", "news", "broadcast", "publishing"], "media industry convention and journalistic tradition"],
    [["real estate", "property", "housing", "mortgage", "rental"], "real estate industry convention and property ownership paradigm"],
    [["manufacturing", "supply chain", "logistics", "production", "factory"], "industrial engineering tradition and lean manufacturing paradigm"],
    [["agriculture", "farming", "crop", "livestock", "irrigation"], "agricultural tradition and food production paradigm"],
    [["legal", "lawyer", "litigation", "court", "contract", "liability"], "legal profession tradition and adversarial justice paradigm"],
  ];

  for (const [keywords, context] of domainMappings) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return context;
    }
  }

  // Fallback: extract key noun phrase from claim for contextual hint
  const nounPhrases = claim.match(/\b([A-Za-z]{4,})(?:\s+of\s+[a-z]+)?/g);
  if (nounPhrases && nounPhrases.length > 0) {
    return `the domain surrounding ${nounPhrases[0].toLowerCase()} and its established practice`;
  }

  return "the domain's established practice and conventional wisdom";
}

/**
 * Generates reconstruction options starting from irreducible facts and physical laws only.
 */
function generateReconstructionOptions(
  claims: ClassifiedClaim[],
  _socratic: SocraticInterrogation[],
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
  _options: ReconstructionOption[],
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
  fullText?: string;
  composeSection?: (thoughtType: ThoughtType, stepNumber: number, totalSections: number, prevOutputs: string[]) => string;
}): FirstPrinciplesDecomposition {
  const { problem_or_system, current_beliefs, decomposition_target, output_depth, output_mode: _output_mode, fullText, composeSection } = params;

  const target = decomposition_target || "Full Problem";
  const claimCount = depthToClaimCount(output_depth);
  const optionCount = depthToOptionCount(output_depth);

  const rawClaims = extractClaims(problem_or_system, current_beliefs, claimCount);
  const selectedClaims = rawClaims.length > 0 ? rawClaims : generateDefaultClaims(problem_or_system, claimCount);

  // Try composer for claim decomposition (deconstructive)
  if (composeSection && fullText) {
    const composedClaims = composeSection('deconstructive', 0, 3, []);
    if (composedClaims.length > 200) {
      const composedSentences = composedClaims.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 10);
      const seen = new Set(selectedClaims.map((c) => c.toLowerCase().replace(/[^a-z0-9\s]/g, "")));
      for (const s of composedSentences) {
        const normalized = s.toLowerCase().replace(/[^a-z0-9\s]/g, "");
        if (!seen.has(normalized) && selectedClaims.length < claimCount) {
          seen.add(normalized);
          selectedClaims.push(s);
        }
      }
    }
  }

  const claims = selectedClaims.map((c) => classifyClaim(c, current_beliefs));

  // Try composer for socratic interrogation (corrective)
  let socraticInterrogation = generateSocraticInterrogation(claims);
  if (composeSection && fullText) {
    const composedSocratic = composeSection('corrective', 1, 3, claims.map((c) => c.claim));
    if (composedSocratic.length > 200) {
      const lines = composedSocratic.split(/\n+/).filter((s: string) => s.trim().length > 10);
      socraticInterrogation = claims.map((t, idx) => {
        const lineText = lines[idx % lines.length] || "";
        return {
          assumption: t.claim,
          origin: lineText.length > 0 ? `Composer analysis: ${lineText.substring(0, 150)}...` : generateOriginForCategory(t.claim, t.category),
          evidence: lineText.length > 0 ? lineText : generateEvidenceForClaim(t.claim, t.category),
          liberation: generateLiberationForClaim(t.claim, t.category),
        };
      });
    }
  }

  const constraintMap = generateConstraintMap(claims);

  // Try composer for reconstruction options (synthetic)
  let reconstructionOptions = generateReconstructionOptions(claims, socraticInterrogation, optionCount);
  if (composeSection && fullText) {
    const composedReconstruction = composeSection('synthetic', 2, 3, [...claims.map((c) => c.claim), ...socraticInterrogation.map((s) => s.evidence)]);
    if (composedReconstruction.length > 200) {
      const sections = composedReconstruction.split(/\n\n+/).filter((s: string) => s.trim().length > 20);
      if (sections.length > 0) {
        reconstructionOptions = sections.slice(0, optionCount).map((text: string, idx: number) => ({
          title: `Composer Option ${idx + 1}`,
          description: text.trim(),
          starting_facts: claims.filter((c) => c.category === "irreducible-fact" || c.category === "physical-law").map((c) => c.claim).slice(0, 2),
          bypassed_assumptions: claims.filter((c) => c.category === "inherited-assumption").map((c) => c.claim).slice(0, 2),
        }));
      }
    }
  }

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

        // Hybrid mode: attempt content composer first, fall back to templates
        const fullText = problem_or_system + " " + current_beliefs;

        const composeSection = (thoughtType: ThoughtType, stepNumber: number, totalSections: number, prevOutputs: string[]): string => {
          return composeToolContent({
            toolName: "think_first_principles",
            text: fullText,
            initialPosition: current_beliefs,
            mode: "critical" as ThinkingMode,
            stepNumber,
            totalSteps: totalSections,
            thoughtType,
            previousOutputs: prevOutputs,
          });
        };

        const decomposition = decompose({
          problem_or_system,
          current_beliefs,
          decomposition_target,
          output_depth,
          output_mode,
          fullText,
          composeSection,
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
