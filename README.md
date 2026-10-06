# pit-lane-claude-mods

My collection of Claude Code mods: live panes, bands and hooks written as function-hook plugins.

Two function-hook mods for Claude Code (needs a recent build; 2.1.286+ here).

- `usage-buddy`: live usage band (context, 5h, 7d) with the Claude mascot and model-switch hints per prompt.
- `pit-wall`: F1-style `/pit` pane tracking plan phases and GitHub pushes.

## Use on any device

```bash
git clone <this repo> ~/claude-mods
claude --plugin-dir ~/claude-mods/usage-buddy --plugin-dir ~/claude-mods/pit-wall
```

To load them in every session, set `CLAUDE_CODE_PLUGIN_DIRS` (colon-separated absolute paths) in your shell profile
or in the `env` block of `~/.claude/settings.json`.

`pit-wall` stores its board per machine and per project folder, and uses `git`, plus `gh` for CI status if installed.
