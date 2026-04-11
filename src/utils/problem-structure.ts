import { DOMAINS } from "../constants/domains.js";
import type { ProblemStructure, SubjectType, SubjectTypeConfidence } from "../types.js";
import { classifyDomain } from "./domain-classifier.js";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "must", "ought",
  "it", "its", "this", "that", "these", "those",
  "i", "you", "he", "she", "we", "they",
  "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "just", "because", "as", "until", "while",
  "of", "at", "by", "for", "with", "about", "against", "between", "through",
  "during", "before", "after", "above", "below", "to", "from", "up", "down",
  "in", "out", "on", "off", "over", "under", "again", "further", "then",
  "once",
]);

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

function isValidEntity(s: string): boolean {
  const words = s.split(/\s+/);
  const meaningful = words.filter((w) => !isStopWord(w));
  return meaningful.length > 0 && s.length > 1;
}

function extractEntities(text: string): string[] {
  const entities = new Set<string>();
  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    // Capitalized multi-word terms
    const capMatches = sentence.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
    if (capMatches) {
      for (const m of capMatches) {
        const n = normalize(m);
        if (isValidEntity(n)) entities.add(n);
      }
    }

    // Terms preceded by determiners
    const detRegex = /\b(?:the|our|their|a|an)\s+([a-z]+(?:\s+[a-z]+){0,3})\b/gi;
    let m: RegExpExecArray | null;
    while ((m = detRegex.exec(sentence)) !== null) {
      const n = normalize(m[1]);
      if (isValidEntity(n)) entities.add(n);
    }
  }

  // Domain-specific terms
  const lower = text.toLowerCase();
  for (const [, domain] of Object.entries(DOMAINS)) {
    for (const term of domain.vocabulary) {
      if (lower.includes(term.toLowerCase())) {
        const n = normalize(term);
        if (isValidEntity(n)) entities.add(n);
      }
    }
  }

  return Array.from(entities);
}

function extractRelationships(text: string): string[] {
  const relationships: string[] = [];
  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    const trimmed = sentence.replace(/[.!?]+$/, "").trim();

    // Causal language patterns — process per sentence to avoid cross-sentence matches
    const causalVerbs =
      "causes|leads to|results in|affects|prevents|blocks|enables|creates|improves|reduces|increases|is blocked by|depends on";
    const causalRegex = new RegExp(
      `([^.]{1,60})\\s+(?:${causalVerbs})\\s+([^.]{1,60})`,
      "i",
    );
    const causalMatch = causalRegex.exec(trimmed);
    if (causalMatch) {
      const x = trimPhrase(causalMatch[1]);
      const y = trimPhrase(causalMatch[2]);
      const verbMatch = causalMatch[0].match(
        new RegExp(`\\s+(${causalVerbs})\\s+`, "i"),
      );
      const verb = verbMatch ? normalize(verbMatch[1]) : "affects";
      if (x && y) {
        relationships.push(`${x} → ${verb} → ${y}`);
      }
    }

    // Conflict language
    const conflictRegex = /([^.,;]{1,60})\s+(?:vs|conflicts with|competes with|trades off with)\s+([^.,;]{1,60})/i;
    const conflictMatch = conflictRegex.exec(trimmed);
    if (conflictMatch) {
      const x = trimPhrase(conflictMatch[1]);
      const y = trimPhrase(conflictMatch[2]);
      if (x && y) {
        relationships.push(`${x} ↔ conflict ↔ ${y}`);
      }
    }

    // Possessive patterns: "X's Y"
    const possessiveRegex = /([A-Za-z]+(?:\s+[A-Za-z]+){0,4})'s\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/g;
    let m: RegExpExecArray | null;
    while ((m = possessiveRegex.exec(trimmed)) !== null) {
      const x = normalize(m[1]);
      const y = normalize(m[2]);
      if (isValidEntity(x) && isValidEntity(y)) {
        relationships.push(`${x} → owns → ${y}`);
      }
    }
  }

  return relationships;
}

// Limit a captured phrase to N words, trimmed and cleaned
function trimPhrase(s: string, maxWords = 6): string {
  const cleaned = normalize(s).replace(/[,;:.!?]+$/, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function extractClaims(text: string, initialPosition: string): string[] {
  const claims: string[] = [];
  const sentences = splitSentences(text);

  const modalRegex = /\b(will|should|must|can|would|could)\b/i;
  const reasoningRegex = /\b(because|therefore|thus)\b/i;
  const needRegex = /^(we need|we should|we must|the team needs)\b/i;

  for (const sentence of sentences) {
    const trimmed = sentence.replace(/[.!?]+$/, "").trim().replace(/\s+/g, " ");
    if (
      modalRegex.test(sentence) ||
      reasoningRegex.test(sentence) ||
      needRegex.test(trimmed)
    ) {
      if (trimmed.length > 5) {
        claims.push(trimmed);
      }
    }
  }

  // initial_position is always an explicit claim
  const normalizedPosition = initialPosition.trim().replace(/\s+/g, " ");
  if (normalizedPosition && !claims.includes(normalizedPosition)) {
    claims.push(normalizedPosition);
  }

  return claims;
}

function extractUncertainties(text: string): string[] {
  const uncertainties: string[] = [];
  const sentences = splitSentences(text);

  const uncertaintyWords =
    /\b(unsure|unknown|unclear|risk|might|perhaps|possibly|uncertain)\b/i;
  const tensionWords = /\b(but|however|although|yet)\b/i;

  for (const sentence of sentences) {
    const trimmed = sentence.trim().replace(/\s+/g, " ");
    if (sentence.endsWith("?")) {
      uncertainties.push(trimmed);
    } else if (uncertaintyWords.test(sentence)) {
      uncertainties.push(trimmed);
    } else if (tensionWords.test(sentence)) {
      uncertainties.push(trimmed);
    }
  }

  return uncertainties;
}

function extractImplicitAssumptions(
  text: string,
  initialPosition: string,
): string[] {
  const assumptions: string[] = [];

  // Pattern: "X will solve Y" → assumption: "X is sufficient to solve Y"
  const solveRegex = /(\w+(?:\s+\w+){0,5})\s+will\s+solve\s+(\w+(?:\s+\w+){0,5})/gi;
  let m: RegExpExecArray | null;
  while ((m = solveRegex.exec(text)) !== null) {
    assumptions.push(`${m[1]} is sufficient to solve ${m[2]}`);
  }

  // Pattern: "if we build X, Y will improve" → assumption: "Y's constraint is X's absence"
  const buildRegex = /if\s+we\s+build\s+(\w+(?:\s+\w+){0,5}),\s+(\w+(?:\s+\w+){0,5})\s+will\s+improve/gi;
  while ((m = buildRegex.exec(text)) !== null) {
    assumptions.push(`${m[2]}'s constraint is ${m[1]}'s absence`);
  }

  // Pattern: "the team needs X" → assumption: "X is the bottleneck"
  const needRegex = /the\s+team\s+needs\s+(\w+(?:\s+\w+){0,5})/gi;
  while ((m = needRegex.exec(text)) !== null) {
    assumptions.push(`${m[1]} is the bottleneck`);
  }

  // Pattern: "X is the problem" → assumption: "Fixing X will resolve downstream effects"
  const problemRegex = /(\w+(?:\s+\w+){0,5})\s+is\s+the\s+problem/gi;
  while ((m = problemRegex.exec(text)) !== null) {
    assumptions.push(`Fixing ${m[1]} will resolve downstream effects`);
  }

  // Pattern: "we need to X" → assumption: "X is the right solution"
  const weNeedRegex = /we\s+need\s+to\s+(\w+(?:\s+\w+){0,5})/gi;
  while ((m = weNeedRegex.exec(text)) !== null) {
    assumptions.push(`${m[1]} is the right solution`);
  }

  // From initial_position: "X will solve Y" → inverse assumption
  const posSolveRegex = /(\w+(?:\s+\w+){0,5})\s+will\s+solve\s+(\w+(?:\s+\w+){0,5})/gi;
  while ((m = posSolveRegex.exec(initialPosition)) !== null) {
    assumptions.push(`current architecture is the constraint on ${m[2]}`);
  }

  // Deduplicate
  return [...new Set(assumptions)];
}

// Explicit vocabulary lists for subject-type classification
const SUBJECT_VOCABULARY: Record<string, string[]> = {
  "ai-system": [
    "agi", "model", "alignment", "training", "inference", "capability",
    "weights", "parameters", "transformer", "llm", "neural network",
    "reward function", "optimization", "loss", "gradient", "fine-tuning",
    "rlhf", "safety", "interpretability", "ai", "agent", "ml",
    "deep learning", "backpropagation", "activation", "layer", "epoch",
    "batch", "token", "embedding", "attention", "prompt", "generation",
    "hallucination", "benchmark", "eval", "scaling", "compute",
    "gpu", "tpu", "inference", "pretraining", "post-training",
  ],
  organization: [
    "team", "company", "department", "governance", "regulatory", "policy",
    "institutional", "board", "committee", "oversight", "compliance",
    "audit", "framework", "standard", "procedure", "bureaucracy",
    "hierarchy", "organization", "group", "stakeholder", "management",
    "leadership", "executive", "director", "vp", "c-suite", "budget",
    "resource allocation", "strategy", "roadmap", "initiative",
    "process", "workflow", "approval", "decision-making", "org chart",
    "matrix", "division", "unit", "branch", "subsidiary",
  ],
  "technical-system": [
    "api", "service", "database", "infrastructure", "deployment",
    "pipeline", "microservice", "monolith", "server", "client",
    "protocol", "network", "container", "orchestration", "ci/cd",
    "kubernetes", "docker", "cloud", "aws", "azure", "gcp",
    "cdn", "load balancer", "cache", "queue", "event bus",
    "graphql", "rest", "grpc", "http", "tcp", "dns",
    "ssl", "tls", "authentication", "authorization", "middleware",
    "frontend", "backend", "fullstack", "devops", "sre",
  ],
  human: [
    "person", "individual", "psychology", "belief", "emotion", "behavior",
    "identity", "motivation", "cognition", "perception", "memory",
    "habit", "trait", "personality", "wellbeing", "employee",
    "manager", "leader", "user", "customer", "stakeholder",
    "bias", "heuristic", "frustration", "satisfaction", "engagement",
    "burnout", "stress", "anxiety", "learning", "skill",
    "expertise", "intuition", "creativity", "empathy", "trust",
  ],
};

interface SubjectClassificationResult {
  type: SubjectType;
  confidence: SubjectTypeConfidence;
}

function classifySubjectType(entities: string[]): SubjectClassificationResult {
  const rawScores: Record<string, number> = {
    "ai-system": 0,
    organization: 0,
    "technical-system": 0,
    human: 0,
  };

  // Count vocabulary matches across all entities
  for (const entity of entities) {
    const lower = entity.toLowerCase();

    for (const [subjectType, vocabulary] of Object.entries(SUBJECT_VOCABULARY)) {
      for (const keyword of vocabulary) {
        if (lower.includes(keyword)) {
          rawScores[subjectType]++;
        }
      }
    }
  }

  // Normalize to 0-1 range based on max possible matches
  const maxVocabSize = Math.max(
    ...Object.values(SUBJECT_VOCABULARY).map((v) => v.length),
  );
  const totalMatches = Object.values(rawScores).reduce((a, b) => a + b, 0);

  const confidence: SubjectTypeConfidence = {
    "ai-system": totalMatches > 0 ? rawScores["ai-system"] / maxVocabSize : 0,
    organization: totalMatches > 0 ? rawScores.organization / maxVocabSize : 0,
    "technical-system": totalMatches > 0 ? rawScores["technical-system"] / maxVocabSize : 0,
    human: totalMatches > 0 ? rawScores.human / maxVocabSize : 0,
  };

  // Find the highest confidence type
  let bestType: SubjectType = "mixed";
  let bestScore = 0;
  let secondScore = 0;

  for (const [type, score] of Object.entries(confidence)) {
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestType = type as SubjectType;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // If no matches found, return mixed
  if (totalMatches === 0) {
    return { type: "mixed", confidence };
  }

  // If two types have similar scores (>30% of best), return mixed
  if (bestScore > 0 && secondScore / bestScore > 0.3) {
    return { type: "mixed", confidence };
  }

  return { type: bestType, confidence };
}

function classifyProblemType(
  relationships: string[],
  claims: string[],
  assumptions: string[],
  uncertainties: string[],
  subjectType: SubjectType,
): string {
  const causalCount = relationships.filter((r) => r.includes("→")).length;
  const conflictCount = relationships.filter((r) => r.includes("↔")).length;
  const assumptionCount = assumptions.length;
  const uncertaintyCount = uncertainties.length;
  const isHuman = subjectType === "human";
  const isOrg = subjectType === "organization";

  // Future-oriented claims
  const futureClaimCount = claims.filter(
    (c) => /\b(will|should|could|would)\b/i.test(c),
  ).length;

  const scores: Record<string, number> = {
    "architectural-decision": causalCount,
    "strategic-choice": conflictCount,
    "interpersonal-conflict": isHuman ? conflictCount + 2 : 0,
    "organizational-design": isOrg ? assumptionCount + 1 : 0,
    "strategic-planning": futureClaimCount,
    "exploratory-analysis": assumptionCount + uncertaintyCount,
    "general-analysis": 1,
  };

  let bestType = "general-analysis";
  let bestScore = 1;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

export function extractProblemStructure(params: {
  text: string;
  initial_position: string;
}): ProblemStructure {
  const { text, initial_position } = params;

  const entities = extractEntities(text);
  const relationships = extractRelationships(text);
  const claims = extractClaims(text, initial_position);
  const uncertainties = extractUncertainties(text);
  const implicit_assumptions = extractImplicitAssumptions(text, initial_position);
  const subjectClassification = classifySubjectType(entities);
  const subject_type = subjectClassification.type;

  // Domain classification
  const domainResults = classifyDomain(text);
  const domain_signals = domainResults
    .filter((d) => d.confidence > 0.05)
    .map((d) => d.domain);
  const primary_domain =
    domainResults.length > 0 && domainResults[0].confidence > 0.05
      ? domainResults[0].domain
      : "general";

  const problem_type = classifyProblemType(
    relationships,
    claims,
    implicit_assumptions,
    uncertainties,
    subject_type,
  );

  return {
    entities,
    relationships,
    claims,
    uncertainties,
    domain_signals,
    primary_domain,
    subject_type,
    subject_type_confidence: subjectClassification.confidence,
    problem_type,
    implicit_assumptions,
  };
}
