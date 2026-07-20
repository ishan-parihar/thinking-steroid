---
name: thinking-modes
description: >
  Structure AI agent reasoning with 13 cognitive modalities. Forces specific
  thinking frameworks: sequential, polarity mapping, AQAL, causal loops,
  Cynefin classification, first principles, shadow work, and more.
---

# Thinking Modes Skill

Force structured reasoning with 13 cognitive modalities for AI agents.

<!-- Static skill -->
<!-- Install: npx skills add <owner/thinking-steroid> --skill thinking-modes -->
<!-- CI check: diff <(node dist/index.js --help) SKILL.md && exit 1 -->

## Quick Start

```bash
# Run the MCP server
node dist/index.js
```

## MCP Configuration

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

## Key Tools (13)

| Tool | Description |
|------|-------------|
| `think_sequential` | Step-by-step reasoning with claims, confidence, assumptions |
| `think_polarity` | Map dialectical tensions |
| `think_aqal_situational` | 4-quadrant holistic analysis |
| `think_aqal_projection` | Temporal projections across quadrants |
| `think_hierarchical` | Developmental stage mapping |
| `think_causal` | Causal loop diagrams and leverage points |
| `think_cynefin` | Domain classification (Clear/Complicated/Complex/Chaotic) |
| `think_first_principles` | Socratic decomposition to bedrock facts |
| `think_shadow` | Unconscious pattern detection |
| `think_scenario` | 2x2 scenario matrix and pre-mortem |
| `think_metacognitive` | Ladder of inference and cognitive bias audit |
| `think_unity` | Multi-system grand synthesis |
| `think_navigator` | DAG-based reasoning orchestration |

## Recommended Workflows

1. Start with `think_cynefin` to classify the domain
2. Use `think_sequential → think_polarity → think_aqal → think_shadow → think_unity` for deep analysis
3. Use `think_metacognitive` after any tool to catch reasoning errors
4. Use `think_navigator` to plan multi-step reasoning chains
