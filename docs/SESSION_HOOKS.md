# Session Hooks — Ambient Context at Session Start

AXI §7: Register your tool into the agent's session lifecycle so every conversation starts with relevant state already visible.

## What these do

At session start, the hook runs your CLI with no arguments and injects the output as context. The agent sees live state (tool count, modality names, server status) before it takes any action.

## Session Hook Installation

### Claude Code

Add to `~/.claude/settings.json` (global) or `.claude/settings.json` (project):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "thinking-steroid"
          }
        ]
      }
    ]
  }
}
```

### Codex

Add to `~/.codex/hooks.json`:

```json
{
  "SessionStart": {
    "command": "thinking-steroid"
  }
}
```

Ensure `[features].hooks = true` in `~/.codex/config.toml`.

### OpenCode

Create `~/.config/opencode/plugins/thinking-steroid.ts`:

```typescript
export default {
  name: "thinking-steroid",
  description: "Thinking modes MCP ambient context",
  sessionStart: async () => {
    const { execSync } = await import("child_process");
    return execSync("thinking-steroid", { encoding: "utf-8" });
  },
};
```

## How it works

1. Agent session starts → hook fires
2. Hook runs `thinking-steroid` (no args = content-first home view with tool list)
3. Agent sees 13 cognitive modalities, descriptions, next-step hints
4. Agent can act immediately without a discovery call

## Rules

- **Portable**: hooks use the binary name (`thinking-steroid`). If the binary isn't on PATH, use the full absolute path.
- **Idempotent**: repeated installs with the same path are silent no-ops.
- **Token-budget-aware**: the home view is already optimized for minimal token cost.
