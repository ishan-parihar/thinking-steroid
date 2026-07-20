#!/usr/bin/env node

import { execSync } from "child_process";

const TOOLS = [
  ["think_sequential", "Step-by-step sequential reasoning with branching paths"],
  ["think_polarity", "Dialectical tension mapping between opposing poles"],
  ["think_aqal_situational", "4-quadrant situational analysis with optional psychograph"],
  ["think_aqal_projection", "Temporal projections across AQAL quadrants"],
  ["think_hierarchical", "Developmental stage mapping with vision-logic substages"],
  ["think_shadow", "Unconscious pattern detection with Jungian archetypes"],
  ["think_unity", "Multi-system grand synthesis across all modalities"],
  ["think_cynefin", "Domain classification (clear/complicated/complex/chaotic/disordered)"],
  ["think_causal", "Causal loop diagrams + Meadows leverage points"],
  ["think_metacognitive", "Ladder of inference + cognitive bias audit"],
  ["think_first_principles", "Socratic decomposition from bedrock facts"],
  ["think_scenario", "2x2 scenario matrix + pre-mortem + futures wheel"],
  ["think_navigator", "DAG-based reasoning planning with dependency tracking"],
];

function listTools(): void {
  console.log(`tools[${TOOLS.length}]{name,description}:`);
  for (const [name, desc] of TOOLS) {
    console.log(`  ${name},${desc}`);
  }
  console.log();
  console.log("help[2]:");
  console.log("  Run `thinking-steroid --tool-info <name>` for details");
  console.log("  Run `thinking-steroid` to start the MCP server");
}

function toolInfo(name: string): void {
  const info: Record<string, any> = {
    think_sequential: {
      name: "think_sequential",
      description: "Step-by-step sequential reasoning with branching paths",
      parameters: { problem: "string (required)", steps: "array (optional)", branchAt: "number[] (optional)" },
      returns: "Sequential reasoning trace with branching analysis",
    },
    think_polarity: {
      name: "think_polarity",
      description: "Dialectical tension mapping between opposing poles",
      parameters: { poles: "{a: string, b: string} (required)", context: "string (optional)" },
      returns: "Polarity map with archetype and recommendations",
    },
    think_navigator: {
      name: "think_navigator",
      description: "DAG-based reasoning planning with dependency tracking and parallel execution",
      parameters: { problem: "string (required)", plan: "array of reasoning nodes (optional)" },
      returns: "Reasoning plan with dependencies and execution status",
    },
  };
  if (info[name]) {
    console.log(JSON.stringify(info[name], null, 2));
  } else {
    console.error(JSON.stringify({ error: `Unknown tool: '${name}'`, help: `Valid tools: ${TOOLS.map(t => t[0]).join(", ")}` }));
    process.exit(2);
  }
}

const args = process.argv.slice(2);
if (args.includes("--list-tools")) {
  listTools();
} else if (args.includes("--tool-info")) {
  const idx = args.indexOf("--tool-info");
  const name = args[idx + 1];
  if (!name) {
    console.error(JSON.stringify({ error: "--tool-info requires a tool name" }));
    process.exit(2);
  }
  toolInfo(name);
} else {
  // No CLI args — run MCP server (AXI §8: content-first home view is via --list-tools)
  import("./index.js");
}
