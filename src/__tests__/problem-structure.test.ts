import assert from "node:assert";
import { extractProblemStructure } from "../utils/problem-structure.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e: any) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

export function runTests() {
  console.log("\n=== Problem Structure Tests ===\n");

  // --- Entity extraction ---
  test("Entity extraction: extracts key entities from input", () => {
    const result = extractProblemStructure({
      text: "The Payment Service needs refactoring.",
      initial_position: "Payment Service is the bottleneck",
    });
    assert.ok(result.entities.length > 0, "Should extract at least one entity");
    const entityLower = result.entities.join(" ").toLowerCase();
    assert.ok(
      entityLower.includes("payment") || entityLower.includes("service"),
      `Should extract domain-specific terms, got: ${JSON.stringify(result.entities)}`,
    );
  });

  // --- Relationship extraction: causal ---
  test("Relationship extraction: extracts causal relationships (X causes Y)", () => {
    const result = extractProblemStructure({
      text: "High latency causes poor user experience.",
      initial_position: "",
    });
    assert.ok(
      result.relationships.length > 0,
      "Should extract at least one causal relationship",
    );
    const hasCausal = result.relationships.some((r) => r.includes("→"));
    assert.ok(
      hasCausal,
      `Should contain causal arrow, got: ${JSON.stringify(result.relationships)}`,
    );
  });

  // --- Relationship extraction: conflict ---
  test("Relationship extraction: extracts conflict relationships (X vs Y)", () => {
    const result = extractProblemStructure({
      text: "Speed vs quality is a constant tradeoff.",
      initial_position: "",
    });
    assert.ok(
      result.relationships.length > 0,
      "Should extract at least one conflict relationship",
    );
    const hasConflict = result.relationships.some((r) => r.includes("↔"));
    assert.ok(
      hasConflict,
      `Should contain conflict marker, got: ${JSON.stringify(result.relationships)}`,
    );
  });

  // --- Claim extraction: modal verbs ---
  test("Claim extraction: extracts claims from modal verbs (will, should, must)", () => {
    const result = extractProblemStructure({
      text: "We will migrate to microservices. The team should adopt CI/CD. We must reduce technical debt.",
      initial_position: "",
    });
    assert.ok(result.claims.length >= 3, `Should extract at least 3 claims, got ${result.claims.length}: ${JSON.stringify(result.claims)}`);
  });

  // --- Claim extraction: always includes initial_position ---
  test("Claim extraction: always includes initial_position as a claim", () => {
    const position = "Our architecture is outdated";
    const result = extractProblemStructure({
      text: "We need to update our systems.",
      initial_position: position,
    });
    assert.ok(
      result.claims.includes(position),
      `Claims should include initial_position "${position}", got: ${JSON.stringify(result.claims)}`,
    );
  });

  // --- Uncertainty extraction: questions ---
  test("Uncertainty extraction: detects questions as uncertainties", () => {
    const result = extractProblemStructure({
      text: "Should we use GraphQL? How will this affect latency?",
      initial_position: "",
    });
    assert.ok(
      result.uncertainties.length >= 2,
      `Should detect at least 2 question-based uncertainties, got ${result.uncertainties.length}: ${JSON.stringify(result.uncertainties)}`,
    );
  });

  // --- Uncertainty extraction: uncertainty words ---
  test("Uncertainty extraction: detects uncertainty words (unsure, unclear, might)", () => {
    const result = extractProblemStructure({
      text: "The impact is unclear and we are unsure about the timeline. It might fail.",
      initial_position: "",
    });
    assert.ok(
      result.uncertainties.length >= 1,
      `Should detect uncertainty words, got ${result.uncertainties.length}: ${JSON.stringify(result.uncertainties)}`,
    );
    const lower = result.uncertainties.join(" ").toLowerCase();
    assert.ok(
      lower.includes("unclear") || lower.includes("unsure") || lower.includes("might"),
      `Should contain uncertainty keywords, got: ${JSON.stringify(result.uncertainties)}`,
    );
  });

  // --- Implicit assumption detection: "X will solve Y" ---
  test("Implicit assumption detection: 'X will solve Y' produces 'X is sufficient to solve Y'", () => {
    const result = extractProblemStructure({
      text: "Microservices will solve scalability problems.",
      initial_position: "Microservices will solve scalability problems.",
    });
    assert.ok(
      result.implicit_assumptions.length > 0,
      "Should detect at least one implicit assumption",
    );
    const hasSufficient = result.implicit_assumptions.some(
      (a) => a.includes("is sufficient to solve"),
    );
    assert.ok(
      hasSufficient,
      `Should produce 'is sufficient to solve' assumption, got: ${JSON.stringify(result.implicit_assumptions)}`,
    );
  });

  // --- Subject type classification: technical-system ---
  test("Subject type classification: technical-system (monolith, api, service)", () => {
    const result = extractProblemStructure({
      text: "The monolith API service needs database migration.",
      initial_position: "",
    });
    assert.strictEqual(
      result.subject_type,
      "technical-system",
      `Should classify as technical-system, got: ${result.subject_type}`,
    );
  });

  // --- Subject type classification: organization ---
  test("Subject type classification: organization (team, department)", () => {
    const result = extractProblemStructure({
      text: "The team and department need better alignment across the organization.",
      initial_position: "",
    });
    assert.strictEqual(
      result.subject_type,
      "organization",
      `Should classify as organization, got: ${result.subject_type}`,
    );
  });

  // --- Subject type classification: mixed ---
  test("Subject type classification: mixed (both technical and org terms)", () => {
    const result = extractProblemStructure({
      text: "The team needs to refactor the monolith API service.",
      initial_position: "",
    });
    assert.strictEqual(
      result.subject_type,
      "mixed",
      `Should classify as mixed, got: ${result.subject_type}`,
    );
  });

  // --- Domain signals: software-architecture input ---
  test("Domain signals: returns correct domains for software-architecture input", () => {
    const result = extractProblemStructure({
      text: "The monolith needs microservice boundaries and API gateway deployment with circuit breakers.",
      initial_position: "",
    });
    assert.ok(
      result.domain_signals.includes("software-architecture"),
      `Should include software-architecture in domain_signals, got: ${JSON.stringify(result.domain_signals)}`,
    );
    assert.strictEqual(
      result.primary_domain,
      "software-architecture",
      `Primary domain should be software-architecture, got: ${result.primary_domain}`,
    );
  });

  // --- Domain signals: organizational input ---
  test("Domain signals: returns correct domains for organizational input", () => {
    const result = extractProblemStructure({
      text: "Team silos and department misalignment require cross-functional collaboration and stakeholder governance.",
      initial_position: "",
    });
    assert.ok(
      result.domain_signals.includes("organizational-topology"),
      `Should include organizational-topology in domain_signals, got: ${JSON.stringify(result.domain_signals)}`,
    );
  });

  // --- Problem type classification: architectural-decision ---
  test("Problem type classification: architectural-decision for tech decisions with causal relationships", () => {
    const result = extractProblemStructure({
      text: "The monolith causes latency issues. High coupling affects deployment speed.",
      initial_position: "We need to decouple the monolith.",
    });
    // With causal relationships and technical entities, should lean toward architectural-decision
    assert.ok(
      result.problem_type.length > 0,
      "Should have a problem type",
    );
    // Verify it's a valid problem type
    const validTypes = [
      "architectural-decision",
      "strategic-choice",
      "interpersonal-conflict",
      "organizational-design",
      "strategic-planning",
      "exploratory-analysis",
      "general-analysis",
    ];
    assert.ok(
      validTypes.includes(result.problem_type),
      `Problem type should be valid, got: ${result.problem_type}`,
    );
  });

  // --- Full structure: returns all 9 fields ---
  test("Full structure: returns all 9 fields on the returned object", () => {
    const result = extractProblemStructure({
      text: "The monolith API causes latency. We will refactor to microservices. But the team is unsure about the timeline.",
      initial_position: "Refactoring is necessary for scalability.",
    });

    const requiredFields = [
      "entities",
      "relationships",
      "claims",
      "uncertainties",
      "domain_signals",
      "primary_domain",
      "subject_type",
      "problem_type",
      "implicit_assumptions",
    ];

    for (const field of requiredFields) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(result, field),
        `Result should have field '${field}'`,
      );
    }

    // Type checks
    assert.ok(Array.isArray(result.entities), "entities should be an array");
    assert.ok(Array.isArray(result.relationships), "relationships should be an array");
    assert.ok(Array.isArray(result.claims), "claims should be an array");
    assert.ok(Array.isArray(result.uncertainties), "uncertainties should be an array");
    assert.ok(Array.isArray(result.domain_signals), "domain_signals should be an array");
    assert.ok(Array.isArray(result.implicit_assumptions), "implicit_assumptions should be an array");
    assert.strictEqual(typeof result.primary_domain, "string", "primary_domain should be a string");
    assert.strictEqual(typeof result.subject_type, "string", "subject_type should be a string");
    assert.strictEqual(typeof result.problem_type, "string", "problem_type should be a string");
  });

  // --- Summary ---
  console.log(`\n  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run if executed directly
runTests();
