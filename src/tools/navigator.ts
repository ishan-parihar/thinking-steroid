import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  NavigatorMode,
  NavigatorAction,
  ReasoningGraph,
  ReasoningNode,
  OutputDepth,
  OutputMode,
  EpistemicStatus,
  SuggestedTool,
  ThoughtType,
} from "../types.js";
import { classifyDomain } from "../utils/domain-classifier.js";
import {
  createSession,
  getSession,
  updateNode,
  getReadyNodes,
  shouldReplan,
  replan,
  terminateSession,
} from "../utils/state-manager.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/** Maps thought types to their assigned tools */
const THOUGHT_TYPE_TO_TOOL: Record<string, string> = {
  deconstructive: "think_first_principles",
  diagnostic: "think_sequential",
  relational: "think_causal",
  perspectival: "think_aqal_situational",
  developmental: "think_hierarchical",
  prospective: "think_scenario",
  synthetic: "think_unity",
  corrective: "think_metacognitive",
} as const;

/** Maps thought types to a suggested follow-up tool */
const THOUGHT_TYPE_TO_FOLLOWUP: Record<string, SuggestedTool> = {
  deconstructive: "think_first_principles",
  diagnostic: "think_sequential",
  relational: "think_causal",
  perspectival: "think_aqal_situational",
  developmental: "think_hierarchical",
  prospective: "think_scenario",
  synthetic: "think_unity",
  corrective: "think_metacognitive",
} as const;

/** Full DAG: 8 nodes covering all thought types */
const FULL_DAG_TEMPLATE: { thoughtType: string; dependsOn: number[] }[] = [
  { thoughtType: "deconstructive", dependsOn: [] },
  { thoughtType: "diagnostic", dependsOn: [0] },
  { thoughtType: "relational", dependsOn: [0] },
  { thoughtType: "perspectival", dependsOn: [1] },
  { thoughtType: "developmental", dependsOn: [1] },
  { thoughtType: "prospective", dependsOn: [2, 3] },
  { thoughtType: "corrective", dependsOn: [1] },
  { thoughtType: "synthetic", dependsOn: [3, 4, 5, 6] },
];

/** Guided DAG: 3 most immediately relevant thought types */
const GUIDED_DAG_TEMPLATE: { thoughtType: string; dependsOn: number[] }[] = [
  { thoughtType: "deconstructive", dependsOn: [] },
  { thoughtType: "diagnostic", dependsOn: [0] },
  { thoughtType: "relational", dependsOn: [0] },
];

/** Minimal DAG: single deconstructive node */
const MINIMAL_DAG_TEMPLATE: { thoughtType: string; dependsOn: number[] }[] = [
  { thoughtType: "deconstructive", dependsOn: [] },
];

// ─── Domain → Priority Mapping ──────────────────────────────────────────────

/**
 * Given domain classification results, return an ordered list of thought types
 * most relevant to the detected domains.
 */
function prioritizeThoughtTypes(
  domains: { domain: string; confidence: number }[],
): string[] {
  const domainIds = domains.map((d) => d.domain).join(" ");

  if (
    domainIds.includes("software-architecture") ||
    domainIds.includes("systems-thinking")
  ) {
    return ["diagnostic", "relational", "corrective"];
  }
  if (
    domainIds.includes("organizational-topology") ||
    domainIds.includes("interpersonal-dynamics")
  ) {
    return ["perspectival", "developmental", "relational"];
  }
  if (
    domainIds.includes("strategic-planning") ||
    domainIds.includes("financial-planning")
  ) {
    return ["prospective", "synthetic", "diagnostic"];
  }

  // Default: general-purpose ordering
  return ["diagnostic", "relational", "perspectival"];
}

// ─── DAG Builder ─────────────────────────────────────────────────────────────

/**
 * Build a ReasoningGraph based on the problem text, domain classification,
 * and planning mode.
 */
function buildDag(
  problem: string,
  initialPosition: string,
  planningMode: NavigatorMode,
): ReasoningGraph {
  // Classify the problem domain
  const domains = classifyDomain(problem);

  // Select the template based on planning mode
  let template: { thoughtType: string; dependsOn: number[] }[];
  switch (planningMode) {
    case "full":
      template = [...FULL_DAG_TEMPLATE];
      break;
    case "guided":
      template = [...GUIDED_DAG_TEMPLATE];
      break;
    case "minimal":
      template = [...MINIMAL_DAG_TEMPLATE];
      break;
  }

  // Build nodes from template
  const nodes: ReasoningNode[] = template.map((entry, idx) => ({
    id: idx,
    tool: THOUGHT_TYPE_TO_TOOL[entry.thoughtType],
    thoughtType: entry.thoughtType,
    purpose: getPurpose(entry.thoughtType, problem),
    params: buildParams(entry.thoughtType, problem, initialPosition),
    dependsOn: entry.dependsOn,
    status: "pending" as const,
  }));

  // For guided mode, optionally inject domain-prioritized nodes
  if (planningMode === "guided" && domains.length > 0) {
    const priorityTypes = prioritizeThoughtTypes(domains);
    const existingTypes = new Set(template.map((t) => t.thoughtType));

    // Add the top priority type not already in the template (if any)
    for (const pt of priorityTypes) {
      if (!existingTypes.has(pt)) {
        const newNode: ReasoningNode = {
          id: nodes.length,
          tool: THOUGHT_TYPE_TO_TOOL[pt],
          thoughtType: pt,
          purpose: getPurpose(pt, problem),
          params: buildParams(pt, problem, initialPosition),
          dependsOn: [0], // depend on deconstructive
          status: "pending" as const,
        };
        nodes.push(newNode);
        break;
      }
    }
  }

  const totalNodes = nodes.length;

  const graph: ReasoningGraph = {
    totalNodes,
    completedNodes: 0,
    nodes,
    parallelGroups: [],
    coverage: {},
    nextInstruction: "",
    sessionToken: "",
    replanCount: 0,
  };

  return graph;
}

function getPurpose(thoughtType: string, problem: string): string {
  const purposes: Record<string, string> = {
    deconstructive: "Break the problem into irreducible facts and inherited assumptions",
    diagnostic: "Analyze the problem step by step to understand its structure",
    relational: "Map causal relationships and feedback loops between components",
    perspectival: "View the problem from multiple quadrants and perspectives",
    developmental: "Assess the developmental stage and growth trajectory",
    prospective: "Explore multiple future scenarios and their implications",
    synthetic: "Integrate all reasoning results into a unified synthesis",
    corrective: "Audit reasoning for biases, blind spots, and errors",
  };
  return purposes[thoughtType] ?? `Apply ${thoughtType} reasoning`;
}

function buildParams(
  thoughtType: string,
  problem: string,
  initialPosition: string,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    problem,
    output_depth: "standard" as const,
    output_mode: "analytical" as const,
  };

  switch (thoughtType) {
    case "deconstructive":
      return {
        ...base,
        problem_or_system: problem,
        current_beliefs: initialPosition,
      };
    case "diagnostic":
      return {
        ...base,
        problem,
        initial_position: initialPosition,
      };
    case "relational":
      return {
        ...base,
        problem_statement: problem,
        key_variables: extractKeyVariables(problem),
      };
    case "perspectival":
      return {
        ...base,
        situation: problem,
        stakeholders: "All stakeholders",
        observable_data: problem,
        reported_experience: initialPosition,
        cultural_context: "Context dependent on problem domain",
        systemic_context: "System to be analyzed",
      };
    case "developmental":
      return {
        ...base,
        system: problem,
        current_stage: "modern-rational" as const,
        system_description: problem,
        observable_behaviors: problem,
        cultural_indicators: "To be determined",
        structural_indicators: "To be determined",
      };
    case "prospective":
      return {
        ...base,
        focal_question: `What are the possible futures for: ${problem}?`,
        key_uncertainties: ["Primary uncertainty", "Secondary uncertainty"],
        scenario_timeframe: "1-3 years",
      };
    case "synthetic":
      return {
        ...base,
        query: problem,
        developmental_context: initialPosition,
        behavioral_patterns: "Results from prior analyses",
        relational_context: "Synthesis context",
      };
    case "corrective":
      return {
        ...base,
        reasoning_chain: "Results from prior analyses",
        conclusion: initialPosition,
      };
    default:
      return base;
  }
}

function extractKeyVariables(problem: string): string[] {
  // Extract potential key variables from the problem text
  const words = problem.split(/\s+/).filter((w) => w.length > 3);
  // Take up to 5 noun-like phrases as key variables
  const variables: string[] = [];
  const seen = new Set<string>();
  for (const word of words) {
    const cleaned = word.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    if (cleaned.length > 3 && !seen.has(cleaned) && variables.length < 5) {
      seen.add(cleaned);
      variables.push(cleaned);
    }
  }
  // Ensure minimum of 3
  while (variables.length < 3) {
    variables.push(`factor-${variables.length + 1}`);
  }
  return variables;
}

// ─── Output Formatters ───────────────────────────────────────────────────────

interface FormatOptions {
  graph: ReasoningGraph;
  depth: OutputDepth;
  mode: OutputMode;
  action: NavigatorAction;
  needsReplan: boolean;
}

function formatNavigatorOutput(opts: FormatOptions): string {
  const { graph, depth, mode, action, needsReplan } = opts;

  // Executive mode: minimal output
  if (mode === "executive") {
    const progressPct = Math.round(
      (graph.completedNodes / graph.totalNodes) * 100,
    );
    return [
      `## Navigator`,
      ``,
      `**Session:** ${graph.sessionToken}`,
      `**Progress:** ${progressPct}% (${graph.completedNodes}/${graph.totalNodes})`,
      `**Action:** ${action}`,
      ``,
      `**Next:** ${graph.nextInstruction}`,
    ].join("\n");
  }

  // Build the full output
  const sections: string[] = [];

  // Header
  sections.push(
    `## Reasoning Navigator`,
    ``,
    `**Session:** ${graph.sessionToken}`,
    `**Mode:** ${getNodeModeDescription(graph)}`,
    `**Progress:** ${graph.completedNodes}/${graph.totalNodes} nodes completed`,
    needsReplan ? "**⚠️ Replanning recommended**" : "",
    ``,
  );

  // Current State Table
  sections.push(`### Current State`, ``);
  sections.push(
    `| Node | Tool | Thought Type | Status | Quality |`,
    `|------|------|-------------|--------|---------|`,
  );

  for (const node of graph.nodes) {
    const statusIcon = getStatusIcon(node.status);
    const qualityStr =
      node.qualityScore !== undefined
        ? node.qualityScore.toFixed(2)
        : "-";
    sections.push(
      `| ${node.id} | ${node.tool} | ${node.thoughtType} | ${statusIcon} ${node.status} | ${qualityStr} |`,
    );
  }

  sections.push(``);

  // Parallel Groups
  if (graph.parallelGroups.length > 0) {
    sections.push(`### Parallel Groups`, ``);
    for (let i = 0; i < graph.parallelGroups.length; i++) {
      const group = graph.parallelGroups[i];
      const nodeDescs = group.map((id) => {
        const node = graph.nodes.find((n) => n.id === id);
        return node ? `#${id}(${node.thoughtType})` : `#${id}`;
      });
      if (group.length > 1) {
        sections.push(
          `- Group ${i + 1}: ${nodeDescs.join(", ")} (can run simultaneously)`,
        );
      } else {
        sections.push(`- Group ${i + 1}: ${nodeDescs[0]}`);
      }
    }
    sections.push(``);
  }

  // Next Instruction
  sections.push(`### Next Instruction`, ``);
  sections.push(graph.nextInstruction);
  sections.push(``);

  // Coverage
  sections.push(`### Coverage`, ``);
  const allThoughtTypes = [
    "deconstructive",
    "diagnostic",
    "relational",
    "perspectival",
    "developmental",
    "prospective",
    "synthetic",
    "corrective",
  ];
  for (const tt of allThoughtTypes) {
    const count = graph.coverage[tt] ?? 0;
    const icon = count > 0 ? "✅" : "⚠️";
    const note =
      count === 0
        ? ` (${graph.replanCount > 0 ? "not included in current plan" : "add with replan"})`
        : "";
    sections.push(`- ${tt}: ${count} node(s) ${icon}${note}`);
  }

  // Epistemic Status
  const epistemicStatus = computeEpistemicStatus(graph);
  sections.push(``, `### Epistemic Status`, ``);
  sections.push(`**Status:** ${epistemicStatus}`);
  sections.push(
    epistemicStatus === "well-supported"
      ? "High-quality outputs from completed nodes support the current reasoning path."
      : epistemicStatus === "tentative"
        ? "The current plan is a hypothesis about the best reasoning path. Validate with tool outputs."
        : "Insufficient data to assess reasoning quality.",
  );

  // Suggested Follow-ups
  const followups = getSuggestedFollowups(graph);
  if (followups.length > 0) {
    sections.push(``, `### Suggested Follow-ups`, ``);
    sections.push("Based on the current state, run these tools next:");
    sections.push("");
    for (const fw of followups) {
      sections.push(`- \`${fw.tool}\` (${fw.thoughtType})`);
    }
  }

  // Exploratory additions
  if (mode === "exploratory") {
    sections.push(``, `### Suggested Explorations`, ``);
    sections.push("Alternative reasoning paths to consider:");
    sections.push("");
    const explorations = getExplorationSuggestions(graph);
    for (const exp of explorations) {
      sections.push(`- ${exp}`);
    }
  }

  return sections.filter(Boolean).join("\n");
}

function getStatusIcon(status: string): string {
  switch (status) {
    case "completed":
      return "✅";
    case "ready":
      return "🔄";
    case "blocked":
      return "⏳";
    case "skipped":
      return "⏭️";
    default:
      return "⬜";
  }
}

function getNodeModeDescription(graph: ReasoningGraph): string {
  if (graph.totalNodes >= 6) return "full";
  if (graph.totalNodes >= 3) return "guided";
  return "minimal";
}

function computeEpistemicStatus(graph: ReasoningGraph): EpistemicStatus {
  const completed = graph.nodes.filter(
    (n) => n.status === "completed" && n.qualityScore !== undefined,
  );

  if (completed.length === 0) {
    return "tentative";
  }

  const avgQuality =
    completed.reduce((sum, n) => sum + (n.qualityScore ?? 0), 0) /
    completed.length;

  if (avgQuality > 0.7) return "well-supported";
  if (avgQuality > 0.4) return "tentative";
  return "speculative";
}

function getSuggestedFollowups(
  graph: ReasoningGraph,
): { tool: string; thoughtType: string }[] {
  const readyIds = graph.nodes
    .filter((n) => n.status === "ready")
    .map((n) => n.id);

  return graph.nodes
    .filter((n) => readyIds.includes(n.id))
    .map((n) => ({ tool: n.tool, thoughtType: n.thoughtType }));
}

function getExplorationSuggestions(graph: ReasoningGraph): string[] {
  const suggestions: string[] = [];
  const completed = graph.nodes.filter((n) => n.status === "completed");
  const completedTypes = new Set(completed.map((n) => n.thoughtType));

  // Suggest thought types not yet covered
  const allTypes = [
    "deconstructive",
    "diagnostic",
    "relational",
    "perspectival",
    "developmental",
    "prospective",
    "synthetic",
    "corrective",
  ];

  for (const tt of allTypes) {
    if (!completedTypes.has(tt) && graph.coverage[tt] === 0) {
      suggestions.push(
        `Add ${tt} reasoning via replan to cover ${THOUGHT_TYPE_TO_TOOL[tt]} perspective`,
      );
    }
  }

  // Suggest quality improvement
  const lowQuality = completed.filter(
    (n) => n.qualityScore !== undefined && n.qualityScore < 0.6,
  );
  if (lowQuality.length > 0) {
    suggestions.push(
      `Re-run ${lowQuality.map((n) => n.tool).join(", ")} with different parameters to improve quality`,
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("Current reasoning path is comprehensive. Proceed with synthetic integration.");
  }

  return suggestions;
}

// ─── Termination Summary ─────────────────────────────────────────────────────

function buildTerminationSummary(graph: ReasoningGraph): string {
  const completed = graph.nodes.filter((n) => n.status === "completed");
  const sections: string[] = [];

  sections.push(
    `## Reasoning Synthesis (Session: ${graph.sessionToken})`,
    ``,
    `**Progress:** ${graph.completedNodes}/${graph.totalNodes} nodes completed`,
    `**Replans:** ${graph.replanCount}`,
    ``,
    `### Completed Reasoning Steps`,
    ``,
  );

  for (const node of completed) {
    const qualityStr =
      node.qualityScore !== undefined ? node.qualityScore.toFixed(2) : "N/A";
    sections.push(
      `#### ${node.id}. ${node.thoughtType} (${node.tool}) — quality: ${qualityStr}`,
      ``,
      node.output ?? "*No output recorded*",
      ``,
    );
  }

  sections.push(`### Coverage`, ``);
  for (const [type, count] of Object.entries(graph.coverage).sort()) {
    sections.push(`- ${type}: ${count} node(s)`);
  }

  return sections.join("\n");
}

// ─── Tool Registration ───────────────────────────────────────────────────────

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_navigator",
    {
      title: "Reasoning DAG Navigator",
      description:
        "Generates a structured reasoning plan by sequencing thinking tools with dependency tracking and " +
        "parallel execution hints. Output produces a reasoning DAG (Directed Acyclic Graph) mapping a " +
        "recommended sequence of thinking tools for a given problem.\n\n" +
        "Use 'plan' action to create a new reasoning plan, 'advance' to mark a node complete and get next steps, " +
        "'replan' when the current path isn't working, and 'terminate' to get a synthesis of all completed nodes.\n\n" +
        "Supports three planning depths: full (8 nodes covering all thought types), guided (3-4 nodes for immediate needs), " +
        "and minimal (1 node for quick analysis).",
      inputSchema: z
        .object({
          problem: z
            .string()
            .optional()
            .describe("The problem to analyze (required for initial planning)"),
          initial_position: z
            .string()
            .optional()
            .describe("Your current stance or hypothesis about the problem"),
          planning_mode: z
            .enum(["full", "guided", "minimal"])
            .optional()
            .default("guided")
            .describe(
              "Planning depth: full=complete DAG (8 nodes), guided=next 2-4 steps, minimal=next single tool",
            ),
          session_token: z
            .string()
            .optional()
            .describe("Session token from a previous navigator call (for advancing/replanning)"),
          action: z
            .enum(["plan", "advance", "replan", "terminate"])
            .optional()
            .default("plan")
            .describe("Action to take"),
          completed_node: z
            .number()
            .optional()
            .describe("ID of the node just completed (for advance action)"),
          node_output: z
            .string()
            .optional()
            .describe("Output from the completed node (for advance action)"),
          node_quality: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe("Self-assessed quality of the completed node output (0-1)"),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .optional()
            .default("standard"),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .optional()
            .default("analytical"),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          problem,
          initial_position,
          planning_mode,
          session_token,
          action,
          completed_node,
          node_output,
          node_quality,
          output_depth,
          output_mode,
        } = args;

        // ─── Mode A: Initial Planning ────────────────────────────────────
        if (!session_token) {
          if (!problem) {
            return {
              content: [
                {
                  type: "text",
                  text: "## Navigator Error\n\n`problem` is required for initial planning (action='plan' without session_token).",
                },
              ],
              isError: true,
            };
          }

          const graph = buildDag(
            problem,
            initial_position ?? "No initial position specified",
            planning_mode,
          );

          const token = createSession(graph);
          graph.sessionToken = token;

          // After createSession, the session's graph has parallelGroups etc. computed
          const session = getSession(token);
          if (!session) {
            return {
              content: [{ type: "text", text: "## Navigator Error\n\nFailed to create session." }],
              isError: true,
            };
          }

          const output = formatNavigatorOutput({
            graph: session.graph,
            depth: output_depth,
            mode: output_mode,
            action: "plan",
            needsReplan: false,
          });

          return { content: [{ type: "text", text: output }] };
        }

        // ─── Mode B: Session Operations ──────────────────────────────────
        const session = getSession(session_token);
        if (!session) {
          return {
            content: [
              {
                type: "text",
                text: `## Navigator Error\n\nSession not found: ${session_token}. It may have expired (30 min timeout). Start a new plan.`,
              },
            ],
            isError: true,
          };
        }

        // Handle advance action
        if (action === "advance") {
          if (completed_node === undefined || !node_output) {
            return {
              content: [
                {
                  type: "text",
                  text: "## Navigator Error\n\n`completed_node` and `node_output` are required for advance action.",
                },
              ],
              isError: true,
            };
          }

          updateNode(
            session_token,
            completed_node,
            node_output,
            node_quality,
          );

          const updatedSession = getSession(session_token);
          if (!updatedSession) {
            return {
              content: [{ type: "text", text: "## Navigator Error\n\nSession lost after update." }],
              isError: true,
            };
          }

          const needsReplan = shouldReplan(session_token);

          const output = formatNavigatorOutput({
            graph: updatedSession.graph,
            depth: output_depth,
            mode: output_mode,
            action: "advance",
            needsReplan,
          });

          return { content: [{ type: "text", text: output }] };
        }

        // Handle replan action
        if (action === "replan") {
          const updatedGraph = replan(session_token);
          if (!updatedGraph) {
            return {
              content: [{ type: "text", text: "## Navigator Error\n\nFailed to replan." }],
              isError: true,
            };
          }

          const output = formatNavigatorOutput({
            graph: updatedGraph,
            depth: output_depth,
            mode: output_mode,
            action: "replan",
            needsReplan: false,
          });

          return { content: [{ type: "text", text: output }] };
        }

        // Handle terminate action
        if (action === "terminate") {
          const summary = buildTerminationSummary(session.graph);
          terminateSession(session_token);

          return { content: [{ type: "text", text: summary }] };
        }

        // Default: just return current state
        const output = formatNavigatorOutput({
          graph: session.graph,
          depth: output_depth,
          mode: output_mode,
          action: action ?? "plan",
          needsReplan: shouldReplan(session_token),
        });

        return { content: [{ type: "text", text: output }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `## Navigator Error\n\n${message}` }],
          isError: true,
        };
      }
    },
  );
}
