import type { QuadrantAnalysis, ProjectionRow, EpistemicStatus, SuggestedTool, OutputMode, OutputDepth, ScenarioNarrative, PreMortemFailure, FuturesWheelRing, ReasoningSubMode, FirstPrinciplesCategory } from "../types.js";
import {
  POLARITY_MAP_ROWS,
  INTEGRATION_SPECTRUM_ROWS,
  INTEGRATION_SPECTRUM_LEVELS,
  FIRST_PRINCIPLES_CATEGORIES,
  CHARACTER_LIMIT,
} from "../constants.js";

// ─── Output Size Enforcement ────────────────────────────────────────────────

function enforceCharacterLimit(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return text.substring(0, CHARACTER_LIMIT - 200) + "\n\n---\n*Output truncated due to size limit. Request 'exhaustive' depth for more detail.*";
}

// Executive mode truncates to < 5,000 chars with progressive disclosure markers.
const _EXECUTIVE_SOFT_LIMIT = 5000;

function progressiveDisclosureMarker(sectionId: string, detailSummary: string): string {
  return `\n\n[DETAIL: ${sectionId}] ${detailSummary}`;
}

function toTwoSentences(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length <= 2) return text;
  return sentences.slice(0, 2).join('. ') + '.';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function confidenceBar(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const filled = Math.round(clamped * 5);
  const empty = 5 - filled;
  const bar = "▓".repeat(filled) + "░".repeat(empty);
  const label =
    clamped <= 0.15
      ? "Very Low"
      : clamped <= 0.35
        ? "Low"
        : clamped <= 0.55
          ? "Medium"
          : clamped <= 0.75
            ? "High"
            : "Very High";
  return `${bar} ${label}`;
}

function mdTable(headers: string[], rows: string[][]): string {
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

function escapeMd(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ").substring(0, 200);
}

function escapeMdLong(text: string, maxLen: number = 500): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ").substring(0, maxLen);
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function checklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join("\n");
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── 1. Sequential Thinking ─────────────────────────────────────────────────

export function formatSequentialThinking(
  problem: string,
  steps: {
    claim: string;
    reasoning: string;
    confidence: number;
    confidence_justification?: string;
    reasoning_sub_mode?: ReasoningSubMode;
    assumptions: string[];
    counter_argument: string;
    next_investigation: string;
  }[],
  output_mode: OutputMode = 'analytical',
  epistemic_status: EpistemicStatus = 'tentative',
  suggested_followup: SuggestedTool[] = [],
): string {
  const sections: string[] = [];

  sections.push("## Sequential Thinking Analysis\n");
  sections.push(`**Problem:** ${problem}\n`);

  steps.forEach((step, idx) => {
    const subModeLabel = step.reasoning_sub_mode
      ? ` [${capitalizeFirst(step.reasoning_sub_mode)}]`
      : '';
    sections.push(`### Step ${idx + 1}:${subModeLabel} ${step.claim}\n`);
    sections.push(`**Reasoning:** ${step.reasoning}\n`);
    sections.push(`**Confidence:** ${confidenceBar(step.confidence)}\n`);
    if (step.confidence_justification) {
      sections.push(`**Confidence Justification:** ${step.confidence_justification}\n`);
    }
    sections.push(`**Assumptions:**\n${checklist(step.assumptions)}\n`);
    sections.push(`**Counter-Argument:** ${step.counter_argument}\n`);
    sections.push(`**Next Investigation:** ${step.next_investigation}\n`);
  });

  sections.push("## Meta-Reflection\n");
  sections.push(
    `This analysis traversed ${steps.length} step(s) of structured reasoning about "${problem}". ` +
      `The confidence distribution across steps reveals ${getConfidencePattern(steps)}. ` +
      `Assumptions identified (${steps.reduce((n, s) => n + s.assumptions.length, 0)} total) indicate the epistemic commitments underlying each claim. ` +
      `The counter-arguments considered suggest the degree of steel-manning applied. ` +
      `Next investigation targets point to the boundaries of current understanding and the frontier of required inquiry.`,
  );

  if (output_mode === 'executive') {
    const truncatedSections: string[] = [];
    let stepIdx = 0;
    for (const s of sections) {
      if (s.startsWith('**Reasoning:**')) {
        const sentences = s.split(/(?<=[.!?])\s+/).filter(x => x.trim().length > 0);
        if (sentences.length > 2) {
          truncatedSections.push(sentences.slice(0, 2).join('. ') + '.' + progressiveDisclosureMarker(`step-${stepIdx + 1}`, 'Full reasoning, assumptions, and counter-arguments available.'));
        } else {
          truncatedSections.push(s);
        }
        stepIdx++;
      } else if (s.startsWith('### Step')) {
        const sentences = s.split(/(?<=[.!?])\s+/).filter(x => x.trim().length > 0);
        truncatedSections.push(sentences.slice(0, 2).join('. ') + '.');
      } else if (s.includes('## Meta-Reflection')) {
        truncatedSections.push(toTwoSentences(s));
      } else if (s.includes('**Confidence:**') || s.includes('**Assumptions:**') || s.includes('**Counter-Argument:**') || s.includes('**Next Investigation:**')) {
        // Skip detailed per-step metadata in executive mode
      } else {
        truncatedSections.push(s);
      }
    }
    sections.length = 0;
    sections.push(...truncatedSections);
  }

  sections.push("\n## Meta-Analysis\n");
  sections.push(`- **Epistemic Status:** ${epistemic_status}`);
  sections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);

  if (output_mode === 'exploratory') {
    sections.push("\n## Open Questions\n");
    sections.push(`1. What assumptions about "${problem}" are we not questioning, and how would the analysis change if they were false?`);
    sections.push(`2. Which stakeholders or perspectives are absent from this analysis, and what would they likely challenge?`);
    sections.push(`3. If the lowest-confidence step turned out to be correct and the highest-confidence step wrong, what would that imply?`);
  }

  return enforceCharacterLimit(sections.join("\n---\n\n"));
}

function getConfidencePattern(
  steps: { confidence: number }[],
): string {
  const avg = steps.reduce((s, t) => s + t.confidence, 0) / steps.length;
  const variance =
    steps.reduce((s, t) => s + (t.confidence - avg) ** 2, 0) / steps.length;

  if (variance < 0.02) {
    return avg > 0.7
      ? "a consistent high-confidence posture, suggesting strong epistemic grounding"
      : avg > 0.4
        ? "a steady moderate-confidence posture, suggesting balanced epistemic humility"
        : "a consistent low-confidence posture, suggesting fundamental uncertainty in the domain";
  }
  return "significant variance in confidence, indicating that some claims rest on firmer ground than others";
}

// ─── 2. Polarity Map ────────────────────────────────────────────────────────

export function formatPolarityMap(
  pole_a: string,
  pole_b: string,
  domain: string,
  polarity_data: Record<string, { a: string; b: string }>,
  spectrum_data: Record<string, Record<string, string>>,
  output_mode: OutputMode = 'analytical',
  epistemic_status: EpistemicStatus = 'tentative',
  suggested_followup: SuggestedTool[] = [],
): string {
  const sections: string[] = [];

  sections.push(`## Polarity Map: ${pole_a} vs ${pole_b}\n`);
  sections.push(`**Domain:** ${domain}\n`);

  // Polarity table
  const polarityHeaders = ["Section", pole_a, pole_b];
  const polarityRows = POLARITY_MAP_ROWS.map((row) => {
    const data = polarity_data[row.section];
    return [
      row.section,
      data?.a ?? "—",
      data?.b ?? "—",
    ];
  });

  sections.push(mdTable(polarityHeaders, polarityRows));
  sections.push("");

  // Integration Spectrum
  sections.push("## Integration Spectrum\n");

  const spectrumHeaders = ["Dimension", ...INTEGRATION_SPECTRUM_LEVELS];
  const spectrumRows = INTEGRATION_SPECTRUM_ROWS.map((dimension) => {
    const row = spectrum_data[dimension];
    return [
      dimension,
      ...(INTEGRATION_SPECTRUM_LEVELS.map((level) => row?.[level] ?? "—")),
    ];
  });

  sections.push(mdTable(spectrumHeaders, spectrumRows));
  sections.push("");

  // Current Position Assessment
  sections.push("## Current Position Assessment\n");
  sections.push(
    `Based on the polarity data and integration spectrum above, the system's current position ` +
      `on the ${pole_a} ↔ ${pole_b} continuum can be interpreted through the pattern of rewards, ` +
      `risks, and feedback signals. The overemphasis indicators reveal which pole is currently ` +
      `dominating, while the neglect risks expose what is being sacrificed. The circular causal ` +
      `loops demonstrate how each pole reinforces the other, suggesting that sustainable management ` +
      `requires maintaining both poles in dynamic tension rather than choosing one over the other. ` +
      `The integration spectrum levels indicate the maturity of the system's capacity to hold this ` +
      `polarity — moving from nascent awareness through transcendent integration.`,
  );

  if (output_mode === 'executive') {
    const spectrumIdx = sections.findIndex(s => s.includes('Integration Spectrum'));
    if (spectrumIdx >= 0) {
      const truncatedSpectrumRows = spectrumRows.slice(0, 4);
      sections[spectrumIdx] = mdTable(spectrumHeaders, truncatedSpectrumRows) +
        progressiveDisclosureMarker('integration-spectrum-full', `${INTEGRATION_SPECTRUM_ROWS.length - 4} additional dimension(s) truncated.`);
    }
    const assessmentIdx = sections.findIndex(s => s.includes('Current Position Assessment'));
    if (assessmentIdx >= 0) {
      const sentences = sections[assessmentIdx].split(/(?<=[.!?])\s+/);
      if (sentences.length > 2) {
        sections[assessmentIdx] = sentences.slice(0, 2).join('. ') + '.' +
          progressiveDisclosureMarker('current-position-full', 'Full assessment with all quadrants and temporal context available.');
      }
    }
  }

  sections.push("\n## Meta-Analysis\n");
  sections.push(`- **Epistemic Status:** ${epistemic_status}`);
  sections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);

  if (output_mode === 'exploratory') {
    sections.push("\n## Open Questions\n");
    sections.push(`1. What would happen if the ${pole_a} ↔ ${pole_b} polarity dissolved entirely — is this a genuine tension or a false dichotomy?`);
    sections.push(`2. Which stakeholder groups experience this polarity differently, and how would centering their experience shift the map?`);
    sections.push(`3. What historical conditions created this polarity, and under what future conditions might it become obsolete?`);
  }

  return enforceCharacterLimit(sections.join("\n\n"));
}

// ─── 3. AQAL Situational Analysis ───────────────────────────────────────────

export function formatAqalSituational(
  situation: string,
  quadrants: {
    intentional: QuadrantAnalysis;
    behavioral: QuadrantAnalysis;
    cultural: QuadrantAnalysis;
    social: QuadrantAnalysis;
  },
  output_mode: OutputMode = 'analytical',
  epistemic_status: EpistemicStatus = 'tentative',
  suggested_followup: SuggestedTool[] = [],
): string {
  const sections: string[] = [];

  sections.push("## AQAL Situational Analysis\n");
  sections.push(`**Situation:** ${situation}\n`);

  const { intentional, behavioral, cultural, social } = quadrants;

  const cell = (q: QuadrantAnalysis): string =>
    [
      `**Context:** ${q.context_summary}`,
      `**Solution:** ${q.solution_summary}`,
      `**Strategies:**\n${bulletList(q.strategies)}`,
      `**2nd Order Effects:**\n${bulletList(q.second_order_effects)}`,
    ].join("\n\n");

  // 2x2 AQAL table
  sections.push(
    mdTable(
      ["Intentional / Subjective (UL)", "Behavioral / Objective (UR)"],
      [[cell(intentional), cell(behavioral)]],
    ),
  );
  sections.push("");
  sections.push(
    mdTable(
      ["Cultural / Inter-subjective (LL)", "Social / Inter-objective (LR)"],
      [[cell(cultural), cell(social)]],
    ),
  );
  sections.push("");

  // Cross-Quadrant Dynamics
  sections.push("## Cross-Quadrant Dynamics\n");

  const interactions = [
    {
      from: "Intentional",
      to: "Behavioral",
      description:
        "Interior beliefs, values, and intentions manifest as observable behaviors and physical patterns. Changes in self-narrative precede behavioral shifts, while behavioral experiments can retroactively reshape self-understanding.",
    },
    {
      from: "Intentional",
      to: "Cultural",
      description:
        "Individual meaning-making is shaped by and contributes to collective worldviews. Personal transformation can challenge cultural norms, while cultural narratives provide the interpretive lens through which individuals understand themselves.",
    },
    {
      from: "Intentional",
      to: "Social",
      description:
        "Individual agency operates within and occasionally transforms systemic structures. Social systems constrain individual possibilities while individuals with sufficient power or insight can restructure the systems themselves.",
    },
    {
      from: "Behavioral",
      to: "Cultural",
      description:
        "Observable patterns of behavior reinforce or challenge cultural norms. Collective behavioral trends shift cultural expectations, while cultural norms dictate which behaviors are acceptable or deviant.",
    },
    {
      from: "Behavioral",
      to: "Social",
      description:
        "Individual behaviors aggregate into systemic patterns. Social structures are maintained by the daily behaviors of individuals, while structural changes alter the behavioral landscape for all participants.",
    },
    {
      from: "Cultural",
      to: "Social",
      description:
        "Shared meanings and values institutionalize into laws, policies, and organizational structures. Social systems, in turn, encode and perpetuate cultural assumptions through their design and operation.",
    },
  ];

  sections.push(
    interactions
      .map(
        (i) =>
          `### ${i.from} → ${i.to}\n\n${i.description}`,
      )
      .join("\n\n"),
  );

  if (output_mode === 'executive') {
    const dynamicsIdx = sections.findIndex(s => s.includes('Cross-Quadrant Dynamics'));
    if (dynamicsIdx >= 0) {
      sections.splice(dynamicsIdx, 1,
        progressiveDisclosureMarker('cross-quadrant-dynamics', '6 cross-quadrant interaction analyses (Intentional→Behavioral, Intentional→Cultural, Intentional→Social, Behavioral→Cultural, Behavioral→Social, Cultural→Social) truncated.')
      );
    }
  }

  sections.push("\n## Meta-Analysis\n");
  sections.push(`- **Epistemic Status:** ${epistemic_status}`);
  sections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);

  if (output_mode === 'exploratory') {
    sections.push("\n## Open Questions\n");
    sections.push(`1. Which quadrant is most likely to produce surprising findings if investigated further, and why has it received less attention?`);
    sections.push(`2. How would the analysis change if we inverted the priority order — starting from Social rather than Intentional, or Cultural rather than Behavioral?`);
    sections.push(`3. What second-order effects of quadrant-specific interventions could create feedback loops that undermine the intended outcomes?`);
  }

  return enforceCharacterLimit(sections.join("\n\n"));
}

// ─── 4. AQAL Projection ─────────────────────────────────────────────────────

export function formatAqalProjection(
  situation: string,
  quadrants: {
    intentional: ProjectionRow;
    behavioral: ProjectionRow;
    cultural: ProjectionRow;
    social: ProjectionRow;
  },
  output_mode: OutputMode = 'analytical',
  epistemic_status: EpistemicStatus = 'tentative',
  suggested_followup: SuggestedTool[] = [],
): string {
  const sections: string[] = [];

  sections.push("## AQAL Projection Analysis\n");
  sections.push(`**Situation:** ${situation}\n`);

  const { intentional, behavioral, cultural, social } = quadrants;

  const projectionCell = (q: ProjectionRow): string =>
    [
      `**Situation:** ${q.situation_summary}`,
      `**Solution:** ${q.solution_summary}`,
      `**Short-Term (<1yr):** ${q.short_term}`,
      `**Mid-Term (1-3yr):** ${q.mid_term}`,
      `**Long-Term (3+yr):** ${q.long_term}`,
    ].join("\n\n");

  // 2x2 table
  sections.push(
    mdTable(
      ["Intentional / Subjective (UL)", "Behavioral / Objective (UR)"],
      [[projectionCell(intentional), projectionCell(behavioral)]],
    ),
  );
  sections.push("");
  sections.push(
    mdTable(
      ["Cultural / Inter-subjective (LL)", "Social / Inter-objective (LR)"],
      [[projectionCell(cultural), projectionCell(social)]],
    ),
  );
  sections.push("");

  // Temporal Dynamics
  sections.push("## Temporal Dynamics Analysis\n");
  sections.push(
    `**Fastest-Changing Quadrants:** The Intentional (UL) quadrant typically changes most rapidly, ` +
      `as shifts in perspective, insight, and meaning-making can occur instantaneously. The Behavioral (UR) ` +
      `quadrant follows, with habit formation and neuroplasticity operating on timescales of weeks to months.\n\n` +
      `**Slowest-Changing Quadrants:** The Cultural (LL) quadrant evolves over years to decades, as shared ` +
      `worldviews require sustained dialogue and generational turnover to shift. The Social (LR) quadrant ` +
      `is typically the most inert, as institutional structures, legal frameworks, and economic systems resist ` +
      `change due to path dependency, vested interests, and systemic complexity.\n\n` +
      `**Temporal Implications:** Effective intervention requires recognizing that interior work (UL) can produce ` +
      `rapid shifts but will be constrained by the inertia of exterior systems (LR). Sustainable change requires ` +
      `parallel work across all quadrants, with patience for the slower quadrants while leveraging the agility ` +
      `of the faster ones. The mid-term window (1-3yr) is the critical period where initial interior shifts must ` +
      `be institutionalized into structural change, or risk regression.\n\n` +
      `**Feedback Loops:** Changes in any quadrant create feedback effects in the others. The intentional → behavioral ` +
      `→ cultural → social cascade is the primary direction of individual-led change, while the social → cultural ` +
      `→ behavioral → intentional cascade describes structural transformation. The most durable changes occur when ` +
      `both cascades are activated simultaneously.`,
  );

  if (output_mode === 'executive') {
    const temporalIdx = sections.findIndex(s => s.includes('Temporal Dynamics Analysis'));
    if (temporalIdx >= 0) {
      sections.splice(temporalIdx, 1,
        progressiveDisclosureMarker('temporal-dynamics', 'Full temporal analysis including fastest/slowest-changing quadrants, temporal implications, and feedback loop cascades available.')
      );
    }
  }

  sections.push("\n## Meta-Analysis\n");
  sections.push(`- **Epistemic Status:** ${epistemic_status}`);
  sections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);

  if (output_mode === 'exploratory') {
    sections.push("\n## Open Questions\n");
    sections.push(`1. Which quadrant's projected trajectory is most vulnerable to disruption from external shocks, and what would cascade from that disruption?`);
    sections.push(`2. If the long-term projection for one quadrant fails to materialize, how would the other quadrants compensate or amplify the deviation?`);
    sections.push(`3. What signals should we monitor in the next 90 days that would indicate the projections are off-track?`);
  }

  return enforceCharacterLimit(sections.join("\n\n"));
}

// ─── 5. Hierarchical Developmental ──────────────────────────────────────────

export function formatHierarchical(
  system: string,
  stages: {
    stage: string;
    intentional: string;
    behavioral: string;
    cultural: string;
    social: string;
  }[],
  output_mode: OutputMode = 'analytical',
  epistemic_status: EpistemicStatus = 'tentative',
  suggested_followup: SuggestedTool[] = [],
): string {
  const sections: string[] = [];

  sections.push(`## Developmental Evolution Map: ${system}\n`);

  const headers = [
    "Stage",
    "Intentional / Subjective",
    "Behavioral / Objective",
    "Cultural / Inter-subjective",
    "Social / Inter-objective",
  ];

  const truncatedStages = output_mode === 'executive' ? stages.slice(0, 3) : stages;
  const rows = truncatedStages.map((s) => [
    s.stage,
    escapeMd(s.intentional),
    escapeMd(s.behavioral),
    escapeMd(s.cultural),
    escapeMd(s.social),
  ]);

  sections.push(mdTable(headers, rows));
  if (output_mode === 'executive' && stages.length > 3) {
    sections.push(progressiveDisclosureMarker('developmental-stages-full', `${stages.length - 3} additional stage(s) truncated: ${stages.slice(3).map(s => s.stage).join(', ')}.`));
  }
  sections.push("");

  sections.push("## Developmental Trajectory Assessment\n");

  const stageNames = stages.map((s) => s.stage);
  const totalStages = stages.length;

  sections.push(
    `This developmental map traces the evolution of **${system}** across ${totalStages} stage(s): ` +
      `${stageNames.join(" → ")}.\n\n` +
      `**Directionality:** Development proceeds from simpler to more complex forms of organization, ` +
      `with each stage transcending and including the capacities of prior stages. The intentional dimension ` +
      `shows the deepening of self-awareness and meaning-making complexity. The behavioral dimension reveals ` +
      `increasingly sophisticated patterns of action and embodiment. The cultural dimension tracks the expansion ` +
      `of shared worldviews from narrow to inclusive. The social dimension documents the evolution of structural ` +
      `arrangements from simple hierarchies to complex networks.\n\n` +
      `**Developmental Tasks:** Each stage presents unique challenges that must be resolved before transition ` +
      `to the next stage is possible. Unresolved tasks at any stage create fixations that limit the system's ` +
      `capacity to access higher-order functioning.\n\n` +
      `**Current Position & Next Stage:** The system's current developmental altitude determines which capacities ` +
      `are available and which remain latent. The next stage represents the leading edge of potential growth — ` +
      `the complexity level that the system is being invited to embody but has not yet fully integrated.`,
  );

  if (output_mode === 'executive') {
    const trajectoryIdx = sections.findIndex(s => s.includes('Developmental Trajectory Assessment'));
    if (trajectoryIdx >= 0) {
      const sentences = sections[trajectoryIdx].split(/(?<=[.!?])\s+/);
      if (sentences.length > 2) {
        sections[trajectoryIdx] = sentences.slice(0, 2).join('. ') + '.' +
          progressiveDisclosureMarker('developmental-trajectory', 'Full trajectory assessment with directionality, developmental tasks, and current position analysis available.');
      }
    }
  }

  sections.push("\n## Meta-Analysis\n");
  sections.push(`- **Epistemic Status:** ${epistemic_status}`);
  sections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);

  if (output_mode === 'exploratory') {
    sections.push("\n## Open Questions\n");
    sections.push(`1. Is the current stage assessment accurate, or could the system be operating from a higher stage in some lines and a lower stage in others?`);
    sections.push(`2. What environmental conditions would force premature stage transition, and what would the costs of such acceleration be?`);
    sections.push(`3. Which quadrant at the current stage represents the weakest link, and what would happen if it were strengthened independently?`);
  }

  return enforceCharacterLimit(sections.join("\n\n"));
}

// ─── 6. Shadow Report ───────────────────────────────────────────────────────

export function formatShadowReport(
  _behavioral_data: string,
  framework_analyses: { framework: string; analysis: string }[],
  stage_analysis: { stage: string; analysis: string }[],
  line_analysis: { line: string; analysis: string }[],
  synthesis: string,
  output_mode: OutputMode = 'analytical',
  epistemic_status: EpistemicStatus = 'tentative',
  suggested_followup: SuggestedTool[] = [],
): string {
  const sections: string[] = [];

  sections.push("## Shadow Analysis Report\n");

  // Section 1: Multi-Framework Analysis
  sections.push("### Multi-Framework Analysis\n");
  framework_analyses.forEach((fa) => {
    sections.push(`#### ${fa.framework}\n\n${fa.analysis}\n`);
  });

  // Section 2: Developmental Stage Shadow
  sections.push("### Developmental Stage Shadow Analysis\n");
  stage_analysis.forEach((sa) => {
    sections.push(`#### Stage: ${sa.stage}\n\n${sa.analysis}\n`);
  });

  // Section 3: Lines of Development Shadow
  sections.push("### Lines of Development Shadow Analysis\n");
  line_analysis.forEach((la) => {
    sections.push(`#### Line: ${la.line}\n\n${la.analysis}\n`);
  });

  // Section 4: Synthesis
  sections.push("### Synthesis and Dominant Shadow Constellations\n");
  sections.push(synthesis);
  sections.push("");

  sections.push(
    "---\n\n*This analysis is purely descriptive and interpretive. No interventions or prescriptions are implied.*",
  );

  if (output_mode === 'executive') {
    const execSections: string[] = [];
    execSections.push(sections[0]);
    if (framework_analyses.length > 0) {
      execSections.push(`### Key Finding\n\n${toTwoSentences(framework_analyses[0].analysis)}.`);
    }
    if (framework_analyses.length > 1) {
      execSections.push(progressiveDisclosureMarker('multi-framework-analysis', `${framework_analyses.length - 1} additional framework analysis(es) available: ${framework_analyses.slice(1).map(f => f.framework).join(', ')}.`));
    }
    if (stage_analysis.length > 0) {
      execSections.push(`### Developmental Shadow\n\n${toTwoSentences(stage_analysis[0].analysis)}.`);
    }
    if (stage_analysis.length > 1) {
      execSections.push(progressiveDisclosureMarker('stage-shadow-analysis', `${stage_analysis.length - 1} additional stage analysis(es) available.`));
    }
    if (line_analysis.length > 0) {
      execSections.push(progressiveDisclosureMarker('lines-of-development-shadow', `${line_analysis.length} line(s) of development shadow analysis available: ${line_analysis.map(l => l.line).join(', ')}.`));
    }
    if (synthesis) {
      execSections.push(progressiveDisclosureMarker('shadow-synthesis', 'Full synthesis and dominant shadow constellations available.'));
    }
    execSections.push("\n## Meta-Analysis\n");
    execSections.push(`- **Epistemic Status:** ${epistemic_status}`);
    execSections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);
    sections.length = 0;
    sections.push(...execSections);
  } else {
    sections.push("\n## Meta-Analysis\n");
    sections.push(`- **Epistemic Status:** ${epistemic_status}`);
    sections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);

    if (output_mode === 'exploratory') {
      sections.push("\n## Open Questions\n");
      sections.push(`1. What shadow material might be operating at a level too subtle for any of these frameworks to detect, and how could we design conditions to surface it?`);
      sections.push(`2. Which framework's analysis is most likely to be wrong, and what evidence would falsify its central claim?`);
      sections.push(`3. If the shadow constellation identified here is actually a strength in disguise, what context would transform it from liability to asset?`);
    }
  }

  return enforceCharacterLimit(sections.join("\n\n"));
}

// ─── 7. Unity Multi-System ──────────────────────────────────────────────────

export function formatUnity(
  query: string,
  subsystem_responses: { name: string; label: string; response: string }[],
  dialogue: string,
  synthesis: string,
  output_mode: OutputMode = 'analytical',
  epistemic_status: EpistemicStatus = 'tentative',
  suggested_followup: SuggestedTool[] = [],
): string {
  const sections: string[] = [];

  sections.push("## Unity Multi-System Analysis\n");
  sections.push(`**Query:** ${query}\n`);

  // Each subsystem
  subsystem_responses.forEach((sub) => {
    sections.push(`### ${sub.label}\n\n${sub.response}\n`);
  });

  // Inter-System Dialogue
  sections.push("## Inter-System Dialogue\n");
  sections.push(dialogue);
  sections.push("");

  // Integrated Synthesis
  sections.push("## Integrated Synthesis\n");
  sections.push(synthesis);
  sections.push("");

  // Closing Reflections
  sections.push("## Closing Reflections\n");
  sections.push(
    `This multi-system analysis engaged ${subsystem_responses.length} subsystems ` +
      `(${subsystem_responses.map((s) => s.label).join(", ")}) in response to the query: "${query}". ` +
      `The inter-system dialogue revealed points of convergence and tension among the different analytical ` +
      `lenses. The integrated synthesis represents the emergent understanding that arises when multiple ` +
      `perspectives are held simultaneously without premature closure.\n\n` +
      `The value of this approach lies not in any single subsystem's output, but in the pattern of ` +
      `relationships between them — the blind spots that one subsystem illuminates for another, the ` +
      `tensions that reveal genuine paradoxes in the territory, and the synthesis that emerges when ` +
      `all voices are given full expression before integration.`,
  );

  if (output_mode === 'executive') {
    const execSections: string[] = [];
    execSections.push(sections[0]);
    execSections.push(sections[1]);
    if (subsystem_responses.length > 2) {
      execSections.push(progressiveDisclosureMarker('subsystem-responses', `${subsystem_responses.length - 2} additional subsystem response(s) available: ${subsystem_responses.slice(2).map(s => s.label).join(', ')}.`));
    }
    execSections.push(progressiveDisclosureMarker('inter-system-dialogue', 'Full inter-system dialogue and integrated synthesis available.'));
    execSections.push(progressiveDisclosureMarker('closing-reflections', 'Closing reflections with multi-system relationship analysis available.'));
    execSections.push("\n## Meta-Analysis\n");
    execSections.push(`- **Epistemic Status:** ${epistemic_status}`);
    execSections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);
    sections.length = 0;
    sections.push(...execSections);
  } else {
    sections.push("\n## Meta-Analysis\n");
    sections.push(`- **Epistemic Status:** ${epistemic_status}`);
    sections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);

    if (output_mode === 'exploratory') {
      sections.push("\n## Open Questions\n");
      sections.push(`1. What analytical lens is missing from this six-subsystem configuration, and what would it reveal that the current set cannot?`);
      sections.push(`2. If one subsystem's analysis is fundamentally misaligned with reality, which one is most vulnerable and why?`);
      sections.push(`3. How would this multi-system analysis look if conducted from a developmental stage higher than the one currently accessible to the analyst?`);
    }
  }

  return enforceCharacterLimit(sections.join("\n\n"));
}

// ─── 8. First Principles Decomposition ──────────────────────────────────────

function categoryShortLabel(cat: FirstPrinciplesCategory): string {
  return FIRST_PRINCIPLES_CATEGORIES[cat].label;
}

export function formatFirstPrinciples(
  problem_or_system: string,
  decomposition: {
    target: string;
    claims: {
      claim: string;
      category: FirstPrinciplesCategory;
      confidence: number;
      test: string;
    }[];
    socraticInterrogation: {
      assumption: string;
      origin: string;
      evidence: string;
      liberation: string;
    }[];
    constraintMap: {
      trulyImpossible: string[];
      merelyDifficult: string[];
      actuallyFlexible: string[];
    };
    reconstructionOptions: {
      title: string;
      description: string;
      starting_facts: string[];
      bypassed_assumptions: string[];
    }[];
    reconstructionBlueprint?: string[];
    epistemic_status: EpistemicStatus;
    suggested_followup: SuggestedTool[];
  },
  output_mode: OutputMode = "analytical",
): string {
  const sections: string[] = [];
  const truncated = problem_or_system.length > 80
    ? problem_or_system.substring(0, 80) + "..."
    : problem_or_system;

  sections.push(`## First Principles Decomposition: ${truncated}\n`);
  sections.push(`**Target:** ${decomposition.target}\n`);

  sections.push("### Claim Classification\n");
  const claimRows = decomposition.claims.map((c) => [
    escapeMdLong(c.claim),
    categoryShortLabel(c.category),
    `${(c.confidence * 100).toFixed(0)}%`,
    escapeMd(c.test),
  ]);
  sections.push(mdTable(["Claim", "Category", "Confidence", "Test"], claimRows));
  sections.push("");

  if (decomposition.socraticInterrogation.length > 0) {
    sections.push("### Socratic Interrogation\n");
    decomposition.socraticInterrogation.forEach((si) => {
      sections.push(`#### ${escapeMdLong(si.assumption)}\n`);
      sections.push(`- **Origin:** ${si.origin}`);
      sections.push(`- **Evidence:** ${si.evidence}`);
      sections.push(`- **Liberation:** ${si.liberation}\n`);
    });
  }

  sections.push("### Constraint Map\n");
  sections.push(`**Truly Impossible (Physical/Logical):** ${decomposition.constraintMap.trulyImpossible.length > 0 ? decomposition.constraintMap.trulyImpossible.join("; ") : "None identified"}`);
  sections.push(`\n**Merely Difficult (Contextual/Conventional):** ${decomposition.constraintMap.merelyDifficult.length > 0 ? decomposition.constraintMap.merelyDifficult.join("; ") : "None identified"}`);
  sections.push(`\n**Actually Flexible (Inherited Assumptions):** ${decomposition.constraintMap.actuallyFlexible.length > 0 ? decomposition.constraintMap.actuallyFlexible.join("; ") : "None identified"}`);
  sections.push("");

  sections.push("### Reconstruction Options\n");
  decomposition.reconstructionOptions.forEach((opt) => {
    sections.push(`**${opt.title}:** ${opt.description}`);
    sections.push(`- **Starting from:** ${opt.starting_facts.join("; ")}`);
    sections.push(`- **Bypasses:** ${opt.bypassed_assumptions.join("; ")}\n`);
  });

  if (decomposition.reconstructionBlueprint && decomposition.reconstructionBlueprint.length > 0) {
    sections.push("### Reconstruction Blueprint\n");
    sections.push(decomposition.reconstructionBlueprint.join("\n\n"));
    sections.push("");
  }

  if (output_mode === "executive") {
    const execSections: string[] = [];
    execSections.push(sections[0]);
    execSections.push(sections[1]);
    execSections.push(sections[2]);
    execSections.push(mdTable(["Claim", "Category", "Confidence", "Test"], claimRows.slice(0, 4)));
    if (decomposition.claims.length > 4) {
      execSections.push(progressiveDisclosureMarker('claim-classification-full', `${decomposition.claims.length - 4} additional claim(s) classified.`));
    }
    execSections.push("");
    if (decomposition.socraticInterrogation.length > 0) {
      const first = decomposition.socraticInterrogation[0];
      execSections.push(`### Socratic Interrogation\n`);
      execSections.push(`**${escapeMd(first.assumption)}**`);
      execSections.push(`- **Liberation:** ${first.liberation}\n`);
    }
    if (decomposition.socraticInterrogation.length > 1) {
      execSections.push(progressiveDisclosureMarker('socratic-interrogation-full', `${decomposition.socraticInterrogation.length - 1} additional assumption(s) interrogated.`));
    }
    execSections.push("### Constraint Map\n");
    execSections.push(`**Truly Impossible:** ${decomposition.constraintMap.trulyImpossible.length > 0 ? decomposition.constraintMap.trulyImpossible.slice(0, 2).join("; ") : "None"}`);
    if (decomposition.constraintMap.trulyImpossible.length > 2) {
      execSections.push(progressiveDisclosureMarker('constraint-impossible', `${decomposition.constraintMap.trulyImpossible.length - 2} additional impossibility constraint(s).`));
    }
    execSections.push(`\n**Flexible:** ${decomposition.constraintMap.actuallyFlexible.length > 0 ? decomposition.constraintMap.actuallyFlexible.slice(0, 2).join("; ") : "None"}`);
    if (decomposition.constraintMap.actuallyFlexible.length > 2) {
      execSections.push(progressiveDisclosureMarker('constraint-flexible', `${decomposition.constraintMap.actuallyFlexible.length - 2} additional flexible constraint(s).`));
    }
    execSections.push("");
    execSections.push("### Reconstruction Options\n");
    decomposition.reconstructionOptions.slice(0, 1).forEach((opt) => {
      execSections.push(`**${opt.title}:** ${toTwoSentences(opt.description)}.`);
    });
    if (decomposition.reconstructionOptions.length > 1) {
      execSections.push(progressiveDisclosureMarker('reconstruction-options', `${decomposition.reconstructionOptions.length - 1} additional reconstruction option(s) available.`));
    }
    if (decomposition.reconstructionBlueprint && decomposition.reconstructionBlueprint.length > 0) {
      execSections.push(progressiveDisclosureMarker('reconstruction-blueprint', `Full blueprint with ${decomposition.reconstructionBlueprint.length} step(s) available.`));
    }
    execSections.push("\n## Meta-Analysis\n");
    execSections.push(`- **Epistemic Status:** ${decomposition.epistemic_status}`);
    execSections.push(`- **Suggested Follow-ups:** ${decomposition.suggested_followup.length > 0 ? decomposition.suggested_followup.join(", ") : "None"}`);
    sections.length = 0;
    sections.push(...execSections);
  } else {
    sections.push("\n## Meta-Analysis\n");
    sections.push(`- **Epistemic Status:** ${decomposition.epistemic_status}`);
    sections.push(`- **Suggested Follow-ups:** ${decomposition.suggested_followup.length > 0 ? decomposition.suggested_followup.join(", ") : "None"}`);
  }

  if (output_mode === "exploratory") {
    sections.push("\n## Open Questions\n");
    sections.push(`1. Which of the classified claims would be most surprising if proven false, and what experiment could test it?`);
    sections.push(`2. What cultural or historical forces created the inherited assumptions identified here, and how would someone from a different background see this problem?`);
    sections.push(`3. If we removed ALL contextual constraints temporarily, what solution becomes obvious? Which of those constraints are actually necessary to reintroduce?`);
  }

  return enforceCharacterLimit(sections.join("\n\n"));
}

// ─── 9. Scenario Planning ────────────────────────────────────────────────────

export function formatScenarioPlanning(
  focal_question: string,
  u1: string,
  u2: string,
  timeframe: string,
  scenarios: ScenarioNarrative[],
  preMortem: PreMortemFailure[],
  futuresWheel: FuturesWheelRing,
  strategicImplications: { robust: string[]; scenario_specific: { scenario: string; actions: string[] }[] } | undefined,
  _output_depth: OutputDepth = 'standard',
  output_mode: OutputMode = 'analytical',
  epistemic_status: EpistemicStatus = 'speculative',
  suggested_followup: SuggestedTool[] = [],
): string {
  const sections: string[] = [];
  const truncated = focal_question.length > 80 ? focal_question.substring(0, 77) + '...' : focal_question;

  sections.push(`## Scenario Planning: ${truncated}\n`);
  sections.push(`**Timeframe:** ${timeframe}\n`);

  const u1LowLabel = `${u1}: Low`;
  const u1HighLabel = `${u1}: High`;
  const u2LowLabel = `${u2}: Low`;
  const u2HighLabel = `${u2}: High`;

  const matrixHeaders = ["", u1LowLabel, u1HighLabel];
  const matrixRows = [
    [u2LowLabel, scenarios[0]?.name ?? "—", scenarios[1]?.name ?? "—"],
    [u2HighLabel, scenarios[2]?.name ?? "—", scenarios[3]?.name ?? "—"],
  ];

  sections.push("### Scenario Matrix\n");
  sections.push(mdTable(matrixHeaders, matrixRows));
  sections.push("");

  sections.push("### Scenario Narratives\n");

  for (const s of scenarios) {
    sections.push(`#### ${s.name}: ${s.axis_position}\n`);
    sections.push(`${s.description}\n`);
    sections.push(`- **Driving Forces:** ${s.driving_forces.join('; ')}`);
    sections.push(`- **Probability:** ${s.probability}`);
    sections.push(`- **1st Order Consequences:**\n${bulletList(s.first_order_consequences)}`);
    sections.push(`- **2nd Order Consequences:**\n${bulletList(s.second_order_consequences)}`);
    sections.push(`- **3rd Order Consequences:**\n${bulletList(s.third_order_consequences)}`);

    if (s.strategic_implications && s.strategic_implications.length > 0) {
      sections.push(`- **Strategic Implications:**\n${bulletList(s.strategic_implications)}`);
    }
    sections.push("");
  }

  sections.push("### Pre-Mortem Analysis\n");
  sections.push(`Assume our answer to "${focal_question}" was catastrophically wrong. Here's why:\n`);

  const pmHeaders = ["Failure Mode", "Early Warning Signal", "Mitigation"];
  const pmRows = preMortem.map((pm) => [
    escapeMd(pm.failure_mode),
    escapeMd(pm.early_warning_signal),
    escapeMd(pm.mitigation_strategy),
  ]);
  sections.push(mdTable(pmHeaders, pmRows));
  sections.push("");

  sections.push("### Futures Wheel\n");
  sections.push(`**Center:** ${focal_question}`);
  sections.push(`**First Ring:**\n${bulletList(futuresWheel.first_ring)}`);
  sections.push("");

  sections.push("**Second Ring:**");
  for (const [parent, children] of Object.entries(futuresWheel.second_ring) as [string, string[]][]) {
    sections.push(`\n*From: ${parent}*`);
    sections.push(bulletList(children));
  }
  sections.push("");

  sections.push("**Third Ring:**");
  for (const [parent, consequence] of Object.entries(futuresWheel.third_ring) as [string, string][]) {
    sections.push(`\n*From: ${parent}*`);
    sections.push(`- ${consequence}`);
  }
  sections.push("");

  if (output_mode === 'executive') {
    const truncatedNarratives: string[] = [];
    for (const s of scenarios) {
      truncatedNarratives.push(`**${s.name}** (${s.probability}): ${s.first_order_consequences.slice(0, 2).join('; ')}.`);
    }
    const narrativeIdx = sections.findIndex(s => s.includes('### Scenario Narratives'));
    if (narrativeIdx >= 0) {
      sections.length = narrativeIdx + 1;
      sections.push(truncatedNarratives.join('\n\n'));
      sections.push(progressiveDisclosureMarker('scenario-narratives-full', 'Full scenario descriptions, driving forces, 2nd/3rd order consequences, and strategic implications per scenario available.'));
    }
    const preMortemIdx = sections.findIndex(s => s.includes('### Pre-Mortem Analysis'));
    if (preMortemIdx >= 0) {
      sections.splice(preMortemIdx, 1,
        progressiveDisclosureMarker('pre-mortem-analysis', `${preMortem.length} failure mode(s) with early warning signals and mitigation strategies available.`)
      );
    }
    const futuresIdx = sections.findIndex(s => s.includes('### Futures Wheel'));
    if (futuresIdx >= 0) {
      sections.splice(futuresIdx, 1,
        progressiveDisclosureMarker('futures-wheel', `Full 3-ring futures wheel: ${futuresWheel.first_ring.length} first-order, ${Object.values(futuresWheel.second_ring).flat().length} second-order, ${Object.keys(futuresWheel.third_ring).length} third-order consequences.`)
      );
    }
    const strategicIdx = sections.findIndex(s => s.includes('### Strategic Implications'));
    if (strategicIdx >= 0) sections.splice(strategicIdx, 1,
      progressiveDisclosureMarker('strategic-implications', 'Cross-scenario robust strategies and scenario-specific actions available.')
    );
  } else {
    const narrativeIdx = sections.findIndex(s => s.includes('### Scenario Narratives'));
    if (narrativeIdx >= 0) {
      const truncatedNarratives: string[] = [];
      for (const s of scenarios) {
        truncatedNarratives.push(`**${s.name}** (${s.probability}): ${s.description.split('. ').slice(0, 2).join('. ')}.`);
      }
      sections.length = narrativeIdx + 1;
      sections.push(truncatedNarratives.join('\n\n'));
    }
    const futuresIdx = sections.findIndex(s => s.includes('### Futures Wheel'));
    if (futuresIdx >= 0 && futuresIdx > narrativeIdx) {
      sections.length = futuresIdx + 1;
      sections.push(`**Key Futures Wheel Insights:** Top consequence: ${futuresWheel.first_ring[0]}`);
    }
  }

  if (strategicImplications) {
    sections.push("### Strategic Implications\n");
    sections.push("**Robust Strategies (valuable across all scenarios):**");
    sections.push(bulletList(strategicImplications.robust));
    sections.push("");

    sections.push("**Scenario-Specific Actions:**");
    for (const ss of strategicImplications.scenario_specific) {
      sections.push(`\n*${ss.scenario}:*`);
      sections.push(bulletList(ss.actions));
    }
    sections.push("");
  }

  sections.push("\n## Meta-Analysis\n");
  sections.push(`- **Epistemic Status:** ${epistemic_status}`);
  sections.push(`- **Suggested Follow-ups:** ${suggested_followup.length > 0 ? suggested_followup.join(', ') : 'None'}`);

  if (output_mode === 'exploratory') {
    sections.push("\n## Open Questions\n");
    sections.push(`1. Which of the two key uncertainties (${u1} vs ${u2}) is more fundamental — could one actually drive the other?`);
    sections.push(`2. What signals in the next 6-12 months would most strongly indicate which scenario quadrant we're heading toward?`);
    sections.push(`3. If all four scenarios are plausible, what single capability would be most valuable regardless of which future unfolds?`);
  }

  return enforceCharacterLimit(sections.join("\n\n"));
}
