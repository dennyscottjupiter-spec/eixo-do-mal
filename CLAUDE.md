# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**EIXO DO MAL** is a 2003-style amber-phosphor terminal strategy game ("world domination" sim). No build step, no dependencies, no framework, no package.json, no tests:

```
index.html        — markup only; links the 4 JS files + styles.css
styles.css        — design tokens, layout, widgets, 3 themes, TV frame, blink (~300 lines)
config.js         — Layer 1: CONFIG (incl. difficulty map), state, utils, accessors (~200 lines)
engine.js         — Layers 2–6: economy, combat, AI, player handlers, DCfg() helper (~690 lines)
render.js         — Layer 7: core in-game rendering only — render() rewrites everything (~260 lines)
screens.js        — Layer 8: overlays, boot screen, click listener, keyboard, bootstrap (~340 lines)
old-TV.jpg        — vintage TV image; EVENT LOG is positioned inside its screen cut-out
nuclear_blast.jpg — full-screen flash asset used on any nuke detonation
.nojekyll         — empty; prevents GitHub Pages Jekyll build
```

Scripts are loaded in order (`config.js` → `engine.js` → `render.js` → `screens.js`) and share one global scope — no `import/export`, no bundler. The bootstrap `applyTheme(); render();` call is at the end of `screens.js` (last-loaded).

## Running / testing

- **Run with a local server** (required for Twemoji flag images and the TV background): `python3 -m http.server 8080` then open `http://localhost:8080/`. Flags are blank on bare `file://` because the CDN asset fetch is blocked.
- **Verify a change:** pick a faction, take a few actions, watch the EVENT LOG + WORLD RANKING update. No test harness — smoke-testing means playing.
- **Hard-refresh** (Ctrl+Shift+R) after edits — the browser caches JS aggressively.
- **Cheats for testing:** Konami code (↑↑↓↓←→←→BA) grants +9,999 gold. Useful for fast-forwarding to late-game states (nukes, coalition). Other shortcuts: Space=Collect, X=Explore, 1–7=tabs, Enter=End Turn, ?=Help, Esc=close overlay.
- **GitHub Pages live URL:** https://dennyscottjupiter-spec.github.io/eixo-do-mal/

## Architecture

The four JS files map 1-to-1 to the 8 layer comments inside them. Read layers top-to-bottom — each builds on the last.

### config.js — Layer 1
`CONFIG` holds **every** balance number (buildings, units, factions, techs, AI profiles, **difficulty levels**). Tune gameplay here, not in logic. `G` is the single source of truth (one mutable game-state object); `UI` holds view-only state (`tab`, `attackTarget`, `difficulty`). `newNation()` / `initGame()` build `G`.

**Difficulty system:** `CONFIG.difficulty` has four entries (`easy`, `medium`, `hard`, `extreme`). Each entry has: `label`, `aiStart` (multiplier on rival starting gold+army — *player untouched*), `playerBonus` (head-start on easy only), `coalition` (streak threshold or `false`), `atkGrace` (turns before AI attacks), `aiAtk` (attack probability), `aiBudget` (decision count), `blurb`. In engine.js, `DCfg()` returns the current difficulty config; `G.difficulty` stores it. `UI.difficulty` is set on the start screen and written to `G.difficulty` in `initGame`.

**Faction pool is 12** (iran, iraq, northkorea, cuba, libya, syria, brazil, usa, russia, china, netherlands, pakistan) but each game seats exactly **6** (player + 5 random rivals via `others.slice(0,5)`). Every faction entry has: `flag`, `bonus`, `tip` (one-liner shown on the start screen), and one wired bonus key (`gold`, `oil`, `pop`, `atk`, `def`, or `spyCost`). Only these 6 keys are wired in engine calculations — new factions must use only them.

**IMF state:** `G.imfRate` (starts 0.08, drifts 0.04–0.16 each turn); `n.debt` on each nation (only player debt is ever non-zero). `score()` subtracts `n.debt` so borrowed gold can't fake a win.

### engine.js — Layers 2–6
- **Economy** — `incomes()`, `upkeep()`, `econTick()` run per-nation each turn.
- **IMF loans** — `H.loan(amt)` borrows gold + adds to `P().debt`; `H.repay(amt|'all')` pays down; `endTurn` accrues compound interest on debt and drifts `G.imfRate`.
- **Combat/spies/missiles/nukes** — `resolveAttack()`, `scudStrike()`, `spyMission()`, `deployNuke()`. `deployNuke` calls `showBlast()` (defined in render.js — safe because render.js is fully loaded before any user action can trigger it).
- **Shared action helpers** — `doBuild`/`doTrain`/`doResearch` and their `*CostOk` guards. **Both the player and the AI call these** — keep them side-effect-only on `G`.
- **AI brains** — `aiMicro()` = one cheap move after each player action; `aiMacro()` = `DCfg().aiBudget` decisions per AI at end of turn. Attack probability = `DCfg().aiAtk`. Grace period = `DCfg().atkGrace` turns.
- **Player handlers** — the `H` object. Each key maps to a `data-a` attribute in the DOM. Most call `spend(cost)` → Layer-4 helper → `afterAction()` (which runs `aiMicro` + `checkAll` + `render`).

### render.js — Layer 7 (core in-game only)
`render()` rewrites the **entire** UI from `G` on every call. No partial DOM updates — mutate state, then call `render()`. Also contains:
- `$` helper, `REL_ICON` constant, `showBlast()` — shared utilities.
- `renderDefcon`, `renderHud`, `renderDetail`, `renderCmd`, `renderTabs`, `renderTabContent` — the main game panel.
- `renderLog`, `renderRank` — sidebar/log.

### screens.js — Layer 8 (overlays, wiring, boot)
All non-game screens and the DOM wiring live here:
- `renderFactionOverlay()` — the **retro console boot menu**: DIFFICULTY row (4 buttons → `H.setDifficulty`), BACKGROUND row (AMBER/SPACE/NEON → `H.setTheme`), blinking INSERT NATION prompt, faction grid.
- `renderMenu`, `renderHelp`, `renderKeys`, `renderFirstMoves`, `renderOver`, `renderStats` — overlays.
- `bootSequence()` — staggered teletype boot lines.
- `applyTheme(t)` — sets `body.theme-{t}` class + persists to `localStorage['eixo-theme']`.
- ONE delegated `click` listener (reads `data-a`/`data-p`/`data-q`) and the full keyboard handler (Konami, Enter, Space, X, 1–7, ?, Esc).
- Bootstrap: `applyTheme(…); render();` at the very end (must remain last).

### Win conditions

`checkAll()` is called after every action and at end of turn:

- **Domination** (`winGame('domination')`) — either: ranked **#1** + you + allies + vassals ≥ 4 of the 6 nations + **at least 1 vassal** (pure alliances alone don't win), OR you eliminate every rival.
- **Nuclear** (`winGame('nuclear')`) — player deploys a warhead while ranked #1.
- **Defeat** — player's population hits 0 or all buildings destroyed.

**Coalition mechanic:** after ≥ `DCfg().coalition` consecutive turns at #1 (`G.streak >= threshold`), `G.coalition` is set; AI nations may declare war on the player (30% chance per turn via `aiDiplomacy`). Disabled on EASY (`coalition:false`); threshold shrinks on HARD (4) and EXTREME (3).

**Alliance acceptance** ramps from 25% → 100% of base chance over the first 8 turns (`earlyWary = clamp(G.turn/8, 0.25, 1)`) so turn-1 alliance spamming doesn't trivially win.

### Themes

Three themes, all using CSS design tokens on `body.theme-X`:
- `amber` (default) — classic phosphor CRT, no class added.
- `nasa` / `body.theme-nasa` — deep-space starfield with drift animation.
- `vscode` / `body.theme-vscode` — VSCode-dark NEON palette with cyan/teal accents.

`applyTheme(t)` is the only way to switch. Add a 4th theme: CSS `body.theme-X {}` block + a `.tpick` button in `renderFactionOverlay`.

### TV frame (EVENT LOG)

`#log` (`.tv-screen`) sits inside `.tv-frame` which displays `old-TV.jpg` as a `background-size:100% 100%` image. The glass overlay (`.tv-screen`) is absolutely positioned at `top:12%;left:12%;right:27%;bottom:22%` — these insets align with the screen cut-out of the 614×427 px JPEG. Wood control panel occupies the right ~26% of the image.

### Key conventions when editing

- **State → render, never DOM-first.** Mutate `G` then call `render()`. Never hand-patch DOM nodes.
- **New player action = 3 edits:** add a handler to `H` (engine.js), emit a button with `data-a="yourKey"` in the appropriate render function, gate with `spend(n)` if it costs an action.
- **New building/unit/tech/faction = a CONFIG entry** (config.js); render loops iterate `CONFIG` generically. New factions also need a `tip:` field and must use only the 6 wired bonus keys.
- **Player is always `G.nations[0]`** (`P()`). Accessors: `nm()`, `fb()`, `byId()`, `rel()`.
- **Win/lose flows through `checkDestroyed` → `checkAll`.** Never set `G.over` directly.
- **Overlays:** `menuOverlay`, `helpOverlay`, `keysOverlay`, `firstMovesOverlay`, `blastOverlay`, `overOverlay`, `statsOverlay`. Every new overlay must be registered in `closeOverlay`, `loadGame`, Esc key handler, `renderOver()` hide list, and any button that opens it.
- **Difficulty gates:** use `DCfg()` (engine.js) — never hardcode threshold numbers. `DCfg().coalition`, `DCfg().atkGrace`, `DCfg().aiAtk`, `DCfg().aiBudget`.

## Conventions

Code style is terse and dense (single-letter locals, packed one-liners, `var`-free). Match it — do not clean up or reformat existing lines. The amber-terminal aesthetic (CSS `:root` design tokens, CRT scanline overlay, ASCII box-art) is intentional; preserve it.
