# Thinking Modes MCP Server

Structured thinking modality tools for AI agents — 12 tools spanning sequential reasoning, polarity mapping, AQAL analysis, developmental stage mapping, shadow work, causal loop analysis, Cynefin domain classification, scenario planning, metacognitive audit, first-principles decomposition, and Unity multi-system synthesis.

## Quick Start

```bash
npm install
npm run build
# Use via stdio transport (e.g., with Claude Desktop or MCP client)
node dist/index.js
# Development mode
npm run dev
```

## Tool Catalog

### Core Tools (Original 7)

| Tool | What It Does | Best For |
| --- | --- | --- |
| `think_sequential` | Step-by-step reasoning with claims, confidence, assumptions, counter-arguments, and **reasoning sub-modes** (deductive/inductive/abductive/analogical) | Breaking down complex problems, avoiding conclusion-jumping |
| `think_polarity` | Dialectical tension mapping with 9-row polarity map + 16x4 integration spectrum + **systems archetype detection** (Senge's 10 archetypes) | Counteracting premature synthesis bias, mapping trade-offs, detecting systemic patterns |
| `think_aqal_situational` | 4-quadrant analysis with strategies and 2nd-order effects + **optional psychograph** (7 lines of development) | Holistic situation analysis + developmental line profiling |
| `think_aqal_projection` | Temporal projections across 4 quadrants at short/mid/long-term horizons | Understanding how change unfolds at different rates per dimension |
| `think_hierarchical` | Developmental stage mapping across 8 stages x 4 quadrants + **optional vision-logic substage analysis** | Mapping developmental trajectory and next growth edges |
| `think_shadow` | Multi-framework shadow analysis + **shadow pattern detection** + **Jungian archetype matching** | Revealing unconscious patterns, blind spots, hidden dynamics |
| `think_unity` | 6-subsystem multi-lens analysis with inter-system dialogue | Grand synthesis integrating all perspectives |

### New Tools (5)

| Tool | Framework | What It Does | Best For |
| --- | --- | --- | --- |
| `think_causal` | Causal Loops + Meadows' 12 Leverage Points + Systems Archetypes | Maps feedback loops (R/B), ranks intervention points 1-12, detects archetypes | Understanding why interventions backfire, finding high-leverage points |
| `think_cynefin` | Cynefin Framework (Snowden) | Classifies situations into Clear/Complicated/Complex/Chaotic/Disorder domains | **Meta-tool**: determines WHICH thinking tools are appropriate |
| `think_scenario` | Scenario Planning + Pre-Mortem + Futures Wheel | 2x2 scenario matrix, pre-mortem failure analysis, 3 orders of consequences | Strategic planning, risk anticipation, exploring multiple futures |
| `think_metacognitive` | Ladder of Inference + 20-Bias Cognitive Audit | Traces reasoning from data to action, detects biases, finds blind spots | **Quality control**: catching reasoning errors before decisions |
| `think_first_principles` | First-Principles Reasoning + Socratic Decomposition | Reduces problems to irreducible facts, separates assumptions from constraints | Breaking free from analogy-based reasoning |

## Common Parameters

All 12 tools support:

| Parameter | Values | Default | Description |
| --- | --- | --- | --- |
| `output_depth` | `essential` / `standard` / `exhaustive` | `standard` | Analysis depth: 3/5/7 steps, relationship count, detail level |
| `output_mode` | `executive` / `analytical` / `exploratory` | `analytical` | Output format: brief decision-oriented / detailed evidence-heavy / possibility-rich |

### Tool-Specific Optional Parameters

| Tool | Parameter | Description |
| --- | --- | --- |
| `think_sequential` | `reasoning_sub_mode` | `deductive` / `inductive` / `abductive` / `analogical` |
| `think_aqal_situational` | `assess_lines` | Enables psychograph analysis of 7 developmental lines |
| `think_hierarchical` | `assess_vision_logic` | Enables vision-logic substage analysis |

## Composition Patterns

### Meta-Tool Routing (New)
```
think_cynefin → determines domain → routes to appropriate tools → synthesize
```

### Deep Analysis Chain
```
think_sequential → think_polarity → think_aqal_situational → think_shadow → think_unity
```

### Strategic Foresight Pipeline
```
think_scenario → think_causal → think_metacognitive → think_unity
```

### Breakthrough Innovation
```
think_first_principles → think_sequential → think_causal → think_scenario
```

### Quality-Controlled Analysis
```
[any analysis tool] → think_metacognitive → [revise based on bias findings] → think_unity
```

### Parallel 3D Map
```
think_aqal_situational + think_aqal_projection + think_hierarchical (run in parallel, synthesize)
```

### Shadow-Infused
```
think_shadow first, then feed shadow insights as context into any other tool
```

### Unity Grand Synthesis
```
Run all tools independently → feed all outputs into think_unity as the terminal synthesizer
```

## Architecture Upgrades

### Epistemic Awareness
Every tool output includes an **Epistemic Status** (`well-supported` / `tentative` / `speculative`) so downstream tools can weight findings appropriately.

### Cross-Tool Guidance
Every tool output includes **Suggested Follow-ups** — recommended tools to run next based on analysis findings, creating guided reasoning paths.

### Output Modes
- **Executive**: Truncated to key findings, 2-sentence summaries, decision-oriented
- **Analytical**: Full detail, evidence-heavy, standard output
- **Exploratory**: Adds "Open Questions" section with 3 probing questions

## Design Principles

- **Input forces specificity** — tools reject underspecified input rather than guessing
- **Output creates reusable artifacts** — structured outputs designed for downstream tool consumption
- **Depth parameter** — every tool supports `essential` | `standard` | `exhaustive` depth levels
- **Coordinates over descriptions** — positions on spectra, not vague text
- **Tools compose** — outputs feed into other tools via suggested_followup guidance
- **Meta-reasoning built in** — each tool reveals something about the reasoning process itself

## Architecture

- **Pure computation** — no external APIs, zero dependencies beyond MCP SDK + Zod
- **Zod validation** on all inputs with `.strict()` schemas
- **stdio transport** for agent/CLI use cases
- **Formatters as pure functions** — fully testable, composable

## Project Structure

```
thinking-modes-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point (12 tools)
│   ├── types.ts              # Shared TypeScript types (30+ exports)
│   ├── constants.ts          # Shared constants (13 domain data exports)
│   ├── tools/
│   │   ├── sequential.ts     # think_sequential (+ reasoning_sub_mode)
│   │   ├── polarity.ts       # think_polarity (+ systems archetype detection)
│   │   ├── aqal-situational.ts   # think_aqal_situational (+ psychograph)
│   │   ├── aqal-projection.ts    # think_aqal_projection
│   │   ├── hierarchical.ts   # think_hierarchical (+ vision-logic substages)
│   │   ├── shadow.ts         # think_shadow (+ shadow patterns + Jungian archetypes)
│   │   ├── unity.ts          # think_unity
│   │   ├── causal.ts         # think_causal (NEW)
│   │   ├── cynefin.ts        # think_cynefin (NEW)
│   │   ├── scenario.ts       # think_scenario (NEW)
│   │   ├── metacognitive.ts  # think_metacognitive (NEW)
│   │   └── first-principles.ts  # think_first_principles (NEW)
│   └── utils/
│       └── formatters.ts     # Pure formatting functions (12 formatters)
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
