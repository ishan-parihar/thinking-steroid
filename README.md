# Thinking Modes MCP Server 🧠

<!-- T2I HERO SPEC — Subject: a neural crown of thinking modes — 13 radiating cognitive lenses around a central brain (dialectical tension map, causal loop, Cynefin grid, polarity compass, shadow mirror, unity sphere…), each lens casting structured-reasoning beams into a decision point. Composition: hub-and-spoke cognitive mandala, one beam resolving into a clean answer node. Palette: deep indigo #1e1b4b → violet #8b5cf6 lenses → gold #f59e0b resolution beam. Style: dark scientific flat vector, precise geometry, no text. 16:9. -->

**The Epistemic Operating System for AI Agents.**

[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
![LOC](https://img.shields.io/badge/LOC-25.0K-informational?style=flat-square)
[![CI](https://github.com/ishan-parihar/thinking-steroid/actions/workflows/ci.yml/badge.svg)](https://github.com/ishan-parihar/thinking-steroid/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/runtime-Bun-black.svg)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/Protocol-MCP-purple.svg)](https://modelcontextprotocol.io/)
[![Zod](https://img.shields.io/badge/Validation-Zod-blue)](https://zod.dev/)
[![Tests](https://img.shields.io/badge/tests-13%20modes-brightgreen)]()

`Thinking Modes` is a specialized MCP server that provides AI agents with a structured library of **Cognitive Modalities**. Rather than relying on the LLM's default (and often biased) reasoning path, this server forces the agent to adopt specific, mathematically and psychologically grounded thinking frameworks.

It transforms the agent from a "next-token predictor" into a **Structured Reasoner**, capable of dialectical tension mapping, causal loop analysis, and multi-system synthesis.

---

## 🚩 The Problem: The "Reasoning Flatland"
Standard LLM reasoning is often a linear "stream of consciousness." Even with "Chain-of-Thought," agents suffer from **Conclusion Jumping** (skipping alternatives), **Confirmation Bias** (selective evidence gathering), and **Synthesis Blindness** (ignoring dialectical tensions). Most critically, agents apply a "one-size-fits-all" reasoning path regardless of whether the problem is "Clear" (linear) or "Complex" (emergent). The challenge was to move beyond prompt-based guidance and implement **hard cognitive constraints** that force the agent into specific, mathematically and psychologically grounded reasoning topologies.


## 💡 The Solution: Forced Cognitive Modalities

`Thinking Modes` provides 13 precision tools that act as **Reasoning Constraints**. By invoking a tool, the agent is forced to structure its output according to a specific epistemic framework.

### The Modality Catalog
- **Sequential Reasoning**: Forces claims to confidence to assumptions to counter-arguments.
- **Polarity Mapping**: Maps dialectical tensions to prevent premature synthesis.
- **AQAL Analysis**: A 4-quadrant holistic view (Individual/Collective x Interior/Exterior).
- **Causal Loop Analysis**: Maps feedback loops (R/B) and identifies high-leverage intervention points.
- **Cynefin Classification**: A meta-tool that classifies the problem domain (Clear, Complicated, Complex, Chaotic) to determine *which other tools* to use.
- **First-Principles Decomposition**: Strips a problem down to its irreducible physical or logical facts.
- **Shadow Work**: A Jungian-inspired framework for detecting blind spots and unconscious biases.
- **Unity Synthesis**: The terminal tool that integrates multiple disparate analyses into a single, coherent truth.

### Full Tool Reference (13 Tools)

| Tool | MCP Name | Framework | What It Forces |
|------|----------|-----------|-----------------|
| **Sequential** | `think_sequential` | Linear reasoning | Claim, confidence, assumptions, steel-manned counter-argument per step |
| **Polarity** | `think_polarity` | Dialectical | 9-row polarity table (Rewards, Overemphasis, Neglect Risks, Circular Loops) |
| **AQAL Projection** | `think_aqal_projection` | Integral (temporal) | 4 quadrants x 3 time horizons (Short, Mid, Long-term) |
| **AQAL Situational** | `think_aqal_situational` | Integral (spatial) | Intentional, Behavioral, Cultural, Social dimensions |
| **Causal** | `think_causal` | Systems thinking | Feedback loops (R/B), leverage points, system archetypes |
| **Cynefin** | `think_cynefin` | Sense-making | Clear, Complicated, Complex, Chaotic, Disorder classification |
| **First-Principles** | `think_first_principles` | Decomposition | Axioms, bypassed assumptions, rebuild from ground truth |
| **Hierarchical** | `think_hierarchical` | Multi-level | Observable behaviors mapped across abstraction layers |
| **Metacognitive** | `think_metacognitive` | Self-audit | Cognitive bias detection: severity (none/mild/moderate/severe) |
| **Navigator** | `think_navigator` | DAG orchestration | Cultural indicators, reasoning DAG construction |
| **Scenario** | `think_scenario` | Scenario planning | Archetypal narratives, pre-mortem failure modes |
| **Shadow** | `think_shadow` | Jungian | Defense patterns, developmental blind spots, integration |
| **Unity** | `think_unity` | Integral synthesis | LoDS, LiDS, SoCS, DriS, QuaS, ShWS integration |

### Why Cognitive Modes?

Standard LLM reasoning is a linear "stream of consciousness" that suffers from three structural failures:

1. **Conclusion Jumping**: The model commits to a thesis before exploring the antithesis
2. **Confirmation Bias**: Once committed, the model selectively gathers supporting evidence
3. **Synthesis Blindness**: The model cannot hold dialectical tension, collapsing to premature either/or

Thinking Modes solves this by **hard-coding the reasoning topology into the tool schema**. When an agent calls `think_polarity`, it is structurally impossible to produce output without mapping both sides of the tension. The Zod-validated schema forces completeness at the protocol level, not the prompt level.

This is the difference between *asking* an LLM to "think carefully" and *forcing* it to fill out a 9-row polarity table with explicit rewards, overemphasis feedback, and circular causal loops.

### Usage Example

```typescript
// Agent calls think_cynefin first to classify the problem
const domain = await client.callTool("think_cynefin", {
  situation: "Our microservices architecture has cascading failures",
  // Cynefin classifies this as COMPLEX
});

// Agent then calls think_causal based on the classification
const analysis = await client.callTool("think_causal", {
  situation: "Cascading failures in microservices",
  variables: ["service timeout", "retry storms", "circuit breaker state"],
  // Produces R/B feedback loops and leverage points
});

// Agent calls think_unity to synthesize
const synthesis = await client.callTool("think_unity", {
  analyses: [domain, analysis],
  // Integrates into a single coherent truth
});
```


---

## How it compares

| Capability | **Thinking Modes** | Raw "think harder" prompting | LangChain chains | Other MCP reasoning tools |
|---|---|---|---|---|
| **Forced reasoning topologies** | ✅ 13 modes as hard constraints (DAG-orchestrated) | ❌ LLM chooses (often shallow) | ⚠️ linear chains | ⚠️ few |
| **Epistemic status tracking** | ✅ every claim carries a status | ❌ | ❌ | ❌ |
| **Dialectical / causal / Cynefin / AQAL tooling** | ✅ dedicated tools | ❌ | ⚠️ | ⚠️ |
| **Shadow work + polarity maps** | ✅ | ❌ | ❌ | ❌ |
| **Deterministic orchestration** | ✅ DAG-based reasoning graph | ❌ | ✅ | ⚠️ |
| **Agent-native MCP surface** | ✅ 13 tools, JSON Schema | n/a | n/a | ✅ |

Thinking Modes doesn't *suggest* better thinking — it *forces* a specific, mathematically grounded framework per task, so the agent cannot fall back to its default reasoning path.

## ✨ Engineering Highlights

### Reasoning Topology as a Constraint
Rather than providing optional hints, this server implements **Hard Modality Constraints**. By structuring tools as rigid topologies (e.g., the 4-quadrant AQAL situational map or Causal Loop feedback patterns), I force the LLM to occupy a specific epistemic space. This prevents the agent from reverting to linear "next-token" prediction and ensures that critical dimensions of a problem—such as dialectical tension or systemic leverage points—are explicitly mapped.

### DAG-Based Reasoning Orchestration
With the implementation of `think_navigator`, the server evolves from a tool library into a **Cognitive Orchestrator**. It allows agents to construct a Directed Acyclic Graph (DAG) of reasoning steps, where the output of a "First Principles" decomposition feeds into a "Causal Loop" analysis. This provides a persistable and auditable reasoning chain, enabling the agent to track dependencies and execute parallel cognitive paths.

### Epistemic Status Framework
To combat hallucination, I implemented an **Epistemic Status Layer**. Every tool output is tagged with a confidence marker (`well-supported`, `tentative`, `speculative`). This creates a meta-layer of certainty, forcing the agent to explicitly label its own speculation and allowing downstream tools (like `think_metacognitive`) to audit the reasoning chain for gaps in evidence.


---

## 🌌 Potentialities & Future Scope

`Thinking Modes` is a prototype for **Cognitive Architecture**:

- **Recursive Reasoning**: An agent that uses `think_metacognitive` to audit its own `think_sequential` output, iteratively refining its truth-claim.
- **Autonomous Modality Selection**: A system where the agent automatically invokes the correct thinking mode based on the detected problem domain (via `think_cynefin`).
- **Epistemic Mapping**: Generating a visual map of "Certainty" across a complex project, highlighting exactly where the agent is speculating versus where it has hard data.

---

## 🚀 Quick Start

### Installation
```bash
git clone https://github.com/ishan-parihar/thinking-steroid.git
cd thinking-steroid
npm install
npm run build
```

### MCP Configuration
Add to your `claude_desktop_config.json`:
```json
"mcpServers": {
  "thinking-modes": {
    "command": "node",
    "args": ["/path/to/thinking-steroid/dist/index.js"]
  }
}
```

## 🛠 Tech Stack
- **Language**: TypeScript
- **Runtime**: Bun / Node.js
- **Protocol**: MCP (Model Context Protocol)
- **Validation**: Zod


### DAG-Based Reasoning Orchestration

The `think_navigator` tool elevates the server from a tool library into a **Cognitive Orchestrator**. Agents construct a Directed Acyclic Graph (DAG) of reasoning steps:

1. Call `think_cynefin` to classify the problem domain
2. Based on domain, call `think_causal` (Complex) or `think_sequential` (Clear)
3. Feed both outputs into `think_unity` for synthesis
4. Run `think_metacognitive` to audit the entire chain for bias gaps

Each step's output is a structured JSON object that feeds into the next tool's input schema. This creates an auditable, persistable reasoning chain, not a one-shot prompt.

### Epistemic Status Framework

Every tool output is tagged with a confidence marker:
- `well-supported`: grounded in evidence or first principles
- `tentative`: plausible but incomplete
- `speculative`: hypothesis or extrapolation

This meta-layer forces the agent to explicitly label its own speculation. Downstream tools (like `think_metacognitive`) audit the reasoning chain for gaps between `well-supported` and `speculative` markers.

### Integration with Claude Desktop

```json
{
  "mcpServers": {
    "thinking-modes": {
      "command": "node",
      "args": ["/path/to/thinking-steroid/dist/index.js"]
    }
  }
}
```

### Integration with Claude Code / Codex / Cursor

Any MCP-compatible agent can use Thinking Modes. The server runs as a stdio-based MCP server, compatible with:
- Claude Desktop
- Claude Code (CLI)
- Cursor (via MCP settings)
- Codex CLI
- Hermes Agent

### Testing

The server includes validation schemas (Zod) for every tool's input and output. Each tool's schema enforces structural completeness, preventing the LLM from producing partial or hallucinated reasoning artifacts.

```bash
# Run the test suite
npm test

# Verify MCP protocol compliance
npm run test:mcp
```


---
Developed by [Ishan Parihar](https://github.com/ishan-parihar) to enhance the cognitive depth and epistemic rigor of AI agents.

If you find this project useful, [consider supporting its development](https://rzp.io/rzp/ishan-parihar)
