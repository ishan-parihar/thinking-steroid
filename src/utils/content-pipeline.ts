import type { ThinkingMode, ReasoningSubMode } from "../types.js";
import type { ProblemStructure } from "../types.js";
import type { ThoughtType } from "../types.js";
import { extractProblemStructure } from "./problem-structure.js";
import { retrievePatterns, buildGraphQuery } from "./graph-engine.js";
import { composeStepContent } from "./content-composer.js";

const FALLBACK =
  "Insufficient domain-specific patterns matched for this step. The analysis continues based on structural decomposition of the input.";

export function composeToolContent(params: {
  toolName: string;
  text: string;
  initialPosition: string;
  mode: ThinkingMode;
  subMode?: ReasoningSubMode;
  stepNumber: number;
  totalSteps: number;
  thoughtType: ThoughtType;
  previousOutputs: string[];
}): string {
  const structure = extractProblemStructure({
    text: params.text,
    initial_position: params.initialPosition,
  });

  const query = buildGraphQuery(structure, params.text);
  const patterns = retrievePatterns(query);

  const content = composeStepContent({
    structure,
    patterns,
    mode: params.mode,
    subMode: params.subMode ?? "deductive",
    stepNumber: params.stepNumber,
    totalSteps: params.totalSteps,
    thoughtType: params.thoughtType,
    previousOutputs: params.previousOutputs,
    toolName: params.toolName,
  });

  if (!content || content.length < 10) return FALLBACK;
  return content;
}

export function getStructureForText(
  text: string,
  initialPosition: string,
): ProblemStructure {
  return extractProblemStructure({
    text,
    initial_position: initialPosition,
  });
}
