export type ResponseFormat = 'markdown' | 'json';

export type OutputDepth = 'essential' | 'standard' | 'exhaustive';

export type OutputMode = 'executive' | 'analytical' | 'exploratory';

export type EpistemicStatus = 'well-supported' | 'tentative' | 'speculative';

export type SuggestedTool =
  | 'think_sequential'
  | 'think_polarity'
  | 'think_aqal_situational'
  | 'think_aqal_projection'
  | 'think_hierarchical'
  | 'think_shadow'
  | 'think_unity'
  | 'think_causal'
  | 'think_cynefin'
  | 'think_scenario'
  | 'think_metacognitive'
  | 'think_first_principles';

export interface ToolOutputEnvelope {
  epistemic_status: EpistemicStatus;
  suggested_followup: SuggestedTool[];
}

export type ReasoningMode =
  | 'analytical'
  | 'creative'
  | 'critical'
  | 'strategic';

/** Alias for backward compatibility with existing tool code */
export type ThinkingMode = ReasoningMode;

export type ReasoningSubMode =
  | 'deductive'
  | 'inductive'
  | 'abductive'
  | 'analogical';

export type DevelopmentalLevel =
  | 'archaic'
  | 'magic'
  | 'magic-mythic'
  | 'mythic'
  | 'modern-rational'
  | 'postmodern'
  | 'integral'
  | 'super-integral';

export type VisionLogicSubstage =
  | 'systematic'
  | 'metasystematic'
  | 'paradigmatic'
  | 'cross-paradigmatic';

export type SpiralDynamicsStage =
  | 'beige'
  | 'purple'
  | 'red'
  | 'blue'
  | 'orange'
  | 'green'
  | 'teal'
  | 'turquoise';

export type LineOfDevelopment =
  | 'cognitive'
  | 'emotional'
  | 'intrapersonal'
  | 'moral'
  | 'spiritual'
  | 'kinesthetic'
  | 'willpower';

export type StateOfConsciousness =
  | 'gross'
  | 'subtle'
  | 'causal'
  | 'witness'
  | 'non-dual';

export type CoreDrive =
  | 'agency'
  | 'communion'
  | 'eros'
  | 'agape';

export type Quadrant =
  | 'intentional'
  | 'behavioral'
  | 'cultural'
  | 'social';

export type ShadowFramework =
  | 'freudian'
  | 'jungian'
  | 'gestalt'
  | 'integral';

export type UnitySubsystem =
  | 'lodS'
  | 'lidS'
  | 'soCS'
  | 'driS'
  | 'quaS'
  | 'shWS';

export type CynefinDomain =
  | 'clear'
  | 'complicated'
  | 'complex'
  | 'chaotic'
  | 'disorder';

export type CausalLoopType = 'reinforcing' | 'balancing';

export type CausalPolarity = '+' | '-';

export type LeveragePointCategory =
  | 'parameters'
  | 'buffers'
  | 'stock-and-flow'
  | 'delays'
  | 'negative-feedback'
  | 'positive-feedback'
  | 'information-flows'
  | 'rules'
  | 'self-organization'
  | 'goals'
  | 'paradigm'
  | 'transcend-paradigm';

export type SystemsArchetype =
  | 'fixes-that-fail'
  | 'shifting-the-burden'
  | 'tragedy-of-the-commons'
  | 'drift-to-low-performance'
  | 'escalation'
  | 'success-to-the-successful'
  | 'limits-to-growth'
  | 'growth-and-underinvestment'
  | 'accidental-adversaries'
  | 'attractiveness';

export type CognitiveBias =
  | 'confirmation-bias'
  | 'anchoring'
  | 'availability-heuristic'
  | 'survivorship-bias'
  | 'sunk-cost-fallacy'
  | 'dunning-kruger'
  | 'planning-fallacy'
  | 'status-quo-bias'
  | 'framing-effect'
  | 'hindsight-bias'
  | 'optimism-bias'
  | 'loss-aversion'
  | 'fundamental-attribution-error'
  | 'groupthink'
  | 'bandwagon-effect'
  | 'false-consensus'
  | 'recency-effect'
  | 'authority-bias'
  | 'illusion-of-validity'
  | 'narrative-fallacy';

export type LadderOfInferenceStep =
  | 'observable-data'
  | 'selected-data'
  | 'interpreted-meaning'
  | 'assumptions'
  | 'conclusions'
  | 'beliefs'
  | 'actions';

export type ShadowPattern =
  | 'projection'
  | 'compensation'
  | 'inflation'
  | 'possession'
  | 'splitting'
  | 'denial';

export type JungianArchetype =
  | 'persona'
  | 'shadow'
  | 'anima'
  | 'animus'
  | 'self'
  | 'hero'
  | 'trickster'
  | 'wise-old-man'
  | 'great-mother'
  | 'child'
  | 'mandala';

export type FirstPrinciplesCategory =
  | 'irreducible-fact'
  | 'inherited-assumption'
  | 'contextual-constraint'
  | 'physical-law'
  | 'social-convention'
  | 'logical-necessity';

export interface PsychographProfile {
  line: LineOfDevelopment;
  estimated_level: DevelopmentalLevel;
  confidence: number;
  indicators: string[];
}

export interface ConfidenceScore {
  value: number;
  rationale: string;
}

export interface SequentialStep {
  step_number: number;
  claim: string;
  reasoning: string;
  confidence: number;
  confidence_justification: string;
  reasoning_sub_mode?: ReasoningSubMode;
  assumptions: string[];
  counter_argument: string;
  next_investigation: string;
}

export interface PolarityThinkingInput {
  pole_a: string;
  pole_b: string;
  domain: string;
  current_position: string;
  evidence_for_position: string;
  desired_outcome: string;
}

export interface AqalSituationalInput {
  situation: string;
  stakeholders: string[];
  observable_data: string;
  reported_experience: string;
  cultural_context: string;
  systemic_context: string;
}

export interface AqalProjectionInput {
  situation: string;
  current_trajectory: string;
  intervention_planned: string;
  time_constraints: string;
}

export interface HierarchicalThinkingInput {
  system: string;
  current_stage: DevelopmentalLevel;
  system_description: string;
  observable_behaviors: string;
  cultural_indicators: string;
  structural_indicators: string;
}

export interface ShadowAnalysisInput {
  behavioral_data: string;
  context: string;
  self_description: string;
  others_description: string;
  contradictions: string;
  triggers: string;
  dreams_fantasies?: string;
}

export interface UnityThinkingInput {
  query: string;
  developmental_context: string;
  state_indicators?: string;
  behavioral_patterns: string;
  relational_context: string;
  shadow_indicators?: string;
  active_drives?: CoreDrive[];
}

export interface QuadrantAnalysis {
  context_summary: string;
  solution_summary: string;
  strategies: string[];
  second_order_effects: string[];
}

export interface ProjectionRow {
  situation_summary: string;
  solution_summary: string;
  short_term: string;
  mid_term: string;
  long_term: string;
}

export interface ScenarioNarrative {
  name: string;
  axis_position: string;
  description: string;
  driving_forces: string[];
  probability: "Likely" | "Possible" | "Unlikely";
  first_order_consequences: string[];
  second_order_consequences: string[];
  third_order_consequences: string[];
  strategic_implications?: string[];
}

export interface PreMortemFailure {
  failure_mode: string;
  early_warning_signal: string;
  mitigation_strategy: string;
}

export interface FuturesWheelRing {
  first_ring: string[];
  second_ring: Record<string, string[]>;
  third_ring: Record<string, string>;
}

export type SubjectType = 'human' | 'ai-system' | 'organization' | 'technical-system' | 'mixed';

export interface DomainClassification {
  domain: string;
  confidence: number;
}

export interface SubjectTypeConfidence {
  "ai-system": number;
  organization: number;
  "technical-system": number;
  human: number;
}

export interface ProblemStructure {
  entities: string[];
  relationships: string[];
  claims: string[];
  uncertainties: string[];
  domain_signals: string[];
  primary_domain: string;
  subject_type: SubjectType;
  subject_type_confidence: SubjectTypeConfidence;
  problem_type: string;
  implicit_assumptions: string[];
  initial_position?: string;
}

export type ThoughtType =
  | 'diagnostic'       // What IS this problem?
  | 'deconstructive'   // Break it apart
  | 'relational'       // How do pieces connect?
  | 'perspectival'     // See from multiple angles
  | 'developmental'    // How does it evolve?
  | 'prospective'      // What could happen?
  | 'synthetic'        // Integrate everything
  | 'corrective';      // Fix reasoning errors

export type NavigatorMode = 'full' | 'guided' | 'minimal';
export type NavigatorAction = 'plan' | 'advance' | 'replan' | 'terminate';

export interface ReasoningNode {
  id: number;
  tool: string;  // e.g., "think_sequential", "think_cynefin"
  thoughtType: string;
  purpose: string;
  params: Record<string, unknown>;
  dependsOn: number[];
  status: 'pending' | 'ready' | 'completed' | 'blocked' | 'skipped';
  output?: string;
  qualityScore?: number;
}

export interface ReasoningGraph {
  totalNodes: number;
  completedNodes: number;
  nodes: ReasoningNode[];
  parallelGroups: number[][];
  coverage: Record<string, number>;
  nextInstruction: string;
  sessionToken: string;
  replanCount: number;
}
