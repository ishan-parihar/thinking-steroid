/**
 * Tests for AXI CLI wrappers: --list-tools and --tool-info (AXI §8/§9).
 *
 * Tests the listTools() and toolInfo() functions from src/cli.ts.
 * Uses the project's custom test pattern with manual assertion helpers.
 */

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Test Helpers ──────────────────────────────────────────────

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, message: string): void {
  total++;
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertIncludes(haystack: string, needle: string, message: string): void {
  assert(haystack.includes(needle), `${message} — expected to contain "${needle}"`);
}

function assertNotStartsWith(text: string, prefix: string, message: string): void {
  assert(!text.startsWith(prefix), `${message} — expected not to start with "${prefix}"`);
}

// ── CLI Runner ────────────────────────────────────────────────

const CLI_PATH = path.resolve(__dirname, "../cli.ts");

function runCli(...args: string[]): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`npx tsx ${CLI_PATH} ${args.join(" ")}`, {
      encoding: "utf-8",
      timeout: 10_000,
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || "",
      exitCode: err.status || 1,
    };
  }
}

// ── Tests ─────────────────────────────────────────────────────

console.log("\n=== AXI CLI Wrappers Tests ===\n");

// ── --list-tools ──────────────────────────────────────────────

console.log("Test group: --list-tools (AXI §8 content-first)");

{
  const { stdout, exitCode } = runCli("--list-tools");

  assert(exitCode === 0, "--list-tools should exit with code 0");
  assertIncludes(stdout, "tools[13]", "Output should contain tools[13] header");

  const expectedTools = [
    "think_sequential",
    "think_polarity",
    "think_aqal_situational",
    "think_aqal_projection",
    "think_hierarchical",
    "think_shadow",
    "think_unity",
    "think_cynefin",
    "think_causal",
    "think_metacognitive",
    "think_first_principles",
    "think_scenario",
    "think_navigator",
  ];

  for (const tool of expectedTools) {
    assertIncludes(stdout, tool, `--list-tools should include ${tool}`);
  }

  assertIncludes(stdout, "help[", "Output should contain help hints");
  assertIncludes(stdout, "--tool-info", "Help hints should mention --tool-info");
  assertNotStartsWith(stdout.trim(), "{", "Output should use TOON format, not raw JSON");
}

// ── --tool-info (known tool) ─────────────────────────────────

console.log("\nTest group: --tool-info (AXI §9 contextual disclosure)");

{
  const { stdout, exitCode } = runCli("--tool-info", "think_sequential");

  assert(exitCode === 0, "--tool-info think_sequential should exit with code 0");

  let parsed: any;
  try {
    parsed = JSON.parse(stdout);
    assert(true, "Output should be valid JSON");
  } catch {
    assert(false, "Output should be valid JSON");
    parsed = null;
  }

  if (parsed) {
    assert(parsed.name === "think_sequential", "name should be think_sequential");
    assert(typeof parsed.description === "string", "description should be a string");
    assert(typeof parsed.parameters === "object", "parameters should be an object");
    assert(typeof parsed.returns === "string", "returns should be a string");
    assertIncludes(parsed.description, "sequential", "description should mention sequential");
  }
}

{
  const { stdout, exitCode } = runCli("--tool-info", "think_cynefin");

  assert(exitCode === 0, "--tool-info think_cynefin should exit with code 0");

  let parsed: any;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    assert(false, "think_cynefin output should be valid JSON");
    parsed = null;
  }

  if (parsed) {
    assert(parsed.name === "think_cynefin", "name should be think_cynefin");
    assertIncludes(parsed.returns, "Cynefin", "returns should mention Cynefin");
  }
}

// ── --tool-info (missing name) ───────────────────────────────

{
  const { exitCode } = runCli("--tool-info");
  assert(exitCode === 2, "--tool-info without name should exit with code 2");
}

// ── --tool-info (unknown tool) ───────────────────────────────

{
  const result = runCli("--tool-info", "nonexistent_tool");

  assert(result.exitCode === 2, "--tool-info with unknown tool should exit with code 2");

  // console.error writes to stderr; try both stderr and stdout
  const errorOutput = result.stderr || result.stdout;
  let parsed: any;
  try {
    parsed = JSON.parse(errorOutput.trim());
  } catch {
    // If neither is parseable, the test still validates the exit code
    parsed = null;
  }

  if (parsed) {
    assert(typeof parsed.error === "string", "Error should contain error field");
    assertIncludes(parsed.error, "nonexistent_tool", "Error should mention the tool name");
    assert(typeof parsed.help === "string", "Error should contain help field");
    assertIncludes(parsed.help, "Valid tools", "Help should suggest valid tools");
  }
}

// ── Summary ───────────────────────────────────────────────────

console.log(`\n=== Results: ${passed}/${total} passed, ${failed} failed ===\n`);

if (failed > 0) {
  process.exit(1);
}
