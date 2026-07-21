#!/usr/bin/env node

// AXI §8: content-first CLI for tool discovery
// AXI §9: contextual disclosure via --tool-info

const TOOLS: [string, string][] = [
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
  console.log("tools[" + TOOLS.length + "]{name,description}:");
  for (const [name, desc] of TOOLS) {
    console.log("  " + name + "," + desc);
  }
  console.log();
  console.log("help[2]:");
  console.log("  Run `thinking-steroid --tool-info <name>` for details");
  console.log("  Run `thinking-steroid` to start the MCP server");
}

interface ToolInfo {
  name: string;
  description: string;
  parameters: Record<string, string>;
  returns: string;
}

function toolInfo(name: string): void {
  const info: Record<string, ToolInfo> = {
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
    think_aqal_situational: {
      name: "think_aqal_situational",
      description: "4-quadrant situational analysis (internal/external x individual/collective)",
      parameters: { situation: "string (required)", include_psychograph: "boolean (optional)" },
      returns: "AQAL quadrants with analysis and optional psychograph",
    },
    think_aqal_projection: {
      name: "think_aqal_projection",
      description: "Temporal projections across AQAL quadrants",
      parameters: { situation: "string (required)", timeframes: "string[] (optional)" },
      returns: "Projected outcomes across past/present/future in each quadrant",
    },
    think_hierarchical: {
      name: "think_hierarchical",
      description: "Developmental stage mapping with vision-logic substages",
      parameters: { situation: "string (required)", include_substages: "boolean (optional)" },
      returns: "Developmental stage analysis with level recommendations",
    },
    think_shadow: {
      name: "think_shadow",
      description: "Unconscious pattern detection with Jungian archetypes",
      parameters: { situation: "string (required)", depth: "essential|standard|exhaustive (default standard)" },
      returns: "Shadow patterns, archetypal motifs, and integration recommendations",
    },
    think_unity: {
      name: "think_unity",
      description: "Multi-system grand synthesis across all modalities",
      parameters: { situation: "string (required)", inputs: "object[] (optional)" },
      returns: "Unified synthesis integrating all reasoning modalities",
    },
    think_cynefin: {
      name: "think_cynefin",
      description: "Domain classification (clear/complicated/complex/chaotic/disordered) for tool routing",
      parameters: { situation: "string (required)" },
      returns: "Cynefin domain classification with recommended response strategy",
    },
    think_causal: {
      name: "think_causal",
      description: "Causal loop diagrams + Meadows leverage points + systems archetypes",
      parameters: { situation: "string (required)", include_leverage_points: "boolean (optional)" },
      returns: "Causal loops, leverage points, and systems archetypes",
    },
    think_metacognitive: {
      name: "think_metacognitive",
      description: "Ladder of inference + cognitive bias audit",
      parameters: { situation: "string (required)", reasoning_trace: "string (optional)" },
      returns: "Metacognitive analysis with bias detection and debiasing strategies",
    },
    think_first_principles: {
      name: "think_first_principles",
      description: "Socratic decomposition from bedrock facts + reconstruction",
      parameters: { problem: "string (required)", assumptions: "string[] (optional)" },
      returns: "Decomposed assumptions and reconstructed solution from first principles",
    },
    think_scenario: {
      name: "think_scenario",
      description: "2x2 scenario matrix + pre-mortem + futures wheel",
      parameters: { situation: "string (required)", axes: "{x: string, y: string} (optional)" },
      returns: "Scenario matrix with pre-mortem analysis and futures wheel",
    },
    think_navigator: {
      name: "think_navigator",
      description: "DAG-based reasoning planning with dependency tracking and parallel execution",
      parameters: { problem: "string (required)", plan: "array (optional)" },
      returns: "Reasoning plan with dependencies, execution status, and progress tracking",
    },
  };
  if (info[name]) {
    console.log(JSON.stringify(info[name], null, 2));
  } else {
    const valid = Object.keys(info).sort().join(", ");
    console.error(JSON.stringify({ error: "Unknown tool: '" + name + "'", help: "Valid tools: " + valid }));
    process.exit(2);
  }
}

// --- CLI entry point (AXI SS8: content-first home view via --list-tools) ---
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
  // No CLI args - run MCP server
  import("./index.js").then(() => {
    process.stderr.write("thinking-modes-mcp-server started via CLI\n");
  }).catch((err: Error) => {
    console.error(JSON.stringify({ error: "Failed to start MCP server: " + err.message }));
    process.exit(1);
  });
}
