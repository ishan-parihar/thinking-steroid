# Thinking Steroids MCP — First Principles Roadmap

## Core Thesis

**Structured thinking frameworks amplify LLM reasoning by constraining the token generation topology.** An LLM generating free-form text follows the path of least probability. A structured scaffold forces generation into cognitive slots the model would naturally skip. This isn't formatting — it's **reasoning topology design**.

### The Mechanism

When an LLM outputs `| Rewards of Focus on A | Rewards of Focus on B |`, the table structure forces **parallel consideration** rather than sequential linearization. Each cell becomes a cognitive attractor that MUST be filled. The model can't hedge, can't average, can't jump to synthesis. The scaffold creates **commitment points** — once generated, these claims condition all subsequent reasoning.

The amplification is **multiplicative**, not additive:
- Linear CoT = 1D reasoning chain
- Polarity mapping = 2D dialectical tension space
- AQAL = 2×4 = 8 simultaneous analytical dimensions
- Shadow analysis = multi-dimensional (frameworks × stages × lines × synthesis)
- Unity = 6 lenses in dialogue → emergent meta-analysis

---

## Design Principles

### 1. Input Forces Specificity
Vague inputs produce vague outputs. Every tool's schema must **reject underspecified input** and demand concrete details. Not `"topic: string"` but `"topic + initial_position + assumptions_to_challenge"`.

### 2. Output Creates Reusable Artifacts
Each tool's output must be structured so specific sections can be **extracted and used as input to other tools**. Sequential thinking's "step 3 conclusion" → polarity thinking's `pole_a`. AQAL's cultural analysis → shadow analysis's behavioral data.

### 3. Tools Compose
The tools aren't independent — they chain. The MCP must explicitly document **composition patterns**: what feeds each tool, what each tool feeds.

### 4. Coordinates Over Descriptions
Don't just describe — give **positions on spectra**. "Position 2 on the integration spectrum" is more useful than "somewhere between balance and disintegration." Coordinates enable downstream reasoning.

### 5. Depth Parameter
Every tool supports `output_depth: "essential" | "standard" | "exhaustive"` — allowing the calling LLM to control token budget vs. analytical depth.

### 6. Meta-Reasoning Built In
Each tool ends with **"What this reveals about how we're thinking"** — second-order insight that compounds reasoning capacity.

---

## Tool Specifications

### Tool 1: `think_sequential`

**Cognitive Mechanism**: Forces commitment to intermediate claims before reaching conclusions. Each claim becomes a fixed context point that subsequent reasoning cannot ignore or hedge away.

**LLM's Natural Failure Mode**: Jumping to conclusions, hedging mid-generation, reversing course without acknowledging the contradiction.

**What the scaffold fixes**: Creates a REASONING AUDIT TRAIL — numbered steps with claims, confidence levels, assumptions, and counter-arguments that the LLM can navigate, challenge, and build upon.

**Input Schema**:
```
problem: string — what to think about
initial_position: string — what you currently think (forces commitment upfront)
depth: "surface" | "deep" | "exhaustive"
thinking_mode: "analytical" | "creative" | "critical" | "strategic"
assumptions_to_challenge: string? — beliefs to test
counter_perspective: string? — opposing view to steelman
```

**Output Structure** (per step):
```
## Step N: [Claim Title]
- **Claim**: [Specific claim, not vague observation]
- **Reasoning**: [Why this claim follows]
- **Confidence**: high | medium | low
- **Depends On**: [Assumptions this step requires]
- **Counter-Argument**: [Strongest case against this step]
- **Next Investigation**: [What to look at next]
```

**Composition**:
- → feeds: `think_polarity` (key tensions become pole_a/pole_b)
- → feeds: `think_aqal_situational` (initial position provides context)
- ← fed by: none (entry-point tool)

---

### Tool 2: `think_polarity`

**Cognitive Mechanism**: Counters LLM's **premature synthesis bias**. The model naturally averages positions ("both have merit"). The polarity map FORCES sustained attention on each pole's strengths, overemphasis risks, neglect risks, and shadow dynamics BEFORE any synthesis is permitted.

**LLM's Natural Failure Mode**: "Both structure and flexibility are important — find the right balance." This is useless. The tool forces: "What is GENUINELY valuable about extreme structure? What breaks when structure is neglected? What feedback loop drives structure to excess?"

**What the scaffold fixes**: Creates a MAP of the tension space and an integration spectrum that gives precise coordinates — "we're at level 2 on harmonious integration, level 3 on pathological disintegration."

**Input Schema**:
```
pole_a: string — first pole (genuine value, not straw man)
pole_b: string — opposing pole (genuine value, not straw man)
domain: string — where this tension plays out
current_position: string — where the system currently sits
evidence_for_position: string — observable data
desired_outcome: string — what "good" looks like
```

**Output Structure**:
- **Table 1**: Polarity Map (9 rows × 2 columns)
  - Rewards of Focus | Overemphasis Feedback | Neglect Risks | Causal Loops | Balkanization Risks | Extremity Loops | Transcendence Rewards | Reflection Loops | Meta-Reflection Process
- **Table 2**: Integration Spectrum (16 rows × 4 levels)
  - Harmonious Integration → Pathological Disintegration → Balance → Dynamic Interplay → Fluid Transition → Interdependence → Hidden Synergy → Emergent Properties → Generative Outcome → Emergence → Transcendence → Unconscious Attachment → Impact on Neutrality → Developmental Tools → Step-by-step Transcendence → Signs of Transcendence

**Composition**:
- → feeds: `think_aqal_situational` (current position provides quadrant context)
- → feeds: `think_unity` (tension map feeds DriS analysis)
- ← fed by: `think_sequential` (identified tensions)

---

### Tool 3: `think_aqal_situational`

**Cognitive Mechanism**: Forces 4-quadrant balance. The LLM naturally overweights quadrants matching the topic's training data distribution. The scaffold FORCES generation in underweighted quadrants.

**Key Insight**: Each quadrant has a different EPISTEMOLOGY:
- Intentional: Known through introspection, self-report
- Behavioral: Known through observation, measurement
- Cultural: Known through interpretation, narrative
- Social: Known through systems analysis, structural mapping

**LLM's Natural Failure Mode**: Technical topics → overweight exterior quadrants. Interpersonal topics → overweight interior quadrants. Never balanced without scaffold.

**What the scaffold fixes**: 4 simultaneous analyses that would never be produced without forced structure. The 2nd order effects reveal non-obvious system dynamics.

**Input Schema**:
```
situation: string — what's happening
stakeholders: string — who's involved
observable_data: string — measurable/observable facts
reported_experience: string — what people say they experience
cultural_context: string — shared narratives, values, norms
systemic_context: string — infrastructure, processes, constraints
```

**Output Structure** (2×2 quadrant table):
Each quadrant produces: Context Summary → Solution Summary → Strategies → 2nd Order Effects

**Composition**:
- → feeds: `think_aqal_projection` (situational context is the baseline)
- → feeds: `think_shadow` (quadrant imbalances reveal shadow zones)
- → feeds: `think_unity` (QuaS analysis directly)
- ← fed by: `think_sequential`, `think_polarity`

---

### Tool 4: `think_aqal_projection`

**Cognitive Mechanism**: AQAL + TIME. Different quadrants change at different rates. Behavioral changes fastest. Cultural changes slowest. The projection reveals temporal asymmetry — what changes first, what follows, what endures.

**LLM's Natural Failure Mode**: Assuming all dimensions change at the same rate. Not seeing that behavioral changes can precede cultural shifts by years.

**What the scaffold fixes**: Shows the TEMPORAL ARC of change — which quadrants lead, which lag, and how they influence each other over time.

**Input Schema**:
```
situation: string — current situation
current_trajectory: string — what's already changing
intervention_planned: string — what change is being attempted
time_constraints: string — deadlines, urgency factors
```

**Output Structure** (2×4 table — 4 quadrants × situation/solution/short/mid/long):
- Short-Term (<1yr): Behavioral-heavy projections
- Mid-Term (1-3yr): Social and intentional shifts emerge
- Long-Term (3+yr): Cultural transformation dominates

**Composition**:
- → feeds: `think_hierarchical` (long-term projections reveal developmental trajectory)
- → feeds: `think_unity` (temporal analysis feeds SoCS state analysis)
- ← fed by: `think_aqal_situational`

---

### Tool 5: `think_hierarchical`

**Cognitive Mechanism**: Maps developmental stages where each stage TRANSCENDS AND INCLUDES the previous. Shows how the same system manifests at each developmental level across all 4 quadrants.

**LLM's Natural Failure Mode**: Treating development as linear improvement rather than stage transitions with qualitatively different capacities.

**What the scaffold fixes**: Creates a DEVELOPMENTAL TRAJECTORY MAP — not just "what stage" but "what does the next stage actually look like for THIS system, and what capacities need to develop?"

**Input Schema**:
```
system: string — person, team, organization, or society
current_stage: "archaic" | "magic" | "magic-mythic" | "mythic" | "modern-rational" | "postmodern" | "integral" | "super-integral"
system_description: string — what's known
observable_behaviors: string — visible patterns
cultural_indicators: string — shared values, narratives
structural_indicators: string — organization, processes
```

**Output Structure** (5-row × 4-quadrant table):
Present stage + 4 future stages, each showing manifestation in Intentional, Behavioral, Cultural, and Social dimensions.

**Composition**:
- → feeds: `think_unity` (stage map feeds LoDS directly)
- → feeds: `think_shadow` (stage mapping reveals which stages are shadowed)
- ← fed by: `think_aqal_projection`, `think_shadow`

---

### Tool 6: `think_shadow`

**Cognitive Mechanism**: The MOST powerful tool. Reveals what's NOT being said by applying multiple psychological frameworks to the same behavioral data. Where frameworks converge → high-confidence shadow identification. Where they diverge → complex dynamics requiring deeper inquiry.

**LLM's Natural Failure Mode**: Applying only the most common framework for a topic. Missing shadow material entirely. Producing "psychobabble" without grounding in specific behavioral data.

**What the scaffold fixes**: Forces ALL frameworks (Freudian, Jungian, Gestalt, Integral) to be applied. Maps shadow across developmental stages and lines. Identifies dominant shadow constellations.

**CRITICAL**: Requires RICH INPUT DATA. Without specific behavioral examples, quotes, and contradictions, the analysis becomes speculative. The tool must VALIDATE input richness.

**Input Schema**:
```
behavioral_data: string — specific behaviors, quotes, patterns
context: string — setting, relationships, history
self_description: string — how they describe themselves
others_description: string — how others describe them
contradictions: string — gaps between stated and actual behavior
triggers: string — what provokes strong reactions
dreams_fantasies: string? — if available
```

**Output Structure** (4 sections):
1. **Multi-Framework Analysis**: Freudian + Jungian + Gestalt applied to data
2. **Developmental Stage Analysis**: Shadow across Spiral Dynamics (Beige→Turquoise)
3. **Lines of Development**: Impact on 8 developmental lines
4. **Synthesis**: Convergent/divergent insights + dominant shadow constellations

**Composition**:
- → feeds: `think_unity` (shadow map feeds ShWS directly)
- → feeds: `think_aqal_situational` (shadow data reveals hidden quadrant dynamics)
- → feeds: `think_polarity` (shadow reveals unacknowledged poles)
- ← fed by: `think_aqal_situational`, `think_sequential`

---

### Tool 7: `think_unity`

**Cognitive Mechanism**: The META-TOOL. Applies 6 different lenses simultaneously, then creates DIALOGUE between them where they challenge and build on each other. The dialogue creates EMERGENT INSIGHTS no single lens could produce.

**6 Sub-Personalities**:
1. **LoDS** (Levels): What stage? What's the next growth edge?
2. **LiDS** (Lines): Which lines strong/weak? Imbalance patterns?
3. **SoCS** (States): What state of consciousness? How does it color perception?
4. **DriS** (Drives): Agency/Communion/Eros/Agape — balanced or distorted?
5. **QuaS** (Quadrants): All 4 AQAL perspectives simultaneously
6. **ShWS** (Shadow): Unconscious material influencing the system

**LLM's Natural Failure Mode**: Applying 1-2 lenses and ignoring the rest. Not holding multiple frameworks in "working memory" simultaneously. Missing emergent insights from lens interaction.

**What the scaffold fixes**: Forces all 6 lenses. Creates inter-system dialogue where LoDS says "Mythic stage" and ShWS responds "here's what Mythic represses" and DriS adds "and here's how the communion drive reinforces it."

**Input Schema**:
```
query: string — what to analyze
developmental_context: string — known development info
state_indicators: string? — clues about current state
behavioral_patterns: string — observable patterns
relational_context: string — relationships, dynamics
shadow_indicators: string? — known shadow material
active_drives: string? — suspected core motivations
```

**Output Structure**:
1. **Prologue**: Unity's initial framing
2. **Six Responses**: Each sub-personality's analysis (~300 words each)
3. **Inter-System Dialogue**: The conversation between sub-personalities (~400 words)
4. **Synthesis**: Integrated perspective (~300 words)
5. **Epilogue**: Closing reflections

**Composition**:
- → feeds: nothing (terminal tool — the grand synthesis)
- ← fed by: ALL other tools (takes their outputs as enriched input)

---

## Composition Patterns

### Pattern 1: Sequential Chain
```
think_sequential → think_polarity → think_aqal_situational → think_shadow → think_unity
```
Each tool's output becomes the next tool's input context. Builds from surface reasoning → tension mapping → quadrant analysis → shadow revelation → grand synthesis.

### Pattern 2: Parallel 3D Map
```
think_aqal_situational + think_aqal_projection + think_hierarchical (parallel)
```
Three tools on the same situation produce a 3D picture: current position + future trajectory + developmental capacity.

### Pattern 3: Shadow-Infused Analysis
```
think_shadow → (any other tool with shadow-informed input)
```
Shadow analysis runs first, revealing hidden dynamics. Then any other tool runs with enriched input that includes the shadow material.

### Pattern 4: Unity Grand Synthesis
```
(all tools) → think_unity
```
Unity runs last, taking outputs from all other tools as its enriched input. The 6 sub-personalities each specialize in one dimension of the accumulated analysis.

---

## Implementation Architecture

### Project Structure
```
thinking-steroid/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts              # McpServer + tool registration + transport
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── constants.ts          # All domain data (stages, lines, drives, quadrants, frameworks)
│   ├── utils/
│   │   └── formatters.ts     # Pure functions: input → structured markdown output
│   └── tools/
│       ├── sequential.ts
│       ├── polarity.ts
│       ├── aqal-situational.ts
│       ├── aqal-projection.ts
│       ├── hierarchical.ts
│       ├── shadow.ts
│       └── unity.ts
└── dist/
```

### Key Dependencies
- `@modelcontextprotocol/server` — MCP SDK v1 stable
- `zod` — runtime input validation
- No external APIs — pure computation

### Transport
- Primary: `StdioServerTransport` (agent/CLI use case)
- Optional: Streamable HTTP via env variable toggle

### Server Instructions
```
This server provides 7 thinking modality tools that structure AI agent reasoning.
Tools compose — use outputs from one as inputs to another.
Recommended workflow: sequential → polarity → aqal → shadow → unity.
Each tool supports output_depth: essential | standard | exhaustive.
```

---

## Implementation Order

### Phase 1: Foundation (Day 1-2)
1. Project setup (package.json, tsconfig, types, constants)
2. Formatter utilities (pure functions, testable)
3. `think_sequential` — simplest tool, validates the entire pipeline
4. Server wiring with first tool

### Phase 2: Core Modalities (Day 2-3)
5. `think_aqal_situational` — establishes quadrant formatting
6. `think_aqal_projection` — extends situational with time
7. `think_polarity` — complex two-table output, validates tension mapping

### Phase 3: Deep Analysis (Day 3-4)
8. `think_hierarchical` — stage mapping across quadrants
9. `think_shadow` — largest formatter, 4-section analytical report

### Phase 4: Integration (Day 4-5)
10. `think_unity` — most complex, 6 sub-systems + dialogue
11. Full server wiring — all 7 tools registered with composition annotations
12. Build, test, verify

---

## Quality Checklist

- [ ] All tools use Zod `.strict()` schemas with descriptive validation errors
- [ ] All tools have `readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false`
- [ ] All tools support `output_depth` parameter
- [ ] All tools have composition annotations in descriptions
- [ ] All formatters are pure functions (no side effects, fully testable)
- [ ] Constants file contains ALL domain data (stages, lines, drives, quadrants, frameworks)
- [ ] Server instructions describe composition patterns
- [ ] `npm run build` completes without errors
- [ ] LSP diagnostics clean on all files
- [ ] README includes tool catalog, composition patterns, and usage examples
