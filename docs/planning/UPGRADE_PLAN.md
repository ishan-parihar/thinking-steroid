# Thinking-Steroid v2.0 — Comprehensive Upgrade Plan

**Date:** April 11, 2026
**Scope:** Two major architecture upgrades + critical bug fixes
**Target:** Replace template engine with knowledge graph + add reasoning DAG orchestration

---

## Problem Statement (from TOOL_ANALYSIS_REPORT.md)

All 12 tools suffer from the same core defect: **template leakage**. The current architecture uses hardcoded template arrays (`claimTemplates[mode][step]`, `reasoningMap[mode][step]`, etc.) that produce generic, domain-agnostic output. Every tool generates text that "could apply to any domain with variable substitution."

Additional critical issues:
1. **3rd-order consequence duplication** in `think_scenario` — every pathway produces identical text
2. **Output size management** — 2 of 12 tools produce 47KB-66KB outputs that get truncated
3. **Subject-type unawareness** — tools recommend human psychological interventions for AI/organizational subjects
4. **Confidence inflation** — all steps rated "High" or "Very High" regardless of actual evidence
5. **Zero bias detection** in `think_metacognitive` — 20-bias library returns nothing for complex reasoning chains

---

## Architecture Blueprint

### Upgrade 1: Thought Process Orchestration — `think_navigator`

**Problem:** The 12 tools are isolated cognitive acts. The agent calls `think_sequential`, gets output, and decides on its own what to do next. There is no meta-planning layer.

**Solution:** A navigator tool that produces a **Reasoning DAG** — a directed graph of which thinking tools to apply, in what order, with explicit dependency chains and parallel execution hints.

### Upgrade 2: Domain-Specific Content Generation — Knowledge Graph + Grammar Engine

**Problem:** Template arrays produce generic output that ignores the actual problem content.

**Solution:** A two-phase engine:
1. **Semantic Decomposition** — extract problem structure (entities, relationships, claims, domain signals)
2. **Knowledge Graph Retrieval + Grammar Composition** — retrieve domain-specific analytical patterns and compose them via grammar rules into fluent, domain-specific text

**Key architectural decision:** No LLM dependency at runtime. The knowledge graph is bootstrapped offline (optionally with LLM assistance) but runs purely algorithmically.

---

## Prioritized Implementation Phases

| Phase | Deliverable | Effort | Depends On | Priority |
|-------|------------|--------|------------|----------|
| **1** | Domain taxonomy + classification engine | Low | None | **P0 — Foundation** |
| **2** | Semantic decomposition engine (`extractProblemStructure`) | Medium | Phase 1 | **P0 — Foundation** |
| **3** | Knowledge graph: pattern registries (causal, assumption, shadow, leverage) | Medium | Phase 2 | **P0 — Foundation** |
| **4** | Grammar-based content composer | Medium | Phase 3 | **P0 — Foundation** |
| **5** | Wire content composer into all 12 tools | Medium | Phase 4 | **P0 — Replace templates** |
| **6** | `think_navigator` with `guided` mode | Medium-High | Phase 5 | **P1 — Orchestration** |
| **7** | Full DAG with parallel execution + re-planning | High | Phase 6 | **P1 — Advanced** |
| **8** | Quick fixes: template dedup, output caps, confidence calibration | Low | Independent | **P0 — Critical bugs** |

> Phases 1-5 and Phase 8 are the **minimum viable v2.0**. Phase 6+ adds orchestration.

---

## Phase 1: Domain Taxonomy + Classification

### New File: `src/constants/domains.ts`

```typescript
export interface Domain {
  id: string;
  name: string;
  vocabulary: string[];              // Terms that signal this domain
  subdomains: string[];
  relatedDomains: string[];
}
```

**Initial domain set (10 domains to start):**

| Domain ID | Name | Key Vocabulary (sample) |
|-----------|------|------------------------|
| `software-architecture` | Software Architecture | monolith, microservice, api, deployment, coupling, cohesion, service boundary, distributed, technical debt |
| `organizational-topology` | Organizational Topology | team, department, silo, cross-functional, matrix, reporting, stakeholder, alignment, culture, resistance |
| `strategic-planning` | Strategic Planning | strategy, objective, roadmap, competitive, market, positioning, risk, opportunity, scenario, forecast |
| `interpersonal-dynamics` | Interpersonal Dynamics | relationship, trust, communication, conflict, empathy, boundary, attachment, projection, transference |
| `financial-planning` | Financial Planning | revenue, cost, margin, investment, roi, budget, cashflow, forecast, valuation, capital |
| `product-management` | Product Management | user, feature, roadmap, backlog, prioritization, mvp, metric, retention, conversion, churn |
| `leadership-development` | Leadership Development | vision, delegation, accountability, feedback, coaching, empowerment, culture, values, decision-making |
| `systems-thinking` | Systems Thinking | feedback loop, leverage point, emergence, boundary, constraint, delay, stock, flow, balancing, reinforcing |
| `ethics-governance` | Ethics & Governance | compliance, risk, accountability, transparency, fairness, bias, privacy, audit, regulation, oversight |
| `personal-development` | Personal Development | habit, identity, belief, pattern, growth, mindset, resilience, self-awareness, motivation, goal |

**Domain classification algorithm (no ML):**

```typescript
function classifyDomain(text: string): { domain: string; confidence: number }[] {
  const lower = text.toLowerCase();
  const results = Object.entries(DOMAINS).map(([id, domain]) => {
    const matches = domain.vocabulary.filter(vocab => lower.includes(vocab));
    const score = matches.length / Math.max(1, domain.vocabulary.length);
    const weightedScore = matches.length / Math.max(1, text.split(' ').length) * 100;
    return { domain: id, confidence: Math.min(1, score * 2 + weightedScore) };
  });
  return results.filter(r => r.confidence > 0.05).sort((a, b) => b.confidence - a.confidence);
}
```

**Expected output:** Multi-domain classification with confidence scores. A problem about "microservices for payments" → `software-architecture` (0.82), `organizational-topology` (0.45), `financial-planning` (0.12).

**Migration impact:** Existing `src/constants.ts` remains unchanged. New file is additive.

---

## Phase 2: Semantic Decomposition Engine

### New File: `src/utils/problem-structure.ts`

### New Type (add to `src/types.ts`):

```typescript
export type SubjectType = 'human' | 'ai-system' | 'organization' | 'technical-system' | 'mixed';

export interface ProblemStructure {
  entities: string[];                    // Key entities extracted from input
  relationships: string[];               // How entities connect (e.g., "X blocked by Y")
  claims: string[];                      // Asserted truths (explicit + implicit)
  uncertainties: string[];               // What's unclear or contested
  domain_signals: string[];              // Domain IDs detected
  primary_domain: string;                // Highest-confidence domain
  subject_type: SubjectType;             // What kind of thing we're analyzing
  problem_type: string;                  // e.g., "architectural-decision", "strategic-choice"
  implicit_assumptions: string[];        // What's assumed but not stated
}
```

### Extraction Pipeline (pure TypeScript, ~5ms, no LLM):

**Step 1: Entity Extraction**
- Regex-based noun phrase extraction
- Capitalized term detection (proper nouns)
- Domain-specific vocabulary matching (from Phase 1 domains)
- Stop-word filtering
- De-duplication via normalization

**Step 2: Relationship Extraction**
- Pattern match for causal language: `"X causes Y"`, `"X leads to Y"`, `"X affects Y"`
- Pattern match for dependency language: `"X blocked by Y"`, `"X depends on Y"`, `"X waiting for Y"`
- Pattern match for conflict language: `"X vs Y"`, `"X conflicts with Y"`
- Extract subject → verb → object triples

**Step 3: Claim Extraction**
- Sentences containing modal verbs: `"will"`, `"should"`, `"must"`, `"can"`
- Sentences with `"because"`, `"therefore"`, `"so"`
- The `initial_position` parameter is always an explicit claim

**Step 4: Implicit Assumption Detection**
- Pattern: `"X will solve Y"` → assumption: `"X is sufficient to solve Y"`
- Pattern: `"if we build X, Y will improve"` → assumption: `"Y's constraint is X's absence"`
- Pattern: `"the team needs X"` → assumption: `"X is the bottleneck"`

**Step 5: Subject Type Classification**
- Heuristic: If entities contain "team", "department", "organization" → `organization`
- Heuristic: If entities contain "system", "api", "monolith", "service" → `technical-system`
- Heuristic: If entities contain "ai", "model", "agent", "llm" → `ai-system`
- Heuristic: If entities contain person names, "he", "she", pronouns → `human`
- Otherwise → `mixed`

**Step 6: Domain Classification**
- Call `classifyDomain()` from Phase 1 on the full input text
- Primary domain = highest confidence result

### Example Output:

Input:
```
problem: "Should we adopt microservices for our payment system? The monolith takes 45 minutes to deploy, and the payments team is constantly blocked by the notifications team's releases."
initial_position: "Microservices will solve our deployment bottleneck"
```

Output:
```typescript
{
  entities: ["payment system", "monolith", "payments team", "notifications team", "deployment pipeline"],
  relationships: [
    "payments team → blocked by → notifications team releases",
    "monolith → causes → 45-minute deployment time",
    "deployment bottleneck → affects → payments team velocity"
  ],
  claims: [
    "Microservices will solve deployment bottleneck",
    "Team coupling is caused by code coupling",
    "Independent deployments improve team velocity"
  ],
  uncertainties: [
    "What is the actual cost of microservice migration?",
    "Do we have organizational readiness for distributed operations?"
  ],
  domain_signals: ["software-architecture", "organizational-topology"],
  primary_domain: "software-architecture",
  subject_type: "mixed",
  problem_type: "architectural-decision",
  implicit_assumptions: [
    "Microservices are sufficient to solve deployment coupling",
    "The bottleneck is technical rather than organizational"
  ]
}
```

---

## Phase 3: Knowledge Graph — Pattern Registries

### New File: `src/constants/patterns.ts`

This file stores structured analytical patterns indexed by domain. No text templates — all structured data.

### 3.1: Causal Patterns

```typescript
export interface CausalPattern {
  id: string;
  domains: string[];
  description: string;
  structure: { cause: string; effect: string; mechanism: string };
  evidence_markers: string[];     // Text patterns that signal this pattern is present
  counter_patterns: string[];     // Text patterns that contradict this pattern
}
```

**Initial patterns (20 across 3 domains):**

| ID | Domain | Pattern |
|----|--------|---------|
| `conway-law` | software-architecture, organizational-topology | System design copies the communication structure of the organization |
| `technical-debt-compounding` | software-architecture, strategic-planning | Deferred maintenance increases future change cost exponentially |
| `deployment-coupling` | software-architecture | Shared deployment boundaries create temporal coupling between independent teams |
| `service-boundary-complexity` | software-architecture | Service boundaries trade deployment coupling for distributed system complexity |
| `observability-gap` | software-architecture | Distributed systems fail without proportionally increased observability investment |
| `change-resistance-cycle` | organizational-topology, strategic-planning | Pushing change without addressing fears creates resistance that slows change |
| `communication-overhead` | organizational-topology | Adding team members increases communication paths quadratically |
| `silo-formation` | organizational-topology | Specialized teams optimize locally at the expense of global flow |
| `hero-culture` | organizational-topology, software-architecture | Rewarding individual heroics prevents systemic health improvement |
| `misaligned-incentives` | organizational-topology, strategic-planning | Teams with different success metrics create coordination failures |

### 3.2: Assumption Patterns

```typescript
export interface AssumptionPattern {
  id: string;
  domains: string[];
  assumption: string;          // The common but often wrong belief
  reality: string;             // What's actually true
  cost_if_wrong: string;
  detection_signals: string[]; // How to spot this assumption in the input
}
```

**Initial patterns (15 across 3 domains):**

| ID | Domain | Assumption |
|----|--------|------------|
| `microservices-solve-scaling` | software-architecture | Microservices automatically solve scaling and deployment problems |
| `technology-solves-people` | organizational-topology, software-architecture | Technical changes will resolve organizational problems |
| `more-data-better-decisions` | strategic-planning | More data always leads to better decisions |
| `communication-solves-resistance` | organizational-topology | Better communication will resolve change resistance |
| `rewrite-solves-debt` | software-architecture | Rewriting from scratch solves technical debt |
| `hiring-solves-capacity` | organizational-topology | Adding headline count solves capacity constraints |
| `automation-solves-quality` | software-architecture | Automating tests guarantees code quality |
| `best-practice-universality` | strategic-planning, software-architecture | Industry best practices apply universally |

### 3.3: Shadow Patterns

```typescript
export interface ShadowPattern {
  id: string;
  domains: string[];
  shadow: string;           // What the system/organization can't see about itself
  manifests_as: string[];
  root_fear: string;
  integration_path: string;
}
```

**Initial patterns (12 across 3 domains):**

| ID | Domain | Shadow |
|----|--------|--------|
| `hero-complex` | software-architecture, organizational-topology | The organization rewards individual heroics over systemic health |
| `architecture-astronaut` | software-architecture | The organization confuses architectural elegance with business value |
| `bus-factor-denial` | software-architecture | The organization pretends knowledge is shared when it lives in one person's head |
| `velocity-theater` | organizational-topology | The organization measures activity (story points) instead of outcomes (value delivered) |
| `innovation-theater` | strategic-planning | The organization performs innovation without changing risk tolerance |
| `consensus-avoidance` | organizational-topology | The organization calls decisions "data-driven" to avoid accountability |

### 3.4: Leverage Point Map

```typescript
export interface LeveragePoint {
  id: string;
  domains: string[];
  description: string;
  meadows_rank: number;       // 1-12 (1 = highest impact)
  applies_when: string[];
  intervention: string;
  risk: string;
}
```

**Initial patterns (15 across 3 domains):**

| ID | Domain | Leverage Point | Meadows Rank |
|----|--------|---------------|--------------|
| `information-flow-transparency` | software-architecture, organizational-topology | Make deployment dependencies visible to all teams | 6 |
| `rule-change-deployment-ownership` | software-architecture | Teams own their deployment pipeline, not a central platform team | 5 |
| `incentive-realignment` | organizational-topology | Align team success metrics with system-level outcomes | 7 |
| `feedback-loop-shortening` | software-architecture | Reduce time from code commit to production feedback | 8 |
| `paradigm-shift-ownership` | organizational-topology | Shift from "team owns feature" to "team owns outcome" | 3 |

### 3.5: Pattern Retrieval Engine

### New File: `src/utils/graph-engine.ts`

```typescript
interface GraphQuery {
  domains: string[];
  entities: string[];
  relationships: string[];
  claims: string[];
}

interface RetrievedPatterns {
  causal: CausalPattern[];
  assumptions: AssumptionPattern[];
  shadows: ShadowPattern[];
  leveragePoints: LeveragePoint[];
}

function retrievePatterns(query: GraphQuery, depth: number = 2): RetrievedPatterns;
function scoreEvidenceOverlap(markers: string[], relationships: string[]): number;
```

**Scoring logic:** Each pattern is scored by how many of its `evidence_markers` or `detection_signals` appear in the problem's relationships and claims. Top-N patterns by score are returned.

---

## Phase 4: Grammar-Based Content Composer

### New File: `src/utils/content-composer.ts`

### New Type (add to `src/types.ts`):

```typescript
export type ThoughtType =
  | 'diagnostic'       // What IS this problem?
  | 'deconstructive'   // Break it apart
  | 'relational'       // How do pieces connect?
  | 'perspectival'     // See from multiple angles
  | 'developmental'    // How does it evolve?
  | 'prospective'      // What could happen?
  | 'synthetic'        // Integrate everything
  | 'corrective';      // Fix reasoning errors
```

### Grammar Rules System

Instead of `claimTemplates[mode][step]`, grammar rules are structured patterns with slot resolvers:

```typescript
interface GrammarRule {
  id: string;
  thoughtTypes: ThoughtType[];
  modes: ThinkingMode[];
  stepRange: [number, number];
  template: string;             // Template with {slot} references
  slots: Record<string, SlotResolver>;
}

type SlotResolver = (ctx: CompositionContext) => string;

interface CompositionContext {
  structure: ProblemStructure;
  patterns: RetrievedPatterns;
  stepNumber: number;
  totalSteps: number;
  mode: ThinkingMode;
  subMode: ReasoningSubMode;
  previousOutputs: string[];
}
```

### Example Rules:

**Rule: decomposition-entity** (analytical, step 0-1)
```
Template: "The {subject} involves {count} distinct causal factors operating at {level}: {factors}."
Slots:
  subject → structure.entities[0]
  count → Math.min(structure.relationships.length + 1, 5)
  level → pick from domain-specific abstraction levels
  factors → patterns.causal.map(p => p.structure.cause)
```

**Rule: evidence-challenge** (critical, step 2-3)
```
Template: 'The claim "{claim}" rests on the assumption that {assumption}. However, {reality}. The cost of this assumption being wrong is {cost}.'
Slots:
  claim → structure.claims[0]
  assumption → patterns.assumptions[0]?.assumption
  reality → patterns.assumptions[0]?.reality
  cost → patterns.assumptions[0]?.cost_if_wrong
```

**Rule: shadow-surface** (any mode, step 3-5)
```
Template: "What the {subject} cannot see about itself is that {shadow}. This manifests as {manifestation}. The underlying dynamic protects against {fear}, which means addressing it requires {integration}."
Slots:
  shadow → patterns.shadows[0]?.shadow
  manifestation → patterns.shadows[0]?.manifests_as.join(' and ')
  fear → patterns.shadows[0]?.root_fear
  integration → patterns.shadows[0]?.integration_path
```

**Rule: leverage-intervention** (strategic, step 4-6)
```
Template: "A high-leverage intervention (Meadows rank {rank}) is to {intervention}. This works because it addresses {mechanism}. The risk is {risk}, which must be mitigated by {mitigation}."
Slots:
  rank → patterns.leveragePoints[0]?.meadows_rank
  intervention → patterns.leveragePoints[0]?.intervention
  mechanism → patterns.causal[0]?.structure.mechanism
  risk → patterns.leveragePoints[0]?.risk
```

### Rule Selection with Deduplication

```typescript
function selectRule(rules: GrammarRule[], previousOutputs: string[]): GrammarRule {
  if (rules.length <= 1) return rules[0];
  // Avoid rules that produced similar output recently
  // Round-robin across applicable rules, biased toward unused rules
  const ruleIndex = previousOutputs.length % rules.length;
  return rules[ruleIndex];
}
```

### Sub-Mode Framing (preserved from current implementation)

The grammar composer adds sub-mode-specific reasoning frames as suffixes:
- **Deductive**: "If the general principle holds in this specific context..."
- **Inductive**: "This pattern matches historical cases where similar dynamics..."
- **Abductive**: "Given the observed dynamics, the best explanation is..."
- **Analogical**: "This situation is structurally similar to known cases..."

These frames are appended to the grammar-composed content, preserving the existing reasoning_sub_mode behavior.

---

## Phase 5: Wire Content Composer into All 12 Tools

### Integration Strategy

Each tool's content generation functions are replaced in two phases:

**Phase 5a: Hybrid mode (default)**
- Call `extractProblemStructure()` at tool entry
- Call `retrievePatterns()` with extracted structure
- Call `composeStepContent()` for each step/section
- **Fallback**: If no patterns match or composer returns empty, fall back to existing template engine

**Phase 5b: Full replacement (after validation)**
- Remove all template arrays from tool files
- All content flows through the composer pipeline

### Tool-by-Tool Integration Plan:

#### 5.1: `think_sequential` (highest impact)
**Current problem:** Every step uses the same template regardless of input.

**Change:** Replace `generateClaim()`, `generateReasoning()`, `generateAssumptions()`, `generateCounterArgument()`, `generateNextInvestigation()` with calls to `composeStepContent()`.

**Mapping:**
| Step | ThoughtType | Grammar Rules Applied |
|------|------------|----------------------|
| 0 | deconstructive | decomposition-entity, decomposition-relationship |
| 1 | relational | causal-mapping, feedback-identification |
| 2 | diagnostic | evidence-challenge, assumption-surface |
| 3 | perspectival | shadow-surface, counter-specific |
| 4 | diagnostic | edge-case-analysis, boundary-testing |
| 5 | prospective | second-order-mapping, cascade-prediction |
| 6 | synthetic | bounded-conclusion, uncertainty-acknowledgment |

#### 5.2: `think_polarity`
**Change:** Replace generic polarity cell content with domain-specific analysis. The 9-row polarity map rows and 16-row integration spectrum are populated from retrieved patterns + grammar composition.

#### 5.3: `think_aqal_situational`
**Change:** Subject-aware strategy generation. When `subject_type !== 'human'`, strategies pull from technical/organizational pattern registries instead of psychological ones.

#### 5.4: `think_aqal_projection`
**Change:** Time-horizon differentiation — short-term, mid-term, and long-term content use different grammar rules and pattern subsets.

#### 5.5: `think_hierarchical`
**Change:** Evidence-to-stage mapping. Instead of generic stage descriptions, map specific observable behaviors to stage characteristics using pattern matching.

#### 5.6: `think_shadow`
**Change:** System-aware shadow analysis. For non-human subjects, use the ShadowPattern registry (hero-complex, architecture-astronaut, etc.) instead of Jungian/Freudian human psychology frameworks.

#### 5.7: `think_cynefin`
**Change:** Domain-specific guidance. Instead of generic "listen to experts," pull leverage points and causal patterns relevant to the classified Cynefin domain.

#### 5.8: `think_causal`
**Change:** Variable definitions from extracted entities. Feedback loop detection uses the causal pattern registry. Archetype matching uses evidence markers from patterns.

#### 5.9: `think_metacognitive`
**Change:** Bias detection sensitivity improved by matching against assumption patterns and claim structures from the extracted problem structure.

#### 5.10: `think_first_principles`
**Change:** Socratic interrogation uses assumption patterns from the knowledge graph. Constraint mapping uses domain-specific constraint registries.

#### 5.11: `think_scenario`
**Change:** 3rd-order consequences generated from cascade patterns in the knowledge graph (each pathway gets unique consequences). Scenario narratives composed from domain-specific driving force patterns.

#### 5.12: `think_unity`
**Change:** Subsystem outputs each use the content composer with their specific lens, ensuring domain-specific analysis in all 6 subsystems.

### New File: `src/utils/content-pipeline.ts`

The orchestration layer that ties it all together:

```typescript
function composeToolContent(params: {
  toolName: string;
  structure: ProblemStructure;
  mode: ThinkingMode;
  subMode?: ReasoningSubMode;
  stepNumber: number;
  totalSteps: number;
  previousOutputs: string[];
}): string;
```

---

## Phase 6: `think_navigator` — Reasoning DAG Orchestration

### New File: `src/tools/navigator.ts`
### New File: `src/utils/graph-engine.ts` (extended)

### New Types (add to `src/types.ts`):

```typescript
export interface ReasoningNode {
  id: number;
  tool: SuggestedTool;
  thoughtType: ThoughtType;
  purpose: string;
  params: Record<string, unknown>;
  dependsOn: number[];
  status: 'pending' | 'ready' | 'completed' | 'blocked' | 'skipped';
  output?: string;
  qualityScore?: number;  // 0-1 assessment of output usefulness
}

export interface ReasoningGraph {
  totalNodes: number;
  completedNodes: number;
  nodes: ReasoningNode[];
  parallelGroups: number[][];  // Groups of nodes that can run in parallel
  coverage: Record<ThoughtType, number>;  // Count of each thought type done
  nextInstruction: string;
  sessionToken: string;
  replanCount: number;
}

export type NavigatorMode = 'full' | 'guided' | 'minimal';
export type NavigatorAction = 'plan' | 'advance' | 'replan' | 'terminate';
```

### Tool Interface:

```typescript
// Initial plan request
think_navigator({
  problem: "Should we adopt microservices for our payment system?",
  initial_position: "Monolith is becoming unmanageable",
  planning_mode: "guided"  // full | guided | minimal
})

// Advance after completing a node
think_navigator({
  session_token: "nav_abc123",
  action: "advance",
  completed_node: 1,
  node_output: "Domain: Complicated (48% confidence)",
  node_quality: 0.7  // optional self-assessment
})
```

### Three Planning Modes:

| Mode | What It Does | When to Use |
|------|-------------|-------------|
| `full` | Generates complete DAG with 6-12 nodes, dependency mapping, parallel groups | Deep analysis of complex problems |
| `guided` | Generates next 2-3 steps only, re-plans after each | Iterative exploration where direction may shift |
| `minimal` | Suggests the next single best tool | Quick decisions, agent wants maximum autonomy |

### DAG Builder Logic:

1. **Classify problem** → call Cynefin classification
2. **Identify thinking gaps** → what thought types are needed for this domain?
3. **Build dependency graph** → diagnostic before deconstructive before synthetic
4. **Identify parallel groups** → nodes with no mutual dependencies
5. **Assign quality thresholds** → what confidence level requires re-planning?

### Re-planning Triggers:

| Trigger | Action |
|---------|--------|
| Cynefin confidence < 50% | Add `think_aqal_situational` for multi-perspective |
| Node quality < 0.5 | Deepen: re-run with higher `output_depth` |
| Coverage gap detected | Add missing thought type (e.g., 0 prospective after 4 diagnostic) |
| Contradiction between nodes | Add `think_metacognitive` to audit reasoning |
| All critical nodes complete | Terminate with synthesis summary |

---

## Phase 7: Full DAG with Parallel Execution + State Persistence

### New File: `src/utils/state-manager.ts`

Session-based state management for the navigator:

```typescript
interface NavigatorSession {
  token: string;
  graph: ReasoningGraph;
  createdAt: Date;
  lastAccessed: Date;
  maxAge: number;  // TTL in minutes
}

const sessions: Map<string, NavigatorSession> = new Map();

function createSession(graph: ReasoningGraph): string;
function getSession(token: string): NavigatorSession | null;
function updateNode(token: string, nodeId: number, output: string, quality?: number): void;
function getReadyNodes(token: string): number[];  // Nodes ready to execute
function shouldReplan(token: string): boolean;
function replan(token: string): ReasoningGraph;
```

### Parallel Execution Support

The navigator identifies parallel groups:
```typescript
// Example: After Cynefin classification (node 1), nodes 2 and 3 can run in parallel
parallelGroups: [[1], [2, 3], [4, 5, 6], [7]]
// Group [2, 3] can execute simultaneously — both depend only on node 1
```

### State Persistence

For MCP stdio transport (stateless between calls), sessions are stored in-memory with a TTL. For production use, consider file-based persistence.

---

## Phase 8: Quick Fixes (Independent, Low Effort)

### 8.1: Confidence Calibration

**Problem:** All steps rated "High" or "Very High" confidence.

**Fix:** Force confidence distribution. The `generateSteps()` function in `sequential.ts` applies a `confidenceDecay` factor, but the base confidence is too high.

**Change:**
- Reduce `confidenceBase` values per mode (analytical: 0.85→0.72, creative: 0.65→0.55, critical: 0.75→0.65, strategic: 0.70→0.58)
- Add forced minimum variance: at least one step must be below the average
- Calibrate the `confidenceBar` labels to be more discriminative

### 8.2: Output Size Management

**Problem:** `think_polarity` and `think_aqal_projection` produce 47KB-66KB outputs.

**Fix:**
- Add a `CHARACTER_LIMIT` enforcement in formatters (already defined as 25000 in constants.ts but not enforced)
- Implement progressive disclosure: summary first, detail on request
- In `executive` output mode, truncate integration spectrum to top 4 rows
- Add a `concise` boolean parameter to large-output tools

### 8.3: Template Deduplication in `think_scenario`

**Problem:** 3rd-order consequences are identical across all pathways.

**Fix:** Each consequence pathway should compose unique text from:
- The specific 2nd-order consequence it follows from
- Domain-specific cascade patterns from the knowledge graph
- A uniqueness check against previously generated consequences

### 8.4: Output Mode Consistency

**Problem:** Not all tools respect `output_mode` consistently.

**Fix:** Standardize the `executive` mode across all 12 tools:
- Limit to 2-sentence summaries per section
- Remove cross-quadrant dynamics in executive mode
- Remove integration spectrum in executive mode for polarity
- Keep only scenario names + probability + 1st-order consequences in executive mode for scenario

---

## File Structure (v2.0)

```
thinking-modes-mcp-server/
├── src/
│   ├── index.ts                    # MCP server entry (add navigator registration)
│   ├── types.ts                    # ADD: ProblemStructure, SubjectType, ThoughtType,
│   │                               #        ReasoningNode, ReasoningGraph, NavigatorMode
│   ├── constants.ts                # KEEP: Existing constants (developmental levels, etc.)
│   ├── constants/
│   │   └── domains.ts              # NEW: Domain taxonomy (10 domains)
│   ├── constants/
│   │   └── patterns.ts             # NEW: Pattern registries (causal, assumption, shadow, leverage)
│   ├── tools/
│   │   ├── sequential.ts           # MODIFY: Replace template engine with content composer
│   │   ├── polarity.ts             # MODIFY: Domain-specific polarity content
│   │   ├── aqal-situational.ts     # MODIFY: Subject-aware strategy generation
│   │   ├── aqal-projection.ts      # MODIFY: Time-horizon differentiation
│   │   ├── hierarchical.ts         # MODIFY: Evidence-to-stage mapping
│   │   ├── shadow.ts               # MODIFY: System-aware shadow analysis
│   │   ├── unity.ts                # MODIFY: Composer in all 6 subsystems
│   │   ├── causal.ts               # MODIFY: Entity-driven variable definitions
│   │   ├── cynefin.ts              # MODIFY: Domain-specific guidance
│   │   ├── scenario.ts             # MODIFY: Unique cascade consequences
│   │   ├── metacognitive.ts        # MODIFY: Pattern-matching bias detection
│   │   ├── first-principles.ts     # MODIFY: Knowledge-graph Socratic interrogation
│   │   └── navigator.ts            # NEW: think_navigator tool
│   └── utils/
│       ├── formatters.ts           # MODIFY: Output size enforcement, concise mode
│       ├── problem-structure.ts    # NEW: Semantic decomposition engine
│       ├── graph-engine.ts         # NEW: Pattern retrieval + scoring
│       ├── content-composer.ts     # NEW: Grammar-based content generation
│       ├── content-pipeline.ts     # NEW: Orchestration layer for all tools
│       ├── state-manager.ts        # NEW: Navigator session state
│       └── domain-classifier.ts    # NEW: Domain classification algorithm
├── scripts/
│   └── bootstrap-knowledge-graph.ts # NEW: Offline LLM-assisted pattern generation
├── package.json
├── tsconfig.json
└── README.md                       # UPDATE: Document new navigator tool + v2 architecture
```

---

## Migration Strategy

### Step 1: Additive Changes (Zero Breaking Changes)
- Add new types to `types.ts`
- Add new files: `domains.ts`, `patterns.ts`, `problem-structure.ts`, `graph-engine.ts`, `content-composer.ts`
- All new code is additive — existing tools continue to work unchanged

### Step 2: Hybrid Mode
- Each tool calls `extractProblemStructure()` and attempts `composeStepContent()`
- If composer returns meaningful content, use it
- If composer returns empty/fallback, use existing template engine
- This allows gradual validation of the knowledge graph

### Step 3: Template Removal
- Once hybrid mode is validated, remove template arrays from each tool
- All content flows through the composer

### Step 4: Navigator Integration
- Add `think_navigator` as the 13th tool
- Register it in `index.ts`
- No changes to existing tools required

---

## Testing Strategy

### Unit Tests (New)
- `domain-classifier.test.ts` — Verify domain classification accuracy against known inputs
- `problem-structure.test.ts` — Verify entity/relationship/claim extraction
- `graph-engine.test.ts` — Verify pattern retrieval scoring
- `content-composer.test.ts` — Verify grammar rule slot resolution
- `navigator.test.ts` — Verify DAG construction, dependency resolution, parallel grouping

### Integration Tests
- Each tool tested with domain-specific inputs:
  - Software architecture problem → should produce software-specific output
  - Organizational problem → should produce organization-specific output
  - Same problem, different domains → should produce different output
- Template regression test: ensure no two calls with the same input produce identical output (except where deterministic)

### Performance Tests
- `extractProblemStructure()` should complete in < 10ms
- `retrievePatterns()` should complete in < 5ms
- `composeStepContent()` should complete in < 5ms
- Total tool overhead from knowledge graph: < 25ms per tool call

---

## Effort Estimate

| Phase | Files Changed | New Files | Estimated Effort | Risk |
|-------|--------------|-----------|-----------------|------|
| **1. Domain Taxonomy** | 0 | 1 (`domains.ts`) | 2 hours | Low |
| **2. Semantic Decomposition** | 1 (`types.ts`) | 1 (`problem-structure.ts`) | 4 hours | Medium |
| **3. Pattern Registries** | 0 | 1 (`patterns.ts`) | 6 hours | Medium |
| **4. Content Composer** | 0 | 2 (`content-composer.ts`, `content-pipeline.ts`) | 6 hours | Medium |
| **5. Wire into Tools** | 12 (all tools) | 0 | 12 hours | High |
| **6. Navigator** | 1 (`index.ts`) | 2 (`navigator.ts`, `state-manager.ts`) | 8 hours | Medium |
| **7. DAG + Persistence** | 1 (`state-manager.ts`) | 0 | 4 hours | Low |
| **8. Quick Fixes** | 4 (sequential, scenario, formatters, constants) | 0 | 4 hours | Low |
| **Testing** | 0 | 5 test files | 6 hours | Medium |
| **Documentation** | 1 (`README.md`) | 1 (`UPGRADE_PLAN.md`) | 2 hours | Low |
| **Total** | — | **13 new files** | **~54 hours** | — |

---

## Success Criteria

### v2.0 Minimum Viable (Phases 1-5 + 8):
- [ ] `extractProblemStructure()` correctly extracts entities, relationships, claims from any input
- [ ] Domain classification returns correct primary domain with confidence > 0.3 for domain-specific inputs
- [ ] Pattern retrieval returns relevant patterns (evidence score > 0.2) for known problem types
- [ ] Grammar composer produces non-template output for at least 3 domains
- [ ] `think_sequential` output is visibly different for two different inputs in the same mode
- [ ] No 3rd-order consequence duplication in `think_scenario`
- [ ] Confidence distribution shows meaningful variance across steps
- [ ] All tools respect `output_mode` consistently

### Full v2.0 (All Phases):
- [ ] `think_navigator` produces valid DAGs with correct dependency resolution
- [ ] Parallel groups are correctly identified (no mutual dependencies within a group)
- [ ] Re-planning triggers correctly on low-quality nodes
- [ ] Session state persists across navigator calls
- [ ] Coverage tracking identifies missing thought types
- [ ] Total knowledge graph: 50+ causal patterns, 30+ assumption patterns, 20+ shadow patterns, 40+ leverage points across 10+ domains

---

## Dependencies

### Runtime Dependencies (unchanged):
- `@modelcontextprotocol/sdk: ^1.29.0`
- `zod: ^3.23.8`

### Optional Dependencies (for bootstrap script only):
- `ollama` — for offline knowledge graph bootstrapping (not needed at runtime)

### No New Runtime Dependencies

The entire architecture is pure TypeScript — no LLM calls, no external APIs, no network requests at runtime.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Knowledge graph too sparse for some domains | Medium | High | Start with 3 well-populated domains, expand iteratively |
| Grammar rules produce awkward/unnatural text | Medium | Medium | Extensive review of composed output; fallback to templates |
| Pattern retrieval returns irrelevant patterns | Low | Medium | Tune scoring thresholds; add manual review layer |
| Navigator DAG too complex for simple problems | Medium | Low | `minimal` and `guided` modes handle simple cases |
| Breaking change in tool output format | Low | High | Hybrid mode ensures backward compatibility during transition |
| Performance degradation from extraction overhead | Low | Low | All extraction is regex/string operations, < 25ms total |

---

## Open Questions

1. **Bootstrap strategy**: Should we use an LLM offline to generate the initial pattern library, or hand-curate the first 50 patterns? Recommendation: LLM-assisted generation with manual review — use the `scripts/bootstrap-knowledge-graph.ts` to generate draft patterns, then review/edit.

2. **Grammar rule authoring**: Who authors the grammar rules? Recommendation: Start with the 8 rules defined in this plan, then expand based on observed gaps in output quality.

3. **Pattern library size**: How many patterns per domain before coverage is adequate? Recommendation: Start with 5 causal + 3 assumption + 2 shadow + 3 leverage per domain (13 patterns/domain). Expand to 20+ per domain based on usage patterns.

4. **Navigator session TTL**: How long should navigator sessions persist? Recommendation: 30-minute TTL for MCP stdio transport. For production, consider file-based persistence with configurable TTL.

5. **Multi-domain problems**: When a problem spans multiple domains (e.g., software-architecture + organizational-topology), should the composer blend patterns from both domains or prioritize the primary domain? Recommendation: Blend — retrieve patterns from all domains with confidence > 0.2, weighted by confidence score.
