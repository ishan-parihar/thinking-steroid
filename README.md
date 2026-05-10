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

Standard LLM reasoning is often a linear "stream of consciousness." Even with "Chain-of-Thought," agents suffer from:
- **Conclusion Jumping**: Moving from data to a decision without exploring alternatives.
- **Confirmation Bias**: Only searching for evidence that supports the first viable hypothesis.
- **Synthesis Blindness**: Failing to see the tension between two opposing but equally true facts (Polarity).
- **Domain Mismatch**: Applying "Clear" domain logic (step-by-step) to "Complex" domain problems (emergent patterns).

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

### 🛠 Design Principles
- **Epistemic Status**: Every tool output includes a status (`well-supported`, `tentative`, `speculative`), allowing the agent to weight findings.
- **Guided Reasoning Paths**: Tools don't just return data; they return **Suggested Follow-ups**, creating a guided "reasoning graph."
- **Zod-Strict Validation**: Every input is validated with `.strict()` schemas, ensuring the agent cannot hallucinate parameters.
- **Depth Control**: Support for `essential` | `standard` | `exhaustive` depths, allowing the agent to scale its cognitive effort based on the problem's importance.

### 🏗 Architecture
- **Pure Computation**: Zero external API dependencies. The server is a pure transformation layer between the Agent and the Framework.
- **Functional Formatters**: All thinking modalities are implemented as pure functions, ensuring deterministic and testable outputs.
- **stdio Transport**: Optimized for seamless integration with Claude Desktop and other MCP-compatible clients.

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
