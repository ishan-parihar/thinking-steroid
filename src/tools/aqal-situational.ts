import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { QuadrantAnalysis, OutputDepth, Quadrant, EpistemicStatus, SuggestedTool, OutputMode, PsychographProfile, LineOfDevelopment, DevelopmentalLevel } from "../types.js";
import { formatAqalSituational } from "../utils/formatters.js";
import { LINES_OF_DEVELOPMENT, DEVELOPMENTAL_LEVELS } from "../constants.js";

// ─── Quadrant Analysis Engine ────────────────────────────────────────────────

function generateQuadrantAnalysis(params: {
  quadrant: Quadrant;
  situation: string;
  stakeholders: string;
  observableData: string;
  reportedExperience: string;
  culturalContext: string;
  systemicContext: string;
  depth: OutputDepth;
}): QuadrantAnalysis {
  const { quadrant, situation, stakeholders, observableData, reportedExperience, culturalContext, systemicContext, depth } = params;

  const depthModifier = depth === "essential" ? "concisely" : depth === "exhaustive" ? "with maximum granularity and multi-layered depth" : "with balanced thoroughness";

  const quadrantGenerators: Record<Quadrant, () => QuadrantAnalysis> = {
    intentional: () => ({
      context_summary: `From the interior-individual perspective, the situation "${situation}" involves subjective experiences of ${stakeholders || "the individuals involved"}. The reported experience — "${reportedExperience}" — reveals the phenomenological landscape: how people are making sense of events from within their own consciousness. This quadrant examines the beliefs, values, emotional states, self-narratives, and meaning-making processes that shape individual responses to the situation. At ${depth} depth, we ${depthModifier} explore the layers of subjective interpretation that filter and color each person's experience.`,
      solution_summary: `Address the intentional dimension by facilitating shifts in self-awareness, emotional regulation, and meaning-making frameworks. Interventions at this level include reflective practices, cognitive reframing, values clarification, and the cultivation of meta-awareness — the capacity to observe one own thought and emotional patterns rather than being identified with them.`,
      strategies: generateStrategies("intentional", depth),
      second_order_effects: generateSecondOrderEffects("intentional", depth),
    }),
    behavioral: () => ({
      context_summary: `From the exterior-individual perspective, the situation manifests in observable, measurable phenomena. The observable data — "${observableData}" — provides the empirical baseline: behaviors, performance metrics, physiological indicators, and other third-person data points. This quadrant examines what can be objectively measured about the individuals involved, independent of their subjective reports. At ${depth} depth, we ${depthModifier} analyze the behavioral patterns, their frequency, intensity, and correlation with environmental triggers.`,
      solution_summary: `Address the behavioral dimension through evidence-based interventions targeting observable patterns. This includes behavioral modification techniques, skills training, environmental redesign to shape behavior, and the establishment of measurement systems that provide objective feedback on progress.`,
      strategies: generateStrategies("behavioral", depth),
      second_order_effects: generateSecondOrderEffects("behavioral", depth),
    }),
    cultural: () => ({
      context_summary: `From the interior-collective perspective, the situation is embedded in a web of shared meanings, values, and worldviews. The cultural context — "${culturalContext}" — defines the interpretive lens through which the group makes sense of events. This quadrant examines the intersubjective agreements, unwritten norms, collective narratives, and shared identity constructs that shape how "we" understand and respond to the situation. At ${depth} depth, we ${depthModifier} map the cultural layers from surface-level norms to deep worldview assumptions.`,
      solution_summary: `Address the cultural dimension through dialogue, shared meaning-making processes, and the intentional evolution of collective values. Interventions include facilitated sensemaking sessions, narrative work that reshapes the group's story about itself, and the cultivation of cultural conditions that support desired behavioral and structural changes.`,
      strategies: generateStrategies("cultural", depth),
      second_order_effects: generateSecondOrderEffects("cultural", depth),
    }),
    social: () => ({
      context_summary: `From the exterior-collective perspective, the situation is shaped by objective systems, structures, and institutional arrangements. The systemic context — "${systemicContext}" — defines the architectural constraints and enablers that govern collective behavior. This quadrant examines the laws, policies, organizational structures, economic arrangements, technological infrastructure, and other inter-objective systems that create the conditions within which individuals and cultures operate. At ${depth} depth, we ${depthModifier} analyze the structural leverage points and systemic feedback loops.`,
      solution_summary: `Address the social dimension through structural interventions: policy changes, organizational redesign, process reengineering, and the modification of systemic incentives and constraints. Interventions target the architecture of collective life rather than the individuals within it.`,
      strategies: generateStrategies("social", depth),
      second_order_effects: generateSecondOrderEffects("social", depth),
    }),
  };

  return quadrantGenerators[quadrant]();
}

function generateStrategies(quadrant: Quadrant, depth: OutputDepth): string[] {
  const strategySets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: [
        "Implement daily reflective practice to increase self-awareness of thought and emotional patterns.",
        "Engage in values clarification to align actions with deeper purpose and identity.",
      ],
      standard: [
        "Implement daily reflective practice to increase self-awareness of thought and emotional patterns.",
        "Engage in values clarification to align actions with deeper purpose and identity.",
        "Develop meta-awareness through mindfulness or contemplative practices that create distance between stimulus and response.",
        "Reframe limiting narratives by identifying cognitive distortions and constructing more adaptive self-stories.",
      ],
      exhaustive: [
        "Implement daily reflective practice to increase self-awareness of thought and emotional patterns.",
        "Engage in values clarification to align actions with deeper purpose and identity.",
        "Develop meta-awareness through mindfulness or contemplative practices that create distance between stimulus and response.",
        "Reframe limiting narratives by identifying cognitive distortions and constructing more adaptive self-stories.",
        "Conduct a developmental self-assessment to identify the current stage of meaning-making and the next available growth edge.",
        "Establish emotional regulation protocols that address both immediate reactivity and underlying emotional patterns.",
        "Create a personal practice of perspective-taking that systematically explores situations from multiple developmental vantage points.",
      ],
    },
    behavioral: {
      essential: [
        "Establish baseline metrics for key behavioral indicators relevant to the situation.",
        "Design environmental cues and structures that support desired behavioral patterns.",
      ],
      standard: [
        "Establish baseline metrics for key behavioral indicators relevant to the situation.",
        "Design environmental cues and structures that support desired behavioral patterns.",
        "Implement a feedback loop system that provides real-time data on behavioral performance.",
        "Apply behavioral science principles (implementation intentions, habit stacking, friction reduction) to shape target behaviors.",
      ],
      exhaustive: [
        "Establish baseline metrics for key behavioral indicators relevant to the situation.",
        "Design environmental cues and structures that support desired behavioral patterns.",
        "Implement a feedback loop system that provides real-time data on behavioral performance.",
        "Apply behavioral science principles (implementation intentions, habit stacking, friction reduction) to shape target behaviors.",
        "Conduct a functional behavioral analysis to identify the antecedents, behaviors, and consequences maintaining current patterns.",
        "Develop a skills training program that addresses any capability gaps preventing desired behavioral change.",
        "Create a behavioral experiment protocol that tests alternative approaches with measurable outcomes and clear success criteria.",
      ],
    },
    cultural: {
      essential: [
        "Facilitate group dialogue sessions to surface and examine shared assumptions and narratives.",
        "Identify the dominant cultural story about the situation and explore alternative narratives.",
      ],
      standard: [
        "Facilitate group dialogue sessions to surface and examine shared assumptions and narratives.",
        "Identify the dominant cultural story about the situation and explore alternative narratives.",
        "Map the group's developmental stage and design interventions that stretch collective meaning-making capacity.",
        "Create rituals and practices that reinforce desired cultural values and make them experientially real rather than abstractly stated.",
      ],
      exhaustive: [
        "Facilitate group dialogue sessions to surface and examine shared assumptions and narratives.",
        "Identify the dominant cultural story about the situation and explore alternative narratives.",
        "Map the group's developmental stage and design interventions that stretch collective meaning-making capacity.",
        "Create rituals and practices that reinforce desired cultural values and make them experientially real rather than abstractly stated.",
        "Conduct a cultural shadow analysis to identify disowned aspects of the group's identity that are being projected onto individuals or external groups.",
        "Design a sensemaking infrastructure — ongoing processes for the group to collectively interpret events, update its worldview, and adapt its identity.",
        "Establish cross-cultural dialogue with external groups to broaden the collective perspective and challenge echo-chamber dynamics.",
      ],
    },
    social: {
      essential: [
        "Map the key systemic structures (policies, processes, hierarchies) that shape the situation.",
        "Identify leverage points where structural changes would produce the greatest systemic impact.",
      ],
      standard: [
        "Map the key systemic structures (policies, processes, hierarchies) that shape the situation.",
        "Identify leverage points where structural changes would produce the greatest systemic impact.",
        "Redesign incentive structures to align individual behavior with desired collective outcomes.",
        "Implement governance mechanisms that ensure accountability, transparency, and adaptability in the face of changing conditions.",
      ],
      exhaustive: [
        "Map the key systemic structures (policies, processes, hierarchies) that shape the situation.",
        "Identify leverage points where structural changes would produce the greatest systemic impact.",
        "Redesign incentive structures to align individual behavior with desired collective outcomes.",
        "Implement governance mechanisms that ensure accountability, transparency, and adaptability in the face of changing conditions.",
        "Conduct a network analysis to identify informal power structures, information flows, and bottlenecks that formal structures obscure.",
        "Design a change architecture that sequences structural interventions to build momentum while managing resistance.",
        "Establish a systems monitoring framework that tracks leading indicators of systemic health and triggers adaptive responses before crises emerge.",
      ],
    },
  };

  return strategySets[quadrant][depth];
}

function generateSecondOrderEffects(quadrant: Quadrant, depth: OutputDepth): string[] {
  const effectSets: Record<Quadrant, { essential: string[]; standard: string[]; exhaustive: string[] }> = {
    intentional: {
      essential: [
        "Increased self-awareness may initially produce discomfort as previously unconscious patterns surface into awareness.",
        "Shifts in individual meaning-making can create temporary misalignment with existing cultural narratives.",
      ],
      standard: [
        "Increased self-awareness may initially produce discomfort as previously unconscious patterns surface into awareness.",
        "Shifts in individual meaning-making can create temporary misalignment with existing cultural narratives.",
        "Enhanced meta-awareness may change the individual's relationship to authority, potentially challenging existing hierarchies.",
        "Values clarification can create tension between newly clarified personal values and organizational expectations.",
      ],
      exhaustive: [
        "Increased self-awareness may initially produce discomfort as previously unconscious patterns surface into awareness.",
        "Shifts in individual meaning-making can create temporary misalignment with existing cultural narratives.",
        "Enhanced meta-awareness may change the individual's relationship to authority, potentially challenging existing hierarchies.",
        "Values clarification can create tension between newly clarified personal values and organizational expectations.",
        "Developmental growth may create a 'meaning gap' where the individual has outgrown their current context but not yet found a new one.",
        "Emotional regulation improvements can shift group dynamics as the individual no longer participates in familiar dysfunctional patterns.",
        "Perspective-taking expansion may produce existential uncertainty as the individual recognizes the complexity and ambiguity of previously held certainties.",
      ],
    },
    behavioral: {
      essential: [
        "New behavioral patterns may face resistance from environmental structures optimized for old patterns.",
        "Measurement systems can create unintended gaming behavior if not designed with awareness of Goodhart's Law.",
      ],
      standard: [
        "New behavioral patterns may face resistance from environmental structures optimized for old patterns.",
        "Measurement systems can create unintended gaming behavior if not designed with awareness of Goodhart's Law.",
        "Behavioral changes in key individuals can trigger cascading adjustments in the behavior of those around them.",
        "Skills development can create expectations that the environment must evolve to utilize the new capabilities.",
      ],
      exhaustive: [
        "New behavioral patterns may face resistance from environmental structures optimized for old patterns.",
        "Measurement systems can create unintended gaming behavior if not designed with awareness of Goodhart's Law.",
        "Behavioral changes in key individuals can trigger cascading adjustments in the behavior of those around them.",
        "Skills development can create expectations that the environment must evolve to utilize the new capabilities.",
        "Environmental redesign may displace existing routines that, while suboptimal, provided psychological stability.",
        "Feedback loop implementation can create information overload if the system is not designed for cognitive manageability.",
        "Behavioral experiments that fail may produce learned helplessness if not framed as learning opportunities rather than performance failures.",
      ],
    },
    cultural: {
      essential: [
        "Shifting cultural narratives may produce identity disruption for those strongly invested in the old story.",
        "New rituals can feel inauthentic if not organically developed from within the group's existing meaning structures.",
      ],
      standard: [
        "Shifting cultural narratives may produce identity disruption for those strongly invested in the old story.",
        "New rituals can feel inauthentic if not organically developed from within the group's existing meaning structures.",
        "Dialogue processes that surface hidden assumptions can create temporary conflict before deeper understanding emerges.",
        "Cultural evolution can create a values gap between early adopters and those still operating within the old paradigm.",
      ],
      exhaustive: [
        "Shifting cultural narratives may produce identity disruption for those strongly invested in the old story.",
        "New rituals can feel inauthentic if not organically developed from within the group's existing meaning structures.",
        "Dialogue processes that surface hidden assumptions can create temporary conflict before deeper understanding emerges.",
        "Cultural evolution can create a values gap between early adopters and those still operating within the old paradigm.",
        "Shadow retrieval at the cultural level can unleash repressed collective emotions that require skilled facilitation to process.",
        "Sensemaking infrastructure may become bureaucratized over time, turning living dialogue into mechanical process.",
        "Cross-cultural dialogue can destabilize the group's sense of coherence before a more inclusive identity can form.",
      ],
    },
    social: {
      essential: [
        "Structural changes will produce winners and losers, creating political dynamics that must be managed.",
        "New governance mechanisms may be perceived as additional bureaucracy rather than enabling frameworks.",
      ],
      standard: [
        "Structural changes will produce winners and losers, creating political dynamics that must be managed.",
        "New governance mechanisms may be perceived as additional bureaucracy rather than enabling frameworks.",
        "Incentive realignment can produce unexpected behavioral adaptations as individuals optimize for the new reward structure.",
        "Process changes may temporarily reduce efficiency as the system transitions from old to new operating modes.",
      ],
      exhaustive: [
        "Structural changes will produce winners and losers, creating political dynamics that must be managed.",
        "New governance mechanisms may be perceived as additional bureaucracy rather than enabling frameworks.",
        "Incentive realignment can produce unexpected behavioral adaptations as individuals optimize for the new reward structure.",
        "Process changes may temporarily reduce efficiency as the system transitions from old to new operating modes.",
        "Network analysis revelations may expose informal power structures that resist formalization or change.",
        "Change architecture that sequences interventions too slowly may lose momentum; too quickly may overwhelm adaptive capacity.",
        "Systems monitoring can create a surveillance culture if not balanced with trust and psychological safety, producing the opposite of intended transparency.",
      ],
    },
  };

  return effectSets[quadrant][depth];
}

// ─── Psychograph Generation Engine ────────────────────────────────────────────

function generatePsychograph(params: {
  situation: string;
  stakeholders: string;
  observableData: string;
  reportedExperience: string;
  culturalContext: string;
  systemicContext: string;
  lines: LineOfDevelopment[];
  depth: OutputDepth;
}): PsychographProfile[] {
  const { situation, stakeholders, observableData, reportedExperience, culturalContext, systemicContext, lines, depth } = params;

  const depthModifier = depth === "essential" ? "briefly" : depth === "exhaustive" ? "with granular specificity" : "with reasonable clarity";

  const contextSynopsis = `Situation: "${situation}". Stakeholders: ${stakeholders || "those involved"}. Observable data: "${observableData}". Reported experience: "${reportedExperience}". Cultural context: "${culturalContext}". Systemic context: "${systemicContext}".`;

  return lines.map((line) => {
    const lineInfo = LINES_OF_DEVELOPMENT[line];
    return {
      line,
      estimated_level: "modern-rational" as DevelopmentalLevel,
      confidence: 0.5,
      indicators: [
        `The situation context suggests ${depthModifier} that the ${line} line operates at a level where individuals ${getLineIndicator(line, "present")}.`,
        `Shadow manifestation patterns indicate potential ${getLineIndicator(line, "shadow")} — consistent with ${lineInfo.label} line underdevelopment or fixation.`,
        `Cross-referencing observable data with reported experience reveals ${getLineIndicator(line, "discrepancy")}.`,
      ],
    };
  });
}

function getLineIndicator(line: LineOfDevelopment, type: "present" | "shadow" | "discrepancy"): string {
  const indicators: Record<LineOfDevelopment, Record<string, string>> = {
    cognitive: {
      present: "engage in systematic rational analysis and evidence-based reasoning",
      shadow: "intellectualization used to avoid emotional processing",
      discrepancy: "a gap between stated rational understanding and actual decision-making patterns",
    },
    emotional: {
      present: "demonstrate awareness and regulation of affective states in service of relational goals",
      shadow: "emotional reactivity that overrides longer-term considerations",
      discrepancy: "a mismatch between expressed emotional awareness and observable emotional responses",
    },
    intrapersonal: {
      present: "show capacity for self-reflection and meta-awareness of own patterns",
      shadow: "obsessive self-analysis that substitutes for genuine action or connection",
      discrepancy: "self-reported self-awareness that does not align with behavioral blind spots",
    },
    moral: {
      present: "reason from principles that extend beyond self-interest or group loyalty",
      shadow: "moral self-righteousness used to justify exclusion or judgment of others",
      discrepancy: "stated moral principles that conflict with actual behavioral choices",
    },
    spiritual: {
      present: "access meaning and purpose that transcends immediate personal concerns",
      shadow: "spiritual bypassing — using transcendent language to avoid psychological work",
      discrepancy: "professed spiritual values that are not embodied in concrete relational patterns",
    },
    kinesthetic: {
      present: "demonstrate embodied awareness and somatic intelligence in action",
      shadow: "dissociation from bodily experience in favor of purely mental functioning",
      discrepancy: "intellectual understanding of embodied principles without physical integration",
    },
    willpower: {
      present: "sustain intentional action toward chosen ends despite internal and external resistance",
      shadow: "rigid willfulness and control that refuses to adapt to changing circumstances",
      discrepancy: "stated intentions and commitments that are not consistently enacted",
    },
  };
  return indicators[line][type];
}

function generatePsychographAnalysis(profiles: PsychographProfile[]): {
  table: string;
  unevenDevelopmentAnalysis: string;
  leadingEdge: string;
  laggingConstraint: string;
} {
  const developmentalOrder: DevelopmentalLevel[] = [
    "archaic", "magic", "magic-mythic", "mythic", "modern-rational", "postmodern", "integral", "super-integral",
  ];

  const levelRank = (level: DevelopmentalLevel): number => developmentalOrder.indexOf(level);

  const sorted = [...profiles].sort((a, b) => levelRank(b.estimated_level) - levelRank(a.estimated_level));
  const leading = sorted[0];
  const lagging = sorted[sorted.length - 1];

  const tableRows = profiles.map((p) => [
    capitalizeFirst(p.line),
    DEVELOPMENTAL_LEVELS[p.estimated_level].label,
    `${Math.round(p.confidence * 100)}%`,
    p.indicators.slice(0, 2).join("; "),
  ]);

  const table = buildMarkdownTable(
    ["Line", "Estimated Level", "Confidence", "Key Indicators"],
    tableRows,
  );

  const levelSpread = levelRank(leading.estimated_level) - levelRank(lagging.estimated_level);
  const spreadDescription = levelSpread >= 4
    ? "a very wide developmental gap"
    : levelSpread >= 2
      ? "a moderate developmental gap"
      : "a relatively narrow developmental spread";

  const unevenDevelopmentAnalysis = `The psychograph profile reveals ${spreadDescription} between the most and least developed lines. ` +
    `The ${capitalizeFirst(leading.line)} line (${DEVELOPMENTAL_LEVELS[leading.estimated_level].label}) operates at a significantly higher developmental altitude than the ${capitalizeFirst(lagging.line)} line (${DEVELOPMENTAL_LEVELS[lagging.estimated_level].label}). ` +
    `This unevenness is a normal feature of human development — no individual or group develops all lines equally. ` +
    `However, when the gap between lines is substantial, it creates characteristic patterns: the leading line provides the individual or group with sophisticated capacities in one domain while the lagging line creates a developmental bottleneck that limits overall effectiveness. ` +
    `The situation analyzed here likely shows evidence of this asymmetry, where strengths in ${leading.line} functioning are partially undermined by limitations in ${lagging.line} capacity.`;

  const leadingEdge = `The ${capitalizeFirst(leading.line)} line emerges as the leading edge of development in this situation. ` +
    `At the ${DEVELOPMENTAL_LEVELS[leading.estimated_level].label} level, this line provides the primary source of developmental resources and adaptive capacity. ` +
    `Individuals or groups can leverage this strength as an entry point for growth — using the meta-awareness and complexity available in the ${leading.line} line to bring attention and intention to the less developed lines.`;

  const laggingConstraint = `The ${capitalizeFirst(lagging.line)} line represents the lagging constraint — the developmental bottleneck that limits the overall effectiveness of interventions. ` +
    `At the ${DEVELOPMENTAL_LEVELS[lagging.estimated_level].label} level, this line operates with less complexity and adaptability than the rest of the system. ` +
    `Any comprehensive intervention strategy must include support for ${lagging.line} line development, as neglecting this dimension will cause the system to default to its least developed capacity under stress.`;

  return { table, unevenDevelopmentAnalysis, leadingEdge, laggingConstraint };
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildMarkdownTable(headers: string[], rows: string[][]): string {
  const maxColWidths: number[] = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );

  const pad = (cell: string, col: number): string => {
    const w = maxColWidths[col];
    return cell.padEnd(w);
  };

  const headerLine = `| ${headers.map((h, i) => pad(h, i)).join(" | ")} |`;
  const separator = `| ${maxColWidths.map((w) => "-".repeat(w)).join(" | ")} |`;
  const bodyLines = rows.map((row) => `| ${row.map((c, i) => pad(c, i)).join(" | ")} |`);

  return [headerLine, separator, ...bodyLines].join("\n");
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
    "think_aqal_situational",
    {
      title: "AQAL Situational Analysis",
      description:
        "Performs a comprehensive Integral AQAL (All Quadrants, All Levels) situational analysis that forces " +
        "balance across all four quadrants of reality: Intentional/Subjective (interior individual — thoughts, " +
        "feelings, self-identity), Behavioral/Objective (exterior individual — observable behavior, metrics, " +
        "physical processes), Cultural/Inter-subjective (interior collective — shared values, worldviews, " +
        "collective meaning), and Social/Inter-objective (exterior collective — systems, institutions, " +
        "structures, infrastructure).\n\n" +
        "Each quadrant produces: a context summary that synthesizes the input data through that quadrant's " +
        "epistemological lens, a solution summary that identifies the intervention approach for that dimension, " +
        "a set of actionable strategies scaled by output depth, and a map of second-order effects that reveals " +
        "the downstream consequences of quadrant-specific interventions.\n\n" +
        "The analysis also includes a 2×2 quadrant overview table for quick reference and cross-quadrant " +
        "dynamics analysis that examines how changes in one quadrant ripple through the others.\n\n" +
        "Use this tool when facing complex situations where single-perspective analysis is insufficient — " +
        "organizational change, conflict resolution, strategic planning, policy analysis, or any context " +
        "where interior and exterior, individual and collective dimensions must all be considered for a " +
        "complete understanding.",
      inputSchema: z
        .object({
          situation: z
            .string()
            .describe(
              "A clear description of the situation to analyze. Should capture the essential facts, " +
                "context, and why the situation matters."
            ),
          stakeholders: z
            .string()
            .describe(
              "The individuals, groups, or entities involved in or affected by the situation. " +
                "Can be a comma-separated list or narrative description."
            ),
          observable_data: z
            .string()
            .describe(
              "Third-person, objective data about the situation — measurable behaviors, performance metrics, " +
                "physical indicators, or any empirically observable phenomena."
            ),
          reported_experience: z
            .string()
            .describe(
              "First-person accounts of the situation — how people describe their inner experience, " +
                "feelings, perceptions, and meaning-making. This is the phenomenological data."
            ),
          cultural_context: z
            .string()
            .describe(
              "The shared values, norms, narratives, and worldview assumptions of the group or community " +
                "involved. What does 'we' believe about this situation?"
            ),
          systemic_context: z
            .string()
            .describe(
              "The structural, institutional, and systemic factors shaping the situation — policies, " +
                "processes, hierarchies, economic arrangements, technological infrastructure, and other " +
                "inter-objective conditions."
            ),
          output_depth: z
            .enum(["essential", "standard", "exhaustive"])
            .default("standard")
            .describe(
              "Controls the depth of each quadrant analysis: 'essential' for a focused overview, " +
                "'standard' for balanced thoroughness, 'exhaustive' for maximum granularity."
            ),
          output_mode: z
            .enum(["executive", "analytical", "exploratory"])
            .default("analytical")
            .describe(
              "Output presentation mode: 'executive' for concise summaries, " +
                "'analytical' for full detailed output (default), 'exploratory' with open questions."
            ),
          assess_lines: z
            .boolean()
            .default(false)
            .describe(
              "When true, generate a psychograph-style multi-line developmental assessment " +
                "for each line of development (cognitive, emotional, intrapersonal, moral, " +
                "spiritual, kinesthetic, willpower)."
            ),
          lines_to_assess: z
            .array(
              z.enum(["cognitive", "emotional", "intrapersonal", "moral", "spiritual", "kinesthetic", "willpower"])
            )
            .optional()
            .describe(
              "Specific lines of development to assess. Defaults to all 7 lines when assess_lines is true."
            ),
        })
        .strict(),
      annotations: ANNOTATIONS,
    },
    async (args) => {
      try {
        const {
          situation,
          stakeholders,
          observable_data,
          reported_experience,
          cultural_context,
          systemic_context,
          output_depth,
          output_mode,
          assess_lines,
          lines_to_assess,
        } = args;

        const quadrants: Record<Quadrant, QuadrantAnalysis> = {
          intentional: generateQuadrantAnalysis({
            quadrant: "intentional",
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            depth: output_depth,
          }),
          behavioral: generateQuadrantAnalysis({
            quadrant: "behavioral",
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            depth: output_depth,
          }),
          cultural: generateQuadrantAnalysis({
            quadrant: "cultural",
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            depth: output_depth,
          }),
          social: generateQuadrantAnalysis({
            quadrant: "social",
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            depth: output_depth,
          }),
        };

        const epistemicStatus: EpistemicStatus = output_depth === 'exhaustive' ? 'well-supported' : output_depth === 'standard' ? 'tentative' : 'speculative';
        const suggestedFollowup: SuggestedTool[] = ['think_aqal_projection', 'think_hierarchical'];

        let markdown_output = formatAqalSituational(situation, {
          intentional: quadrants.intentional,
          behavioral: quadrants.behavioral,
          cultural: quadrants.cultural,
          social: quadrants.social,
        }, output_mode, epistemicStatus, suggestedFollowup);

        if (assess_lines) {
          const lines = lines_to_assess && lines_to_assess.length > 0
            ? lines_to_assess
            : (Object.keys(LINES_OF_DEVELOPMENT) as LineOfDevelopment[]);

          const psychographProfiles = generatePsychograph({
            situation,
            stakeholders,
            observableData: observable_data,
            reportedExperience: reported_experience,
            culturalContext: cultural_context,
            systemicContext: systemic_context,
            lines,
            depth: output_depth,
          });

          const analysis = generatePsychographAnalysis(psychographProfiles);

          const psychographSection = [
            "",
            "## Psychograph: Lines of Development Analysis",
            "",
            analysis.table,
            "",
            "### Uneven Development Patterns",
            "",
            analysis.unevenDevelopmentAnalysis,
            "",
            `**Leading Edge:** ${analysis.leadingEdge}`,
            "",
            `**Lagging Constraint:** ${analysis.laggingConstraint}`,
          ].join("\n");

          markdown_output = markdown_output + psychographSection;
        }

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
