#!/usr/bin/env node

// AXI §8: content-first CLI for tool discovery
// AXI §9: contextual disclosure via --tool-info
// AXI §1: Token-efficient TOON output format

import { truncateStr, axiError, getBinPath, formatText } from "./utils/toon.js";

const VERSION = "1.0.0";

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

// AXI §10: Server identity + AXI §8: Content-first home view
function showHomeView(): void {
  const binPath = getBinPath();
  
  console.log(`bin: ${binPath}`);
  console.log(`description: Structure AI agent reasoning with 13 cognitive modalities`);
  console.log();
  
  // Show tools in TOON format (AXI §2: minimal schema with name + description)
  console.log(`tools[${TOOLS.length}]{name,description}:`);
  for (const [name, desc] of TOOLS) {
    console.log(`  ${name},${truncateStr(desc, 60)}`);
  }
  console.log();
  
  // AXI §9: Contextual disclosure - suggest next steps
  console.log("help[3]:");
  console.log("  Run `thinking-steroid --tool-info <name>` for detailed parameters");
  console.log("  Run `thinking-steroid --list-tools` to see all tools");
  console.log("  Run `thinking-steroid` to start the MCP server");
}

function listTools(): void {
  console.log(`tools[${TOOLS.length}]{name,description}:`);
  for (const [name, desc] of TOOLS) {
    console.log(`  ${name},${truncateStr(desc, 60)}`);
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
    console.log(formatText(info[name], outFormat));
  } else {
    // AXI §6: Structured error with actionable help
    const valid = Object.keys(info).sort().join(", ");
    axiError(`Unknown tool: '${name}'`, `Valid tools: ${valid}`);
  }
}

function showHelp(): void {
  console.log(`thinking-steroid v${VERSION}`);
  console.log("Structure AI agent reasoning with 13 cognitive modalities");
  console.log();
  console.log("Usage:");
  console.log("  thinking-steroid                 Start MCP server (stdio)");
  console.log("  thinking-steroid --list-tools    List all available tools");
  console.log("  thinking-steroid --tool-info <n> Show details for a specific tool");
  console.log("  thinking-steroid --help          Show this help message");
  console.log();
  console.log("Examples:");
  console.log("  thinking-steroid --tool-info think_sequential");
  console.log("  thinking-steroid --list-tools");
  console.log("  thinking-steroid | claude");
}

// --- CLI entry point ---
const args = process.argv.slice(2);

// Parse flags
const hasListTools = args.includes("--list-tools");
const hasToolInfo = args.includes("--tool-info");
const hasHelp = args.includes("--help") || args.includes("-h");
const hasJson = args.includes("--json");
const outFormat = hasJson ? "json" : "toon";

// Get positional arguments (non-flag args)
const positionalArgs = args.filter(a => !a.startsWith("--") && a !== "-h");

if (hasHelp) {
  showHelp();
} else if (hasListTools) {
  listTools();
} else if (hasToolInfo) {
  const idx = args.indexOf("--tool-info");
  const name = args[idx + 1];
  if (!name) {
    axiError("--tool-info requires a tool name", "Usage: thinking-steroid --tool-info <tool-name>");
  }
  toolInfo(name);
} else if (positionalArgs.length === 0 && args.length === 0) {
  // AXI §8: No-args shows content-first home view with live state
  showHomeView();
} else {
  // Check for unknown flags
  const knownFlags = ["--list-tools", "--tool-info", "--help"];
  const unknownFlags = args.filter(a => a.startsWith("--") && !knownFlags.includes(a));
  
  if (unknownFlags.length > 0) {
    axiError(`Unknown flag: '${unknownFlags[0]}'`, "Valid flags: --list-tools, --tool-info, --help");
  } else if (positionalArgs.length > 0) {
    axiError(`Unknown argument: '${positionalArgs[0]}'`, "Run `thinking-steroid --help` for usage");
  } else {
    // No CLI args - run MCP server
    import("./index.js").then(() => {
      process.stderr.write("thinking-modes-mcp-server started via CLI\n");
    }).catch((err: Error) => {
      axiError("Failed to start MCP server: " + err.message, "Check that @modelcontextprotocol/sdk is installed");
    });
  }
}