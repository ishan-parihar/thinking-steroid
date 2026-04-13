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
import { composeToolContent, getStructureForText } from "../utils/content-pipeline.js";
import type { ThoughtType, ThinkingMode } from "../types.js";

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
  _name: string,
): string {
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
  _name: string,
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
  _u1Low: boolean,
  _u2Low: boolean,
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
  u2: string,
  u1Low: boolean,
  u2Low: boolean,
  firstOrder: string[],
  secondOrder: string[],
  allPreviouslyGenerated: string[],
): string[] {
  const templatePool: Record<string, string[]> = {
    positive_positive: [
      `Paradigm-level shift in how the domain is understood and organized`,
      `Risk of overconfidence and under-preparation for less favorable scenarios`,
      `Emergence of new institutional forms optimized for sustained growth conditions`,
      `Cultural narratives shift from scarcity to abundance mindset across the sector`,
      `Regulatory frameworks evolve to accommodate rapid innovation velocity`,
      `Cross-sector collaboration becomes the default operating mode`,
      `Secondary markets develop to support the expanded ecosystem of growth-oriented actors`,
      `Educational institutions redesign curricula to prepare future participants for the new paradigm`,
      `Legacy organizations that fail to adapt face existential pressure from natively optimized competitors`,
      `Global benchmarking shifts as the domain becomes a model for other sectors to emulate`,
    ],
    positive_negative: [
      `Entrenched structural divisions that persist across decades`,
      `Periodic crises of legitimacy as inequality becomes politically unsustainable`,
      `Parallel systems emerge serving those excluded from ${u1}-dependent advantages`,
      `Social cohesion erodes as access to ${u2} becomes a class marker`,
      `Populist movements gain traction by promising to rebalance the asymmetry`,
      `Brain drain from ${u2}-constrained regions accelerates over time`,
      `Underground or informal economies develop to bypass ${u1}-centric gatekeeping`,
      `International pressure mounts as the asymmetry creates cross-border spillover effects`,
      `Generational resentment builds as younger cohorts inherit structural disadvantages`,
      `Innovation stagnates in ${u2}-constrained sectors due to chronic underinvestment`,
    ],
    negative_positive: [
      `Fundamental restructuring of the domain around new organizing principles`,
      `Loss of valuable legacy capabilities that depended on the old ${u1}-rich environment`,
      `Innovation ecosystems form around ${u2}-leveraging alternatives to ${u1}`,
      `New market leaders emerge from organizations that adapted fastest to ${u1} constraints`,
      `Knowledge transfer programs develop to preserve institutional memory during transition`,
      `Regulatory sandboxes accelerate testing of ${u1}-independent models`,
      `Cultural narratives reframe scarcity as a catalyst for creative problem-solving`,
      `International partnerships form to share ${u2}-based solutions with ${u1}-constrained regions`,
      `Talent migrates toward organizations demonstrating successful adaptation models`,
      `Long-term competitive advantage accrues to entities that invested early in ${u1}-alternatives`,
    ],
    negative_negative: [
      `Complete paradigm collapse requiring reconstruction from foundational principles`,
      `Extended recovery period with potential for permanent capability loss`,
      `Institutional trust deficit takes generations to rebuild`,
      `Fragmentation into isolated self-sufficient units replacing coordinated systems`,
      `Loss of collective problem-solving capacity as expertise disperses`,
      `Cultural shift toward short-term survival thinking suppresses long-term planning`,
      `Black market and informal governance structures fill the vacuum left by failing institutions`,
      `International intervention becomes necessary as domestic capacity falls below minimum thresholds`,
      `Historical precedents from prior collapses are studied and selectively adapted to current conditions`,
      `Civil society organizations assume roles traditionally handled by formal institutions`,
    ],
  };

  const key = u1Low && u2Low
    ? "negative_negative"
    : u1Low && !u2Low
      ? "negative_positive"
      : !u1Low && u2Low
        ? "positive_negative"
        : "positive_positive";

  const pool = templatePool[key];
  const results: string[] = [];

  const allKnown = [...allPreviouslyGenerated, ...firstOrder, ...secondOrder];

  function jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  function isUnique(candidate: string): boolean {
    for (const existing of allKnown) {
      if (jaccardSimilarity(candidate, existing) > 0.5) return false;
    }
    for (const existing of results) {
      if (jaccardSimilarity(candidate, existing) > 0.5) return false;
    }
    return true;
  }

  for (const second of secondOrder) {
    const seed = second.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    const templateIdx = Math.abs(seed) % pool.length;
    const candidate = pool[templateIdx];

    if (isUnique(candidate)) {
      results.push(candidate);
    } else {
      const fallbackIdx = (templateIdx + 1 + Math.abs(seed >> 4)) % pool.length;
      const fallback = pool[fallbackIdx];
      if (isUnique(fallback)) {
        results.push(fallback);
      }
    }
  }

  if (results.length < 2 && pool.length > results.length) {
    for (let i = 0; i < pool.length && results.length < 2; i++) {
      if (isUnique(pool[i])) {
        results.push(pool[i]);
      }
    }
  }

  return results;
}

function generatePreMortem(_focalQuestion: string): PreMortemFailure[] {
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

function generateFuturesWheel(_focalQuestion: string): FuturesWheelRing {
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

  const thirdRingTemplates: string[] = [
    `Institutional memory and culture gradually encode the new normal, making reversal increasingly difficult`,
    `New generation of professionals grows up in the transformed landscape, treating it as the baseline`,
    `Investment patterns permanently shift to reinforce the emerging structure`,
    `Regulatory frameworks adapt to codify the new reality into formal governance`,
    `Public expectations recalibrate, creating political pressure against reverting to old models`,
    `Competing organizations that resisted change lose market position or relevance`,
    `Supply chain dependencies realign to favor entities that adapted early to the new conditions`,
    `Educational and training curricula evolve to reflect the transformed landscape as the new standard`,
    `Cross-industry knowledge transfer accelerates as best practices from the new paradigm spread`,
    `Legacy infrastructure becomes a stranded asset as investment flows toward the emerging model`,
    `Social norms shift to stigmatize behaviors associated with the previous paradigm`,
    `New metrics and KPs emerge that reflect the transformed value system of the domain`,
    `Talent migration patterns reverse as the new center of gravity attracts previously unaligned professionals`,
    `Secondary markets develop around the infrastructure and services supporting the new paradigm`,
    `Risk models are rewritten as historical correlations break down under the new regime`,
    `Stakeholder coalitions realign as the distribution of winners and losers becomes entrenched`,
    `Narrative authority shifts from legacy institutions to emergent thought leaders in the new paradigm`,
    `Resource allocation mechanisms transition from optimization for the old system to the new one`,
    `Cultural artifacts — media, literature, art — begin reflecting and reinforcing the new dominant narrative`,
    `Inter-generational knowledge transfer gaps widen as experienced practitioners of the old model retire`,
  ];

  const thirdRing: Record<string, string> = {};
  const usedTemplates = new Set<string>();
  for (const [_parent, children] of Object.entries(secondRing)) {
    for (const child of children) {
      const seed = child.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      let templateIdx = (Math.abs(seed) + Object.keys(thirdRing).length) % thirdRingTemplates.length;
      let candidate = thirdRingTemplates[templateIdx];
      let attempts = 0;
      while (usedTemplates.has(candidate) && attempts < thirdRingTemplates.length) {
        templateIdx = (templateIdx + 1) % thirdRingTemplates.length;
        candidate = thirdRingTemplates[templateIdx];
        attempts++;
      }
      thirdRing[child] = candidate;
      usedTemplates.add(candidate);
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
        "Generates a 2x2 scenario planning matrix from two key uncertainties, producing four named scenarios with " +
        "archetypal narratives following a structured scenario planning framework. Output includes pre-mortem failure " +
        "analysis, futures wheel mapping of 1st/2nd/3rd order consequences, and early warning signals. " +
        "Use for strategic planning, risk anticipation, and exploring multiple plausible futures before committing to a course of action.",
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

        // Hybrid mode: attempt content composer first, fall back to templates
        const fullText = focal_question + " " + key_uncertainties[0] + " " + key_uncertainties[1];
        const _structure = getStructureForText(fullText, focal_question);

        const composeSection = (thoughtType: ThoughtType, stepNumber: number, totalSections: number, prevOutputs: string[]): string => {
          return composeToolContent({
            toolName: "think_scenario",
            text: fullText,
            initialPosition: focal_question,
            mode: "analytical" as ThinkingMode,
            stepNumber,
            totalSteps: totalSections,
            thoughtType,
            previousOutputs: prevOutputs,
          });
        };

        const [u1, u2] = key_uncertainties;

        const axisStates: { u1Low: boolean; u2Low: boolean }[] = [
          { u1Low: true, u2Low: true },
          { u1Low: false, u2Low: true },
          { u1Low: true, u2Low: false },
          { u1Low: false, u2Low: false },
        ];

        const scenarios: ScenarioNarrative[] = [];
        for (const { u1Low, u2Low } of axisStates) {
          const scenarioIdx = scenarios.length;
          const name = generateArchetypalName(u1Low, u2Low);

          // Try composer for description (prospective)
          const descComposed = composeSection('prospective', scenarioIdx * 5, 20, []);
          const description = descComposed.length > 200
            ? descComposed
            : generateDescription(focal_question, u1, u2, u1Low, u2Low, name);

          const drivingForces = generateDrivingForces(u1, u2, u1Low, u2Low, known_driving_forces ?? "");

          // Try composer for first-order consequences (diagnostic)
          const firstOrderComposed = composeSection('diagnostic', scenarioIdx * 5 + 1, 20, []);
          const firstOrder = firstOrderComposed.length > 200
            ? firstOrderComposed.split(/\n+/).filter((s: string) => s.trim().length > 5)
            : generateFirstOrderConsequences(name, u1, u2, u1Low, u2Low);

          // Try composer for second-order consequences (relational)
          const secondOrderComposed = composeSection('relational', scenarioIdx * 5 + 2, 20, [description]);
          const secondOrder = secondOrderComposed.length > 200
            ? secondOrderComposed.split(/\n+/).filter((s: string) => s.trim().length > 5)
            : generateSecondOrderConsequences(u1, u2, u1Low, u2Low, firstOrder);

          const allPrevious: string[] = [];
          for (const existing of scenarios) {
            allPrevious.push(...existing.first_order_consequences, ...existing.second_order_consequences, ...existing.third_order_consequences);
          }
          allPrevious.push(...firstOrder, ...secondOrder);

          // Try composer for third-order consequences (prospective)
          const thirdOrderComposed = composeSection('prospective', scenarioIdx * 5 + 3, 20, [...firstOrder, ...secondOrder]);
          const thirdOrder = thirdOrderComposed.length > 200
            ? thirdOrderComposed.split(/\n+/).filter((s: string) => s.trim().length > 5)
            : generateThirdOrderConsequences(u1, u2, u1Low, u2Low, firstOrder, secondOrder, allPrevious);

          scenarios.push({
            name,
            axis_position: `${u1}: ${u1Low ? "Low" : "High"} / ${u2}: ${u2Low ? "Low" : "High"}`,
            description,
            driving_forces: drivingForces,
            probability: generateProbability(u1Low, u2Low),
            first_order_consequences: firstOrder,
            second_order_consequences: secondOrder,
            third_order_consequences: thirdOrder,
          });
        }

        const preMortem = generatePreMortem(focal_question);
        const futuresWheel = generateFuturesWheel(focal_question);

        // Try composer for strategic implications (synthetic)
        const strategicComposed = composeSection('synthetic', 19, 20, scenarios.map((s) => s.description));
        const strategicImplications =
          output_depth === "exhaustive"
            ? (strategicComposed.length > 200
                ? { robust: strategicComposed.split(/\n+/).filter((s: string) => s.trim().length > 5), scenario_specific: [] }
                : generateStrategicImplications(scenarios))
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
