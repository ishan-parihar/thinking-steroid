import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  OutputDepth,
  OutputMode,
  EpistemicStatus,
  SuggestedTool,
  CognitiveBias,
  LadderOfInferenceStep,
} from "../types.js";
import { COGNITIVE_BIASES, LADDER_OF_INFERENCE_STEPS } from "../constants.js";

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
): DetectedBias[] {
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

  return detected;
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
): RecursiveLoopAnalysis {
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
): BlindSpot[] {
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
): LadderAnalysis[] {
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

  const analysis: LadderAnalysis[] = [];

  for (const step of steps) {
    const stepInfo = LADDER_OF_INFERENCE_STEPS[step];
    const errors: string[] = [...stepInfo.common_errors];
    let validTransition = true;

    switch (step) {
      case "observable-data": {
        const contentAssessment = availableData
          ? `Available data provided: "${availableData.substring(0, 150)}${availableData.length > 150 ? "..." : ""}". The reasoning chain should explicitly reference what verifiable data was available at the start.`
          : "No explicit available_data provided. The reasoning chain must be scanned for references to raw, verifiable data. Without a clear baseline of observable data, the entire ladder rests on potentially selected or interpreted information.";

        if (!availableData || availableData.length < 50) {
          errors.push("Insufficient description of available data — the observable data pool may be incomplete or pre-filtered.");
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

      case "selected-data": {
        const hasDataSelection = combinedLower.includes("focused on") || combinedLower.includes("key") ||
          combinedLower.includes("relevant") || combinedLower.includes("noted") || combinedLower.includes("observed");
        const contentAssessment = hasDataSelection
          ? "The reasoning chain shows evidence of data selection — specific data points were prioritized over others. This is natural but introduces selection bias risk."
          : "No explicit data selection markers found. This could mean either (a) all available data was considered, or (b) selection happened unconsciously and is not visible in the reasoning chain.";

        if (biasNames.includes("confirmation-bias") || biasNames.includes("availability-heuristic") || biasNames.includes("recency-effect")) {
          errors.push(`Biased data selection detected: confirmation-bias, availability-heuristic, or recency-effect likely influenced which data was attended to.`);
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
        const hasInterpretation = combinedLower.includes("means") || combinedLower.includes("suggests") ||
          combinedLower.includes("indicates") || combinedLower.includes("implies") || combinedLower.includes("shows that");
        const contentAssessment = hasInterpretation
          ? "The reasoning chain contains interpretive language — data is being assigned meaning beyond its raw form. This is the critical step where facts become narratives."
          : "No clear interpretive language detected. Either meaning was assigned implicitly (and should be made explicit) or the reasoning stayed at the data level (unlikely given a conclusion exists).";

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
        const hasAssumptions = combinedLower.includes("assume") || combinedLower.includes("presume") ||
          combinedLower.includes("take for granted") || combinedLower.includes("given that") || combinedLower.includes("since");
        const contentAssessment = hasAssumptions
          ? "Explicit assumption markers detected in the reasoning chain. The assumptions should be catalogued and individually tested."
          : "No explicit assumption markers found. This is a red flag — all reasoning rests on assumptions. Their invisibility suggests they were never surfaced or examined.";

        if (!hasAssumptions) {
          errors.push("No assumptions were surfaced — invisible assumptions are the most dangerous because they cannot be tested.");
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
        const contentAssessment = `The stated conclusion is: "${conclusion.substring(0, 150)}${conclusion.length > 150 ? "..." : ""}". This conclusion should be evaluated for logical validity given the assumptions and interpretations that preceded it.`;

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
        const hasBelief = combinedLower.includes("believe") || combinedLower.includes("always") ||
          combinedLower.includes("never") || combinedLower.includes("the truth is") || combinedLower.includes("fundamentally");
        const contentAssessment = hasBelief
          ? "Belief-level statements detected — the reasoning has moved from specific conclusions to general beliefs that will influence future data selection."
          : "No explicit belief statements detected. The conclusion may remain situational rather than generalizing into a belief, or beliefs are implicit.";

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
        const hasAction = combinedLower.includes("should") || combinedLower.includes("must") ||
          combinedLower.includes("need to") || combinedLower.includes("we will") || combinedLower.includes("therefore we");
        const contentAssessment = hasAction
          ? "Action-oriented language detected — the reasoning chain is driving toward specific behaviors or decisions."
          : "No explicit action statements. The reasoning may be analytical without reaching the action rung, or actions are implied but not stated.";

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
): string {
  const sections: string[] = [];

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

  return sections.join("\n\n");
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

        const detectedBiases = detectBiases(reasoning_chain, conclusion);
        const ladderAnalysis = analyzeLadder(reasoning_chain, conclusion, available_data, detectedBiases);
        const loopAnalysis = detectRecursiveLoops(reasoning_chain, conclusion, detectedBiases);
        const blindSpots = identifyBlindSpots(reasoning_chain, conclusion, detectedBiases);

        const markdown_output = formatOutput(
          reasoning_chain,
          conclusion,
          ladderAnalysis,
          detectedBiases,
          loopAnalysis,
          blindSpots,
          output_depth,
          output_mode,
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
