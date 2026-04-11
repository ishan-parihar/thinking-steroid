import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  OutputDepth,
  OutputMode,
  EpistemicStatus,
  SuggestedTool,
  CognitiveBias,
  LadderOfInferenceStep,
  ThoughtType,
} from "../types.js";
import { COGNITIVE_BIASES, LADDER_OF_INFERENCE_STEPS, CHARACTER_LIMIT } from "../constants.js";
import { composeToolContent, getStructureForText } from "../utils/content-pipeline.js";
import type { ThinkingMode } from "../types.js";

function enforceLimit(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return text.substring(0, CHARACTER_LIMIT - 200) + "\n\n---\n*Output truncated due to size limit.*";
}

// ─── Bias Detection Engine ───────────────────────────────────────────────────

interface BiasSignal {
  keywords: string[];
  patterns: RegExp[];
}

const BIAS_SIGNALS: Record<CognitiveBias, { keywords: string[]; patterns: RegExp[] }> = {
  "confirmation-bias": {
    keywords: [
      "proves i was right", "confirms my belief", "as i expected", "i knew it",
      "obviously", "clearly supports", "everyone knows", "disproves the other side",
      "ignore the noise", "only relevant data", "the evidence speaks for itself",
    ],
    patterns: [
      /ignoring?\s+(any\s+)?(evidence|data|feedback|criticism|dissent)/i,
      /dismiss(ed|es|ing)?\s+(contradictory|opposing|conflicting|negative)/i,
      /only\s+(looked|considered|focused|saw)\s+(at\s+)?(what|evidence|data)\s+(supports|confirms|agrees)/i,
      /everything\s+(points?|shows?|indicates?)\s+to\s+(the\s+)?same\s+(conclusion|answer|result)/i,
    ],
  },
  anchoring: {
    keywords: [
      "initial estimate", "first number", "starting point", "baseline figure",
      "original assessment", "first impression", "the initial data showed",
    ],
    patterns: [
      /based\s+on\s+(the\s+)?(first|initial|original)\s+(number|figure|estimate|data|information)/i,
      /adjust(ed|ing)?\s+(slightly|a\s+bit|somewhat)\s+from\s+(the\s+)?(initial|first|starting)/i,
      /the\s+(first|initial)\s+(thing|data|number)\s+i\s+saw\s+was/i,
    ],
  },
  "availability-heuristic": {
    keywords: [
      "recently i saw", "just happened", "vivid example", "memorable case",
      "standout example", "striking case", "everyone's talking about",
      "in the news", "high profile", "famous example",
    ],
    patterns: [
      /(recently|just)\s+(saw|heard|read|witnessed|experienced).*(example|case|incident)/i,
      /can\s+(easily|readily)\s+think\s+of\s+(many|several|examples)/i,
      /(remember|recall)\s+(the\s+)?(famous|well.?known|notorious|vivid)/i,
    ],
  },
  "survivorship-bias": {
    keywords: [
      "they all succeeded", "winners", "successful companies", "top performers",
      "best practices from leaders", "what the best do", "look at who made it",
    ],
    patterns: [
      /look(ing)?\s+at\s+(the\s+)?(successful|winning|top|best|leading)/i,
      /what\s+(made|separates)\s+(them|the\s+)?(winners|successes|survivors)/i,
      /(studied|analyzed|learned\s+from)\s+(the\s+)?(most\s+)?(successful|best|top)/i,
      /they\s+(all|every)\s+(succeeded|made\s+it|won|survived)\s+by/i,
    ],
  },
  "sunk-cost-fallacy": {
    keywords: [
      "already invested", "we've come too far", "too much to quit",
      "past investment", "resources already spent", "we can't waste",
      "years of work", "can't start over", "we've built",
    ],
    patterns: [
      /(already|so\s+much)\s+(invested|spent|committed|put\s+into)/i,
      /(can't|cannot|shouldn't|won't)\s+(quit|abandon|start\s+over|waste)\s+(all\s+)?(the\s+)?(time|money|effort|work|resources)/i,
      /(we've|i've)\s+(already|been)\s+(spent|invested|worked).*(so|this\s+long|this\s+far)/i,
      /too\s+(much|far|late)\s+to\s+(quit|stop|turn\s+back)/i,
    ],
  },
  "dunning-kruger": {
    keywords: [
      "it's simple", "anyone can", "obviously", "straightforward",
      "no expert needed", "common sense", "self-taught", "I figured it out quickly",
    ],
    patterns: [
      /(it'?s|this\s+is)\s+(really\s+)?(simple|easy|straightforward|obvious)/i,
      /(don'?t|doesn'?t)\s+(really|even)\s+need\s+(an?\s+)?(expert|specialist|professional)/i,
      /(i|we)\s+(quickly|easily|immediately)\s+(understood|figured\s+out|mastered|learned)/i,
      /after\s+(a\s+)?(few\s+)?(minutes?|hours?|days?)\s+(i|we)\s+(knew|understood|got\s+it)/i,
    ],
  },
  "planning-fallacy": {
    keywords: [
      "should only take", "realistic timeline", "we can deliver by",
      "optimistic estimate", "best case", "if everything goes well",
    ],
    patterns: [
      /should\s+(only\s+)?(take|need|be)\s+/i,
      /(timeline|estimate|schedule)\s+(assumes?|is\s+based\s+on)\s+(everything\s+)?(going\s+)?well/i,
      /(we'?ll|we\s+can)\s+(easily|definitely|certainly)\s+(finish|deliver|complete)\s+by/i,
      /no\s+(major|significant|serious)\s+(risks|obstacles|issues)\s+foreseen/i,
    ],
  },
  "status-quo-bias": {
    keywords: [
      "we've always done it this way", "if it ain't broke", "why change",
      "current approach", "existing system", "the way things are",
    ],
    patterns: [
      /(we'?ve|always)\s+(done|used|worked)\s+(it\s+)?(this\s+)?way/i,
      /if\s+(it\s+)?(ain'?t|isn'?t)\s+(broke|broken)/i,
      /(why|no\s+reason\s+to)\s+(change|switch|alter|modify)/i,
      /(current|existing|present)\s+(approach|system|method|process)\s+(works|has\s+worked|is\s+working)/i,
    ],
  },
  "framing-effect": {
    keywords: [
      "framed as", "presented as", "the way it's put", "worded as",
      "90% success", "10% failure", "gain frame", "loss frame",
    ],
    patterns: [
      /depending\s+on\s+(how\s+)?(it'?s|we)\s+(frame|present|word|describe)/i,
      /(viewed|seen|presented)\s+as\s+(a\s+)?(gain|loss|opportunity|risk)/i,
    ],
  },
  "hindsight-bias": {
    keywords: [
      "it was inevitable", "should have seen it coming", "obvious in retrospect",
      "looking back", "with hindsight", "clearly was going to",
    ],
    patterns: [
      /(was|were)\s+(always|bound|going|destined)\s+to/i,
      /(should|could)\s+(have|ve)\s+(seen|known|predicted)/i,
      /(in\s+)?(retrospect|hindsight),?\s+(it|the)\s+(was|became)/i,
      /(obvious|clear|apparent)\s+(in\s+)?(retrospect|hindsight|afterward)/i,
    ],
  },
  "optimism-bias": {
    keywords: [
      "best case scenario", "things will work out", "likely to succeed",
      "low risk", "minimal downside", "upside is huge",
    ],
    patterns: [
      /things?\s+(will|should)\s+(work\s+out|go\s+well|turn\s+out\s+fine)/i,
      /(unlikely|low\s+probability|minimal)\s+(risk|chance\s+of\s+failure|downside)/i,
      /(best.?case|optimistic)\s+(scenario|projection|estimate|outcome)/i,
      /everything\s+(points?\s+)?to\s+(success|a\s+positive\s+outcome)/i,
    ],
  },
  "loss-aversion": {
    keywords: [
      "can't afford to lose", "risk losing", "protect what we have",
      "too risky", "not worth the gamble", "better safe than sorry",
    ],
    patterns: [
      /can'?t\s+(afford|risk)\s+(to\s+)?lose/i,
      /(protect|defend)\s+(what\s+)?we\s+(have|built)/i,
      /better\s+(to|safe)\s+(keep|stay|hold)\s+(than\s+)?(risk|gamble)/i,
      /the\s+(cost|pain|impact)\s+of\s+(losing|a\s+loss)\s+(outweighs|exceeds|is\s+worse)/i,
    ],
  },
  "fundamental-attribution-error": {
    keywords: [
      "that's just who they are", "their nature", "personality trait",
      "they always", "they never", "typical of them",
    ],
    patterns: [
      /(it'?s|that'?s)\s+(just|simply)\s+(their|his|her)\s+(nature|personality|character|way)/i,
      /they\s+(always|never)\s+\w+/i,
      /(typical|classic)\s+(of|for)\s+(them|him|her|that\s+(person|group))/i,
      /(it'?s|they'?re)\s+((in)?competent|lazy|selfish|greedy|dishonest)/i,
    ],
  },
  groupthink: {
    keywords: [
      "everyone agrees", "consensus", "team alignment", "no dissent",
      "we're all on the same page", "unanimous", "no one disagreed",
    ],
    patterns: [
      /(everyone|the\s+whole\s+team|all\s+of\s+us)\s+(agrees?|agreed|is\s+aligned)/i,
      /(no\s+one|nobody)\s+(disagreed|objected|raised\s+concerns)/i,
      /(unanimous|consensus|full\s+alignment)/i,
      /we'?re\s+all\s+(on\s+the\s+same\s+page|in\s+agreement)/i,
    ],
  },
  "bandwagon-effect": {
    keywords: [
      "industry standard", "everyone is doing it", "the trend",
      "going with the flow", "majority opinion", "most companies",
    ],
    patterns: [
      /(everyone|all\s+the\s+(top|major|leading))\s+(is|are)\s+(doing|using|adopting)/i,
      /(industry\s+standard|best\s+practice|the\s+norm)/i,
      /(majority|most)\s+(of\s+)?(companies|people|organizations|teams)\s+(do|have|are)/i,
      /the\s+(trend|momentum|movement)\s+is\s+(clear|toward|moving)/i,
    ],
  },
  "false-consensus": {
    keywords: [
      "obviously everyone thinks", "naturally", "of course",
      "any reasonable person", "common sense tells us",
    ],
    patterns: [
      /(obviously|clearly|naturally|of\s+course),?\s+(everyone|people|most\s+people)/i,
      /any\s+(reasonable|sensible|rational)\s+(person|team|organization)/i,
      /(it'?s|we)?re\s+(clear|obvious)\s+(that\s+)?(everyone|most\s+people)/i,
    ],
  },
  "recency-effect": {
    keywords: [
      "latest data", "most recent", "just happened", "this week",
      "right now", "current situation", "latest trend",
    ],
    patterns: [
      /(the\s+)?(latest|most\s+recent)\s+(data|information|event|trend|development)/i,
      /(just|recently|this\s+(week|month|quarter))\s+(happened|occurred|showed|revealed)/i,
      /(right\s+now|currently|at\s+present)\s+we'?re\s+seeing/i,
    ],
  },
  "authority-bias": {
    keywords: [
      "the expert says", "according to the study", "research shows",
      "the CEO decided", "the data proves", "the report concludes",
    ],
    patterns: [
      /(the\s+)?(expert|authority|CEO|leader|professor|study|report)\s+(says?|showed?|found|concluded)/i,
      /research\s+(shows?|indicates?|proves?|confirms)/i,
      /(because|since)\s+(the\s+)?(data|study|expert|authority)/i,
    ],
  },
  "illusion-of-validity": {
    keywords: [
      "the data is clear", "pattern is obvious", "highly predictive",
      "strong signal", "the trend is undeniable", "can't be wrong",
    ],
    patterns: [
      /(the\s+)?(data|pattern|signal|trend)\s+is\s+(clear|obvious|undeniable|unmistakable)/i,
      /(highly|very|extremely)\s+(predictive|reliable|accurate|strong)/i,
      /can('?t|not)?\s+(be|possibly)\s+wrong/i,
      /(the\s+)?(evidence|results)\s+(speak|talk)\s+(for\s+)?themselves/i,
    ],
  },
  "narrative-fallacy": {
    keywords: [
      "the story goes", "it all makes sense now", "connects the dots",
      "fits perfectly", "clear narrative", "tells us that",
      "the pattern emerged", "the trajectory",
    ],
    patterns: [
      /(it\s+)?all\s+(makes\s+sense|fits|falls\s+into\s+place)\s+(now|in\s+retrospect)/i,
      /(the\s+)?(story|narrative|tale)\s+(goes|suggests|shows)/i,
      /connect(s|ed)?\s+(the\s+)?dots/i,
      /(fits|fit)\s+(perfectly|neatly|nicely)\s+(into\s+)?(the\s+)?(pattern|story|narrative)/i,
      /a\s+(clear|coherent|compelling)\s+(narrative|story|arc|trajectory)/i,
    ],
  },
};

interface DetectedBias {
  bias: CognitiveBias;
  likelihood: "high" | "medium" | "low";
  evidence: string;
  detection_question: string;
  mitigation: string;
}

function detectBiases(
  reasoningChain: string,
  conclusion: string,
  fullText?: string,
  composeSection?: (thoughtType: ThoughtType, stepNumber: number, totalSections: number, prevOutputs: string[]) => string,
): DetectedBias[] {
  const text = fullText ?? `${reasoningChain} ${conclusion}`;
  const composerAttempt = composeSection
    ? composeSection("corrective", 2, 5, [])
    : composeToolContent({
        toolName: "think_metacognitive",
        text,
        initialPosition: conclusion,
        mode: "critical" as ThinkingMode,
        stepNumber: 2,
        totalSteps: 5,
        thoughtType: "corrective" as ThoughtType,
        previousOutputs: [],
      });
  if (composerAttempt.length >= 50) {
    return [{
      bias: "confirmation-bias",
      likelihood: "medium",
      evidence: `Composer analysis: ${composerAttempt.substring(0, 200)}`,
      detection_question: "Am I selectively attending to data that confirms my pre-existing beliefs?",
      mitigation: "Deliberately seek disconfirming evidence and consider alternative interpretations.",
    }];
  }

  const combined = `${reasoningChain}\n${conclusion}`.toLowerCase();
  const detected: DetectedBias[] = [];
  const biasKeys = Object.keys(COGNITIVE_BIASES) as CognitiveBias[];

  for (const biasKey of biasKeys) {
    const signals = BIAS_SIGNALS[biasKey];
    const biasInfo = COGNITIVE_BIASES[biasKey];
    let keywordHits = 0;
    let patternHits = 0;
    const matchedEvidence: string[] = [];

    for (const kw of signals.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        keywordHits++;
        matchedEvidence.push(`Keyword match: "${kw}"`);
      }
    }

    for (const pattern of signals.patterns) {
      const match = combined.match(pattern);
      if (match) {
        patternHits++;
        matchedEvidence.push(`Pattern match: "${match[0].substring(0, 60)}"`);
      }
    }

    if (keywordHits > 0 || patternHits > 0) {
      const total = keywordHits + patternHits * 2;
      let likelihood: "high" | "medium" | "low";
      if (total >= 3 || patternHits >= 2) {
        likelihood = "high";
      } else if (total >= 2) {
        likelihood = "medium";
      } else {
        likelihood = "low";
      }

      detected.push({
        bias: biasKey,
        likelihood,
        evidence: matchedEvidence.join("; "),
        detection_question: biasInfo.detection_question,
        mitigation: biasInfo.mitigation_strategy,
      });
    }
  }

  detected.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.likelihood] - order[b.likelihood];
  });

  // Structural bias detection: analyze reasoning patterns, not just keywords
  const structuralBiases = detectStructuralBiases(reasoningChain, conclusion, detected);
  for (const sb of structuralBiases) {
    const existing = detected.find((d) => d.bias === sb.bias);
    if (!existing) {
      detected.push(sb);
    } else if (sb.likelihood === "high" && existing.likelihood !== "high") {
      existing.likelihood = "high";
      existing.evidence += `; ${sb.evidence}`;
    }
  }

  detected.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.likelihood] - order[b.likelihood];
  });

  return detected;
}

/**
 * Detects biases through structural analysis of reasoning patterns,
 * not just keyword matching. Catches biases expressed through
 * reasoning structure rather than specific trigger words.
 */
function detectStructuralBiases(
  reasoningChain: string,
  conclusion: string,
  alreadyDetected: DetectedBias[],
): DetectedBias[] {
  const combined = `${reasoningChain}\n${conclusion}`;
  const combinedLower = combined.toLowerCase();
  const sentences = combined.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
  const structuralBiases: DetectedBias[] = [];

  const alreadyHas = (bias: CognitiveBias) => alreadyDetected.some((d) => d.bias === bias);

  // Confirmation bias: no alternative perspectives, no disconfirming evidence
  if (!alreadyHas("confirmation-bias")) {
    const hasAlternative = /alternative|competing|opposing|different\s+view|another\s+(way|perspective|interpretation)|on\s+the\s+other\s+hand|conversely|however/i.test(combined);
    const hasDisconfirm = /disconfirm|contradict|challenge|counterevidence|falsif/i.test(combined);
    const hasAbsoluteLanguage = /\b(all|every|always|never|undoubtedly|undeniably|certainly|absolutely|without\s+doubt)\b/i.test(combined);
    const oneSidedEvidence = sentences.filter((s) => {
      const lower = s.toLowerCase();
      return /supports?|confirms?|shows?|proves?|demonstrates?|validates?/i.test(lower) &&
             !/however|but|although|though|yet|conversely/i.test(lower);
    }).length;

    if ((!hasAlternative && !hasDisconfirm) && (hasAbsoluteLanguage || oneSidedEvidence >= 3)) {
      structuralBiases.push({
        bias: "confirmation-bias",
        likelihood: hasAbsoluteLanguage && oneSidedEvidence >= 3 ? "high" : "medium",
        evidence: `Structural: reasoning presents ${oneSidedEvidence} one-sided supporting statements with no alternative perspectives considered${hasAbsoluteLanguage ? " and uses absolute language" : ""}. No disconfirming evidence sought.`,
        detection_question: "Am I selectively attending to data that confirms my pre-existing beliefs?",
        mitigation: "Deliberately seek disconfirming evidence and consider at least 2 alternative interpretations.",
      });
    }
  }

  // Planning fallacy: optimistic timelines without base rate reference
  if (!alreadyHas("planning-fallacy")) {
    const hasOptimisticTimeline = /should\s+(only\s+)?take|can\s+(easily|definitely)\s+(finish|deliver|complete)|realistic\s+(timeline|estimate|schedule)/i.test(combined);
    const hasNoBaseRate = !/base\s+rate|historical(ly)?\s+(data|average|performance|similar|previous|past|typical|median|reference\s+class)/i.test(combined);
    const hasNoRiskMention = !/risk|uncertainty|could\s+(go\s+)?wrong|what\s+if|potential\s+(issue|problem|delay|setback)|contingency/i.test(combined);

    if (hasOptimisticTimeline && hasNoBaseRate && hasNoRiskMention) {
      structuralBiases.push({
        bias: "planning-fallacy",
        likelihood: "medium",
        evidence: `Structural: timeline appears optimistic with no reference to historical base rates and no risk acknowledgment.`,
        detection_question: "Am I using base rate data from similar past situations, or am I relying on an optimistic inside-view estimate?",
        mitigation: "Reference historical data from similar situations. Apply the outside view before the inside view.",
      });
    }
  }

  // Availability heuristic: reliance on specific examples without broader data
  if (!alreadyHas("availability-heuristic")) {
    const specificExamples = combined.match(/\b(for example|for instance|such as|like|e\.g\.|case\s+of|recent\s+(example|case|incident|event))\b/gi);
    const hasBroadData = /\b(statistic|survey|study|meta.?analysis|systematic\s+review|comprehensive|across\s+|population\s+level|aggregate|sample\s+size|n\s*=\s*\d+)\b/i.test(combined);
    const hasRecencyLanguage = /\b(recent|latest|just\s+(happened|saw|heard|noticed|last\s+week|this\s+week|yesterday|today|newest))\b/i.test(combined);

    if (specificExamples && specificExamples.length >= 2 && !hasBroadData && hasRecencyLanguage) {
      structuralBiases.push({
        bias: "availability-heuristic",
        likelihood: "medium",
        evidence: `Structural: reasoning relies on ${specificExamples.length} specific examples with recency language, without broader statistical data.`,
        detection_question: "Am I overweighting vivid or recent examples at the expense of broader statistical evidence?",
        mitigation: "Seek base rate data and aggregate statistics, not just memorable examples.",
      });
    }
  }

  // Optimism bias: no mention of downsides, risks, or failure modes
  if (!alreadyHas("optimism-bias")) {
    const hasDownside = /\b(risk|downside|threat|danger|vulnerab|fail|worst.?case|adverse|negative|pessimistic|caution|concern|problem|issue|challenge|obstacle)\b/i.test(combined);
    const hasPositiveRatio = sentences.filter((s) => {
      const lower = s.toLowerCase();
      const positive = /\b(opportunity|benefit|advantage|positive|gain|improve|success|growth|potential|upside|strength|favorable)\b/i.test(lower);
      const negative = /\b(risk|threat|fail|worse|decline|loss|problem|concern|challenge|weakness|danger|negative|downside|worrisome)\b/i.test(lower);
      return positive && !negative;
    }).length;
    const hasNegativeRatio = sentences.filter((s) => {
      const lower = s.toLowerCase();
      return /\b(risk|threat|fail|worse|decline|loss|problem|concern|challenge|weakness|danger|negative|downside)\b/i.test(lower);
    }).length;

    if (!hasDownside && hasPositiveRatio > 0 && hasNegativeRatio === 0) {
      structuralBiases.push({
        bias: "optimism-bias",
        likelihood: "medium",
        evidence: `Structural: reasoning mentions ${hasPositiveRatio} positive outcome(s) with zero acknowledgment of risks, downsides, or failure modes.`,
        detection_question: "Am I underestimating risks and overestimating positive outcomes?",
        mitigation: "Conduct a pre-mortem: assume the decision failed and work backward to identify what went wrong.",
      });
    }
  }

  // Narrative fallacy: overly coherent story without acknowledging complexity
  if (!alreadyHas("narrative-fallacy")) {
    const hasCausalChain = /\b(led\s+to|resulted?\s+in|caused|triggered|set\s+off|brought\s+about|consequently|therefore|thus|as\s+a\s+result)\b/i.test(combined);
    const hasComplexityLanguage = /\b(complex|nuanced|multi.?faceted|interdependent|uncertain|ambiguous|context.?dependent|it\s+depends|multiple\s+factors)\b/i.test(combined);
    const hasCoherentNarrative = hasCausalChain && sentences.length >= 3 && !hasComplexityLanguage;

    if (hasCoherentNarrative) {
      const sentenceCount = sentences.length;
      const causalCount = (combined.match(/\b(led\s+to|resulted?\s+in|caused|triggered|consequently|therefore|thus)\b/gi) || []).length;
      if (causalCount >= 2 && sentenceCount <= 10) {
        structuralBiases.push({
          bias: "narrative-fallacy",
          likelihood: causalCount >= 3 ? "high" : "medium",
          evidence: `Structural: reasoning constructs a coherent causal chain (${causalCount} causal links across ${sentenceCount} sentences) without acknowledging complexity or ambiguity.`,
          detection_question: "Am I imposing a neat narrative on a messy situation, making it seem more understandable and predictable than it actually is?",
          mitigation: "Acknowledge uncertainty and complexity. Consider whether the causal chain might be coincidental or reverse-causal.",
        });
      }
    }
  }

  // Anchoring: reference to initial values without sufficient adjustment
  if (!alreadyHas("anchoring")) {
    const hasInitialValue = /\b(initial|first|starting|original|baseline|beginning|at\s+first|to\s+start)\s+(value|number|estimate|assessment|figure|data|information|measurement|result)\b/i.test(combined);
    const hasSmallAdjustment = /\b(slightly|marginally|a\s+bit|somewhat|minor|small|modest)\s+(adjust|change|update|revise|modify|shift)\b/i.test(combined);
    const hasInsufficientJustification = hasInitialValue && !/\bjustif(i|y)|because|reason\s+for|rationale|evidence\s+(for|that)|data\s+supports/i.test(combined);

    if (hasInitialValue && (hasSmallAdjustment || hasInsufficientJustification)) {
      structuralBiases.push({
        bias: "anchoring",
        likelihood: hasSmallAdjustment ? "high" : "medium",
        evidence: `Structural: reasoning references an initial value${hasSmallAdjustment ? " with only minor adjustments" : ""}${hasInsufficientJustification ? " without sufficient justification for the adjustment" : ""}.`,
        detection_question: "Am I insufficiently adjusting away from an initial anchor value?",
        mitigation: "Consider the anchor as arbitrary. What would your estimate be if you had never seen the initial value?",
      });
    }
  }

  return structuralBiases;
}

// ─── Recursive Loop Detection ────────────────────────────────────────────────

interface RecursiveLoopAnalysis {
  spiral_detected: boolean;
  loop_description: string;
  loop_stages: string[];
  severity: "none" | "mild" | "moderate" | "severe";
}

function detectRecursiveLoops(
  reasoningChain: string,
  conclusion: string,
  detectedBiases: DetectedBias[],
  fullText?: string,
  composeSection?: (thoughtType: ThoughtType, stepNumber: number, totalSections: number, prevOutputs: string[]) => string,
): RecursiveLoopAnalysis {
  const text = fullText ?? `${reasoningChain} ${conclusion}`;
  const composerAttempt = composeSection
    ? composeSection("relational", 4, 5, [])
    : composeToolContent({
        toolName: "think_metacognitive",
        text,
        initialPosition: conclusion,
        mode: "critical" as ThinkingMode,
        stepNumber: 4,
        totalSteps: 5,
        thoughtType: "relational" as ThoughtType,
        previousOutputs: [],
      });
  if (composerAttempt.length >= 50) {
    return {
      spiral_detected: composerAttempt.toLowerCase().includes("spiral") || composerAttempt.toLowerCase().includes("loop") || composerAttempt.toLowerCase().includes("circular"),
      loop_description: composerAttempt.substring(0, 400),
      loop_stages: ["Composer-identified recursive pattern"],
      severity: composerAttempt.length > 200 ? "moderate" : "mild",
    };
  }

  const combined = `${reasoningChain}\n${conclusion}`.toLowerCase();
  const hasConfirmationBias = detectedBiases.some(
    (b) => b.bias === "confirmation-bias" && (b.likelihood === "high" || b.likelihood === "medium"),
  );

  const beliefMarkers = [
    /i\s+(believe|think|know|am\s+(sure|certain))/i,
    /it\s+is\s+(clear|obvious|evident)/i,
    /this\s+(proves|confirms|shows|demonstrates)/i,
  ];

  const selectionMarkers = [
    /only\s+(considered|looked|focused)/i,
    /the\s+(relevant|key|important)\s+(data|evidence|facts?)/i,
    /ignoring?\s+(the\s+)?(rest|other)/i,
  ];

  const interpretationMarkers = [
    /this\s+(means|shows|indicates|proves)/i,
    /which\s+(confirms|supports|validates)/i,
  ];

  let beliefCount = 0;
  let selectionCount = 0;
  let interpretationCount = 0;

  for (const m of beliefMarkers) {
    if (m.test(combined)) beliefCount++;
  }
  for (const m of selectionMarkers) {
    if (m.test(combined)) selectionCount++;
  }
  for (const m of interpretationMarkers) {
    if (m.test(combined)) interpretationCount++;
  }

  const loopSignals = (hasConfirmationBias ? 1 : 0) +
    (beliefCount >= 2 ? 1 : 0) +
    (selectionCount >= 1 ? 1 : 0) +
    (interpretationCount >= 2 ? 1 : 0);

  let severity: "none" | "mild" | "moderate" | "severe";
  if (loopSignals >= 4) {
    severity = "severe";
  } else if (loopSignals >= 3) {
    severity = "moderate";
  } else if (loopSignals >= 2) {
    severity = "mild";
  } else {
    severity = "none";
  }

  const loopStages: string[] = [];
  if (beliefCount > 0) loopStages.push("Belief → selectively filtered data selection");
  if (selectionCount > 0) loopStages.push("Data selection → biased interpretation favoring existing beliefs");
  if (interpretationCount > 0) loopStages.push("Interpretation → conclusions that strengthen original beliefs");
  if (hasConfirmationBias) loopStages.push("Conclusions → reinforced beliefs that further narrow future data selection");

  return {
    spiral_detected: loopSignals >= 2,
    loop_description: loopSignals >= 2
      ? `Detected a confirmation bias spiral with ${loopSignals} signal(s). The reasoning chain shows evidence of beliefs filtering data selection, which is then interpreted in ways that confirm the original beliefs, creating a self-reinforcing loop that excludes disconfirming evidence.`
      : "No significant recursive confirmation loops detected. The reasoning chain does not show strong evidence of beliefs circularly reinforcing themselves through selective data processing.",
    loop_stages: loopStages.length > 0 ? loopStages : ["No spiral stages detected"],
    severity,
  };
}

// ─── Blind Spot Identification ───────────────────────────────────────────────

interface BlindSpot {
  category: string;
  description: string;
  why_missed: string;
}

function identifyBlindSpots(
  reasoningChain: string,
  conclusion: string,
  detectedBiases: DetectedBias[],
  fullText?: string,
  composeSection?: (thoughtType: ThoughtType, stepNumber: number, totalSections: number, prevOutputs: string[]) => string,
): BlindSpot[] {
  const text = fullText ?? `${reasoningChain} ${conclusion}`;
  const composerAttempt = composeSection
    ? composeSection("perspectival", 3, 5, [])
    : composeToolContent({
        toolName: "think_metacognitive",
        text,
        initialPosition: conclusion,
        mode: "critical" as ThinkingMode,
        stepNumber: 3,
        totalSteps: 5,
        thoughtType: "perspectival" as ThoughtType,
        previousOutputs: [],
      });
  if (composerAttempt.length >= 50) {
    return [{
      category: "Composer-Identified Blind Spots",
      description: composerAttempt.substring(0, 300),
      why_missed: "The content composer identified these perspectives as potentially overlooked.",
    }];
  }

  const combined = `${reasoningChain}\n${conclusion}`.toLowerCase();
  const blindSpots: BlindSpot[] = [];

  if (!combined.includes("alternative") && !combined.includes("other perspective")) {
    blindSpots.push({
      category: "Alternative Perspectives",
      description: "No alternative viewpoints or competing hypotheses were explicitly considered.",
      why_missed: "The reasoning proceeded in a single line without generating or evaluating rival explanations.",
    });
  }

  if (!combined.includes("base rate") && !combined.includes("statistical") && !combined.includes("probability")) {
    blindSpots.push({
      category: "Base Rate Information",
      description: "No reference to base rates, statistical frequencies, or population-level data.",
      why_missed: "Reasoning relied on specific instances rather than reference class data, increasing vulnerability to availability heuristic.",
    });
  }

  if (!combined.includes("disconfirm") && !combined.includes("counter") && !combined.includes("challenge")) {
    blindSpots.push({
      category: "Disconfirming Evidence",
      description: "No active search for evidence that would contradict the conclusion.",
      why_missed: "The reasoning process appears to have sought validation rather than falsification.",
    });
  }

  if (!combined.includes("stakeholder") && !combined.includes("perspective") && !combined.includes("who else")) {
    blindSpots.push({
      category: "Stakeholder Perspectives",
      description: "No consideration of how different stakeholders or demographic groups might view the situation differently.",
      why_missed: "Analysis remained within a single viewpoint without mapping whose interests and perspectives are represented or absent.",
    });
  }

  if (!combined.includes("what if") && !combined.includes("scenario") && !combined.includes("edge case")) {
    blindSpots.push({
      category: "Edge Cases & Boundary Conditions",
      description: "No exploration of edge cases, boundary conditions, or scenarios where the conclusion might fail.",
      why_missed: "The reasoning focused on the central case without testing the limits of applicability.",
    });
  }

  const hasTemporalLanguage = combined.includes("over time") || combined.includes("long term") || combined.includes("trend");
  if (!hasTemporalLanguage) {
    blindSpots.push({
      category: "Temporal Dynamics",
      description: "No consideration of how the situation might evolve over different time horizons.",
      why_missed: "Analysis appears static — a snapshot rather than a trajectory. Second-order effects and feedback loops over time were not explored.",
    });
  }

  const biasNames = detectedBiases.map((b) => b.bias);
  if (biasNames.includes("availability-heuristic") || biasNames.includes("recency-effect")) {
    blindSpots.push({
      category: "Historical Precedents",
      description: "Historical cases and long-term patterns may have been overlooked in favor of recent or memorable examples.",
      why_missed: "Availability and recency biases pull attention toward vivid recent events, obscuring slower but more significant historical patterns.",
    });
  }

  if (biasNames.includes("authority-bias")) {
    blindSpots.push({
      category: "Dissenting Expert Opinion",
      description: "Minority or dissenting expert views may have been overlooked by overweighting the majority or most prominent authority.",
      why_missed: "Authority bias creates a gravitational pull toward consensus expert opinion, making minority views invisible.",
    });
  }

  return blindSpots;
}

// ─── Ladder of Inference Analysis ────────────────────────────────────────────

interface LadderAnalysis {
  step: LadderOfInferenceStep;
  content_assessment: string;
  valid_transition: boolean;
  errors_detected: string[];
  descent_question: string;
}

function analyzeLadder(
  reasoningChain: string,
  conclusion: string,
  availableData: string | undefined,
  detectedBiases: DetectedBias[],
  fullText?: string,
  composeSection?: (thoughtType: ThoughtType, stepNumber: number, totalSections: number, prevOutputs: string[]) => string,
): LadderAnalysis[] {
  const text = fullText ?? `${reasoningChain} ${conclusion} ${availableData ?? ""}`;
  const composerAttempt = composeSection
    ? composeSection("diagnostic", 1, 5, [])
    : composeToolContent({
        toolName: "think_metacognitive",
        text,
        initialPosition: conclusion,
        mode: "critical" as ThinkingMode,
        stepNumber: 1,
        totalSteps: 5,
        thoughtType: "diagnostic" as ThoughtType,
        previousOutputs: [],
      });

  const combined = `${reasoningChain}\n${conclusion}`;
  const combinedLower = combined.toLowerCase();
  const biasNames = detectedBiases.map((b) => b.bias);
  const steps: LadderOfInferenceStep[] = [
    "observable-data",
    "selected-data",
    "interpreted-meaning",
    "assumptions",
    "conclusions",
    "beliefs",
    "actions",
  ];

  const observableContent = extractDataReferences(reasoningChain, availableData);
  const selectedContent = extractSelectedData(reasoningChain, availableData);
  const interpretedContent = extractInterpretations(reasoningChain);
  const assumptionsContent = extractAssumptions(reasoningChain);
  const conclusionsContent = extractConclusions(reasoningChain, conclusion);
  const beliefsContent = extractBeliefs(reasoningChain, conclusion);
  const actionsContent = extractActions(reasoningChain, conclusion);

  const rungContent: Record<LadderOfInferenceStep, string> = {
    "observable-data": observableContent,
    "selected-data": selectedContent,
    "interpreted-meaning": interpretedContent,
    assumptions: assumptionsContent,
    conclusions: conclusionsContent,
    beliefs: beliefsContent,
    actions: actionsContent,
  };

  const analysis: LadderAnalysis[] = [];

  for (const step of steps) {
    const stepInfo = LADDER_OF_INFERENCE_STEPS[step];
    const errors: string[] = [...stepInfo.common_errors];
    let validTransition = true;
    const content = rungContent[step];

    switch (step) {
      case "observable-data": {
        const contentAssessment = content;

        if (!availableData || availableData.length < 50) {
          errors.push("Insufficient description of available data — the observable data pool may be incomplete or pre-filtered.");
          validTransition = false;
        }

        if (composerAttempt.length >= 50) {
          analysis.push({
            step,
            content_assessment: `${contentAssessment}\n\nComposer analysis: ${composerAttempt.substring(0, 300)}`,
            valid_transition: validTransition,
            errors_detected: errors,
            descent_question: stepInfo.descent_question,
          });
        } else {
          analysis.push({
            step,
            content_assessment: contentAssessment,
            valid_transition: validTransition,
            errors_detected: errors,
            descent_question: stepInfo.descent_question,
          });
        }
        break;
      }

      case "selected-data": {
        const contentAssessment = content;

        if (biasNames.includes("confirmation-bias") || biasNames.includes("availability-heuristic") || biasNames.includes("recency-effect")) {
          errors.push(`Biased data selection likely influenced which data was attended to.`);
          validTransition = false;
        }

        analysis.push({
          step,
          content_assessment: contentAssessment,
          valid_transition: validTransition,
          errors_detected: errors,
          descent_question: stepInfo.descent_question,
        });
        break;
      }

      case "interpreted-meaning": {
        const contentAssessment = content;

        if (biasNames.includes("framing-effect") || biasNames.includes("narrative-fallacy")) {
          errors.push("Interpretation may be shaped by framing effects or narrative construction — the meaning assigned to data may reflect the frame rather than the data itself.");
          validTransition = false;
        }

        analysis.push({
          step,
          content_assessment: contentAssessment,
          valid_transition: validTransition,
          errors_detected: errors,
          descent_question: stepInfo.descent_question,
        });
        break;
      }

      case "assumptions": {
        const contentAssessment = content;

        if (!combinedLower.includes("assume") && !combinedLower.includes("presume") && !combinedLower.includes("given that") && !combinedLower.includes("since")) {
          errors.push("No explicit assumption markers found — invisible assumptions are the most dangerous because they cannot be tested.");
          validTransition = false;
        }

        if (biasNames.includes("illusion-of-validity") || biasNames.includes("dunning-kruger")) {
          errors.push("Overconfidence in assumptions detected — the reasoning may treat untested assumptions as established facts.");
          validTransition = false;
        }

        analysis.push({
          step,
          content_assessment: contentAssessment,
          valid_transition: validTransition,
          errors_detected: errors,
          descent_question: stepInfo.descent_question,
        });
        break;
      }

      case "conclusions": {
        const contentAssessment = content;

        if (biasNames.includes("hindsight-bias") || biasNames.includes("narrative-fallacy")) {
          errors.push("Conclusion may reflect hindsight or narrative bias — the outcome may seem more inevitable or logical than the evidence supports.");
          validTransition = false;
        }

        if (detectedBiases.length >= 3) {
          errors.push(`Multiple biases detected (${detectedBiases.length} total) — the conclusion's reliability is significantly compromised.`);
          validTransition = false;
        }

        analysis.push({
          step,
          content_assessment: contentAssessment,
          valid_transition: validTransition,
          errors_detected: errors,
          descent_question: stepInfo.descent_question,
        });
        break;
      }

      case "beliefs": {
        const contentAssessment = content;

        if (biasNames.includes("fundamental-attribution-error") || biasNames.includes("false-consensus")) {
          errors.push("Beliefs may be overgeneralized — attributing situational findings to stable traits or assuming broader consensus than exists.");
          validTransition = false;
        }

        analysis.push({
          step,
          content_assessment: contentAssessment,
          valid_transition: validTransition,
          errors_detected: errors,
          descent_question: stepInfo.descent_question,
        });
        break;
      }

      case "actions": {
        const contentAssessment = content;

        if (biasNames.includes("sunk-cost-fallacy") || biasNames.includes("status-quo-bias")) {
          errors.push("Actions may be driven by past investment or inertia rather than forward-looking rationality.");
          validTransition = false;
        }

        analysis.push({
          step,
          content_assessment: contentAssessment,
          valid_transition: validTransition,
          errors_detected: errors,
          descent_question: stepInfo.descent_question,
        });
        break;
      }
    }
  }

  return analysis;
}

// ─── Ladder Rung Content Extractors ──────────────────────────────────────────

function extractDataReferences(reasoningChain: string, availableData: string | undefined): string {
  const parts: string[] = [];

  // If available_data was provided, use it as the primary source
  if (availableData && availableData.length > 20) {
    const dataExcerpt = availableData.length > 400 ? availableData.substring(0, 400) + "…" : availableData;
    parts.push(`**Extracted from available_data:** ${dataExcerpt}`);

    // Check what the reasoning chain actually references from available_data
    const availableLower = availableData.toLowerCase();
    const sentences = reasoningChain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
    const referencedItems: string[] = [];
    const unreferencedItems: string[] = [];

    // Extract key entities/numbers from available_data
    const dataEntities = availableLower.match(/\b[a-z]{3,20}\b/g)?.filter((w) => !new Set(["the","and","for","with","that","this","from","have","been","were","their","there","about","would","could","should","which","where","when","what","does","done","more","some","than","then","just","only","also","very","each","such","other","both","same","most","into","over","after","before","between","through","during","without","within","along","following","across","around","behind","beyond","toward","upon","since","while","however","therefore","because","although","unless","until","whether"]).has(w)) ?? [];
    const uniqueEntities = [...new Set(dataEntities)].slice(0, 10);

    const reasoningLower = reasoningChain.toLowerCase();
    for (const entity of uniqueEntities) {
      if (reasoningLower.includes(entity)) {
        referencedItems.push(entity);
      } else {
        unreferencedItems.push(entity);
      }
    }

    if (unreferencedItems.length > 0) {
      parts.push(`**Data in available_data NOT referenced in reasoning:** ${unreferencedItems.slice(0, 8).join(", ")}`);
    }
    if (referencedItems.length > 0) {
      parts.push(`**Data elements actually referenced:** ${referencedItems.slice(0, 8).join(", ")}`);
    }

    parts.push(`**Validity:** ${referencedItems.length > 0 ? "valid — reasoning references specific provided data" : "concerning — reasoning does not appear to engage with the provided available_data"}`);
    parts.push(`**Explanation:** The observable data pool is defined by available_data (${availableData.length} chars). ${referencedItems.length > 0 ? `The reasoning chain engages with ${referencedItems.length} of the data elements, suggesting selective attention from the start.` : `The reasoning chain makes no clear reference to the provided data, suggesting it may be operating on pre-filtered or external data instead.`}`);
    return parts.join("\n\n");
  }

  // No available_data provided — extract factual claims from reasoning chain
  const sentences = reasoningChain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);

  // Extract sentences with factual markers: numbers, dates, named patterns, measurements
  const factualPatterns = [
    /\d+\s*(%|percent|users|people|cases|instances|times?|dollars?|months?|years?|weeks?|days?|hours?)/i,
    /(survey|study|report|analysis|data|metric|measurement|result|finding)\s+(found|showed|revealed|indicated|reported|measured)/i,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Q[1-4]|20\d{2})\b/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(reported|announced|released|published|stated|confirmed)/i,
  ];

  const factualSentences = sentences.filter((s) =>
    factualPatterns.some((p) => p.test(s)),
  );

  if (factualSentences.length > 0) {
    const excerpt = factualSentences.slice(0, 4).map((s) => `"${s}"`).join("; ");
    parts.push(`**Extracted factual statements:** ${excerpt}`);
    parts.push(`**Validity:** valid — reasoning contains ${factualSentences.length} statements with measurable/verifiable markers`);
    parts.push(`**Explanation:** These statements contain numbers, dates, studies, or named entities that can be independently verified. They form the observable data pool at the bottom of the ladder. Note: ${factualSentences.length < sentences.length ? `${sentences.length - factualSentences.length} additional sentences in the reasoning chain lack factual markers and may already contain interpretation rather than raw observation.` : "all sentences in the reasoning chain contain factual markers, which is unusual — even raw data selection involves some interpretation."}`);
    return parts.join("\n\n");
  }

  // Fallback: extract all declarative claims as the observable pool
  const declarativeClaims = sentences.filter((s) => {
    const lower = s.toLowerCase();
    if (/^(perhaps|maybe|possibly|might|could|should|we need|i think|it seems|note|important|however)/i.test(s)) return false;
    return /^[A-Z]/.test(s) && s.length > 15 && s.length < 300;
  }).slice(0, 5);

  if (declarativeClaims.length > 0) {
    const excerpt = declarativeClaims.map((c) => `"${c}"`).join("; ");
    parts.push(`**Declarative claims treated as observable data:** ${excerpt}`);
    parts.push(`**Validity:** concerning — no statements contain verifiable markers (numbers, dates, studies, named entities)`);
    parts.push(`**Explanation:** The reasoning chain presents ${declarativeClaims.length} claims as observable facts, but none contain measurable markers. Without available_data to compare against, it is impossible to determine whether these are direct observations or already-interpreted conclusions. This means the ladder may start partway up rather than at the bottom.`);
    return parts.join("\n\n");
  }

  const opening = reasoningChain.substring(0, 200);
  parts.push(`**Observable data pool:** "${opening}${reasoningChain.length > 200 ? "…" : ""}"`);
  parts.push(`**Validity:** missing — insufficient factual content to identify discrete observable data points`);
  parts.push(`**Explanation:** The reasoning chain (${reasoningChain.length} chars) does not contain clearly identifiable observable data points. The entire text may already reflect selection and interpretation. Without a clear data foundation, all higher rungs of the ladder are built on potentially pre-filtered input.`);
  return parts.join("\n\n");
}

function extractSelectedData(reasoningChain: string, availableData: string | undefined): string {
  const parts: string[] = [];
  const sentences = reasoningChain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);

  // Extract explicit selection markers
  const selectionPatterns = [
    /(?:focused|concentrated|prioritized|emphasized)\s+(on\s+)?(the\s+)?(key|main|critical|important|relevant)/i,
    /(?:noted|observed|identified|highlighted)\s+(that\s+)?(the\s+)?(key|main|critical|important|most\s+relevant)/i,
    /the\s+(key|main|critical|important|most\s+significant|primary|central)\s+(factor|issue|data\s*point|finding|result|metric|trend|pattern|concern|problem)/i,
    /(?:particularly|especially|notably|specifically|critically),?\s+/i,
    /(?:ignored|overlooked|dismissed|excluded|ignored|left\s+out)/i,
  ];

  const selectedSentences = sentences.filter((s) =>
    selectionPatterns.some((p) => p.test(s)),
  );

  // Analyze what topics dominate the reasoning chain
  const reasoningLower = reasoningChain.toLowerCase();
  const topicWords = reasoningLower.match(/\b[a-z]{5,20}\b/g) ?? [];
  const stopWords = new Set(["this","that","these","those","with","from","they","their","there","about","would","could","should","which","where","when","what","have","been","being","does","done","more","some","than","then","just","only","also","very","each","such","other","both","same","most","into","over","after","before","between","through","during","without","within","along","following","across","around","behind","beyond","toward","upon","since","while","however","therefore","because","although","unless","until","whether","whereas","further","rather","here","many","much","even","still","already","always","never","often","sometimes","usually","generally","simply","really","quite","enough","again","once","away","back","down","forward","forth","hard","high","late","long","near","next","past","round","short","slow","soon","sure","tight","well","wide","early","few","true","false","real","whole","part","side","end","point","form","case","kind","sort","type","way","time","year","month","week","day","hour","minute","second","place","state","thing","person","people","world","life","hand","company","system","program","question","work","government","number","night","home","water","room","mother","area","money","story","fact","lot","right","study","book","eye","job","word","business","issue","head","house","service","friend","father","power","idea","body","information","girl","moment","air","teacher","force","education","problem","data","analysis","result","evidence","reasoning","conclusion","belief","action"]);
  const contentWords = topicWords.filter((w) => !stopWords.has(w));
  const freq: Record<string, number> = {};
  contentWords.forEach((w) => { freq[w] = (freq[w] ?? 0) + 1; });
  const topTopics = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const dominantTopics = topTopics.filter(([, count]) => count >= 2).map(([word]) => word);

  if (selectedSentences.length > 0) {
    const excerpt = selectedSentences.slice(0, 3).map((s) => `"${s}"`).join("\n- ");
    parts.push(`**Explicit selection markers found:**\n- ${excerpt}`);
  }

  // Compare with available_data if provided
  if (availableData && availableData.length > 20) {
    const availableLower = availableData.toLowerCase();
    const availableTopics = availableLower.match(/\b[a-z]{5,20}\b/g)?.filter((w) => !stopWords.has(w)) ?? [];
    const availFreq: Record<string, number> = {};
    availableTopics.forEach((w) => { availFreq[w] = (availFreq[w] ?? 0) + 1; });
    const availableTopTopics = Object.entries(availFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);

    const selected = dominantTopics.filter((t) => availableTopTopics.includes(t));
    const ignored = availableTopTopics.filter((t) => !dominantTopics.includes(t) && !selected.includes(t));

    if (selected.length > 0) {
      parts.push(`**Selected from available_data:** ${selected.join(", ")} (these topics appear in both available_data and reasoning)`);
    }
    if (ignored.length > 0) {
      parts.push(`**Likely ignored from available_data:** ${ignored.join(", ")} (present in available_data but absent from reasoning chain)`);
    }
    parts.push(`**Validity:** ${ignored.length > 2 ? "concerning — ${ignored.length} data topics from available_data were not engaged with in reasoning" : "valid — reasoning engages with most topics present in available_data"}`);
  } else if (dominantTopics.length > 0) {
    parts.push(`**Dominant topics in reasoning (appearing 2+ times):** ${dominantTopics.join(", ")}`);
    parts.push(`**Validity:** concerning — without available_data to compare against, cannot verify whether topic concentration reflects actual data distribution or selective attention`);
  }

  parts.push(`**Explanation:** ${selectedSentences.length > 0 ? `The reasoning contains ${selectedSentences.length} explicit selection marker(s), indicating conscious data prioritization. ` : `The reasoning contains no explicit selection markers, suggesting data selection happened unconsciously. `}${dominantTopics.length > 0 ? `The reasoning concentrates on "${dominantTopics.join(", ")}" — these topics receive disproportionate attention relative to other potential data points.` : `The reasoning does not show clear topical concentration, which could indicate either balanced data coverage or diffuse focus.`}`);
  return parts.join("\n\n");
}

function extractInterpretations(reasoningChain: string): string {
  const parts: string[] = [];
  const sentences = reasoningChain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);

  // Extract explicit interpretive language
  const interpretationPatterns = [
    /(?:means?|suggests?|indicates?|implies?|points?\s+to|signals?|demonstrates?\s+that)/i,
    /(?:this\s+)?(?:shows?|reveals?|confirms?|validates?|supports?|proves?)\s+(that\s+)?/i,
    /(?:interpreted?|understood?|read\s+as|seen\s+as|viewed\s+as)\s+(as\s+)?/i,
    /(?:therefore|thus|hence|consequently|so|as\s+a\s+result)\s+(?:the\s+)?(?:situation|problem|issue|data|trend|pattern|evidence)/i,
    /(?:represents?|reflects?|is\s+a\s+sign\s+of|is\s+indicative\s+of)/i,
  ];

  const interpretiveSentences = sentences.filter((s) =>
    interpretationPatterns.some((p) => p.test(s)),
  );

  // Extract evaluative/categorical language (assigning meaning through classification)
  const evaluativePatterns = [
    /(?:problem|issue|risk|threat|danger|concern|crisis|challenge|opportunity|strength|weakness|failure|success)\b/i,
    /(?:good|bad|poor|strong|weak|serious|significant|critical|major|minor|clear|obvious|alarming|promising|encouraging|disturbing)/i,
    /(?:too\s+\w+|not\s+\w+|insufficient|inadequate|excessive|overwhelming|negligible|substantial)/i,
  ];

  const evaluativeSentences = sentences.filter((s) =>
    evaluativePatterns.some((p) => p.test(s)) && !interpretationPatterns.some((p) => p.test(s)),
  );

  if (interpretiveSentences.length > 0) {
    const excerpt = interpretiveSentences.slice(0, 3).map((s) => `"${s}"`).join("\n- ");
    parts.push(`**Explicit interpretive statements:**\n- ${excerpt}`);
  }

  if (evaluativeSentences.length > 0) {
    const excerpt = evaluativeSentences.slice(0, 3).map((s) => `"${s}"`).join("\n- ");
    parts.push(`**Evaluative framing (meaning through classification):**\n- ${excerpt}`);
  }

  const totalInterpretive = interpretiveSentences.length + evaluativeSentences.length;
  parts.push(`**Validity:** ${totalInterpretive > 3 ? "concerning — ${totalInterpretive} interpretive statements detected; meaning assignments may be conflated with data" : totalInterpretive > 0 ? "valid — ${totalInterpretive} interpretive statements identified and can be compared against neutral data" : "missing — no explicit interpretive language found; meaning may be assigned implicitly through framing and ordering"}`);
  parts.push(`**Explanation:** ${interpretiveSentences.length > 0 ? `The reasoning chain contains ${interpretiveSentences.length} statements that explicitly assign meaning to data (using words like "means," "indicates," "shows"). ` : ``}${evaluativeSentences.length > 0 ? `Additionally, ${evaluativeSentences.length} sentences assign meaning through evaluative classification, labeling phenomena as problems, risks, opportunities, etc. ` : ``}${totalInterpretive === 0 ? `The absence of explicit interpretive language does not mean interpretation is absent — the mere selection and ordering of facts constitutes an interpretive act. The reasoning chain may be presenting interpretations as if they were neutral observations.` : `These ${totalInterpretive} interpretive statements should be tested: could the same data support different meanings? Alternative interpretations are the primary check against interpretive overreach.`}`);
  return parts.join("\n\n");
}

function extractAssumptions(reasoningChain: string): string {
  const parts: string[] = [];
  const sentences = reasoningChain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);

  // Explicit assumption markers
  const explicitPatterns = [
    /(?:assume|presume|suppose|take\s+for\s+granted)\s+(that\s+)?/i,
    /(?:given|assuming|if\s+we\s+accept)\s+(that\s+)?/i,
    /(?:since|because)\s+(the\s+)?(?:fact\s+that\s+)?/i,
    /(?:presumably|it\s+stands\s+to\s+reason|it\s+follows\s+that)/i,
  ];

  const explicitAssumptions = sentences.filter((s) =>
    explicitPatterns.some((p) => p.test(s)),
  );

  // Implicit assumptions: declarative statements that present claims as settled without evidence
  const implicitAssumptions = sentences.filter((s) => {
    const lower = s.toLowerCase();
    // Skip hedging, questions, meta-commentary, and explicitly marked assumptions
    if (/^(perhaps|maybe|possibly|might|could|should|what|how|why|if\s+[^w]|unless|we need|i think|it seems|note|important|however|but|assume|given|since\s+we|presumably)/i.test(s)) return false;
    if (explicitPatterns.some((p) => p.test(s))) return false; // already captured
    // Statements that present something as established fact
    return /\b(is|are|was|were|will|must|cannot|don't|doesn't|won't)\b/i.test(s) && s.length > 20 && s.length < 300;
  }).slice(0, 5);

  if (explicitAssumptions.length > 0) {
    const excerpt = explicitAssumptions.slice(0, 3).map((s) => `"${s}"`).join("\n- ");
    parts.push(`**Explicit assumptions:**\n- ${excerpt}`);
  }

  if (implicitAssumptions.length > 0) {
    const excerpt = implicitAssumptions.map((c) => `"${c}"`).join("\n- ");
    parts.push(`**Implicit assumptions (stated as facts without evidence):**\n- ${excerpt}`);
  }

  const totalAssumptions = explicitAssumptions.length + implicitAssumptions.length;
  parts.push(`**Validity:** ${explicitAssumptions.length === 0 ? "concerning — no assumptions are explicitly surfaced; invisible assumptions cannot be tested" : totalAssumptions > 5 ? "concerning — ${totalAssumptions} assumptions detected; reasoning chain may be overbuilt on untested premises" : "valid — ${totalAssumptions} assumption(s) identified for testing"}`);
  parts.push(`**Explanation:** ${explicitAssumptions.length > 0 ? `${explicitAssumptions.length} assumption(s) are explicitly acknowledged, which is good — these can be individually tested. ` : `No assumptions are explicitly surfaced, which is a red flag. `}${implicitAssumptions.length > 0 ? `${implicitAssumptions.length} statements function as implicit assumptions — they are presented as facts without supporting justification. If any of these are false, the reasoning chain above them collapses. Each should be tested: what evidence supports this claim independently?` : `The reasoning chain does not contain clearly identifiable assumption-level claims, which could mean assumptions are so deeply embedded they appear as background reality, or the reasoning is unusually evidence-based.`}`);
  return parts.join("\n\n");
}

function extractConclusions(reasoningChain: string, conclusion: string): string {
  const parts: string[] = [];
  const sentences = reasoningChain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);

  // Extract conclusion-like statements from the reasoning chain
  const conclusionPatterns = [
    /(?:therefore|thus|hence|consequently|so|as\s+a\s+result|it\s+follows\s+that)/i,
    /(?:the\s+)?(?:conclusion|answer|solution|verdict|judgment)\s+(is|was|should\s+be)/i,
    /(?:we\s+)?(?:should|must|need\s+to|ought\s+to|have\s+to)/i,
    /(?:this\s+)?(?:means?|shows?|demonstrates?|proves?|confirms?|indicates?)\s+(that\s+)?/i,
    /(?:clearly|obviously|evidently|undoubtedly),?\s+/i,
  ];

  const conclusionSentences = sentences.filter((s) =>
    conclusionPatterns.some((p) => p.test(s)),
  );

  // Check if the formal conclusion is supported by statements in the reasoning chain
  const conclusionLower = conclusion.toLowerCase();
  const conclusionKeyWords = conclusionLower.match(/\b[a-z]{4,20}\b/g)?.filter((w) => !new Set(["this","that","the","and","for","with","should","would","could","need","have","been","were","their","there","about","more","some","than","then","just","only","also","very","such","other","both","same","most","into","over","after","before","between","through","during","without","within","along","following","across","around","behind","beyond","toward","upon","since","while","however","therefore","because","although","unless","until","whether"]).has(w)) ?? [];

  const reasoningLower = reasoningChain.toLowerCase();
  const supportedWords = conclusionKeyWords.filter((w) => reasoningLower.includes(w));
  const unsupportedWords = conclusionKeyWords.filter((w) => !reasoningLower.includes(w));

  parts.push(`**Formal conclusion:** "${conclusion.length > 300 ? conclusion.substring(0, 300) + "…" : conclusion}"`);

  if (conclusionSentences.length > 0) {
    const excerpt = conclusionSentences.slice(0, 3).map((s) => `"${s}"`).join("\n- ");
    parts.push(`**Conclusion markers in reasoning chain:**\n- ${excerpt}`);
  }

  if (unsupportedWords.length > 0 && unsupportedWords.length <= conclusionKeyWords.length) {
    parts.push(`**Conclusion elements NOT present in reasoning chain:** ${unsupportedWords.slice(0, 5).join(", ")}`);
  }
  if (supportedWords.length > 0) {
    parts.push(`**Conclusion elements supported by reasoning:** ${supportedWords.slice(0, 5).join(", ")}`);
  }

  const supportRatio = conclusionKeyWords.length > 0 ? Math.round((supportedWords.length / conclusionKeyWords.length) * 100) : 0;
  parts.push(`**Validity:** ${supportRatio >= 60 ? "valid — ${supportRatio}% of conclusion keywords appear in reasoning chain" : supportRatio >= 30 ? "concerning — only ${supportRatio}% of conclusion keywords appear in reasoning; conclusion may go beyond what the reasoning supports" : "concerning — conclusion contains concepts not present in the reasoning chain; it may not follow from the stated reasoning"}`);
  parts.push(`**Explanation:** The formal conclusion is ${conclusion.length} chars. ${conclusionSentences.length > 0 ? `The reasoning chain contains ${conclusionSentences.length} statement(s) with conclusion markers (therefore/thus/so), suggesting the reasoning builds toward this conclusion. ` : `The reasoning chain contains no explicit conclusion markers, which means the formal conclusion may be asserted rather than derived. `}${unsupportedWords.length > 0 ? `The conclusion introduces "${unsupportedWords.slice(0, 3).join(", ")}" which do not appear in the reasoning chain — these are new claims not supported by the stated reasoning.` : `All key terms in the conclusion appear in the reasoning chain, suggesting the conclusion is grounded in the stated reasoning. However, presence of terms does not guarantee logical validity — the inference pattern itself should be checked.`}`);
  return parts.join("\n\n");
}

function extractBeliefs(reasoningChain: string, conclusion: string): string {
  const parts: string[] = [];
  const sentences = reasoningChain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);

  // Explicit belief markers
  const beliefPatterns = [
    /(?:believe|think|feel)\s+(that\s+)?(?:the\s+)?(?:key|main|fundamental|core|truth|reality)/i,
    /(?:always|never|every\s+time|consistently|invariably)\s+\w+/i,
    /(?:fundamentally|essentially|at\s+(the\s+)?core|by\s+nature|inherently)/i,
    /(?:the\s+)?(?:truth|reality|nature)\s+(is|was)\s+(that\s+)?/i,
    /(?:this\s+)?(?:demonstrates?|proves?|confirms?)\s+(that\s+)?(?:the\s+)?(?:fundamental|core|underlying|root)/i,
  ];

  const beliefSentences = sentences.filter((s) =>
    beliefPatterns.some((p) => p.test(s)),
  );

  // Generalizing language that elevates specific findings to general principles
  const generalizingPatterns = [
    /(?:generally|typically|usually|in\s+general|as\s+a\s+rule|broadly|by\s+and\s+large)/i,
    /(?:tends?\s+to|prone\s+to|likely\s+to|unlikely\s+to)/i,
    /(?:is\s+a\s+(sign|symptom|indicator|pattern|trend)\s+of)/i,
    /(?:reflects?\s+(a\s+)?(?:systemic|structural|cultural|fundamental))/i,
  ];

  const generalizingSentences = sentences.filter((s) =>
    generalizingPatterns.some((p) => p.test(s)),
  );

  if (beliefSentences.length > 0) {
    const excerpt = beliefSentences.slice(0, 3).map((s) => `"${s}"`).join("\n- ");
    parts.push(`**Explicit belief-level statements:**\n- ${excerpt}`);
  }

  if (generalizingSentences.length > 0) {
    const excerpt = generalizingSentences.slice(0, 3).map((s) => `"${s}"`).join("\n- ");
    parts.push(`**Generalizing language (specific → general belief):**\n- ${excerpt}`);
  }

  // Derive the belief system implied by the conclusion
  const conclusionTrimmed = conclusion.trim();
  const isPrescriptive = /^(we\s+)?(should|must|need|have\s+to|ought)/i.test(conclusionTrimmed);
  const isCausal = /\b(causes?|leads?\s+to|results?\s+in|drives?|prevents?|enables?|correlates?)\b/i.test(conclusionTrimmed);
  const isEvaluative = /\b(good|bad|better|worse|risky|safe|effective|ineffective|optimal|suboptimal|preferable|undesirable)\b/i.test(conclusionTrimmed);
  const isSystemic = /\b(systemic|structural|fundamental|root\s+cause|underlying)\b/i.test(conclusionTrimmed);

  let beliefCategory = "implicit worldview";
  if (isPrescriptive) beliefCategory = "normative belief (about what ought to be done)";
  else if (isCausal) beliefCategory = "causal belief (about how things work)";
  else if (isEvaluative) beliefCategory = "evaluative belief (about what is good/bad)";
  else if (isSystemic) beliefCategory = "systemic belief (about underlying structures)";

  const totalBeliefMarkers = beliefSentences.length + generalizingSentences.length;
  parts.push(`**Inferred belief category:** ${beliefCategory}`);
  parts.push(`**Validity:** ${totalBeliefMarkers > 2 ? "concerning — ${totalBeliefMarkers} belief-level markers detected; reasoning may be driven by pre-existing beliefs rather than data" : totalBeliefMarkers > 0 ? "valid — ${totalBeliefMarkers} belief marker(s) identified" : "concerning — no belief markers surfaced; beliefs may be operating invisibly"}`);
  parts.push(`**Explanation:** ${beliefSentences.length > 0 ? `The reasoning chain contains ${beliefSentences.length} explicit belief-level statement(s) using universal quantifiers (always/never) or fundamental claims. ` : ``}${generalizingSentences.length > 0 ? `${generalizingSentences.length} statement(s) generalize from specific findings to broader patterns, which is the mechanism by which situational conclusions become enduring beliefs. ` : ``}The conclusion encodes a ${beliefCategory}: "${conclusionTrimmed.substring(0, 150)}${conclusionTrimmed.length > 150 ? "…" : ""}". If accepted, this belief will act as a filter on all future data selection — making this rung the most consequential for long-term reasoning quality. Beliefs at this level create self-reinforcing loops: they determine what data is noticed, how it is interpreted, and which assumptions feel natural.`);
  return parts.join("\n\n");
}

function extractActions(reasoningChain: string, conclusion: string): string {
  const parts: string[] = [];
  const sentences = reasoningChain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);

  // Explicit action markers
  const actionPatterns = [
    /(?:should|must|need\s+to|ought\s+to|have\s+to)\s+\w+/i,
    /(?:we\s+(will|should|must|need\s+to)|i\s+(will|should|must|need\s+to))/i,
    /(?:therefore\s+(we|i)\s+|so\s+(we|i)\s+|consequently\s+(we|i)\s+)/i,
    /(?:recommend|suggest|propose|advise|action\s+(plan|item|step|required))/i,
    /(?:implement|adopt|change|switch|stop|start|invest|divest|reconsider|review|monitor|track|test|validate)/i,
  ];

  const actionSentences = sentences.filter((s) =>
    actionPatterns.some((p) => p.test(s)),
  );

  // Extract action verbs from the conclusion
  const actionVerbs = conclusion.match(/\b(implement|adopt|change|switch|stop|start|invest|divest|reconsider|review|monitor|track|test|validate|verify|communicate|document|plan|prepare|build|create|design|evaluate|assess|measure|analyze|investigate|explore|consider|avoid|prevent|mitigate|eliminate|minimize|maximize|optimize|prioritize|focus|shift|transition|migrate|upgrade|downgrade|replace|remove|add|update|maintain|support|train|educate|inform|notify|alert|escalate|report|audit|inspect|check|confirm|ensure|address|fix|resolve|improve|reduce|increase)\b/gi);
  const uniqueVerbs = actionVerbs ? [...new Set(actionVerbs.map((v) => v.toLowerCase()))] : [];

  if (actionSentences.length > 0) {
    const excerpt = actionSentences.slice(0, 3).map((s) => `"${s}"`).join("\n- ");
    parts.push(`**Explicit action statements:**\n- ${excerpt}`);
  }

  if (uniqueVerbs.length > 0) {
    parts.push(`**Action verbs in conclusion:** ${uniqueVerbs.map((v) => `"${v}"`).join(", ")}`);
  }

  // Derive implied action from conclusion type
  const conclusionTrimmed = conclusion.trim();
  const isPrescriptive = /^(we\s+)?(should|must|need|have\s+to|ought)/i.test(conclusionTrimmed);
  const isDiagnostic = /\b(problem|issue|root\s+cause|diagnosis|identified|found|detected)\b/i.test(conclusionTrimmed);
  const isRiskWarning = /\b(risk|danger|threat|vulnerable|exposed|concern)\b/i.test(conclusionTrimmed);

  let impliedAction = "";
  if (isPrescriptive) impliedAction = `The conclusion is explicitly prescriptive, directly prescribing action.`;
  else if (isDiagnostic) impliedAction = `The conclusion is diagnostic — the implied action is to address the identified problem or root cause.`;
  else if (isRiskWarning) impliedAction = `The conclusion is a risk warning — the implied action is to implement mitigations or monitoring for the identified risk.`;
  else impliedAction = `The conclusion is declarative — the implied action is to either act on this finding (if actionable) or update mental models (if informational).`;

  const totalActionSignals = actionSentences.length + uniqueVerbs.length;
  parts.push(`**Validity:** ${totalActionSignals > 0 ? "valid — ${totalActionSignals} action signal(s) detected" : "concerning — no explicit action statements; the ladder is incomplete without specifying what follows from the belief system"}`);
  parts.push(`**Explanation:** ${actionSentences.length > 0 ? `The reasoning chain contains ${actionSentences.length} explicit action-oriented statement(s). ` : ``}${uniqueVerbs.length > 0 ? `The conclusion contains ${uniqueVerbs.length} distinct action verb(s): ${uniqueVerbs.join(", ")}. ` : ``}${impliedAction} Every conclusion on the ladder of inference implies at least one action — even the decision to take no action is an action. Making this explicit completes the ladder. Without a clear action rung, it is impossible to assess whether the actions follow from corrected reasoning or from bias-reinforced beliefs higher on the ladder.`);
  return parts.join("\n\n");
}

// ─── Reconstructed Reasoning (Exhaustive Only) ───────────────────────────────

function reconstructReasoning(
  reasoningChain: string,
  conclusion: string,
  ladderAnalysis: LadderAnalysis[],
  detectedBiases: DetectedBias[],
): string {
  const corrections: string[] = [];

  const highBiases = detectedBiases.filter((b) => b.likelihood === "high");
  const mediumBiases = detectedBiases.filter((b) => b.likelihood === "medium");

  if (highBiases.length > 0) {
    corrections.push(
      `**Bias Corrections Required (High Likelihood):**\n${highBiases.map((b) =>
        `- ${b.bias}: ${b.detection_question} → ${b.mitigation}`,
      ).join("\n")}`,
    );
  }

  if (mediumBiases.length > 0) {
    corrections.push(
      `**Bias Corrections Recommended (Medium Likelihood):**\n${mediumBiases.map((b) =>
        `- ${b.bias}: ${b.detection_question} → ${b.mitigation}`,
      ).join("\n")}`,
    );
  }

  const invalidRungs = ladderAnalysis.filter((a) => !a.valid_transition);
  if (invalidRungs.length > 0) {
    corrections.push(
      `**Ladder Rungs Requiring Re-examination:**\n${invalidRungs.map((a) =>
        `- ${a.step}: ${a.descent_question}`,
      ).join("\n")}`,
    );
  }

  corrections.push(
    `\n**Reconstruction Protocol:**\n` +
    `1. Start from the observable-data rung — list ALL available data, not just the convenient subset.\n` +
    `2. At selected-data — deliberately include data that contradicts your initial hypothesis.\n` +
    `3. At interpreted-meaning — generate at least 3 alternative interpretations for each data point.\n` +
    `4. At assumptions — list every assumption and rate its evidential support (strong/weak/untested).\n` +
    `5. At conclusions — only draw conclusions that follow from tested (not merely convenient) assumptions.\n` +
    `6. At beliefs — examine how existing beliefs are filtering each prior rung.\n` +
    `7. At actions — verify that the action follows from the corrected reasoning, not from bias-reinforced beliefs.`,
  );

  return corrections.join("\n\n");
}

// ─── Epistemic Status ────────────────────────────────────────────────────────

function computeEpistemicStatus(detectedBiases: DetectedBias[]): EpistemicStatus {
  const count = detectedBiases.length;
  if (count <= 1) return "well-supported";
  if (count <= 4) return "tentative";
  return "speculative";
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function escapeMd(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ").substring(0, 200);
}

function mdTable(headers: string[], rows: string[][]): string {
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

function formatOutput(
  reasoningChain: string,
  conclusion: string,
  ladderAnalysis: LadderAnalysis[],
  detectedBiases: DetectedBias[],
  loopAnalysis: RecursiveLoopAnalysis,
  blindSpots: BlindSpot[],
  outputDepth: OutputDepth,
  outputMode: OutputMode,
  fullText?: string,
  composeSection?: (thoughtType: ThoughtType, stepNumber: number, totalSections: number, prevOutputs: string[]) => string,
): string {
  const text = fullText ?? `${reasoningChain} ${conclusion}`;
  const composerAttempt = composeSection
    ? composeSection("synthetic", 5, 5, [])
    : composeToolContent({
        toolName: "think_metacognitive",
        text,
        initialPosition: conclusion,
        mode: "critical" as ThinkingMode,
        stepNumber: 5,
        totalSteps: 5,
        thoughtType: "synthetic" as ThoughtType,
        previousOutputs: [],
      });

  const sections: string[] = [];

  if (composerAttempt.length >= 50 && outputMode === "executive") {
    sections.push("## Metacognitive Audit\n");
    sections.push(`**Conclusion:** ${conclusion.substring(0, 200)}${conclusion.length > 200 ? "..." : ""}\n`);
    sections.push(composerAttempt);
    const epistemicStatus = computeEpistemicStatus(detectedBiases);
    const suggestedFollowup: SuggestedTool[] = ["think_cynefin", "think_first_principles"];
    sections.push(`\n**Epistemic Status:** ${epistemicStatus}`);
    sections.push(`**Suggested Follow-ups:** ${suggestedFollowup.join(", ")}`);
    return enforceLimit(sections.join("\n\n"));
  }

  sections.push("## Metacognitive Audit\n");
  sections.push(`**Reasoning Chain:** ${reasoningChain.substring(0, 200)}${reasoningChain.length > 200 ? "..." : ""}`);
  sections.push(`**Conclusion:** ${conclusion.substring(0, 200)}${conclusion.length > 200 ? "..." : ""}\n`);

  // Ladder of Inference
  sections.push("### Ladder of Inference\n");
  const ladderRows = ladderAnalysis.map((a) => [
    a.step,
    escapeMd(a.content_assessment),
    a.valid_transition ? "Yes" : "No",
    escapeMd(a.errors_detected.length > 0 ? a.errors_detected.join("; ") : "None detected"),
    escapeMd(a.descent_question),
  ]);
  sections.push(mdTable(
    ["Rung", "Content Assessment", "Valid Transition?", "Errors Detected", "Descent Question"],
    ladderRows,
  ));
  sections.push("");

  // Cognitive Bias Detection
  sections.push("### Cognitive Bias Detection\n");
  if (detectedBiases.length === 0) {
    sections.push("No cognitive bias signals detected in the reasoning chain. This does not guarantee absence of bias — it means no keyword or pattern signals matched the 20-bias library.\n");
  } else {
    const biasRows = detectedBiases.map((b) => [
      COGNITIVE_BIASES[b.bias].name,
      b.likelihood,
      escapeMd(b.evidence),
      escapeMd(b.mitigation),
    ]);
    sections.push(mdTable(
      ["Bias", "Likelihood", "Evidence from Reasoning", "Mitigation"],
      biasRows,
    ));
    sections.push("");
  }

  // Recursive Loop Analysis
  sections.push("### Recursive Loop Analysis\n");
  sections.push(`**Spiral Detected:** ${loopAnalysis.spiral_detected ? "Yes" : "No"}`);
  sections.push(`**Severity:** ${loopAnalysis.severity}\n`);
  sections.push(loopAnalysis.loop_description);
  if (loopAnalysis.loop_stages.length > 0) {
    sections.push("");
    sections.push(loopAnalysis.loop_stages.map((s) => `- ${s}`).join("\n"));
  }
  sections.push("");

  // Blind Spots
  sections.push("### Blind Spots\n");
  if (blindSpots.length === 0) {
    sections.push("No blind spots identified — all major perspective categories appear to have been considered.\n");
  } else {
    blindSpots.forEach((bs) => {
      sections.push(`#### ${bs.category}`);
      sections.push(`- **What wasn't considered:** ${bs.description}`);
      sections.push(`- **Why it was missed:** ${bs.why_missed}`);
      sections.push("");
    });
  }

  // Reconstructed Reasoning (exhaustive only)
  if (outputDepth === "exhaustive") {
    sections.push("### Reconstructed Reasoning\n");
    sections.push(reconstructReasoning(reasoningChain, conclusion, ladderAnalysis, detectedBiases));
    sections.push("");
  }

  // Meta-Analysis
  const epistemicStatus = computeEpistemicStatus(detectedBiases);
  const suggestedFollowup: SuggestedTool[] = ["think_cynefin", "think_first_principles"];
  if (outputDepth === "exhaustive") {
    suggestedFollowup.push("think_sequential");
  }

  sections.push("### Meta-Analysis\n");
  sections.push(`- **Epistemic Status:** ${epistemicStatus}`);
  sections.push(`- **Biases Detected:** ${detectedBiases.length} (${detectedBiases.filter((b) => b.likelihood === "high").length} high, ${detectedBiases.filter((b) => b.likelihood === "medium").length} medium, ${detectedBiases.filter((b) => b.likelihood === "low").length} low)`);
  sections.push(`- **Ladder Transitions Valid:** ${ladderAnalysis.filter((a) => a.valid_transition).length}/${ladderAnalysis.length}`);
  sections.push(`- **Recursive Loop:** ${loopAnalysis.severity}`);
  sections.push(`- **Suggested Follow-ups:** ${suggestedFollowup.join(", ")}`);

  if (outputMode === "executive") {
    const highLikelihoodBiases = detectedBiases.filter((b) => b.likelihood === "high");
    const executiveSummary = `This reasoning ${epistemicStatus === "well-supported" ? "appears well-supported" : epistemicStatus === "tentative" ? "is tentative due to" : "is speculative due to"} ${detectedBiases.length} detected bias(es)` +
      (highLikelihoodBiases.length > 0 ? `, including ${highLikelihoodBiases.map((b) => COGNITIVE_BIASES[b.bias].name).join(", ")}` : "") +
      `. ${ladderAnalysis.filter((a) => !a.valid_transition).length} of 7 ladder transitions were invalid. ` +
      `${blindSpots.length} blind spot(s) identified. ` +
      `Recommended: ${suggestedFollowup.join(", ")}.`;

    const metaIdx = sections.findIndex((s) => s.includes("### Meta-Analysis"));
    if (metaIdx >= 0) {
      sections.splice(0, metaIdx);
      sections.unshift(`## Metacognitive Audit\n\n**Conclusion:** ${conclusion.substring(0, 150)}${conclusion.length > 150 ? "..." : ""}\n\n${executiveSummary}`);
    }
  }

  return enforceLimit(sections.join("\n\n"));
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
    "think_metacognitive",
    {
      title: "Metacognitive Reasoning Audit",
      description:
        "Audits a chain of reasoning using Chris Argyris' Ladder of Inference and detects cognitive biases from a 20-bias library. " +
        "Traces the mental steps from observable data through selection, interpretation, assumptions, conclusions, beliefs, and actions. " +
        "Identifies where reasoning may have gone wrong and what blind spots exist. Essential for catching reasoning errors before they propagate into decisions.\n\n" +
        "The tool performs: (1) Ladder of Inference analysis across all 7 rungs with validity assessment, (2) Cognitive bias detection " +
        "against 20 biases from the Decision Lab taxonomy, (3) Recursive loop detection for confirmation bias spirals, " +
        "(4) Blind spot identification for unasked questions and unconsidered perspectives.\n\n" +
        "Use this tool when you need to audit your own or another agent's reasoning before acting on it. " +
        "Particularly valuable for high-stakes decisions, controversial conclusions, or when the reasoning feels 'too clean.'",
      inputSchema: z
        .object({
          reasoning_chain: z
            .string()
            .min(30)
            .describe(
              "The chain of reasoning or decision to audit. Should include the logical steps taken, " +
                "evidence considered, and the thought process that led to the conclusion."
            ),
          conclusion: z
            .string()
            .min(10)
            .describe(
              "The conclusion reached from this reasoning. The specific claim, decision, or judgment " +
                "that the reasoning chain supports."
            ),
          available_data: z
            .string()
            .optional()
            .describe(
              "What data was available to the reasoner before they began their analysis. " +
                "If not provided, the tool will infer available data from the reasoning chain itself."
            ),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard")
            .describe(
              "Controls the depth of the audit: 'essential' for quick bias scan, " +
                "'standard' for full ladder + bias + blind spot analysis, " +
                "'exhaustive' adds reconstructed reasoning showing how the reasoning would look if biases were corrected."
            ),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output presentation mode: 'executive' for concise summary with key findings, " +
                "'analytical' for full detailed output (default), 'exploratory' for detailed output with open questions."
            ),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          reasoning_chain,
          conclusion,
          available_data,
          output_depth,
          output_mode,
        } = args;

        // Hybrid mode: attempt content composer first, fall back to templates
        const fullText = reasoning_chain + " " + conclusion;
        const structure = getStructureForText(fullText, conclusion);

        // ThoughtType mapping per spec:
        // ladder rungs→'diagnostic', bias detection→'corrective',
        // blind spots→'perspectival', recursive loops→'relational',
        // reconstruction→'synthetic'
        const composeSection = (
          thoughtType: ThoughtType,
          stepNumber: number,
          totalSections: number,
          prevOutputs: string[],
        ): string => {
          return composeToolContent({
            toolName: "think_metacognitive",
            text: fullText,
            initialPosition: conclusion,
            mode: "critical" as ThinkingMode,
            stepNumber,
            totalSteps: totalSections,
            thoughtType,
            previousOutputs: prevOutputs,
          });
        };

        const detectedBiases = detectBiases(reasoning_chain, conclusion, fullText, composeSection);
        const ladderAnalysis = analyzeLadder(reasoning_chain, conclusion, available_data, detectedBiases, fullText, composeSection);
        const loopAnalysis = detectRecursiveLoops(reasoning_chain, conclusion, detectedBiases, fullText, composeSection);
        const blindSpots = identifyBlindSpots(reasoning_chain, conclusion, detectedBiases, fullText, composeSection);

        const markdown_output = formatOutput(
          reasoning_chain,
          conclusion,
          ladderAnalysis,
          detectedBiases,
          loopAnalysis,
          blindSpots,
          output_depth,
          output_mode,
          fullText,
          composeSection,
        );

        if (output_mode === "exploratory") {
          const openQuestions = [
            "What would the analysis look like if we inverted the conclusion and searched for evidence supporting the opposite position?",
            "Which of the detected biases, if corrected, would most significantly change the conclusion?",
            "What data would need to exist for this entire reasoning chain to be invalidated?",
          ];
          return {
            content: [{ type: "text", text: markdown_output + "\n\n## Open Questions\n\n" + openQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") }],
          };
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
