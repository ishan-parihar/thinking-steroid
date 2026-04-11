import assert from "node:assert";
import { classifyDomain, getPrimaryDomain } from "../utils/domain-classifier.js";
import { DOMAINS } from "../constants/domains.js";

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
  console.log("\n=== Domain Classifier Tests ===\n");

  // --- Single domain classification ---
  test("Single domain classification: software-architecture input returns software-architecture as primary", () => {
    const input =
      "We need to refactor the monolith into microservices with proper API boundaries, database sharding, and circuit breakers for scalability.";
    const results = classifyDomain(input);
    assert.ok(results.length > 0, "Should return at least one domain");
    assert.strictEqual(
      results[0].domain,
      "software-architecture",
      "Primary domain should be software-architecture",
    );
    assert.ok(
      results[0].confidence > 0.1,
      `Confidence should exceed 0.1, got ${results[0].confidence}`,
    );
  });

  // --- Organizational topology detection ---
  test("Organizational topology detection: detects team silos and departments", () => {
    const input =
      "The team silos between departments are causing communication problems. We need cross-functional collaboration and a reorg to improve alignment.";
    const results = classifyDomain(input);
    const orgDomain = results.find(
      (r) => r.domain === "organizational-topology",
    );
    assert.ok(orgDomain, "Should detect organizational-topology domain");
    assert.ok(
      orgDomain!.confidence > 0.1,
      `Organizational confidence should exceed 0.1, got ${orgDomain!.confidence}`,
    );
  });

  // --- Strategic planning detection ---
  test("Strategic planning detection: detects strategy, roadmap, market keywords", () => {
    const input =
      "Our strategy roadmap needs to account for competitive market positioning, risk assessment, and scenario planning with clear milestones.";
    const results = classifyDomain(input);
    const stratDomain = results.find(
      (r) => r.domain === "strategic-planning",
    );
    assert.ok(stratDomain, "Should detect strategic-planning domain");
    assert.ok(
      stratDomain!.confidence > 0.1,
      `Strategic planning confidence should exceed 0.1, got ${stratDomain!.confidence}`,
    );
  });

  // --- Interpersonal dynamics detection ---
  test("Interpersonal dynamics detection: detects trust, communication, conflict", () => {
    const input =
      "There is a lack of trust in the relationship. Communication breakdown leads to conflict, and we need empathy and psychological safety to rebuild rapport.";
    const results = classifyDomain(input);
    const interpDomain = results.find(
      (r) => r.domain === "interpersonal-dynamics",
    );
    assert.ok(interpDomain, "Should detect interpersonal-dynamics domain");
    assert.ok(
      interpDomain!.confidence > 0.1,
      `Interpersonal confidence should exceed 0.1, got ${interpDomain!.confidence}`,
    );
  });

  // --- Financial planning detection ---
  test("Financial planning detection: detects revenue, cost, margin, roi", () => {
    const input =
      "We need to track revenue and cost to improve margin. The ROI on our investment depends on cashflow forecast and unit economics including ltv and cac.";
    const results = classifyDomain(input);
    const finDomain = results.find((r) => r.domain === "financial-planning");
    assert.ok(finDomain, "Should detect financial-planning domain");
    assert.ok(
      finDomain!.confidence > 0.1,
      `Financial planning confidence should exceed 0.1, got ${finDomain!.confidence}`,
    );
  });

  // --- Product management detection ---
  test("Product management detection: detects user, feature, backlog, churn", () => {
    const input =
      "The user feature backlog needs prioritization. We must reduce churn through better retention, activation metrics, and achieving product-market fit.";
    const results = classifyDomain(input);
    const pmDomain = results.find(
      (r) => r.domain === "product-management",
    );
    assert.ok(pmDomain, "Should detect product-management domain");
    assert.ok(
      pmDomain!.confidence > 0.1,
      `Product management confidence should exceed 0.1, got ${pmDomain!.confidence}`,
    );
  });

  // --- Leadership development detection ---
  test("Leadership development detection: detects vision, delegation, coaching", () => {
    const input =
      "Leadership requires clear vision, effective delegation, and coaching. Accountability and mentorship drive team building and emotional intelligence.";
    const results = classifyDomain(input);
    const leadDomain = results.find(
      (r) => r.domain === "leadership-development",
    );
    assert.ok(leadDomain, "Should detect leadership-development domain");
    assert.ok(
      leadDomain!.confidence > 0.1,
      `Leadership confidence should exceed 0.1, got ${leadDomain!.confidence}`,
    );
  });

  // --- Systems thinking detection ---
  test("Systems thinking detection: detects feedback loop, emergence, leverage point", () => {
    const input =
      "The feedback loop shows emergence at the leverage point. We need to understand the balancing and reinforcing causal loops, system dynamics, and complexity.";
    const results = classifyDomain(input);
    const sysDomain = results.find((r) => r.domain === "systems-thinking");
    assert.ok(sysDomain, "Should detect systems-thinking domain");
    assert.ok(
      sysDomain!.confidence > 0.1,
      `Systems thinking confidence should exceed 0.1, got ${sysDomain!.confidence}`,
    );
  });

  // --- Ethics governance detection ---
  test("Ethics governance detection: detects compliance, transparency, fairness", () => {
    const input =
      "Compliance requires transparency and fairness. We need an audit framework for oversight, regulation, policy standards, and responsible governance.";
    const results = classifyDomain(input);
    const ethicsDomain = results.find(
      (r) => r.domain === "ethics-governance",
    );
    assert.ok(ethicsDomain, "Should detect ethics-governance domain");
    assert.ok(
      ethicsDomain!.confidence > 0.1,
      `Ethics confidence should exceed 0.1, got ${ethicsDomain!.confidence}`,
    );
  });

  // --- Personal development detection ---
  test("Personal development detection: detects habit, identity, growth, resilience", () => {
    const input =
      "Building a growth mindset requires habit formation, identity shift, and resilience. Self-awareness, motivation, discipline, and mindfulness lead to well-being.";
    const results = classifyDomain(input);
    const pdDomain = results.find(
      (r) => r.domain === "personal-development",
    );
    assert.ok(pdDomain, "Should detect personal-development domain");
    assert.ok(
      pdDomain!.confidence > 0.1,
      `Personal development confidence should exceed 0.1, got ${pdDomain!.confidence}`,
    );
  });

  // --- Multi-domain classification ---
  test("Multi-domain classification: input spanning software + org returns both domains", () => {
    const input =
      "The monolith architecture causes team silos. Microservice boundaries need cross-functional departments to handle API deployment and stakeholder alignment.";
    const results = classifyDomain(input);
    assert.ok(
      results.length >= 2,
      `Should return at least 2 domains, got ${results.length}`,
    );
    const domainIds = results.map((r) => r.domain);
    assert.ok(
      domainIds.includes("software-architecture"),
      "Should include software-architecture",
    );
    assert.ok(
      domainIds.includes("organizational-topology"),
      "Should include organizational-topology",
    );
  });

  // --- Low-confidence input ---
  test("Low-confidence input: random text returns few or no domains", () => {
    const input = "asdf jklp qwerty banana umbrella moonlight xyzzy";
    const results = classifyDomain(input);
    // With random text, should have very few matches (ideally zero or just noise)
    assert.ok(
      results.length <= 3,
      `Random text should return few domains, got ${results.length}`,
    );
    // If any domains returned, confidence should be very low
    for (const r of results) {
      assert.ok(
        r.confidence < 0.3,
        `Random text confidence should be low, got ${r.confidence} for ${r.domain}`,
      );
    }
  });

  // --- Confidence scores are between 0 and 1 ---
  test("Confidence scores are always between 0 and 1", () => {
    const testInputs = [
      "The monolith API deployment needs circuit breaker and event-driven database scaling",
      "team silos department cross-functional matrix alignment culture collaboration",
      "habit identity belief pattern growth mindset resilience meditation mindfulness",
      "xyzzy florp quux banana",
      "",
      "a",
    ];

    for (const input of testInputs) {
      const results = classifyDomain(input);
      for (const r of results) {
        assert.ok(
          r.confidence >= 0 && r.confidence <= 1,
          `Confidence for "${input}" on domain "${r.domain}" should be in [0,1], got ${r.confidence}`,
        );
      }
    }
  });

  // --- Results sorted by confidence descending ---
  test("Results are sorted by confidence descending", () => {
    const input =
      "The monolith microservice API deployment needs team cross-functional stakeholder alignment and strategy roadmap competitive market positioning";
    const results = classifyDomain(input);
    for (let i = 1; i < results.length; i++) {
      assert.ok(
        results[i - 1].confidence >= results[i].confidence,
        `Results should be sorted descending: ${results[i - 1].domain}(${results[i - 1].confidence}) >= ${results[i].domain}(${results[i].confidence})`,
      );
    }
  });

  // --- getPrimaryDomain returns null for low-confidence input ---
  test("getPrimaryDomain returns null for empty input", () => {
    const result = getPrimaryDomain("");
    assert.strictEqual(result, null, "Empty input should return null");
  });

  test("getPrimaryDomain returns correct domain for clear input", () => {
    const result = getPrimaryDomain(
      "The monolith needs microservice API boundaries and database caching",
    );
    assert.strictEqual(
      result,
      "software-architecture",
      "Should return software-architecture",
    );
  });

  // --- Summary ---
  console.log(`\n  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run if executed directly
runTests();
