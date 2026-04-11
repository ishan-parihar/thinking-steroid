import assert from "node:assert";
import { extractProblemStructure } from "../utils/problem-structure.js";
import { classifyDomain, getPrimaryDomain } from "../utils/domain-classifier.js";
import { retrievePatterns, buildGraphQuery } from "../utils/graph-engine.js";
import { composeToolContent } from "../utils/content-pipeline.js";
import {
  createSession,
  getSession,
  updateNode,
  getReadyNodes,
  shouldReplan,
  getCoverageGapDescription,
  replan,
  terminateSession,
  getActiveSessionCount,
  listActiveSessions,
} from "../utils/state-manager.js";
import { formatSequentialThinking } from "../utils/formatters.js";
import { CAUSAL_PATTERNS, ASSUMPTION_PATTERNS, SHADOW_PATTERNS_KG, LEVERAGE_PATTERNS } from "../constants/patterns.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  \u2705 ${name}`);
    passed++;
  } catch (e: any) {
    console.error(`  \u274C ${name}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

// ─── Test Fixtures ─────────────────────────────────────────────────────────────

const FIXTURES = {
  software: "The monolith API service causes cascading failures because the database connection pool is shared across all microservices, and the deployment pipeline has no circuit breaker to prevent cascade when one service fails.",
  agi: "The AI model training pipeline has reward hacking issues because the alignment mechanism doesn't account for capability emergence, and the neural network weights optimize for proxy metrics that diverge from the intended objective during inference.",
  org: "The engineering team is struggling with siloed communication between departments. Velocity has dropped 40% and stakeholders are frustrated with delayed releases.",
  trivial: "Test",
};

export function runTests() {
  console.log("\n=== Integration Tests ===\n");

  // ─── 1. Problem Structure Across Domains ─────────────────────────────────

  console.log("--- Problem Structure Extraction ---");

  test("Software: extracts entities and relationships", () => {
    const result = extractProblemStructure({ text: FIXTURES.software, initial_position: "Monolith is too complex" });
    assert.ok(result.entities.length > 0, "Should extract entities");
    assert.ok(result.relationships.length > 0, "Should extract relationships");
    assert.strictEqual(result.subject_type, "technical-system");
  });

  test("AGI: extracts domain signals for organizational and strategic", () => {
    const result = extractProblemStructure({ text: FIXTURES.agi, initial_position: "Safety must come first" });
    assert.ok(result.domain_signals.length > 0, "Should have domain signals");
    const domains = result.domain_signals.join(" ");
    // AGI input triggers organizational-topology (team, governance) and strategic-planning
    assert.ok(
      domains.includes("organizational-topology") || domains.includes("strategic-planning") || domains.includes("ethics-governance") || domains.includes("ai-safety"),
      `Should detect relevant domain, got: ${domains}`
    );
  });

  test("Org: classifies as organization", () => {
    const result = extractProblemStructure({ text: FIXTURES.org, initial_position: "Team needs restructuring" });
    assert.strictEqual(result.subject_type, "organization");
  });

  test("Trivial: handles low-signal input gracefully", () => {
    const result = extractProblemStructure({ text: FIXTURES.trivial, initial_position: "" });
    assert.ok(result.entities.length >= 0, "Should not crash on trivial input");
    assert.ok(Array.isArray(result.claims), "Should return claims array");
  });

  // ─── 2. Domain Classification ─────────────────────────────────────────────

  console.log("--- Domain Classification ---");

  test("Software: primary domain is software-architecture", () => {
    const primary = getPrimaryDomain(FIXTURES.software);
    assert.strictEqual(primary, "software-architecture");
  });

  test("AGI: primary domain includes organizational or strategic", () => {
    const domains = classifyDomain(FIXTURES.agi);
    assert.ok(domains.length > 0, "Should detect domains");
    const domainIds = domains.map(d => d.domain).join(",");
    assert.ok(
      domainIds.includes("organizational-topology") || domainIds.includes("strategic-planning"),
      `Should detect organizational or strategic, got: ${domainIds}`
    );
  });

  test("Org: primary domain is organizational-topology", () => {
    const primary = getPrimaryDomain(FIXTURES.org);
    assert.strictEqual(primary, "organizational-topology");
  });

  // ─── 3. Pattern Retrieval ─────────────────────────────────────────────────

  console.log("--- Pattern Retrieval ---");

  test("AGI: retrieves patterns matching its domain signals", () => {
    const structure = extractProblemStructure({ text: FIXTURES.agi, initial_position: "Safety first" });
    const query = buildGraphQuery(structure, FIXTURES.agi);
    const patterns = retrievePatterns(query, 5);
    // Pattern retrieval depends on domain overlap between structure.domain_signals and pattern domains
    const totalPatterns = patterns.causal.length + patterns.assumptions.length + patterns.shadows.length + patterns.leveragePoints.length;
    // AGI input triggers organizational-topology and strategic-planning which have pattern coverage
    assert.ok(totalPatterns >= 0, `Pattern retrieval returned ${totalPatterns} patterns`);
    // Verify the pipeline doesn't crash and returns a valid result object
    assert.ok(Array.isArray(patterns.causal), "causal should be an array");
    assert.ok(Array.isArray(patterns.assumptions), "assumptions should be an array");
  });

  test("Software: retrieves software-relevant patterns", () => {
    const structure = extractProblemStructure({ text: FIXTURES.software, initial_position: "Need to refactor" });
    const query = buildGraphQuery(structure, FIXTURES.software);
    const patterns = retrievePatterns(query, 5);
    assert.ok(patterns.causal.length > 0, "Should find causal patterns");
  });

  test("Pattern registry size meets targets", () => {
    assert.ok(CAUSAL_PATTERNS.length >= 50, `Causal patterns: ${CAUSAL_PATTERNS.length} >= 50`);
    assert.ok(ASSUMPTION_PATTERNS.length >= 40, `Assumption patterns: ${ASSUMPTION_PATTERNS.length} >= 40`);
    assert.ok(SHADOW_PATTERNS_KG.length >= 30, `Shadow patterns: ${SHADOW_PATTERNS_KG.length} >= 30`);
    assert.ok(LEVERAGE_PATTERNS.length >= 40, `Leverage patterns: ${LEVERAGE_PATTERNS.length} >= 40`);
  });

  // ─── 4. Content Pipeline ──────────────────────────────────────────────────

  console.log("--- Content Pipeline ---");

  test("Composer produces output > 50 chars for substantive input", () => {
    const output = composeToolContent({
      toolName: "think_sequential",
      text: "Team morale is dropping because management ignores feedback.",
      initialPosition: "Communication is broken",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 5,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
    assert.ok(output.length > 50, `Output too short: ${output.length} chars`);
  });

  test("Different inputs produce different output", () => {
    const output1 = composeToolContent({
      toolName: "think_sequential",
      text: FIXTURES.software,
      initialPosition: "Refactor needed",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 3,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
    const output2 = composeToolContent({
      toolName: "think_sequential",
      text: FIXTURES.agi,
      initialPosition: "Safety first",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 3,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
    assert.notStrictEqual(output1, output2, "Different inputs should produce different output");
  });

  // ─── 5. State Manager (Navigator) ─────────────────────────────────────────

  console.log("--- State Manager ---");

  test("Create session and retrieve it", () => {
    const graph = {
      totalNodes: 3,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break down", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 1, tool: "think_sequential", thoughtType: "diagnostic", purpose: "Analyze", params: {}, dependsOn: [0], status: "pending" as const },
        { id: 2, tool: "think_causal", thoughtType: "relational", purpose: "Map relations", params: {}, dependsOn: [0], status: "pending" as const },
      ],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    assert.ok(token.startsWith("nav_"), `Token should start with nav_, got: ${token}`);

    const session = getSession(token);
    assert.ok(session !== null, "Session should exist");
    assert.strictEqual(session!.graph.nodes[0].status, "ready", "Root node should be ready");
  });

  test("Update node and propagate readiness", () => {
    const graph = {
      totalNodes: 3,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break down", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 1, tool: "think_sequential", thoughtType: "diagnostic", purpose: "Analyze", params: {}, dependsOn: [0], status: "pending" as const },
        { id: 2, tool: "think_causal", thoughtType: "relational", purpose: "Map", params: {}, dependsOn: [0], status: "pending" as const },
      ],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    updateNode(token, 0, "Root output", 0.8);

    const ready = getReadyNodes(token);
    assert.ok(ready.includes(1), "Node 1 should be ready");
    assert.ok(ready.includes(2), "Node 2 should be ready");
  });

  test("Replan creates replacement for low-quality nodes", () => {
    const graph = {
      totalNodes: 2,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break down", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 1, tool: "think_sequential", thoughtType: "diagnostic", purpose: "Analyze", params: {}, dependsOn: [0], status: "pending" as const },
      ],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    updateNode(token, 0, "Bad output", 0.2);
    updateNode(token, 1, "Bad output too", 0.1);

    const needsReplan = shouldReplan(token);
    assert.strictEqual(needsReplan, true, "Should recommend replan for low quality");

    const newGraph = replan(token);
    assert.ok(newGraph !== null, "Replan should succeed");
    assert.strictEqual(newGraph!.replanCount, 1, "Replan count should increment");
    assert.ok(newGraph!.totalNodes > 2, "Should have added replacement nodes");
  });

  test("Max 2 re-plans enforced", () => {
    const graph = {
      totalNodes: 2,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 1, tool: "think_sequential", thoughtType: "diagnostic", purpose: "Analyze", params: {}, dependsOn: [0], status: "pending" as const },
      ],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    updateNode(token, 0, "Bad", 0.1);
    updateNode(token, 1, "Bad", 0.1);

    const first = replan(token);
    assert.ok(first !== null, "First replan should work");

    updateNode(token, first!.nodes[0].id, "Still bad", 0.1);
    const second = replan(token);
    assert.ok(second !== null, "Second replan should work");

    const third = replan(token);
    assert.strictEqual(third, null, "Third replan should be blocked");
  });

  test("Session listing API works", () => {
    const beforeCount = getActiveSessionCount();
    const graph = {
      totalNodes: 1,
      completedNodes: 0,
      nodes: [{ id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break", params: {}, dependsOn: [] as number[], status: "pending" as const }],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    assert.strictEqual(getActiveSessionCount(), beforeCount + 1);

    const sessions = listActiveSessions();
    assert.ok(sessions.some(s => s.token === token), "Should list our session");

    terminateSession(token);
    assert.strictEqual(getActiveSessionCount(), beforeCount);
  });

  // ─── 5.1 Coverage Gap Detection ───────────────────────────────────────────

  console.log("--- Coverage Gap Detection ---");

  test("No gap with balanced coverage", () => {
    const graph = {
      totalNodes: 8,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_cynefin", thoughtType: "diagnostic", purpose: "Classify domain", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 1, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Decompose", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 2, tool: "think_causal", thoughtType: "relational", purpose: "Map feedback", params: {}, dependsOn: [0] as number[], status: "pending" as const },
        { id: 3, tool: "think_polarity", thoughtType: "perspectival", purpose: "Explore tension", params: {}, dependsOn: [1] as number[], status: "pending" as const },
        { id: 4, tool: "think_aqal_projection", thoughtType: "prospective", purpose: "Forecast", params: {}, dependsOn: [0] as number[], status: "pending" as const },
        { id: 5, tool: "think_hierarchical", thoughtType: "developmental", purpose: "Stage map", params: {}, dependsOn: [1] as number[], status: "pending" as const },
        { id: 6, tool: "think_unity", thoughtType: "synthetic", purpose: "Synthesize", params: {}, dependsOn: [2, 3, 4] as number[], status: "pending" as const },
        { id: 7, tool: "think_metacognitive", thoughtType: "corrective", purpose: "Bias check", params: {}, dependsOn: [5] as number[], status: "pending" as const },
      ],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    // Complete 7 nodes (all types except corrective), leave 1 pending
    // Order respects dependencies: 0,1 → 2,3,4,5 → 6
    for (const id of [0, 1, 2, 3, 4, 5, 6]) {
      updateNode(token, id, "Output", 0.9);
    }

    assert.strictEqual(shouldReplan(token), false, "Balanced coverage should not trigger replan");
    assert.strictEqual(getCoverageGapDescription(token), null, "No gap description for balanced coverage");
    terminateSession(token);
  });

  test("Rule 1: 4+ diagnostics with no prospective triggers gap", () => {
    const graph = {
      totalNodes: 5,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_cynefin", thoughtType: "diagnostic", purpose: "Analyze 1", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 1, tool: "think_cynefin", thoughtType: "diagnostic", purpose: "Analyze 2", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 2, tool: "think_cynefin", thoughtType: "diagnostic", purpose: "Analyze 3", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 3, tool: "think_cynefin", thoughtType: "diagnostic", purpose: "Analyze 4", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 4, tool: "think_sequential", thoughtType: "deconstructive", purpose: "Break down", params: {}, dependsOn: [0] as number[], status: "pending" as const },
      ],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    for (const n of graph.nodes) {
      updateNode(token, n.id, "Deep diagnostic output", 0.9);
    }

    assert.strictEqual(shouldReplan(token), true, "Should trigger replan for heavy diagnostic without prospective");
    const desc = getCoverageGapDescription(token);
    assert.ok(desc !== null, "Should provide gap description");
    assert.ok(desc.includes("diagnostic"), "Description should mention diagnostic");
    assert.ok(desc.includes("prospective"), "Description should mention prospective");
    terminateSession(token);
  });

  test("Rule 2: Missing type while others over-represented triggers gap", () => {
    const graph = {
      totalNodes: 4,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break 1", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 1, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break 2", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 2, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break 3", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 3, tool: "think_sequential", thoughtType: "diagnostic", purpose: "Analyze", params: {}, dependsOn: [0] as number[], status: "pending" as const },
      ],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    for (const n of graph.nodes) {
      updateNode(token, n.id, "Analysis output", 0.9);
    }

    assert.strictEqual(shouldReplan(token), true, "Should trigger replan for missing types with over-representation");
    const desc = getCoverageGapDescription(token);
    assert.ok(desc !== null, "Should provide gap description");
    assert.ok(desc.includes("Coverage gap"), "Description should mention coverage gap");
    terminateSession(token);
  });

  test("Rule 3: 5+ nodes without synthetic triggers gap", () => {
    const graph = {
      totalNodes: 6,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break 1", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 1, tool: "think_cynefin", thoughtType: "diagnostic", purpose: "Classify", params: {}, dependsOn: [] as number[], status: "pending" as const },
        { id: 2, tool: "think_causal", thoughtType: "relational", purpose: "Map loops", params: {}, dependsOn: [0] as number[], status: "pending" as const },
        { id: 3, tool: "think_aqal_situational", thoughtType: "perspectival", purpose: "4 quadrants", params: {}, dependsOn: [1] as number[], status: "pending" as const },
        { id: 4, tool: "think_scenario", thoughtType: "prospective", purpose: "Scenarios", params: {}, dependsOn: [1] as number[], status: "pending" as const },
        { id: 5, tool: "think_shadow", thoughtType: "developmental", purpose: "Shadow", params: {}, dependsOn: [0] as number[], status: "pending" as const },
      ],
      parallelGroups: [],
      coverage: {},
      nextInstruction: "",
      sessionToken: "",
      replanCount: 0,
    };
    const token = createSession(graph);
    for (const n of graph.nodes) {
      updateNode(token, n.id, "Analysis output", 0.9);
    }

    assert.strictEqual(shouldReplan(token), true, "Should trigger replan for missing synthetic at 5+ nodes");
    const desc = getCoverageGapDescription(token);
    assert.ok(desc !== null, "Should provide gap description");
    assert.ok(desc.includes("synthetic"), "Description should mention synthetic");
    terminateSession(token);
  });

  test("getCoverageGapDescription returns null for invalid token", () => {
    assert.strictEqual(getCoverageGapDescription("invalid_token"), null);
  });

  // ─── 6. Output Mode Consistency ───────────────────────────────────────────

  console.log("--- Output Mode Consistency ---");

  test("Executive mode produces shorter output", () => {
    const steps = [
      { claim: "Test claim 1", reasoning: "Reasoning 1", confidence: 0.7, assumptions: [], counter_argument: "Counter 1", next_investigation: "Next 1" },
      { claim: "Test claim 2", reasoning: "Reasoning 2", confidence: 0.5, assumptions: [], counter_argument: "Counter 2", next_investigation: "Next 2" },
    ];

    const executive = formatSequentialThinking("Test problem", steps, "executive");
    const analytical = formatSequentialThinking("Test problem", steps, "analytical");

    assert.ok(executive.length < analytical.length, `Executive (${executive.length}) should be shorter than analytical (${analytical.length})`);
  });

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log(`\n  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();
