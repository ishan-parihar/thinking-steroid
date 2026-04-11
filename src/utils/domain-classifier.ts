import { DOMAINS } from "../constants/domains.js";

/**
 * Classify a text into domains based on keyword matching against the domain taxonomy.
 * Returns an array of { domain, confidence } sorted by confidence descending.
 * Only includes domains with confidence > 0.05.
 */
export function classifyDomain(
  text: string,
): { domain: string; confidence: number }[] {
  const lower = text.toLowerCase();
  const wordCount = Math.max(1, text.split(/\s+/).length);

  const results: { domain: string; confidence: number }[] = [];

  for (const [, domain] of Object.entries(DOMAINS)) {
    let matchCount = 0;
    for (const term of domain.vocabulary) {
      if (lower.includes(term.toLowerCase())) {
        matchCount++;
      }
    }

    const rawScore = matchCount / domain.vocabulary.length;
    const densityScore = (matchCount / wordCount) * 100;
    const confidence = Math.min(1, rawScore * 2 + densityScore);

    if (confidence > 0.05) {
      results.push({ domain: domain.id, confidence });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

/**
 * Return the highest-confidence domain ID, or null if none exceeds 0.1.
 */
export function getPrimaryDomain(text: string): string | null {
  const results = classifyDomain(text);
  if (results.length === 0 || results[0].confidence <= 0.1) {
    return null;
  }
  return results[0].domain;
}
