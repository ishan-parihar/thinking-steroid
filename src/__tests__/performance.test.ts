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
  replan,
  terminateSession,
} from "../utils/state-manager.js";

let passed = 0;
let failed = 0;

function benchmark(name: string, fn: () => void, maxMs: number) {
  const start = performance.now();
  fn();
  const elapsed = performance.now() - start;
  if (elapsed < maxMs) {
    console.log(`  \u2705 ${name}: ${elapsed.toFixed(2)}ms (< ${maxMs}ms)`);
    passed++;
  } else {
    console.error(`  \u274C ${name}: ${elapsed.toFixed(2)}ms (>= ${maxMs}ms)`);
    failed++;
  }
}

const TEST_INPUT = "The engineering team needs to refactor the monolith API service into microservices with proper database sharding, circuit breakers, and deployment pipelines to handle scalability while maintaining team velocity and stakeholder satisfaction.";

export function runTests() {
  console.log("\n=== Performance Benchmarks ===\n");

  benchmark("extractProblemStructure", () => {
    extractProblemStructure({ text: TEST_INPUT, initial_position: "Refactor needed" });
  }, 10);

  benchmark("classifyDomain", () => {
    classifyDomain(TEST_INPUT);
  }, 5);

  benchmark("getPrimaryDomain", () => {
    getPrimaryDomain(TEST_INPUT);
  }, 5);

  benchmark("buildGraphQuery", () => {
    const structure = extractProblemStructure({ text: TEST_INPUT, initial_position: "Refactor needed" });
    buildGraphQuery(structure, TEST_INPUT);
  }, 10);

  benchmark("retrievePatterns", () => {
    const structure = extractProblemStructure({ text: TEST_INPUT, initial_position: "Refactor needed" });
    const query = buildGraphQuery(structure, TEST_INPUT);
    retrievePatterns(query, 5);
  }, 10);

  benchmark("composeToolContent", () => {
    composeToolContent({
      toolName: "think_sequential",
      text: TEST_INPUT,
      initialPosition: "Refactor needed",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 5,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
  }, 10);

  benchmark("createSession (3 nodes)", () => {
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
    terminateSession(token);
  }, 5);

  benchmark("updateNode + getReadyNodes", () => {
    const graph = {
      totalNodes: 3,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break", params: {}, dependsOn: [] as number[], status: "pending" as const },
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
    updateNode(token, 0, "Output", 0.8);
    getReadyNodes(token);
    terminateSession(token);
  }, 5);

  benchmark("shouldReplan", () => {
    const graph = {
      totalNodes: 3,
      completedNodes: 0,
      nodes: [
        { id: 0, tool: "think_first_principles", thoughtType: "deconstructive", purpose: "Break", params: {}, dependsOn: [] as number[], status: "pending" as const },
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
    updateNode(token, 0, "Bad", 0.1);
    shouldReplan(token);
    terminateSession(token);
  }, 5);

  // Memory: actual heap usage measurement across 100 createSession+terminate cycles
  {
    const beforeHeap = process.memoryUsage().heapUsed;
    for (let i = 0; i < 100; i++) {
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
      terminateSession(token);
    }
    // Force GC if available
    if (global.gc) global.gc();
    const afterHeap = process.memoryUsage().heapUsed;
    const heapDeltaMB = (afterHeap - beforeHeap) / (1024 * 1024);
    const maxHeapMB = 5;
    if (heapDeltaMB < maxHeapMB) {
      console.log(`  \u2705 Memory: 100 cycles heap delta: ${heapDeltaMB.toFixed(2)}MB (< ${maxHeapMB}MB)`);
      passed++;
    } else {
      console.error(`  \u274C Memory: 100 cycles heap delta: ${heapDeltaMB.toFixed(2)}MB (>= ${maxHeapMB}MB)`);
      failed++;
    }
  }

  // Aggregate total pipeline: extractProblemStructure → buildGraphQuery → retrievePatterns → composeToolContent
  {
    const start = performance.now();
    const structure = extractProblemStructure({ text: TEST_INPUT, initial_position: "Refactor needed" });
    const query = buildGraphQuery(structure, TEST_INPUT);
    retrievePatterns(query, 5);
    composeToolContent({
      toolName: "think_sequential",
      text: TEST_INPUT,
      initialPosition: "Refactor needed",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 5,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
    const elapsed = performance.now() - start;
    if (elapsed < 25) {
      console.log(`  \u2705 Total pipeline overhead: ${elapsed.toFixed(2)}ms (< 25ms)`);
      passed++;
    } else {
      console.error(`  \u274C Total pipeline overhead: ${elapsed.toFixed(2)}ms (>= 25ms)`);
      failed++;
    }
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed out of ${passed + failed} benchmarks`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();
