# pit-lane-claude-mods

My collection of Claude Code mods: live panes, bands, themes and hooks written as function-hook plugins.
Needs a recent Claude Code build (2.1.325 recommended).

| Mod | What it is |
| --- | --- |
| [`usage-buddy`](usage-buddy) | Live usage band (context, 5h, 7d) with the Claude mascot and model-switch hints per prompt. |
| [`pit-wall`](pit-wall) | F1-style `/pit` pane tracking plan phases and GitHub pushes. |
| [`cupertino-dusk`](cupertino-dusk) | Dark theme with an animated dusk scene (desktop and mobile apps only). |

## Install

As a marketplace, on any device:

```bash
claude plugin marketplace add rhealaloo45/pit-lane-claude-mods
claude plugin install usage-buddy@pit-lane-claude-mods
claude plugin install pit-wall@pit-lane-claude-mods
claude plugin install cupertino-dusk@pit-lane-claude-mods
```

Restart the desktop app afterwards.

Or load a folder directly for one session:

```bash
git clone https://github.com/rhealaloo45/pit-lane-claude-mods ~/claude-mods
claude --plugin-dir ~/claude-mods/usage-buddy --plugin-dir ~/claude-mods/pit-wall
```

To load folders in every session, set `CLAUDE_CODE_PLUGIN_DIRS` (colon-separated absolute paths) in your shell
profile or in the `env` block of `~/.claude/settings.json`.

`pit-wall` stores its board per machine and per project folder, and uses `git`, plus `gh` for CI status if installed.
