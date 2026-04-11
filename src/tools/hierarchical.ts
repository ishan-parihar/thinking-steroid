import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DEVELOPMENTAL_LEVELS, QUADRANTS, VISION_LOGIC_SUBSTAGES } from "../constants.js";
import { formatHierarchical } from "../utils/formatters.js";
import type { EpistemicStatus, SuggestedTool, OutputMode, VisionLogicSubstage, ThoughtType } from "../types.js";
import { composeToolContent, getStructureForText } from "../utils/content-pipeline.js";

const OUTPUT_DEPTH_ENUM = z.enum(["essential", "standard", "exhaustive"]);

const QUADRANT_KEYS = ["intentional", "behavioral", "cultural", "social"] as const;

const VISION_LOGIC_ORDER: VisionLogicSubstage[] = ["systematic", "metasystematic", "paradigmatic", "cross-paradigmatic"];

interface HierarchicalComposerContext {
  fullText: string;
  initialPosition: string;
  outputMode: OutputMode;
}

function generateVisionLogicAnalysis(params: {
  system: string;
  currentStage: string;
  systemDescription: string;
  composerCtx?: HierarchicalComposerContext;
}): {
  currentSubstage: VisionLogicSubstage;
  evidence: string[];
  nextSubstage: VisionLogicSubstage | null;
  gapAnalysis: string;
  typicalOutputCurrent: string;
  typicalOutputNext: string | null;
} {
  const { system, currentStage, systemDescription, composerCtx } = params;

  if (composerCtx) {
    const composed = composeToolContent({
      toolName: "think_hierarchical",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: 1,
      totalSteps: 2,
      thoughtType: "relational" as ThoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) {
      const stageToSubstageMap: Record<string, VisionLogicSubstage> = {
        archaic: "systematic", magic: "systematic", "magic-mythic": "systematic", mythic: "systematic",
        "modern-rational": "systematic", postmodern: "metasystematic", integral: "metasystematic",
        "super-integral": "paradigmatic",
      };
      const currentSubstage = stageToSubstageMap[currentStage] ?? "systematic";
      const currentIndex = VISION_LOGIC_ORDER.indexOf(currentSubstage);
      const nextSubstage = currentIndex < VISION_LOGIC_ORDER.length - 1 ? VISION_LOGIC_ORDER[currentIndex + 1] : null;
      const currentSubstageInfo = VISION_LOGIC_SUBSTAGES[currentSubstage];
      return {
        currentSubstage,
        evidence: [composed],
        nextSubstage,
        gapAnalysis: composed,
        typicalOutputCurrent: currentSubstageInfo.typical_output,
        typicalOutputNext: nextSubstage ? VISION_LOGIC_SUBSTAGES[nextSubstage]?.typical_output ?? null : null,
      };
    }
  }

  const stageToSubstageMap: Record<string, VisionLogicSubstage> = {
    archaic: "systematic",
    magic: "systematic",
    "magic-mythic": "systematic",
    mythic: "systematic",
    "modern-rational": "systematic",
    postmodern: "metasystematic",
    integral: "metasystematic",
    "super-integral": "paradigmatic",
  };

  const currentSubstage = stageToSubstageMap[currentStage] ?? "systematic";
  const currentIndex = VISION_LOGIC_ORDER.indexOf(currentSubstage);
  const nextSubstage = currentIndex < VISION_LOGIC_ORDER.length - 1 ? VISION_LOGIC_ORDER[currentIndex + 1] : null;

  const evidenceBySubstage: Record<VisionLogicSubstage, string[]> = {
    systematic: [
      `${system} operates within a single coherent framework of understanding`,
      `Can coordinate multiple variables within one domain but does not compare frameworks`,
      `Analysis stays within established paradigms without questioning underlying assumptions`,
      `System description indicates bounded reasoning: "${systemDescription.slice(0, 150)}"`,
    ],
    metasystematic: [
      `${system} demonstrates capacity to compare and coordinate multiple frameworks`,
      `Can identify structural similarities between different systematic approaches`,
      `Shows awareness that different frameworks reveal different aspects of reality`,
      `System description indicates meta-level reasoning: "${systemDescription.slice(0, 150)}"`,
    ],
    paradigmatic: [
      `${system} identifies and constructs overarching paradigms that organize multiple metasystems`,
      `Recognizes that paradigms themselves are constructed and can be evaluated`,
      `Can articulate the underlying assumptions generating entire families of approaches`,
      `System description indicates paradigm-level awareness: "${systemDescription.slice(0, 150)}"`,
    ],
    "cross-paradigmatic": [
      `${system} fluidly moves between paradigms without collapsing their differences`,
      `Synthesizes across paradigms while honoring irreducible validity of each`,
      `Operates at the boundary of what can be conceptualized within any single framework`,
      `System description indicates cross-paradigmatic fluency: "${systemDescription.slice(0, 150)}"`,
    ],
  };

  const gapAnalysisByTransition: Record<string, string> = {
    "systematic-metasystematic": `To reach metasystematic functioning, ${system} would need to develop the capacity to step outside its current framework and compare it with at least two alternative frameworks. This requires: (1) learning competing paradigms deeply enough to understand their internal logic, (2) identifying structural isomorphisms between systems, and (3) constructing a meta-framework that coordinates both without reducing one to the other.`,
    "metasystematic-paradigmatic": `To reach paradigmatic functioning, ${system} would need to develop the capacity to identify the deep assumptions that generate entire families of metasystems. This requires: (1) examining the historical and cultural conditions that produced current frameworks, (2) recognizing the limits of integration-as-synthesis, and (3) constructing new paradigms rather than coordinating existing ones.`,
    "paradigmatic-cross-paradigmatic": `To reach cross-paradigmatic functioning, ${system} would need to develop the capacity to inhabit multiple paradigms simultaneously without the urge to resolve their tension into a higher synthesis. This requires: (1) comfort with irreducible multiplicity, (2) translation skills between incommensurable frameworks, and (3) the recognition that reality exceeds any paradigm's descriptive capacity.`,
  };

  const currentSubstageInfo = VISION_LOGIC_SUBSTAGES[currentSubstage];
  const nextSubstageInfo = nextSubstage ? VISION_LOGIC_SUBSTAGES[nextSubstage] : null;

  const gapKey = nextSubstage ? `${currentSubstage}-${nextSubstage}` : null;
  const gapAnalysis = gapKey && gapAnalysisByTransition[gapKey]
    ? gapAnalysisByTransition[gapKey]
    : `${system} is operating at the highest identified substage (cross-paradigmatic). Further development would involve embodiment and spontaneous expression rather than conceptual advancement.`;

  return {
    currentSubstage,
    evidence: evidenceBySubstage[currentSubstage],
    nextSubstage,
    gapAnalysis,
    typicalOutputCurrent: currentSubstageInfo.typical_output,
    typicalOutputNext: nextSubstageInfo?.typical_output ?? null,
  };
}

function generateCellContent(
  stage: string,
  quadrant: string,
  system: string,
  systemDescription: string,
  observableBehaviors: string,
  culturalIndicators: string,
  structuralIndicators: string,
  depth: string,
  composerCtx?: HierarchicalComposerContext,
  cellIndex?: number,
  totalCells?: number,
): string {
  if (composerCtx) {
    const thoughtType: ThoughtType = "developmental";
    const composed = composeToolContent({
      toolName: "think_hierarchical",
      text: composerCtx.fullText,
      initialPosition: composerCtx.initialPosition,
      mode: composerCtx.outputMode === "executive" ? "strategic" : composerCtx.outputMode === "exploratory" ? "creative" : "analytical",
      subMode: "deductive",
      stepNumber: cellIndex ?? 1,
      totalSteps: totalCells ?? 32,
      thoughtType,
      previousOutputs: [],
    });
    if (composed.length > 200) return composed;
  }

  const stageInfo = DEVELOPMENTAL_LEVELS[stage as keyof typeof DEVELOPMENTAL_LEVELS];
  const quadrantInfo = QUADRANTS[quadrant as keyof typeof QUADRANTS];

  if (!stageInfo || !quadrantInfo) {
    return "—";
  }

  const stageChars = stageInfo.key_characteristics;
  const baseDescription = stageInfo.description;
  const quadrantFocus = quadrantInfo.description;
  const epistemology = quadrantInfo.epistemology;

  const essentialContent = `${stageInfo.label} ${quadrantInfo.label}: System manifests ${stageChars[0]?.toLowerCase() || stageChars[1]?.toLowerCase()}. ${baseDescription.slice(0, 120)}...`;

  if (depth === "essential") {
    return essentialContent;
  }

  const standardContent = [
    `**${stageInfo.label} in ${quadrantInfo.label}**`,
    ``,
    `${quadrantFocus}`,
    ``,
    `At this developmental altitude, ${system} expresses the following characteristics:`,
    `- ${stageChars.slice(0, 3).join("\n- ")}`,
    ``,
    `Epistemological approach: ${epistemology}`,
    ``,
    `System context: ${systemDescription.slice(0, 200)}`,
  ].join("\n");

  if (depth === "standard") {
    return standardContent;
  }

  const exhaustiveContent = [
    `**${stageInfo.label} — ${quadrantInfo.label} (${quadrantInfo.full_label})**`,
    ``,
    `### Stage Character at this Altitude`,
    ``,
    baseDescription,
    ``,
    `### Key Characteristics Manifest in this Quadrant`,
    ``,
    stageChars.map((c: string) => `- ${c}`).join("\n"),
    ``,
    `### Epistemological Grounding`,
    ``,
    epistemology,
    ``,
    `### System-Specific Manifestation`,
    ``,
    `Given the system description: "${systemDescription.slice(0, 300)}"`,
    ``,
    `Observable behaviors: ${observableBehaviors.slice(0, 200)}`,
    ``,
    `Cultural indicators: ${culturalIndicators.slice(0, 200)}`,
    ``,
    `Structural indicators: ${structuralIndicators.slice(0, 200)}`,
    ``,
    `### Developmental Implications`,
    ``,
    `The ${stageInfo.label} stage, when expressed through the ${quadrantInfo.label} quadrant, creates a specific configuration of capacities and limitations. This configuration determines what the system can perceive, what it can act upon, and what remains invisible to it. The transition to the next stage requires the resolution of developmental tasks specific to this quadrant-stage intersection.`,
  ].join("\n");

  return exhaustiveContent;
}

function getFutureStages(currentStage: string, allStages: string[], count: number): string[] {
  const currentIndex = allStages.indexOf(currentStage);
  if (currentIndex === -1) return allStages.slice(0, count);
  return allStages.slice(currentIndex, currentIndex + 1 + count);
}

export function registerTool(server: McpServer): void {
  server.registerTool(
    "think_hierarchical",
    {
      title: "Hierarchical Complexity / Developmental Stage Map",
      description:
        "Maps a system's developmental trajectory across stages using the 'transcend and include' principle. Shows how each stage manifests across all 4 quadrants (Intentional, Behavioral, Cultural, Social). Creates a navigational map showing where the system is, what the next stage looks like, and what capacities need development.",
      inputSchema: z.object({
        system: z.string().describe("The system being analyzed (e.g., individual, team, organization, culture)"),
        current_stage: z.enum(["archaic", "magic", "magic-mythic", "mythic", "modern-rational", "postmodern", "integral", "super-integral"]).describe("The current developmental stage of the system"),
        system_description: z.string().describe("Detailed description of the system"),
        observable_behaviors: z.string().describe("Specific observable behaviors and patterns"),
        cultural_indicators: z.string().describe("Cultural and shared meaning indicators"),
        structural_indicators: z.string().describe("Structural and systemic indicators"),
        output_depth: OUTPUT_DEPTH_ENUM.default("standard").describe("Depth of analysis: essential (brief), standard (moderate), exhaustive (comprehensive)"),
        assess_vision_logic: z.boolean().default(false).describe("When true, include vision-logic substage analysis (systematic, metasystematic, paradigmatic, cross-paradigmatic)"),
        output_mode: z.enum(["executive", "analytical", "exploratory"]).default("analytical").describe("Output presentation mode: 'executive' for concise summaries, 'analytical' for full detailed output (default), 'exploratory' with open questions."),
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const {
          system,
          current_stage,
          system_description,
          observable_behaviors,
          cultural_indicators,
          structural_indicators,
          output_depth,
          assess_vision_logic,
          output_mode,
        } = args;

        const fullText = `${system} ${system_description} ${observable_behaviors} ${cultural_indicators} ${structural_indicators}`;
        getStructureForText(fullText, `${current_stage} stage characteristics`);
        const om = output_mode ?? 'analytical';
        const composerCtx: HierarchicalComposerContext = {
          fullText,
          initialPosition: `${current_stage} stage characteristics`,
          outputMode: om,
        };

        const allStageKeys = Object.keys(DEVELOPMENTAL_LEVELS);
        const stagesToMap = getFutureStages(current_stage, allStageKeys, 4);
        const totalCells = stagesToMap.length * QUADRANT_KEYS.length;
        let cellIndex = 0;

        const stageRows = stagesToMap.map((stage) => {
          const cells = QUADRANT_KEYS.map((quadrant) => {
            cellIndex++;
            return generateCellContent(
              stage,
              quadrant,
              system,
              system_description,
              observable_behaviors,
              cultural_indicators,
              structural_indicators,
              output_depth,
              composerCtx,
              cellIndex,
              totalCells,
            );
          });

          const stageInfo = DEVELOPMENTAL_LEVELS[stage as keyof typeof DEVELOPMENTAL_LEVELS];
          return {
            stage: stageInfo?.label ?? stage,
            intentional: cells[0],
            behavioral: cells[1],
            cultural: cells[2],
            social: cells[3],
          };
        });

        const epistemicStatus: EpistemicStatus = output_depth === 'exhaustive' ? 'well-supported' : output_depth === 'standard' ? 'tentative' : 'speculative';
        const suggestedFollowup: SuggestedTool[] = ['think_shadow', 'think_unity'];

        let formatted = formatHierarchical(system, stageRows, output_mode, epistemicStatus, suggestedFollowup);

        if (assess_vision_logic) {
          const visionLogic = generateVisionLogicAnalysis({
            system,
            currentStage: current_stage,
            systemDescription: system_description,
            composerCtx,
          });

          const currentSubstageInfo = VISION_LOGIC_SUBSTAGES[visionLogic.currentSubstage];
          const nextSubstageInfo = visionLogic.nextSubstage ? VISION_LOGIC_SUBSTAGES[visionLogic.nextSubstage] : null;

          const visionLogicSection = [
            "",
            "## Vision-Logic Substage Analysis",
            "",
            `### Current Substage: ${currentSubstageInfo.label}`,
            "",
            `${currentSubstageInfo.description}`,
            "",
            `**Cognitive Capacity:** ${currentSubstageInfo.cognitive_capacity}`,
            "",
            "### Evidence",
            "",
            ...visionLogic.evidence.map((e) => `- ${e}`),
            "",
          ];

          if (visionLogic.nextSubstage && nextSubstageInfo) {
            visionLogicSection.push(
              `### Next Substage: ${nextSubstageInfo.label}`,
              "",
              nextSubstageInfo.description,
              "",
              "### Gap Analysis",
              "",
              visionLogic.gapAnalysis,
              "",
              "### Typical Output Comparison",
              "",
              `**At current substage (${currentSubstageInfo.label}):**`,
              visionLogic.typicalOutputCurrent,
              "",
              `**At next substage (${nextSubstageInfo.label}):**`,
              visionLogic.typicalOutputNext ?? "N/A — highest substage reached",
              "",
            );
          } else {
            visionLogicSection.push(
              "### Developmental Ceiling",
              "",
              `${system} is operating at the highest identified vision-logic substage (Cross-Paradigmatic).`,
              "",
              visionLogic.gapAnalysis,
              "",
            );
          }

          formatted += visionLogicSection.join("\n");
        }

        return {
          content: [{ type: "text" as const, text: formatted }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error generating hierarchical analysis: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
