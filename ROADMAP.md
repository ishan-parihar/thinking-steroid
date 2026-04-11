# Thinking-Steroids MCP — Progressive Refactoring Roadmap

**Version:** 2.0  
**Date:** April 11, 2026  
**Scope:** Full-stack refactor of content generation pipeline + bug fixes + navigator enhancement  
**Execution Model:** Subagent-driven, progressive milestones, zero-breaking-change migrations  
**Total Phases:** 7 (6 implementation + 1 hardening)

---

## Current State Assessment

Based on production-grade stress testing of all 13 tools against a maximally complex AGI governance scenario and controlled edge-case inputs:

### Critical Findings (Fresh Testing)

| Severity | Issue | Status in Existing Plan | Root Cause |
|---|---|---|---|
| **P0** | `think_scenario` hard crash (`Cannot access 'scenarios' before initialization`) | Not documented | JavaScript ReferenceError in scenario.ts |
| **P0** | ALL tools produce 80-95% identical boilerplate text | Partially documented (as "template leakage") | Content composer's 12 GrammarRules are tool-agnostic; `withSubModeFrame()` appends identical suffixes |
| **P0** | `think_aqal_projection` injects software observability language into AGI governance analysis | Not documented | Pattern retrieval matches wrong domain when input lacks strong signals |
| **P1** | Every "Reasoning:" field across all tools = identical string: `"If the general principle holds..."` | Documented | `withSubModeFrame()` produces mode-subMode-specific text, not step-specific |
| **P1** | `think_aqal_situational` — Strategies and 2nd Order Effects sections empty for all 4 quadrants | Partially documented | Content composer returns short text that doesn't populate these slots |
| **P1** | `think_first_principles` — Claim table has 6 identical rows, claims truncated mid-sentence | Not documented | `composeFromRule()` reuses same slot-filler for all claims |
| **P1** | `think_metacognitive` — Only 1 of 7 Ladder of Inference rungs filled | Partially documented | Same composer limitation |
| **P2** | Confidence scores meaningless (all ~60% or ~80%, all lines exactly 50%) | Documented | Calibration formula doesn't vary meaningfully |
| **P2** | Integration spectrum table duplicated in `think_polarity` | Not documented | Rendering bug in formatter |
| **P2** | Output truncation at exhaustive depth even for valid requests | Documented | Boilerplate wastes token budget |

### Architecture Diagnosis (Confirmed)

The content generation pipeline has a **hybrid design with inverted priorities**:

```
Tool → composeToolContent() → extractProblemStructure() →
  retrievePatterns() → composeStepContent() →
  selectRule() → composeFromRule() → withSubModeFrame()
    ↓ (if output < 50 chars)
  Tool-specific fallback templates (DETAILED but RARELY ACTIVATED)
```

**The fatal flaw:** Tool-specific fallback templates ARE domain-aware and detailed, but they only activate when composer output is < 50 characters. The composer routinely exceeds 50 chars with generic boilerplate, bypassing the good code entirely.

---

## Execution Philosophy

1. **Zero breaking changes** — each phase is additive; existing tool behavior is preserved until explicitly replaced
2. **Subagent-delegable** — each milestone has atomic scope, clear file boundaries, and specific success criteria
3. **Progressive validation** — build + test after every phase; no phase depends on future work
4. **Invert the priority** — tool-specific intelligence FIRST, composer enhancement SECOND
5. **Fix crashes before features** — P0 bugs block all other value

---

## Phase 0: Emergency Triage (P0 Bug Fixes)

**Goal:** Make all 13 tools non-crashing and non-duplicative.  
**Category:** `quick`  
**Skills:** `systematic-debugging`  
**Estimated Effort:** 2-3 hours  
**Files:** `src/tools/scenario.ts`, `src/utils/content-composer.ts`

### 0.1 Fix `think_scenario` Hard Crash
- **File:** `src/tools/scenario.ts`
- **Bug:** `ReferenceError: Cannot access 'scenarios' before initialization`
- **Root Cause:** Variable declared with `const` or `let` used before assignment in scenario generation loop
- **Fix:** Identify the `scenarios` variable declaration, ensure it's initialized before first use (hoist declaration or reorder assignment)
- **Validation:** Tool returns valid markdown without throwing for any input

### 0.2 Fix Integration Spectrum Duplication in `think_polarity`
- **File:** `src/tools/polarity.ts` or `src/utils/formatters.ts`
- **Bug:** 16-row × 4-level table rendered twice in output
- **Fix:** Locate the duplicate `mdTable()` or template interpolation call and remove the second invocation
- **Validation:** Table appears exactly once

### 0.3 Invert Content Priority — Tool Templates as Primary
- **File:** Each tool's handler (all 13 files in `src/tools/`)
- **Change:** Raise the fallback threshold from 50 chars to a meaningful value OR invert the logic:
  - **Option A (Recommended):** Raise threshold to 200 chars AND add a content quality check (reject output that is >60% boilerplate phrases)
  - **Option B:** Invert priority — call tool-specific template generators FIRST, then enhance with composer output where available
- **Files Affected:** All 13 tool files that call `composeToolContent()`
- **Validation:** Each tool now produces visibly different output for different inputs

### Success Criteria
- [ ] `think_scenario` returns valid output for any valid input
- [ ] No duplicated tables in any tool output
- [ ] `think_sequential` with input "Test" produces different output than `think_sequential` with AGI governance input
- [ ] `npm run build` passes
- [ ] `npm run test` passes

---

## Phase 1: Content Composer Rewrite (Core Engine)

**Goal:** Replace the 12 tool-agnostic GrammarRules with tool-aware, domain-scoped content generation.  
**Category:** `deep`  
**Skills:** `writing-skills`  
**Estimated Effort:** 6-8 hours  
**Files:** `src/utils/content-composer.ts`, `src/utils/content-pipeline.ts`, `src/constants/patterns.ts`

### 1.1 Make Grammar Rules Tool-Aware
- **File:** `src/utils/content-composer.ts`
- **Change:** Add `toolName` to `CompositionContext` and `GrammarRule` interface
- **New Rule Selection:** Filter rules by `toolName` AND `thoughtType` AND `mode` AND `stepRange`
- **Effect:** `think_sequential` gets sequential-specific rules; `think_causal` gets causal-specific rules
- **Rule Count:** Expand from 12 to 60+ rules (5+ per tool minimum)

### 1.2 Fix `withSubModeFrame()` Reasoning Diversity
- **File:** `src/utils/content-composer.ts`
- **Current Bug:** Every deductive step gets identical `"If the general principle holds..."` suffix
- **Fix:** Generate step-specific reasoning frames by incorporating:
  - The specific claim being made
  - The patterns retrieved for this step
  - Previous step conclusions (for sequential tools)
  - Tool-specific reasoning methodology descriptions

### 1.3 Expand Pattern Registry
- **File:** `src/constants/patterns.ts`
- **Current:** 26 causal + 22 assumption + 17 shadow + 14 leverage patterns (mostly software/organizational)
- **Target:** 50+ causal + 40+ assumption + 30+ shadow + 40+ leverage across 10+ domains
- **New Domains to Add:** `ethics-governance` (for AGI scenarios), `technology-policy`, `geopolitics`, `ai-safety`, `philosophy-epistemology`
- **Validation:** Pattern retrieval returns domain-relevant patterns for the AGI governance test input

### 1.4 Add Boilerplate Detection Gate
- **File:** `src/utils/content-composer.ts`
- **New Function:** `isBoilerplate(text: string): boolean`
- **Detection:** Flag output containing >60% of these phrases:
  - "Taken together, the evidence supports"
  - "If the general principle holds in this specific context"
  - "What the system cannot see about itself"
  - "A high-leverage intervention (Meadows rank N/A)"
  - "rests on the assumption that the underlying premise holds"
- **Action:** If detected, force fallback to tool-specific templates

### Success Criteria
- [ ] `selectRule()` returns different rules for different tools at the same step number
- [ ] No two "Reasoning:" fields in `think_sequential` output are identical
- [ ] Pattern retrieval for AGI governance input returns ethics-governance and ai-safety domain patterns
- [ ] Boilerplate detection correctly flags generic output
- [ ] All tools produce >50% unique content when given domain-specific inputs

---

## Phase 2: Structural Completeness (Empty Sections)

**Goal:** Every tool fills all its structural sections with meaningful content.  
**Category:** `deep`  
**Skills:** `writing-skills`  
**Estimated Effort:** 4-6 hours  
**Files:** `src/tools/aqal-situational.ts`, `src/tools/causal.ts`, `src/tools/hierarchical.ts`, `src/tools/metacognitive.ts`, `src/tools/first-principles.ts`

### 2.1 Fix `think_aqal_situational` — Populate Strategies and 2nd Order Effects
- **File:** `src/tools/aqal-situational.ts`
- **Current:** All 4 quadrants have empty `Strategies:` and `2nd Order Effects:` sections
- **Fix:** Generate 3-5 strategies per quadrant using:
  - Quadrant-specific intervention types (Intentional → reflective practices, Behavioral → skills training, Cultural → dialogue processes, Social → policy changes)
  - Subject-type awareness (non-human subjects get structural, not psychological, strategies)
  - Pattern-derived 2nd order effects from causal patterns

### 2.2 Fix `think_causal` — Populate Feedback Loops and Leverage Points
- **File:** `src/tools/causal.ts`
- **Current:** No actual causal relationships mapped, no feedback loops identified, no leverage points ranked
- **Fix:** 
  - Generate actual causal relationships from extracted entities (entity A → entity B with polarity)
  - Implement graph-theoretic cycle detection for feedback loops
  - Map retrieved leverage patterns to problem structure

### 2.3 Fix `think_metacognitive` — Fill All 7 Ladder Rungs
- **File:** `src/tools/metacognitive.ts`
- **Current:** Only 1 of 7 Ladder of Inference rungs populated
- **Fix:** Generate content for all 7 rungs: observable-data → selected-data → interpreted-meaning → assumptions → conclusions → beliefs → actions

### 2.4 Fix `think_first_principles` — Unique Claim Classification
- **File:** `src/tools/first-principles.ts`
- **Current:** 6 identical claim rows, claims truncated mid-sentence
- **Fix:** 
  - Extract unique claims from input text (problem statement + current_beliefs)
  - Classify each claim independently using heuristic keywords
  - Ensure full claim text (no truncation)
  - Generate unique Socratic interrogation per claim

### Success Criteria
- [ ] `think_aqal_situational` has 3+ strategies and 2+ 2nd order effects per quadrant
- [ ] `think_causal` identifies 2+ feedback loops and ranks 5+ leverage points
- [ ] `think_metacognitive` fills all 7 Ladder of Inference rungs
- [ ] `think_first_principles` claim table has unique, non-truncated claims
- [ ] No structural section is empty across any tool

---

## Phase 3: Subject-Type Awareness

**Goal:** Tools adapt their analysis based on whether the subject is human, AI, organization, or technical system.  
**Category:** `deep`  
**Skills:** `writing-skills`  
**Estimated Effort:** 4-5 hours  
**Files:** `src/utils/problem-structure.ts`, `src/tools/aqal-situational.ts`, `src/tools/shadow.ts`, `src/tools/aqal-projection.ts`

### 3.1 Enhance Subject-Type Classification
- **File:** `src/utils/problem-structure.ts`
- **Current:** Heuristic keyword matching for subject classification
- **Enhancement:** Add explicit subject-type vocabulary lists:
  - `ai-system`: AGI, model, alignment, training, inference, capability, weights, parameters, transformer
  - `organization`: team, company, department, governance, regulatory, policy, institutional
  - `technical-system`: API, service, database, infrastructure, deployment, pipeline
  - `human`: person, individual, psychology, belief, emotion, behavior, identity
- **Output:** Confidence-scored multi-type classification (e.g., { ai-system: 0.7, organization: 0.3 })

### 3.2 Adapt Tool Strategies by Subject Type
- **Files:** `src/tools/aqal-situational.ts`, `src/tools/shadow.ts`, `src/tools/aqal-projection.ts`
- **Change:** When `subject_type !== 'human'`:
  - Replace psychological interventions with structural/architectural ones
  - For Shadow: use system shadow patterns (training data bias, architectural constraints, incentive misalignment) instead of Jungian/Freudian analysis
  - For AQAL Projection: use technical deviation risks instead of psychological resistance patterns

### Success Criteria
- [ ] AGI governance input classified as `ai-system` + `organization` (not `human`)
- [ ] `think_shadow` for AGI input produces system shadow analysis (not human psychology)
- [ ] `think_aqal_situational` strategies for non-human subjects are structural, not behavioral
- [ ] Explicit acknowledgment when frameworks are category-mismatched for the subject

---

## Phase 4: Confidence Calibration and Output Quality

**Goal:** Meaningful confidence scoring, output size management, and output mode consistency.  
**Category:** `quick` + `deep` (mixed)  
**Skills:** `systematic-debugging`  
**Estimated Effort:** 3-4 hours  
**Files:** `src/utils/formatters.ts`, `src/tools/sequential.ts`, `src/tools/polarity.ts`, `src/tools/aqal-projection.ts`, `src/constants.ts`

### 4.1 Confidence Score Calibration
- **File:** `src/tools/sequential.ts`
- **Current:** All steps rated ~60-80% "High" confidence regardless of actual evidence
- **Fix:**
  - Reduce base confidence per mode: analytical 0.85→0.72, creative 0.65→0.55, critical 0.75→0.65, strategic 0.70→0.58
  - Force minimum variance: at least one step below average confidence
  - Tie confidence to pattern match quality (low pattern overlap = lower confidence)
  - Add explicit confidence justification (why this level, not higher/lower)

### 4.2 Output Size Management
- **File:** `src/utils/formatters.ts`
- **Current:** `think_polarity` and `think_aqal_projection` produce 47-66KB outputs that get truncated
- **Fix:**
  - Enforce `CHARACTER_LIMIT` (25,000) in all formatters
  - In `executive` mode: truncate to 2-sentence summaries per section
  - Implement progressive disclosure markers: `[DETAIL: <section-id>]` for follow-up queries
  - In `concise` mode (new parameter): skip integration spectrum, cross-quadrant dynamics

### 4.3 Output Mode Consistency
- **Files:** All 13 tool files
- **Current:** Not all tools respect `output_mode` consistently
- **Fix:** Standardize behavior:
  - `executive`: 2-sentence summaries, no tables, key conclusions only
  - `analytical`: Full output (current default behavior)
  - `exploratory`: Full output + open questions section

### 4.4 Fix Psychograph Uniformity
- **File:** `src/tools/aqal-situational.ts`
- **Current:** All 7 developmental lines scored exactly 50% at exactly "Modern-Rational" with identical justification
- **Fix:** Differentiate line scores based on input signals:
  - Cognitive: driven by analytical complexity signals
  - Emotional: driven by affective language signals
  - Moral: driven by normative/ethical language signals
  - Each line gets independent scoring

### Success Criteria
- [ ] `think_sequential` confidence distribution shows meaningful variance (range > 20 percentage points)
- [ ] No tool output exceeds 25,000 characters
- [ ] `executive` mode output is < 5,000 characters for all tools
- [ ] Psychograph line scores vary meaningfully across the 7 lines

---

## Phase 5: Navigator Enhancement

**Goal:** Make `think_navigator` production-ready with state persistence and re-planning.  
**Category:** `deep`  
**Skills:** `writing-skills`  
**Estimated Effort:** 4-5 hours  
**Files:** `src/tools/navigator.ts`, `src/utils/state-manager.ts`

### 5.1 Verify DAG Construction
- **File:** `src/tools/navigator.ts`
- **Validation:** Test that DAG dependencies are correct (diagnostic before synthetic, deconstructive before relational)
- **Fix:** Any circular dependencies or missing prerequisite nodes

### 5.2 Enhance State Persistence
- **File:** `src/utils/state-manager.ts`
- **Current:** In-memory Map with no TTL management
- **Enhancement:**
  - Add configurable TTL (default 30 minutes)
  - Add session cleanup (garbage collection of expired sessions)
  - Add file-based persistence option for production (JSON files in `.sessions/`)
  - Add session listing API (what sessions are active?)

### 5.3 Improve Re-planning Logic
- **File:** `src/utils/state-manager.ts`
- **Current:** Basic replan trigger on `replanCount`
- **Enhancement:**
  - Re-plan when coverage gaps detected (e.g., 4 diagnostic nodes, 0 prospective)
  - Re-plan when node quality < 0.5
  - Re-plan when contradiction between completed nodes detected
  - Limit re-plan depth (max 2 re-plans per session)

### Success Criteria
- [ ] Navigator produces valid DAGs with no circular dependencies
- [ ] Parallel groups correctly identified (no mutual dependencies within group)
- [ ] Session TTL enforced (expired sessions cleaned up)
- [ ] Re-planning triggers on coverage gaps and low-quality nodes
- [ ] `npm run test` passes (existing navigator tests)

---

## Phase 6: Integration Testing and Hardening

**Goal:** End-to-end validation across all tools with domain-specific test cases.  
**Category:** `deep`  
**Skills:** `writing-skills`, `systematic-debugging`  
**Estimated Effort:** 4-5 hours  
**Files:** `src/__tests__/` (new test files)

### 6.1 Domain-Specific Integration Tests
- **New Files:** `src/__tests__/integration.test.ts`
- **Test Matrix:**

| Input Domain | Tools Tested | Validation |
|---|---|---|
| Software Architecture (microservices migration) | All 13 | Output references software concepts, not generic text |
| AGI Governance (alignment, safety, policy) | All 13 | Output references AI/policy concepts, not generic text |
| Organizational Change (team restructuring) | All 13 | Output references organizational concepts |
| Trivial Input ("Test") | All 13 | Graceful degradation, no crashes, acknowledges low signal |

### 6.2 Template Regression Tests
- **New File:** `src/__tests__/template-regression.test.ts`
- **Tests:**
  - No two calls with same input produce identical output (except deterministic tools)
  - Boilerplate phrases appear < 20% of total output
  - All structural sections populated (no empty sections)
  - Confidence scores vary meaningfully

### 6.3 Performance Benchmarks
- **New File:** `src/__tests__/performance.test.ts`
- **Thresholds:**
  - `extractProblemStructure()` < 10ms
  - `retrievePatterns()` < 5ms
  - `composeStepContent()` < 5ms
  - Total tool overhead < 25ms per call
  - Memory usage < 50MB for 100 sequential tool calls

### 6.4 Build and CI
- **File:** `package.json`
- **Add:** `npm run lint` (if not present), `npm run test:integration`
- **Validation:** Clean build, all tests pass, no TypeScript errors

### Success Criteria
- [ ] All integration tests pass across 4 domain inputs × 13 tools = 52 test cases
- [ ] Template regression tests confirm < 20% boilerplate
- [ ] Performance benchmarks within thresholds
- [ ] `npm run test` passes with 0 failures
- [ ] `npm run build` produces clean `dist/` with 0 TypeScript errors

---

## Execution Order and Dependencies

```
Phase 0 (Emergency)  ──────────────┐
                                     ├──→ Phase 1 (Composer Rewrite) ──┐
Phase 0 (Emergency)  ──────────────┘                                    │
                                                                        ├──→ Phase 2 (Structural Completeness)
Phase 1 (Composer) ────────────────────────────────────────────────────┤│
                                                                        ├──→ Phase 3 (Subject-Type Awareness)
Phase 2 (Structural) ──────────────────────────────────────────────────┤│
                                                                        ├──→ Phase 4 (Confidence & Quality)
Phase 3 (Subject-Type) ────────────────────────────────────────────────┤│
                                                                        ├──→ Phase 5 (Navigator)
Phase 4 (Quality) ─────────────────────────────────────────────────────┘│
                                                                        │
Phase 5 (Navigator) ────────────────────────────────────────────────────┘
                                                                        │
Phase 6 (Integration & Hardening) ← ALL PHASES MUST BE COMPLETE ────────┘
```

**Parallel Execution Opportunities:**
- Phase 0.1 (scenario crash) and Phase 0.2 (duplication) are independent → can run simultaneously
- Phase 1.1 (tool-aware rules) and Phase 1.3 (pattern expansion) are independent → can run simultaneously
- Phase 3 (subject-type) and Phase 4 (confidence calibration) are independent → can run simultaneously after Phase 2

---

## Subagent Delegation Matrix

| Phase | Category | Skills | Agent Prompt Template | Validation Method |
|---|---|---|---|---|
| 0.1 | `quick` | `systematic-debugging` | "Fix ReferenceError in scenario.ts: `Cannot access 'scenarios' before initialization`. Find the `scenarios` variable, trace its declaration and usage, fix ordering." | Run tool, verify no crash |
| 0.2 | `quick` | `systematic-debugging` | "Fix duplicated integration spectrum table in polarity output. Table appears twice. Find duplicate rendering call in polarity.ts or formatters.ts." | Run tool, verify single table |
| 0.3 | `deep` | `writing-skills` | "Invert content priority across all 13 tools: tool-specific templates should be primary, composer enhancement secondary. Raise fallback threshold from 50 to 200 chars. Add boilerplate detection." | Compare outputs for 2 different inputs |
| 1.1 | `deep` | `writing-skills` | "Make GrammarRules in content-composer.ts tool-aware. Add toolName to CompositionContext. Expand from 12 to 60+ rules (5+ per tool). Each tool gets unique rule sets." | Verify selectRule() returns different rules per tool |
| 1.2 | `deep` | `writing-skills` | "Fix withSubModeFrame() to generate step-specific reasoning, not identical suffixes. Incorporate claim text, retrieved patterns, and previous step conclusions." | No two reasoning fields identical in sequential output |
| 1.3 | `deep` | `writing-skills` | "Expand patterns.ts to 50+ causal, 40+ assumption, 30+ shadow, 40+ leverage patterns. Add domains: ethics-governance, technology-policy, geopolitics, ai-safety, philosophy-epistemology." | Pattern retrieval returns domain-relevant patterns |
| 1.4 | `quick` | `systematic-debugging` | "Add isBoilerplate() detection gate to content-composer.ts. Flag output with >60% boilerplate phrases. Force fallback to tool templates when detected." | Boilerplate output triggers fallback |
| 2.1 | `deep` | `writing-skills` | "Fix think_aqal_situational: populate Strategies (3-5 per quadrant) and 2nd Order Effects (2+ per quadrant). Subject-type aware." | No empty sections in AQAL output |
| 2.2 | `deep` | `writing-skills` | "Fix think_causal: generate actual causal relationships, implement cycle detection for feedback loops, map leverage patterns." | 2+ feedback loops, 5+ ranked leverage points |
| 2.3 | `deep` | `writing-skills` | "Fix think_metacognitive: fill all 7 Ladder of Inference rungs with content derived from input reasoning chain." | All 7 rungs populated |
| 2.4 | `deep` | `writing-skills` | "Fix think_first_principles: unique claim classification, no truncation, unique Socratic interrogation per claim." | Unique claims, no duplicates |
| 3.1 | `quick` | `systematic-debugging` | "Enhance subject-type classification in problem-structure.ts with explicit vocabulary lists for ai-system, organization, technical-system, human." | AGI input classified correctly |
| 3.2 | `deep` | `writing-skills` | "Adapt tool strategies by subject type. Non-human subjects get structural/architectural strategies, not psychological ones." | Shadow analysis for AI input is system-focused |
| 4.1 | `quick` | `systematic-debugging` | "Calibrate confidence scores: reduce base confidence per mode, force minimum variance, tie to pattern match quality." | Confidence range > 20pp |
| 4.2 | `quick` | `systematic-debugging` | "Enforce 25,000 char limit in formatters. Add executive mode truncation. Add progressive disclosure markers." | No output exceeds limit |
| 4.3 | `quick` | `systematic-debugging` | "Standardize output_mode across all 13 tools: executive=2-sentence summaries, analytical=full, exploratory=full+questions." | Mode behavior consistent |
| 4.4 | `quick` | `systematic-debugging` | "Fix psychograph uniformity: differentiate line scores based on input signals, not all 50%." | Line scores vary |
| 5.1 | `deep` | `writing-skills` | "Verify and fix navigator DAG construction: correct dependencies, no circular refs, valid parallel groups." | Valid DAGs for 3 test inputs |
| 5.2 | `deep` | `writing-skills` | "Enhance state-manager: configurable TTL, session cleanup, file-based persistence option, session listing API." | Sessions expire, cleanup works |
| 5.3 | `deep` | `writing-skills` | "Improve re-planning: coverage gaps, low-quality nodes, contradiction detection, max 2 re-plans." | Re-planning triggers correctly |
| 6.1-6.4 | `deep` | `systematic-debugging` | "Create integration test suite: 4 domains × 13 tools, template regression, performance benchmarks, build validation." | All tests pass |

---

## Total Effort Estimate

| Phase | Effort | Subagent Count | Sequential or Parallel |
|---|---|---|---|
| Phase 0 | 2-3 hours | 2 agents (0.1+0.2 parallel, then 0.3) | Partial parallel |
| Phase 1 | 6-8 hours | 4 agents (1.1+1.3 parallel, then 1.2, then 1.4) | Partial parallel |
| Phase 2 | 4-6 hours | 4 agents (2.1-2.4 independent) | Full parallel |
| Phase 3 | 4-5 hours | 2 agents (3.1+3.2 independent) | Full parallel |
| Phase 4 | 3-4 hours | 4 agents (4.1-4.4 independent) | Full parallel |
| Phase 5 | 4-5 hours | 3 agents (5.1-5.3 sequential) | Sequential |
| Phase 6 | 4-5 hours | 1 agent (4 sub-tests sequential) | Sequential |
| **Total** | **27-36 hours** | **20 agent invocations** | **Can compress to ~18 hours with parallelism** |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pattern expansion insufficient for new domains | Medium | High | Start with 3 well-populated domains, validate before expanding |
| Grammar rules still produce generic text | Medium | Medium | Boilerplate detection gate (1.4) catches this; iterate rules |
| Tool-specific templates too verbose | Low | Medium | Character limit enforcement (4.2) controls output size |
| Breaking change in tool output format during migration | Low | High | Hybrid mode preserves backward compatibility |
| Navigator state leaks across sessions | Low | Medium | TTL enforcement + session cleanup (5.2) |
| Subagent hallucinates incorrect code changes | Medium | High | Each phase has explicit validation criteria; verify with `npm run build && npm run test` |

---

## Definition of Done (Per Phase)

Each phase is complete when:
1. **Code changes committed** — all modified files in `src/`
2. **Build passes** — `npm run build` exits 0, no TypeScript errors
3. **Tests pass** — `npm run test` exits 0, no failures
4. **Manual validation** — each success criterion from the phase verified by running the affected tool(s)
5. **No regressions** — existing tools not affected by the phase continue to work

---

## Post-Roadmap: Future Enhancements (v2.1+)

Not in scope for this roadmap, but identified for future work:

1. **LLM-assisted pattern bootstrapping** — offline script to generate initial pattern library using Ollama/local model
2. **Real-time pattern learning** — tool outputs feed back into pattern registry for continuous improvement
3. **Multi-modal input support** — accept structured JSON inputs in addition to text
4. **Custom domain registration** — allow users to register their own domain vocabularies and patterns
5. **Streaming output** — for large outputs, stream sections rather than buffering full response
6. **Caching layer** — cache pattern retrieval results for identical inputs to reduce latency

---

*Roadmap synthesized from: (1) Production stress test of all 13 tools, (2) Existing UPGRADE_PLAN.md, (3) TOOL_ANALYSIS_REPORT.md, (4) Complete codebase architecture map.*
