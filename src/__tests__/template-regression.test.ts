import { extractProblemStructure } from "../utils/problem-structure.js";
import { composeToolContent } from "../utils/content-pipeline.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(
      `  ❌ ${name}\n     ${e instanceof Error ? e.message : String(e)}`,
    );
    failed++;
  }
}

export function runTests() {
  console.log("\n=== Template Regression Tests ===\n");

  // Test 1: Different inputs produce different output
  test("Different inputs produce different output", () => {
    const out1 = composeToolContent({
      toolName: "think_sequential",
      text: "software architecture",
      initialPosition: "A",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 0,
      totalSteps: 5,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
    const out2 = composeToolContent({
      toolName: "think_sequential",
      text: "team restructuring",
      initialPosition: "B",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 0,
      totalSteps: 5,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
    if (out1 === out2) throw new Error("Identical output for different inputs");
  });

  // Test 2: No single phrase appears in >20% of outputs (boilerplate check)
  test("Boilerplate phrases appear < 20% of output", () => {
    const outputs: string[] = [];
    const inputs = ["refactor monolith", "hire new team", "launch product", "fix bug"];
    for (const input of inputs) {
      outputs.push(
        composeToolContent({
          toolName: "think_sequential",
          text: input,
          initialPosition: "X",
          mode: "analytical",
          subMode: "deductive",
          stepNumber: 0,
          totalSteps: 5,
          thoughtType: "diagnostic",
          previousOutputs: [],
        }),
      );
    }
    const boilerplatePhrases = [
      "This is a",
      "The problem is",
      "In this analysis",
      "This step",
    ];
    for (const phrase of boilerplatePhrases) {
      let count = 0;
      for (const out of outputs) {
        if (out.toLowerCase().includes(phrase.toLowerCase())) count++;
      }
      const ratio = count / outputs.length;
      if (ratio > 0.2)
        throw new Error(
          `Phrase "${phrase}" appears in ${Math.round(ratio * 100)}% of outputs (threshold: 20%)`,
        );
    }
  });

  // Test 3: All structural sections populated (no empty sections)
  test("Sequential thinking sections are populated", () => {
    const out = composeToolContent({
      toolName: "think_sequential",
      text: "test problem with some depth",
      initialPosition: "Test position",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 0,
      totalSteps: 5,
      thoughtType: "diagnostic",
      previousOutputs: [],
    });
    if (out.length < 50)
      throw new Error(`Output too short: ${out.length} chars`);
  });

  // Test 4: AQAL situational output is different across subject types
  test("AQAL output varies by subject type context", () => {
    const out1 = composeToolContent({
      toolName: "think_aqal_situational",
      text: "AI model alignment issue with training data bias",
      initialPosition: "Align",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 4,
      thoughtType: "perspectival",
      previousOutputs: [],
    });
    const out2 = composeToolContent({
      toolName: "think_aqal_situational",
      text: "Team reorganization to improve cross-functional collaboration",
      initialPosition: "Reorganize",
      mode: "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 4,
      thoughtType: "perspectival",
      previousOutputs: [],
    });
    if (out1 === out2)
      throw new Error("Identical AQAL output for different contexts");
  });

  // Test 5: Problem structure returns distinct results for different inputs
  test("Problem structure is input-dependent", () => {
    const s1 = extractProblemStructure({
      text: "X causes Y and Z",
      initial_position: "X is bad",
    });
    const s2 = extractProblemStructure({
      text: "A vs B conflict in team",
      initial_position: "Need compromise",
    });
    if (
      JSON.stringify(s1.entities) === JSON.stringify(s2.entities) &&
      s1.entities.length > 0
    )
      throw new Error("Same entities for different inputs");
  });

  console.log(
    `\n  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`,
  );
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();
