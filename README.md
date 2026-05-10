# Thinking Modes MCP Server 🧠

**The Epistemic Operating System for AI Agents.**

[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/runtime-Bun-black.svg)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/Protocol-MCP-purple.svg)](https://modelcontextprotocol.io/)
[![Zod](https://img.shields.io/badge/Validation-Zod-blue)](https://zod.dev/)

`Thinking Modes` is a specialized MCP server that provides AI agents with a structured library of **Cognitive Modalities**. Rather than relying on the LLM's default (and often biased) reasoning path, this server forces the agent to adopt specific, mathematically and psychologically grounded thinking frameworks.

It transforms the agent from a "next-token predictor" into a **Structured Reasoner**, capable of dialectical tension mapping, causal loop analysis, and multi-system synthesis.

---

## 🚩 The Problem: The "Reasoning Flatland"
Standard LLM reasoning is often a linear "stream of consciousness." Even with "Chain-of-Thought," agents suffer from **Conclusion Jumping** (skipping alternatives), **Confirmation Bias** (selective evidence gathering), and **Synthesis Blindness** (ignoring dialectical tensions). Most critically, agents apply a "one-size-fits-all" reasoning path regardless of whether the problem is "Clear" (linear) or "Complex" (emergent). The challenge was to move beyond prompt-based guidance and implement **hard cognitive constraints** that force the agent into specific, mathematically and psychologically grounded reasoning topologies.


## 💡 The Solution: Forced Cognitive Modalities

`Thinking Modes` provides 12 precision tools that act as **Reasoning Constraints**. By invoking a tool, the agent is forced to structure its output according to a specific epistemic framework.

### The Modality Catalog
- **Sequential Reasoning**: Forces claims $\to$ confidence $\to$ assumptions $\to$ counter-arguments.
- **Polarity Mapping**: Maps dialectical tensions to prevent premature synthesis.
- **AQAL Analysis**: A 4-quadrant holistic view (Individual/Collective $\times$ Interior/Exterior).
- **Causal Loop Analysis**: Maps feedback loops (R/B) and identifies high-leverage intervention points.
- **Cynefin Classification**: A meta-tool that classifies the problem domain (Clear, Complicated, Complex, Chaotic) to determine *which other tools* to use.
- **First-Principles Decomposition**: Strips a problem down to its irreducible physical or logical facts.
- **Shadow Work**: A Jungian-inspired framework for detecting blind spots and unconscious biases.
- **Unity Synthesis**: The terminal tool that integrates multiple disparate analyses into a single, coherent truth.

---

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

---
Developed by [Ishan Parihar](https://github.com/ishan-parihar) to enhance the cognitive depth and epistemic rigor of AI agents.
