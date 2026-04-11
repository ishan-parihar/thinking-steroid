# Thinking-Steroids MCP — Refactor Execution Plan

**Version:** 3.0  
**Date:** April 11, 2026  
**Scope:** Fill gaps from ROADMAP.md Phases 0, 2, 3, 4, 5, 6  
**Execution Model:** Subagent-driven, progressive milestones, zero-breaking-change migrations  
**Pre-requisite:** Phases 1 (Content Composer Rewrite) is 95% complete — no further work needed

---

## Current State Summary

The content generation pipeline has been substantially upgraded from its original broken state. The following is **already implemented** and should NOT be re-worked:

### ✅ Already Complete (Do NOT Touch)

| Area | What Exists | Files |
|---|---|---|
| Tool-aware GrammarRules | 74 rules total (12 tool-agnostic + 62 tool-specific) | `src/utils/content-composer.ts` |
| `withSubModeFrame()` diversity | Step-specific reasoning with claim/pattern context | `src/utils/content-composer.ts` |
| Boilerplate Detection Gate | `isBoilerplate()` with 10 phrases, 60% threshold | `src/utils/content-composer.ts` |
| Pattern Registry Expansion | 280 patterns across 15+ domains including ethics-governance, ai-safety, geopolitics | `src/constants/patterns.ts` |
| Subject-Type Vocabulary | 4-type classification with explicit keyword lists | `src/utils/problem-structure.ts` |
| Output Size Management | `enforceCharacterLimit()` at 25,000 chars, executive soft limit at 5,000 | `src/utils/formatters.ts` |
| Output Mode Consistency | All 13 formatters support executive/analytical/exploratory | `src/utils/formatters.ts` |
| Scenario Crash Fix | `scenarios` array properly initialized before loop | `src/tools/scenario.ts` |
| Spectrum Duplication Fix | Single table render, no duplication | `src/tools/polarity.ts`, `src/utils/formatters.ts` |
| Navigator State Management | TTL enforcement, session cleanup, listing API, max 2 replans | `src/utils/state-manager.ts` |
| Build + Tests | `npm run build` clean, `npm run test` 18/18 passing | — |

### ❌ Gaps to Fill

| Gap | Severity | Estimated Effort |
|---|---|---|
| Phase 2: Structural Completeness (4 tools with empty sections) | **P0** | 4-6 hours |
| Phase 4.1: Confidence Score Calibration | **P1** | 1-2 hours |
| Phase 4.4: Psychograph Line Differentiation | **P1** | 1-2 hours |
| Phase 3.2: Non-Human Subject Strategy Adaptation | **P1** | 2-3 hours |
| Phase 5: File-based persistence for navigator | **P2** | 1-2 hours |
| Phase 5.3: Coverage-gap replanning trigger | **P2** | 1 hour |
| Phase 6: Integration/Regression/Performance tests | **P2** | 3-4 hours |

---

## Execution Order

```
Phase 2 (Structural Completeness) ──┐
                                      ├──→ Phase 4 (Quality + Confidence) ──┐
Phase 3 (Subject-Type Adaptation) ────┘                                    │
                                                                           ├──→ Phase 5 (Navigator Polish)
                                                                           ├──→ Phase 6 (Tests)
```

**Parallel Opportunities:** Phase 2 sub-phases (2.1-2.4) are fully independent. Phase 4.1 and 4.4 are independent.

---

## Phase 2: Structural Completeness (P0)

**Goal:** Every tool fills all its structural sections with meaningful content. No empty sections in any tool output.

### 2.1 Fix `think_aqal_situational` — Populate Strategies and 2nd Order Effects

**Files:** `src/tools/aqal-situational.ts`

**Current Bug:** All 4 quadrants have empty `Strategies:` and `2nd Order Effects:` sections because the tool passes empty arrays to the formatter.

**Fix:** Generate 3-5 strategies per quadrant using:
- **Intentional (UL):** Reflective practices, mindfulness protocols, identity narrative work, perspective-taking exercises
- **Behavioral (UR):** Skills training, habit formation, behavioral experiments, measurable intervention protocols
- **Cultural (LL):** Dialogue processes, shared meaning-making, cultural narrative reframing, community sense-making rituals
- **Social (LR):** Policy changes, structural reforms, resource reallocation, governance redesign

Generate 2+ 2nd order effects per quadrant by:
- Tracing causal chains from each strategy through the retrieved causal patterns
- Cross-quadrant ripple effects (e.g., behavioral change → cultural shift → structural adaptation)
- Subject-type awareness: non-human subjects get structural strategies, not psychological ones

**Success Criteria:**
- [ ] `think_aqal_situational` output has 3+ strategies per quadrant
- [ ] 2+ 2nd order effects per quadrant
- [ ] Strategies match the subject type (AI system → architectural strategies, not mindfulness)
- [ ] `npm run test` still passes

### 2.2 Fix `think_causal` — Populate Feedback Loops and Leverage Points

**Files:** `src/tools/causal.ts`

**Current Bug:** No actual causal relationships mapped, no feedback loops identified, no leverage points ranked.

**Fix:**
1. **Causal Relationship Generation:** Extract entities from input, generate causal relationships (A → B with polarity) using retrieved causal patterns as templates
2. **Graph-Theoretic Cycle Detection:** Implement DFS-based cycle detection on the causal graph to identify feedback loops. Classify as Reinforcing (R) or Balancing (B).
3. **Leverage Point Mapping:** Map retrieved leverage patterns to the problem structure. Rank by Meadows' 12 leverage points framework.
4. **Systems Archetype Integration:** Use existing `SYSTEMS_ARCHETYPES` from `src/constants.js` to detect and report active archetypes.

**Success Criteria:**
- [ ] 2+ feedback loops identified with R/B classification
- [ ] 5+ leverage points ranked with Meadows numbering
- [ ] At least 1 systems archetype detected when input matches patterns
- [ ] `npm run test` still passes

### 2.3 Fix `think_metacognitive` — Fill All 7 Ladder Rungs

**Files:** `src/tools/metacognitive.ts`

**Current Bug:** Only 1 of 7 Ladder of Inference rungs populated.

**Fix:** Generate content for all 7 rungs:
1. **Observable Data:** Extract factual, measurable elements from input
2. **Selected Data:** Identify what was focused on vs. ignored
3. **Interpreted Meaning:** Generate meaning assignments from retrieved assumption patterns
4. **Assumptions:** Surface implicit assumptions from the input reasoning chain
5. **Conclusions:** Generate the logical conclusions drawn
6. **Beliefs:** Identify the underlying belief systems that support the conclusions
7. **Actions:** Derive the actions/decisions that follow from the belief system

Each rung should reference the specific input content, not generic boilerplate.

**Success Criteria:**
- [ ] All 7 Ladder of Inference rungs filled with content
- [ ] Each rung references specific input elements
- [ ] Rungs build logically on each other (data → selection → interpretation → assumption → conclusion → belief → action)
- [ ] `npm run test` still passes

### 2.4 Fix `think_first_principles` — Unique Claim Classification

**Files:** `src/tools/first-principles.ts`

**Current Bug:** 6 identical claim rows, claims truncated mid-sentence, identical Socratic interrogations.

**Fix:**
1. **Claim Extraction:** Extract unique claims from input text (problem statement + current_beliefs). Use sentence boundary detection, not character slicing.
2. **Independent Classification:** Classify each claim using heuristic keywords:
   - Physical laws: "impossible", "fundamental", "law", "constant", "physics", "math"
   - Social conventions: "should", "norm", "standard", "tradition", "culture"
   - Contextual constraints: "currently", "resource", "budget", "time", "team"
   - Inherited assumptions: "always", "everyone", "never", "obviously", "naturally"
   - Logical necessities: "must", "necessarily", "implies", "contradiction"
3. **Full Claim Text:** No truncation — use complete claim sentences.
4. **Unique Socratic Interrogation:** Generate origin, evidence, and liberation analysis per claim based on its category and the retrieved patterns.

**Success Criteria:**
- [ ] Claim table has unique, non-duplicated claims
- [ ] No truncated text (no mid-sentence cutoffs)
- [ ] Each claim has independent Socratic interrogation
- [ ] Categories vary across the 5 claim types
- [ ] `npm run test` still passes

---

## Phase 3.2: Non-Human Subject Strategy Adaptation (P1)

**Goal:** When `subject_type !== 'human'`, replace psychological interventions with structural/architectural ones.

**Files:** `src/tools/aqal-situational.ts`, `src/tools/shadow.ts`, `src/tools/aqal-projection.ts`

**Changes:**
- Add `getStrategiesForSubjectType(subjectType, quadrant)` helper function
- For `ai-system`: Use training data bias mitigation, architectural constraint analysis, incentive alignment, capability governance
- For `organization`: Use process redesign, governance restructuring, incentive realignment, communication architecture
- For `technical-system`: Use architectural refactoring, API redesign, infrastructure scaling, observability improvement
- For `shadow.ts`: Replace Jungian/Freudian analysis with system shadow patterns (training data bias, architectural blind spots, incentive misalignment, capability overhang)

**Success Criteria:**
- [ ] AGI governance input classified as `ai-system` + `organization`
- [ ] `think_shadow` for AGI input produces system shadow analysis (not human psychology)
- [ ] `think_aqal_situational` strategies for non-human subjects are structural
- [ ] Explicit acknowledgment when frameworks are category-mismatched

---

## Phase 4: Confidence Calibration & Quality (P1)

### 4.1 Confidence Score Calibration

**Files:** `src/tools/sequential.ts`

**Current Bug:** All steps rated ~60-80% "High" confidence regardless of actual evidence.

**Fix:**
1. **Reduce base confidence per mode:**
   - analytical: 0.85 → 0.72
   - creative: 0.65 → 0.55
   - critical: 0.75 → 0.65
   - strategic: 0.70 → 0.58
2. **Force minimum variance:** At least one step must be below average confidence
3. **Tie confidence to pattern match quality:** Low pattern overlap = lower confidence
4. **Add explicit confidence justification:** Why this level, not higher/lower

**Success Criteria:**
- [ ] `think_sequential` confidence distribution shows meaningful variance (range > 20 percentage points)
- [ ] No two steps have identical confidence values unless input genuinely warrants it

### 4.4 Fix Psychograph Uniformity

**Files:** `src/tools/aqal-situational.ts`

**Current Bug:** All 7 developmental lines scored exactly 50% at exactly "Modern-Rational" with identical justification.

**Fix:** Differentiate line scores based on input signals:
- **Cognitive:** Driven by analytical complexity signals (entity count, relationship depth, claim specificity)
- **Emotional:** Driven by affective language signals (emotion words, intensity markers, stress indicators)
- **Moral:** Driven by normative/ethical language signals (should, must, right, wrong, justice, fairness)
- **Intrapersonal:** Driven by self-reflection signals
- **Interpersonal:** Driven by relationship/communication signals
- **Kinesthetic:** Driven by action/embodiment signals
- **Willpower:** Driven by commitment/discipline signals

Each line gets independent scoring with 15+ percentage point spread between highest and lowest.

**Success Criteria:**
- [ ] Psychograph line scores vary meaningfully across the 7 lines
- [ ] Minimum 15pp spread between highest and lowest line
- [ ] Each line has unique justification text

---

## Phase 5: Navigator Polish (P2)

### 5.2 File-Based Persistence (Optional Enhancement)

**Files:** `src/utils/state-manager.ts`

**Current:** In-memory Map with no persistence across server restarts.

**Enhancement:** Add file-based persistence option:
- JSON files in `.sessions/` directory
- Load sessions on server startup
- Save sessions on every update
- Configurable: enable/disable via environment variable

**Note:** This is optional. In-memory operation with TTL cleanup is production-sufficient for most use cases.

### 5.3 Coverage-Gap Replanning Trigger

**Files:** `src/utils/state-manager.ts`

**Current:** Re-plan triggers on low quality, contradictions, or no ready nodes.

**Enhancement:** Add coverage gap detection:
- If `diagnostic` nodes ≥ 4 but `prospective` nodes = 0 → trigger re-plan
- If any `thoughtType` has 0 nodes while others have ≥ 3 → flag coverage gap
- Re-plan to add missing thought types

**Success Criteria:**
- [ ] Re-planning triggers on coverage gaps
- [ ] Max 2 re-plans per session still enforced

---

## Phase 6: Integration Testing & Hardening (P2)

### 6.1 Domain-Specific Integration Tests

**New File:** `src/__tests__/integration.test.ts`

**Test Matrix:**

| Input Domain | Tools Tested | Validation |
|---|---|---|
| Software Architecture (microservices migration) | All 13 | Output references software concepts |
| AGI Governance (alignment, safety, policy) | All 13 | Output references AI/policy concepts |
| Organizational Change (team restructuring) | All 13 | Output references organizational concepts |
| Trivial Input ("Test") | All 13 | Graceful degradation, no crashes |

### 6.2 Template Regression Tests

**New File:** `src/__tests__/template-regression.test.ts`

**Tests:**
- No two calls with different inputs produce identical output
- Boilerplate phrases appear < 20% of total output
- All structural sections populated (no empty sections)
- Confidence scores vary meaningfully

### 6.3 Performance Benchmarks

**New File:** `src/__tests__/performance.test.ts`

**Thresholds:**
- `extractProblemStructure()` < 10ms
- `retrievePatterns()` < 5ms
- `composeStepContent()` < 5ms
- Total tool overhead < 25ms per call
- Memory usage < 50MB for 100 sequential tool calls

### 6.4 Build and CI

**File:** `package.json`

**Add:**
- `npm run lint` (if not present)
- `npm run test:integration` script
- `npm run test:performance` script

**Validation:** Clean build, all tests pass, no TypeScript errors.

---

## Total Effort Estimate

| Phase | Effort | Subagent Count | Parallelism |
|---|---|---|---|
| Phase 2 | 4-6 hours | 4 agents (2.1-2.4 independent) | Full parallel |
| Phase 3.2 | 2-3 hours | 2 agents (3.2a + 3.2b) | Full parallel |
| Phase 4 | 2-3 hours | 2 agents (4.1 + 4.4 independent) | Full parallel |
| Phase 5 | 1-2 hours | 1 agent (sequential) | Sequential |
| Phase 6 | 3-4 hours | 1 agent (4 sub-tests sequential) | Sequential |
| **Total** | **12-18 hours** | **10 agent invocations** | **Can compress to ~8 hours with parallelism** |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Structural generators produce verbose output | Medium | Low | Character limit enforcement controls output size |
| Cycle detection algorithm too slow for large graphs | Low | Medium | Limit graph size, use iterative DFS with depth cap |
| Confidence calibration makes scores too low | Medium | Medium | Validate with test inputs, adjust base confidence if needed |
| Breaking change during migration | Low | High | Hybrid mode preserves backward compatibility |
| Subagent produces incorrect code | Medium | High | Each phase has explicit validation criteria; verify with `npm run build && npm run test` |

---

## Definition of Done (Per Phase)

Each phase is complete when:
1. **Code changes committed** — all modified files in `src/`
2. **Build passes** — `npm run build` exits 0, no TypeScript errors
3. **Tests pass** — `npm run test` exits 0, no failures
4. **Manual validation** — each success criterion verified by running the affected tool(s)
5. **No regressions** — existing tools not affected by the phase continue to work

---

*This plan supersedes UPGRADE_PLAN.md and TOOL_ANALYSIS_REPORT.md. All findings from those documents have been incorporated into the current state assessment.*
