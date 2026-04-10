import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  OutputDepth,
  OutputMode,
  EpistemicStatus,
  SuggestedTool,
  ScenarioNarrative,
  PreMortemFailure,
  FuturesWheelRing,
} from "../types.js";
import { formatScenarioPlanning } from "../utils/formatters.js";

// ─── Scenario Generation Engine ──────────────────────────────────────────────

const ARCHETYPAL_NAMES: Record<string, string[]> = {
  positive_positive: ["Renaissance", "Golden Age", "Flourishing", "Harmony", "Green Shoots"],
  positive_negative: ["Fragmentation", "Dark Horse", "Divided We Stand", "Bifurcation", "Erosion"],
  negative_positive: ["Transformation", "Phoenix Rising", "Breakthrough", "Rebirth", "Catalyst"],
  negative_negative: ["Collapse", "Dark Winter", "Perfect Storm", "Entropy", "Dissolution"],
};

function generateArchetypalName(u1Low: boolean, u2Low: boolean): string {
  const key = u1Low && u2Low
    ? "negative_negative"
    : u1Low && !u2Low
      ? "negative_positive"
      : !u1Low && u2Low
        ? "positive_negative"
        : "positive_positive";
  const pool = ARCHETYPAL_NAMES[key];
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateProbability(u1Low: boolean, u2Low: boolean): "Likely" | "Possible" | "Unlikely" {
  if (!u1Low && !u2Low) return "Likely";
  if (u1Low && u2Low) return "Unlikely";
  return "Possible";
}

function generateDescription(
  focalQuestion: string,
  u1: string,
  u2: string,
  u1Low: boolean,
  u2Low: boolean,
  name: string,
): string {
  const u1State = u1Low ? "low" : "high";
  const u2State = u2Low ? "low" : "high";

  const narratives: Record<string, string> = {
    positive_positive: `In this world, ${u1} reaches high levels while ${u2} also flourishes. The convergence of these forces creates a self-reinforcing cycle of growth and innovation around "${focalQuestion}". Institutions adapt rapidly, trust is high, and the conditions for transformative progress are abundant. This is a world where positive feedback loops amplify opportunity.`,
    positive_negative: `Here, ${u1} reaches high levels but ${u2} remains constrained. The asymmetry creates a world of uneven development — pockets of excellence coexist with systemic fragility around "${focalQuestion}". Those who can leverage ${u1Low ? "low" : "high"} ${u1} thrive, while those dependent on ${u2} face growing headwinds. This is a world of winners and losers defined by access.`,
    negative_positive: `In this scenario, ${u1} is low but ${u2} is high. This creates a crucible environment for "${focalQuestion}" — traditional pathways are blocked, forcing radical adaptation and innovation. The constraint on ${u1} becomes a catalyst for reimagining fundamentals. Those who can harness the available ${u2} while navigating the ${u1} shortage emerge transformed.`,
    negative_negative: `This is the most challenging world for "${focalQuestion}": both ${u1} and ${u2} are low. Systemic deterioration compounds as feedback loops turn negative. Trust erodes, resources become scarce, and the institutional capacity to respond weakens precisely when it's needed most. Survival and preservation become the dominant strategies, with transformation possible only through collapse and rebuilding.`,
  };

  const key = u1Low && u2Low
    ? "negative_negative"
    : u1Low && !u2Low
      ? "negative_positive"
      : !u1Low && u2Low
        ? "positive_negative"
        : "positive_positive";

  return narratives[key];
}

function generateDrivingForces(
  u1: string,
  u2: string,
  u1Low: boolean,
  u2Low: boolean,
  knownForces: string,
): string[] {
  const forces: string[] = [];
  const knownList = knownForces ? knownForces.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (!u1Low) {
    forces.push(`Accelerating ${u1} across multiple sectors`);
    forces.push(`Institutional investment in ${u1} infrastructure`);
  } else {
    forces.push(`Structural decline in ${u1}`);
    forces.push(`Erosion of ${u1}-dependent systems`);
  }

  if (!u2Low) {
    forces.push(`Growing momentum in ${u2}`);
    forces.push(`Cultural shift toward ${u2}-favorable norms`);
  } else {
    forces.push(`Systemic resistance to ${u2}`);
    forces.push(`Resource constraints limiting ${u2}`);
  }

  if (knownList.length > 0) {
    forces.push(...knownList.slice(0, 3));
  }

  return [...new Set(forces)];
}

function generateFirstOrderConsequences(
  name: string,
  u1: string,
  u2: string,
  u1Low: boolean,
  u2Low: boolean,
): string[] {
  const templates: Record<string, string[]> = {
    positive_positive: [
      `Rapid scaling of ${u1}-dependent initiatives`,
      `Surge in collaborative ventures driven by ${u2}`,
      `Positive market sentiment and increased investment flows`,
      `Policy environments become more permissive and supportive`,
    ],
    positive_negative: [
      `Concentration of advantages among ${u1}-rich actors`,
      `Growing inequality in access to ${u2}-dependent resources`,
      `Policy polarization as competing interests clash`,
      `Fragmentation of previously unified approaches`,
    ],
    negative_positive: [
      `Forced innovation in response to ${u1} constraints`,
      `Rapid adoption of alternative models leveraging ${u2}`,
      `Disruption of established players dependent on ${u1}`,
      `Cultural narrative shifts toward adaptation and resilience`,
    ],
    negative_negative: [
      `Contraction of ${u1}-dependent activities and investments`,
      `Breakdown of cooperative frameworks around ${u2}`,
      `Institutional capacity degradation across multiple domains`,
      `Rise of protectionist and risk-averse behaviors`,
    ],
  };

  const key = u1Low && u2Low
    ? "negative_negative"
    : u1Low && !u2Low
      ? "negative_positive"
      : !u1Low && u2Low
        ? "positive_negative"
        : "positive_positive";

  return templates[key];
}

function generateSecondOrderConsequences(
  u1: string,
  u2: string,
  u1Low: boolean,
  u2Low: boolean,
  firstOrder: string[],
): string[] {
  if (firstOrder.length < 2) return [];
  return [
    `Compounding effects from ${firstOrder[0]?.toLowerCase()} reshape competitive landscapes`,
    `Cascading institutional responses to ${firstOrder[1]?.toLowerCase()}`,
    `Emergence of new power centers that were previously marginalized`,
    `Feedback between ${u1} and ${u2} dynamics creates non-linear outcomes`,
  ];
}

function generateThirdOrderConsequences(
  u1: string,
  u1Low: boolean,
  u2Low: boolean,
): string[] {
  const templates: Record<string, string[]> = {
    positive_positive: [
      `Potential for paradigm-level shift in how the domain is understood and organized`,
      `Risk of overconfidence and under-preparation for less favorable scenarios`,
    ],
    positive_negative: [
      `Entrenched structural divisions that may persist across decades`,
      `Periodic crises of legitimacy as inequality becomes politically unsustainable`,
    ],
    negative_positive: [
      `Fundamental restructuring of the domain around new organizing principles`,
      `Loss of valuable legacy capabilities that depended on the old ${u1}-rich environment`,
    ],
    negative_negative: [
      `Complete paradigm collapse requiring reconstruction from foundational principles`,
      `Extended recovery period with potential for permanent capability loss`,
    ],
  };

  const key = u1Low && u2Low
    ? "negative_negative"
    : u1Low && !u2Low
      ? "negative_positive"
      : !u1Low && u2Low
        ? "positive_negative"
        : "positive_positive";

  return templates[key];
}

function generatePreMortem(focalQuestion: string): PreMortemFailure[] {
  return [
    {
      failure_mode: "Single-scenario attachment — we invested in one forecast and ignored alternatives",
      early_warning_signal: "Strategic planning documents reference only one future; dissenting views are labeled as 'pessimistic' or 'unrealistic'",
      mitigation_strategy: "Maintain active investment in at least two divergent scenarios; assign a dedicated scenario advocate in planning sessions",
    },
    {
      failure_mode: "Driving force misidentification — we tracked the wrong variables",
      early_warning_signal: "Key performance indicators remain stable while the system undergoes qualitative change; stakeholders report surprise at 'unexpected' developments",
      mitigation_strategy: "Quarterly review of driving forces; maintain a 'weak signals' monitoring process for emerging factors outside the current model",
    },
    {
      failure_mode: "Linear extrapolation — we assumed trends continue smoothly without inflection points",
      early_warning_signal: "Rate of change accelerates or decelerates unexpectedly; leading indicators diverge from historical correlation patterns",
      mitigation_strategy: "Map potential inflection points explicitly; build trigger-based contingency plans for non-linear transitions",
    },
    {
      failure_mode: "Insider bias — our assumptions reflect our organizational perspective, not the ecosystem",
      early_warning_signal: "External stakeholders express confusion at our strategy; our scenario narratives sound identical to our competitors'",
      mitigation_strategy: "Include external voices in scenario development; conduct regular 'outside-in' perspective exercises",
    },
    {
      failure_mode: "Action paralysis — we generated scenarios but never linked them to decisions",
      early_warning_signal: "Scenario documents exist but are not referenced in strategic decisions; planning cycles proceed without scenario input",
      mitigation_strategy: "Define decision-specific scenario implications upfront; create a scenario-to-action mapping matrix",
    },
    {
      failure_mode: "Temporal mismatch — our planning horizon doesn't match the speed of change",
      early_warning_signal: "Scenarios feel outdated within months; external events consistently outpace our planning cycle",
      mitigation_strategy: "Implement rolling scenario updates; maintain both short-term tactical and long-term strategic scenario tracks",
    },
    {
      failure_mode: "Overconfidence in probability assignments — we treated speculation as prediction",
      early_warning_signal: "Probability estimates are cited as facts; decision-makers use scenario likelihoods to justify pre-determined choices",
      mitigation_strategy: "Label all probability assessments as subjective; conduct calibration exercises for probability estimation",
    },
  ];
}

function generateFuturesWheel(focalQuestion: string): FuturesWheelRing {
  const firstRing = [
    `Resource allocation shifts to prepare for the most probable scenario`,
    `Organizational structure adapts to address identified vulnerabilities`,
    `Stakeholder expectations recalibrate based on scenario narratives`,
    `Risk management frameworks incorporate scenario-specific contingencies`,
    `Innovation pipelines prioritize scenario-resilient solutions`,
    `Talent strategy evolves to build scenario-relevant capabilities`,
    `Partnership and ecosystem strategies shift toward scenario-aligned actors`,
    `Communication narratives frame strategic choices within scenario context`,
  ];

  const secondRing: Record<string, string[]> = {
    [firstRing[0]]: [
      `Budget reallocation creates winners and losers within the organization`,
      `Short-term performance may dip during transition to new allocation model`,
    ],
    [firstRing[1]]: [
      `Resistance from units whose mandate is reduced under new structure`,
      `Emergence of new roles and capabilities that didn't previously exist`,
    ],
    [firstRing[2]]: [
      `Some stakeholders disengage if their preferred scenario appears unlikely`,
      `New coalition forms around scenario-specific interests`,
    ],
    [firstRing[3]]: [
      `Risk management becomes more nuanced but also more complex to administer`,
      `Insurance and hedging costs increase as more contingencies are modeled`,
    ],
    [firstRing[4]]: [
      `R&D portfolio becomes more diversified but may lose focus on core innovations`,
      `Cross-pollination between scenario-specific projects generates unexpected insights`,
    ],
    [firstRing[5]]: [
      `Hiring criteria shift toward adaptability and scenario literacy`,
      `Training programs expand to include scenario planning competencies`,
    ],
  };

  const thirdRing: Record<string, string> = {};
  for (const [parent, children] of Object.entries(secondRing)) {
    for (const child of children) {
      thirdRing[child] = `Institutional memory and culture gradually encode the new normal, making reversal increasingly difficult`;
    }
  }

  return { first_ring: firstRing, second_ring: secondRing, third_ring: thirdRing };
}

function generateStrategicImplications(
  scenarios: ScenarioNarrative[],
): { robust: string[]; scenario_specific: { scenario: string; actions: string[] }[] } {
  const robust = [
    `Build organizational adaptability — invest in capabilities that are valuable across all four scenarios`,
    `Establish early warning signal monitoring for the key uncertainties that define the scenario axes`,
    `Maintain strategic optionality — avoid irreversible commitments that only pay off in one scenario`,
    `Develop scenario literacy across the organization so decisions can be contextualized in real-time`,
    `Create trigger-based decision rules: "If signal X crosses threshold Y, activate plan Z"`,
  ];

  const scenario_specific = scenarios.map((s) => ({
    scenario: s.name,
    actions: [
      `In ${s.name}: ${s.first_order_consequences[0] ? "accelerate preparation for " + s.first_order_consequences[0].toLowerCase() : "monitor and prepare"}`,
      `In ${s.name}: ${s.second_order_consequences[0] ? "develop response capacity for " + s.second_order_consequences[0].toLowerCase() : "build resilience"}`,
    ],
  }));

  return { robust, scenario_specific };
}

// ─── Tool Registration ───────────────────────────────────────────────────────

const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_scenario",
    {
      title: "Scenario Planning Matrix",
      description:
        "Generates a 2x2 scenario planning matrix from two key uncertainties, creating four named scenarios with archetypal narratives. " +
        "Includes pre-mortem failure analysis, futures wheel mapping of 1st/2nd/3rd order consequences, and early warning signals. " +
        "Best for strategic planning, risk anticipation, and exploring multiple plausible futures before committing to a course of action.",
      inputSchema: z
        .object({
          focal_question: z
            .string()
            .min(15)
            .describe(
              "The central question the scenarios will explore. Should be open-ended and strategically significant. " +
                "Minimum 15 characters. Example: 'How will AI transform the future of professional knowledge work by 2035?'"
            ),
          key_uncertainties: z
            .array(z.string())
            .length(2)
            .describe(
              "Exactly two key uncertainties that define the scenario axes. Each should be a dimension that can vary " +
                "from low/negative to high/positive. Example: ['AI capability growth', 'Regulatory adoption rate']"
            ),
          scenario_timeframe: z
            .string()
            .min(5)
            .default("5-10 years")
            .describe("The time horizon for scenario exploration. Minimum 5 characters. Default: '5-10 years'."),
          known_driving_forces: z
            .string()
            .optional()
            .describe(
              "Comma-separated list of known megatrends or driving forces that should be incorporated into scenario narratives. " +
                "Example: 'climate change, demographic shifts, geopolitical fragmentation'"
            ),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard")
            .describe(
              "Controls output depth: 'essential' for core matrix only, 'standard' for full analysis with pre-mortem and futures wheel, " +
                "'exhaustive' adds strategic implications and robust strategy identification."
            ),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output presentation mode: 'executive' for concise summaries, 'analytical' for full detailed output (default), " +
                "'exploratory' for detailed output with open questions."
            ),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          focal_question,
          key_uncertainties,
          scenario_timeframe,
          known_driving_forces,
          output_depth,
          output_mode,
        } = args;

        const [u1, u2] = key_uncertainties;

        const axisStates: { u1Low: boolean; u2Low: boolean }[] = [
          { u1Low: true, u2Low: true },
          { u1Low: false, u2Low: true },
          { u1Low: true, u2Low: false },
          { u1Low: false, u2Low: false },
        ];

        const scenarios: ScenarioNarrative[] = axisStates.map(({ u1Low, u2Low }) => {
          const name = generateArchetypalName(u1Low, u2Low);
          const drivingForces = generateDrivingForces(u1, u2, u1Low, u2Low, known_driving_forces ?? "");
          const firstOrder = generateFirstOrderConsequences(name, u1, u2, u1Low, u2Low);

          return {
            name,
            axis_position: `${u1}: ${u1Low ? "Low" : "High"} / ${u2}: ${u2Low ? "Low" : "High"}`,
            description: generateDescription(focal_question, u1, u2, u1Low, u2Low, name),
            driving_forces: drivingForces,
            probability: generateProbability(u1Low, u2Low),
            first_order_consequences: firstOrder,
            second_order_consequences: generateSecondOrderConsequences(u1, u2, u1Low, u2Low, firstOrder),
            third_order_consequences: generateThirdOrderConsequences(u1, u1Low, u2Low),
          };
        });

        const preMortem = generatePreMortem(focal_question);
        const futuresWheel = generateFuturesWheel(focal_question);

        const strategicImplications =
          output_depth === "exhaustive"
            ? generateStrategicImplications(scenarios)
            : undefined;

        const epistemicStatus: EpistemicStatus =
          known_driving_forces ? "tentative" : "speculative";
        const suggestedFollowup: SuggestedTool[] = ["think_causal", "think_cynefin"];
        if (output_depth === "exhaustive") {
          suggestedFollowup.push("think_metacognitive");
        }

        const markdown_output = formatScenarioPlanning(
          focal_question,
          u1,
          u2,
          scenario_timeframe,
          scenarios,
          preMortem,
          futuresWheel,
          strategicImplications,
          output_depth,
          output_mode,
          epistemicStatus,
          suggestedFollowup,
        );

        return {
          content: [{ type: "text", text: markdown_output }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
