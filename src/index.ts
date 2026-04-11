#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTool as registerSequential } from "./tools/sequential.js";
import { registerTool as registerPolarity } from "./tools/polarity.js";
import { registerTool as registerAqalSituational } from "./tools/aqal-situational.js";
import { registerTool as registerAqalProjection } from "./tools/aqal-projection.js";
import { registerTool as registerHierarchical } from "./tools/hierarchical.js";
import { registerTool as registerShadow } from "./tools/shadow.js";
import { registerTool as registerUnity } from "./tools/unity.js";
import { registerTool as registerCynefin } from "./tools/cynefin.js";
import { registerTool as registerCausal } from "./tools/causal.js";
import { registerTool as registerMetacognitive } from "./tools/metacognitive.js";
import { registerTool as registerFirstPrinciples } from "./tools/first-principles.js";
import { registerTool as registerScenario } from "./tools/scenario.js";
import { registerTool as registerNavigator } from "./tools/navigator.js";
import { initializePersistence } from "./utils/state-manager.js";

const INSTRUCTIONS =
  "This server provides 13 thinking modality tools that structure AI agent reasoning. " +
  "Each tool forces a different reasoning topology. " +
  "Tools compose — use outputs from one as inputs to another. " +
  "Core tools: think_sequential (step-by-step reasoning), think_polarity (dialectical tension mapping), " +
  "think_aqal_situational (4-quadrant analysis + optional psychograph), think_aqal_projection (temporal projections), " +
  "think_hierarchical (developmental stage mapping + optional vision-logic substages), " +
  "think_shadow (unconscious pattern detection + Jungian archetypes), " +
  "think_unity (multi-system grand synthesis). " +
  "New tools: think_causal (causal loop diagrams + Meadows leverage points + systems archetypes), " +
  "think_cynefin (domain classification for tool routing), " +
  "think_scenario (2x2 scenario matrix + pre-mortem + futures wheel), " +
  "think_metacognitive (ladder of inference + cognitive bias audit), " +
  "think_first_principles (Socratic decomposition + reconstruction from bedrock facts). " +
  "Orchestrator: think_navigator (DAG-based reasoning planning with dependency tracking and parallel execution). " +
  "All tools support: output_depth (essential|standard|exhaustive), output_mode (executive|analytical|exploratory). " +
  "Recommended workflows: " +
  "(1) cynefin first to determine domain, then route to appropriate tools. " +
  "(2) sequential → polarity → aqal → shadow → unity for deep analysis. " +
  "(3) scenario → causal → metacognitive for strategic foresight. " +
  "(4) first_principles → sequential → causal for breakthrough innovation. " +
  "(5) metacognitive after any tool to catch reasoning errors. " +
  "(6) navigator to plan and orchestrate multi-step reasoning chains with progress tracking.";

async function main(): Promise<void> {
  initializePersistence();

  const server = new McpServer(
    {
      name: "thinking-modes-mcp-server",
      version: "1.0.0",
    },
    {
      instructions: INSTRUCTIONS,
    },
  );

  registerSequential(server);
  registerPolarity(server);
  registerAqalSituational(server);
  registerAqalProjection(server);
  registerHierarchical(server);
  registerShadow(server);
  registerUnity(server);
  registerCynefin(server);
  registerCausal(server);
  registerMetacognitive(server);
  registerFirstPrinciples(server);
  registerScenario(server);
  registerNavigator(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("thinking-modes-mcp-server running via stdio");

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Fatal error: ${message}`);
  process.exit(1);
});
