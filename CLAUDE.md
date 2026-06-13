# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**EIXO DO MAL** is a 2003-style amber-phosphor terminal strategy game ("world domination" sim). No build step, no dependencies, no framework, no package.json, no tests:

```
index.html        — markup only; links the 3 JS files + styles.css
styles.css        — amber CRT design tokens, layout, widgets, NASA theme (~290 lines)
config.js         — Layer 1: CONFIG, state, utils, accessors, relations (~170 lines)
engine.js         — Layers 2–6: economy, combat, AI, player handlers (~620 lines)
render.js         — Layers 7–8: all rendering, overlays, keyboard wiring (~540 lines)
nuclear_blast.jpg — full-screen flash asset used on any nuke detonation
.nojekyll         — empty; prevents GitHub Pages Jekyll build
```

Scripts are loaded in order (`config.js` → `engine.js` → `render.js`) and share one global scope — no `import/export`, no bundler.

## Running / testing

- **Run with a local server** (required for Twemoji flag images): `python3 -m http.server 8080` then open `http://localhost:8080/`. Flags are blank on bare `file://` because the CDN asset fetch is blocked.
- **Verify a change:** pick a faction, take a few actions, watch the EVENT LOG + WORLD RANKING update. No test harness — smoke-testing means playing.
- **Hard-refresh** (Ctrl+Shift+R) after edits — the browser caches JS aggressively.
- **Cheats for testing:** Konami code (↑↑↓↓←→←→BA) grants +9,999 gold. Useful for fast-forwarding to late-game states (nukes, coalition). Other shortcuts: Space=Collect, X=Explore, 1–7=tabs, Enter=End Turn, ?=Help, Esc=close overlay.
- **GitHub Pages live URL:** https://dennyscottjupiter-spec.github.io/eixo-do-mal/

## Architecture

The three JS files map 1-to-1 to the 8 layer comments inside them. Read layers top-to-bottom — each builds on the last.

### config.js — Layer 1
`CONFIG` holds **every** balance number (buildings, units, factions, techs, AI profiles). Tune gameplay here, not in logic. `G` is the single source of truth (one mutable game-state object); `UI` holds view-only state (`tab`, `attackTarget`, `mode`). `newNation()` / `initGame()` build `G`.

**Faction pool is 11** (iran, iraq, northkorea, cuba, libya, syria, brazil, usa, russia, china, netherlands) but each game seats exactly **6** (player + 5 random rivals via `others.slice(0,5)`). Every faction entry has: `flag`, `bonus`, `tip` (one-liner shown on the start screen), and one wired bonus key (`gold`, `oil`, `pop`, `atk`, `def`, or `spyCost`). Only these 6 keys are wired in engine calculations — new factions must use only them.

**IMF state:** `G.imfRate` (starts 0.08, drifts 0.04–0.16 each turn); `n.debt` on each nation (only player debt is ever non-zero). `score()` subtracts `n.debt` so borrowed gold can't fake a win.

### engine.js — Layers 2–6
- **Economy** — `incomes()`, `upkeep()`, `econTick()` run per-nation each turn.
- **IMF loans** — `H.loan(amt)` borrows gold + adds to `P().debt`; `H.repay(amt|'all')` pays down; `endTurn` accrues compound interest on debt and drifts `G.imfRate`.
- **Combat/spies/missiles/nukes** — `resolveAttack()`, `scudStrike()`, `spyMission()`, `deployNuke()`. `deployNuke` calls `showBlast()` (defined in render.js — safe because render.js is fully loaded before any user action can trigger it).
- **Shared action helpers** — `doBuild`/`doTrain`/`doResearch` and their `*CostOk` guards. **Both the player and the AI call these** — keep them side-effect-only on `G`.
- **AI brains** — `aiMicro()` = one cheap move after each player action; `aiMacro()` = ~6 decisions per AI at end of turn.
- **Player handlers** — the `H` object. Each key maps to a `data-a` attribute in the DOM. Most call `spend(cost)` → Layer-4 helper → `afterAction()` (which runs `aiMicro` + `checkAll` + `render`).

### render.js — Layers 7–8
`render()` rewrites the **entire** UI from `G` on every call. No partial DOM updates — mutate state, then call `render()`. Also contains:
- `applyTheme(t)` — sets `body.theme-{t}` class + persists to `localStorage['eixo-theme']`. Called once at boot before the first `render()`.
- `showBlast()` — unhides `#blastOverlay` for 2.2 s on any nuke.
- `renderMenu()`, `renderHelp()`, `renderKeys()`, `renderFirstMoves()` — overlay panels.
- `renderOver()` — game-over screen including FINAL STATISTICS comparison table.
- ONE delegated `click` listener (reads `data-a`/`data-p`/`data-q`) and the full keyboard handler (Konami, Enter, Space, X, 1–7, ?, Esc).

### Win conditions

`checkAll()` is called after every action and at end of turn:

- **Domination** (`winGame('domination')`) — ranked **#1** AND you + allies + vassals ≥ 4 of the 6 nations AND **at least 1 vassal** (pure alliances alone don't win). Normal mode only.
- **Nuclear** (`winGame('nuclear')`) — player deploys a warhead while ranked #1.
- **Easy** (`winGame('easy')`) — reach `CONFIG.easyTargetNW` ($60,000) as #1, or eliminate every rival.
- **Defeat** — player's population hits 0 or all buildings destroyed.

**Coalition mechanic:** after ≥ 5 consecutive turns at #1 (`G.streak >= 5`), `G.coalition` is set; AI nations may declare war on the player (30% chance per turn via `aiDiplomacy`). Disabled in Easy Mode.

**Alliance acceptance** ramps from 25% → 100% of base chance over the first 8 turns (`earlyWary = clamp(G.turn/8, 0.25, 1)`) so turn-1 alliance spamming doesn't trivially win.

### Key conventions when editing

- **State → render, never DOM-first.** Mutate `G` then call `render()`. Never hand-patch DOM nodes.
- **New player action = 3 edits:** add a handler to `H` (engine.js), emit a button with `data-a="yourKey"` in the appropriate render function (render.js), gate with `spend(n)` if it costs an action.
- **New building/unit/tech/faction = a CONFIG entry** (config.js); render loops iterate `CONFIG` generically. New factions also need a `tip:` field and must use only the 6 wired bonus keys.
- **Player is always `G.nations[0]`** (`P()`). Accessors: `nm()`, `fb()`, `byId()`, `rel()`.
- **Win/lose flows through `checkDestroyed` → `checkAll`.** Never set `G.over` directly.
- **Overlays:** `menuOverlay`, `helpOverlay`, `keysOverlay`, `firstMovesOverlay`, `blastOverlay`, `overOverlay`. Every new overlay must be added to **all five** places: `closeOverlay` handler, `loadGame`, `renderMenu`, `renderHelp`/`renderKeys`, `renderOver`, and the Esc key array.
- **Themes:** `applyTheme('amber'|'nasa')` is the only way to switch themes. `body.theme-nasa` CSS lives in styles.css. To add a third theme, add a `body.theme-X {}` block in CSS and a `.tpick` button in `renderFactionOverlay`.

## Conventions

Code style is terse and dense (single-letter locals, packed one-liners, `var`-free). Match it — do not clean up or reformat existing lines. The amber-terminal aesthetic (CSS `:root` design tokens, CRT scanline overlay, ASCII box-art) is intentional; preserve it.
