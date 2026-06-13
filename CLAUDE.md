# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`eixo-do-mal.html` is a **single self-contained file** — an entire turn-based strategy game ("EIXO DO MAL", a 2003-style amber-phosphor terminal "world domination" sim). All HTML, CSS, and the full game engine (~950 lines of vanilla JS) live inline in that one file. There is no build step, no dependencies, no framework, no package.json, no tests.

## Running / testing

- **Run:** open `eixo-do-mal.html` directly in a browser (no server needed). On Windows: `start eixo-do-mal.html`.
- **Verify a change:** open the file, pick a faction, take a few actions, and watch the EVENT LOG + WORLD RANKING update. There is no test harness — smoke-testing means playing.
- **Hard-refresh** (Ctrl+Shift+R) after edits — the browser caches the file.
- **Cheats for testing:** Konami code (↑↑↓↓←→←→BA) grants +9999 gold; `Enter` ends the turn. Useful for fast-forwarding to late-game states (nukes, coalition).

## Architecture

The `<script>` is organized into 8 explicitly-commented layers. Read them top-to-bottom — each builds on the last:

1. **CONFIG + state + utils** — `CONFIG` holds *every* balance number (buildings, units, factions, techs, AI profiles). Tune gameplay here, not in logic. `G` is the single source of truth (one mutable game-state object); `UI` holds view-only state (`tab`, `attackTarget`). `newNation()` / `initGame()` build `G`.
2. **Economy** — `incomes()`, `upkeep()`, `econTick()` run per-nation each turn.
3. **Combat/spies/missiles/nukes** — `resolveAttack()`, `scudStrike()`, `spyMission()`, `deployNuke()`, plus `checkDestroyed()` / `winGame()` / `loseGame()` endings.
4. **Shared action helpers** — `doBuild`/`doTrain`/`doResearch` and their `*CostOk` guards. **Both the player and the AI call these** — keep them side-effect-only on `G`.
5. **AI brains** — one greedy decision function driven by five personality weight-maps in `CONFIG.profiles`. `aiMicro()` = one cheap move after each player action; `aiMacro()` = ~6 decisions per AI at end of turn. `aiConsiderAttack`, `aiNukeStep`, `aiDiplomacy` add behaviors.
6. **Player action handlers** — the `H` object. Each key maps to a `data-a` attribute in the DOM. Most call `spend(cost)` (deduct actions) then a Layer-4 helper then `afterAction()` (which runs `aiMicro` + `checkAll` + `render`).
7. **Rendering** — `render()` rewrites the *entire* UI from `G` every call (`renderStats`, `renderTabContent`, `renderLog`, `renderRank`, overlays). No partial DOM updates — mutate state, then call `render()`.
8. **Wiring** — ONE delegated `click` listener reads `data-a`/`data-p`/`data-q` off the clicked element and dispatches to `H`. Plus the Konami/Enter keyboard handler.

### Key conventions when editing

- **State → render, never DOM-first.** To change what's shown, mutate `G` then call `render()`. Never hand-patch DOM nodes.
- **New player action = 3 edits:** add a handler to `H`, emit a button with `data-a="yourKey"` (+ `data-p`/`data-q` payload) somewhere in `renderTabContent`, and (if it's a turn cost) gate it with `spend(n)`. The delegated listener wires it automatically — no `addEventListener`.
- **New building/unit/tech/faction = a CONFIG entry**, usually nothing more; the render loops iterate `CONFIG` generically.
- **Player is always `G.nations[0]`** (`P()`). AIs are the rest. Faction/personality accessors: `nm()`, `fb()`, `byId()`, `rel()`.
- **Win/lose flows through `checkDestroyed` → `checkAll`.** Don't set `G.over` directly; call `winGame()` / `loseGame()`.

## Conventions

Code style is terse and dense (single-letter locals, packed one-liners, `var`-free). Match it — do not "clean up" or reformat existing lines. The amber-terminal aesthetic (CSS `:root` design tokens, CRT scanline overlay, ASCII box-art) is intentional; preserve it.
