# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**EIXO DO MAL** is a 2003-style amber-phosphor terminal strategy game ("world domination" sim). No build step, no framework, no package.json, no tests. Firebase CDN is the only external dependency (online multiplayer only).

```
index.html          — markup only; links all JS files + styles.css
styles.css          — design tokens, layout, widgets, 3 themes, TV frame, blink (~370 lines)
config.js           — Layer 1: CONFIG (balance numbers), state, utils, accessors (~210 lines)
engine.js           — Layers 2–6: economy, combat, AI, player handlers (~800 lines)
render.js           — Layer 7: core in-game rendering + playBroadcast() (~380 lines)
screens.js          — Layer 8: overlays, boot screen, click/keyboard, bootstrap (~380 lines)
multiplayer.js      — Layer 9: Firebase Realtime Database online MP (additive, SP-safe)
FIREBASE-SETUP.md   — 5-min guide to wire up Firebase for online play
old-TV.jpg          — vintage TV image; EVENT LOG is positioned inside its screen cut-out
nuclear_blast.jpg   — full-screen flash asset used on any nuke detonation
.nojekyll           — empty; prevents GitHub Pages Jekyll build
```

Scripts load in order (`config.js` → `engine.js` → `render.js` → `screens.js` → `multiplayer.js`) and share one global scope — no `import/export`, no bundler. The bootstrap `applyTheme(); UI.broadcast=…; render();` call is at the end of `screens.js`.

## Running / testing

- **Run with a local server** (required for Twemoji flag images and the TV background): `python3 -m http.server 8080` then open `http://localhost:8080/`. Flags are blank on bare `file://` because the CDN asset fetch is blocked.
- **Verify a change:** pick a faction, take a few actions, watch the EVENT LOG + WORLD RANKING update. No test harness — smoke-testing means playing.
- **Hard-refresh** (Ctrl+Shift+R) after edits — the browser caches JS aggressively.
- **Cheats for testing:** Konami code (↑↑↓↓←→←→BA) grants +9,999 gold. Useful for fast-forwarding to late-game states (nukes, coalition). Other shortcuts: Space=Collect, X=Explore, 1–7=tabs, Enter=End Turn, ?=Help, Esc=close overlay.
- **GitHub Pages live URL:** https://dennyscottjupiter-spec.github.io/eixo-do-mal/

## Architecture

The five JS files map 1-to-1 to the 9 layer comments inside them. Read layers top-to-bottom — each builds on the last.

### config.js — Layer 1
`CONFIG` holds **every** balance number (buildings, units, factions, techs, AI profiles, **difficulty levels**, `diploCost`). Tune gameplay here, not in logic. `G` is the single source of truth (one mutable game-state object); `UI` holds view-only state (`tab`, `attackTarget`, `difficulty`, `broadcast`). `newNation()` / `initGame()` build `G`.

**Difficulty system:** `CONFIG.difficulty` has four entries (`easy`, `medium`, `hard`, `extreme`). Each entry has: `label`, `aiStart` (multiplier on rival starting gold+army — *player untouched*), `playerBonus` (head-start on easy only), `coalition` (streak threshold or `false`), `atkGrace` (turns before AI attacks), `aiAtk` (attack probability), `aiBudget` (decision count), `blurb`. In engine.js, `DCfg()` returns the current difficulty config; `G.difficulty` stores it. `UI.difficulty` is set on the start screen and written to `G.difficulty` in `initGame`.

**Faction pool is 12** (iran, iraq, northkorea, cuba, libya, syria, brazil, usa, russia, china, netherlands, pakistan) but each game seats exactly **6** (player + 5 random rivals via `others.slice(0,5)`). Every faction entry has: `flag`, `bonus`, `tip` (one-liner shown on the start screen), and one wired bonus key (`gold`, `oil`, `pop`, `atk`, `def`, `spyCost`, or `trainCost`). Only these 7 keys are wired in engine calculations — new factions must use only them.
- `trainCost` (multiplier <1 = cheaper): applied in `unitGoldCost()` (engine.js) to infantry/tank/jet/marine batch cost. Example: China `trainCost:0.85` → 15% off all combat-unit training.

**Units** (8 total in `CONFIG.units`): infantry, tank, jet, spy, turret, marine, scud, warhead.
- `marine` — amphibious elite troops (atk 3, def 3, batch 5, 90g). Used by the Marine Assault attack mode which bypasses half of the defender's turret/bunker fortifications.

**Diplomacy costs:** `CONFIG.diploCost = { ally:300, peace:200 }` — gold envoy fee deducted before the action spend(1). Show in button labels.

**IMF state:** `G.imfRate` (starts 0.08, drifts 0.04–0.16 each turn); `n.debt` on each nation (only player debt is ever non-zero). `score()` subtracts `n.debt` so borrowed gold can't fake a win.

**Multiplayer state:** `G.activeSeat` (int, defaults 0) — which seat's turn it is; `G._ver` / `G._writer` — echo-prevention for Firebase sync.

### engine.js — Layers 2–6
- **Economy** — `incomes()`, `upkeep()`, `econTick()` run per-nation each turn.
- **IMF loans** — `H.loan(amt)` borrows gold + adds to `P().debt`; `H.repay(amt|'all')` pays down; `endTurn` accrues compound interest on debt and drifts `G.imfRate`.
- **Combat** — `resolveAttack(att, def, pct, mode)` where `mode` ∈ `'ground'|'air'|'marine'`:
  - `ground` — infantry+tanks, seizes land 12% + loot 10% + raze 1–2 bldgs.
  - `air` — jets only, razes 2–4 bldgs, no land, jets risk interception.
  - `marine` — marines only, bypasses half turrets/bunkers, seizes 10% land + loots 8%.
  - `defPower(n, mode)` varies by doctrine.
- **SCUD/nuke** — `scudStrike()`, `deployNuke()`. `deployNuke` calls `showBlast()` (render.js).
- **Shared action helpers** — `doBuild`/`doTrain`/`doResearch` and their `*CostOk` guards. **Both the player and the AI call these** — keep them side-effect-only on `G`.
- **AI brains** — `aiMicro()` = one cheap move after each player action; `aiMacro()` = `DCfg().aiBudget` decisions per AI at end of turn. AI picks attack mode (ground/air/marine) based on available units.
- **Player handlers** — the `H` object. Each key maps to a `data-a` attribute in the DOM.
- **Turn split:** `endTurnResolve()` runs all synchronous logic and returns the highlight entries; `endTurn()` calls it then feeds highlights to `playBroadcast()` (or `finish()` if broadcast is off).
- **COLLECT rates:** `[1.0, 0.75, 0.5, 0.25, 0.1]` per use this turn (resets in `endTurn`). Counter: `G.collectsThisTurn`.
- **Diplomacy costs:** `H.diplo` deducts `CONFIG.diploCost.ally` or `.peace` gold before `spend(1)` on alliance/peace proposals.

### render.js — Layer 7 (core in-game only)
`render()` rewrites the **entire** UI from `G` on every call. No partial DOM updates — mutate state, then call `render()`. Also contains:
- `$` helper, `REL_ICON` constant, `showBlast()`, `playBroadcast()` — shared utilities.
- `renderDefcon`, `renderHud`, `renderDetail`, `renderCmd`, `renderTabs`, `renderTabContent` — the main game panel.
- `renderLog`, `renderRank` — sidebar/log.
- `renderCmd` shows a "⏳ WAITING FOR …" banner when `MP.enabled && !MP.canAct()`.

**Keyboard badge:** `renderTabs` adds `<span class="kbd">${i+1}</span>` before each tab label. `renderCmd` adds `<span class="kbd">␣</span>` / `<span class="kbd">X</span>` / `<span class="kbd">⏎</span>` to COLLECT / EXPLORE / END TURN.

**ATTACK tab** has three assault rows: GROUND INVASION (25/50/75/100% → `data-q="ground"`), AIR STRIKE (50/100% → `data-q="air"`), MARINE ASSAULT (50/100% → `data-q="marine"`), plus SCUD and NUCLEAR unchanged.

**Cross-file forward calls:** `render()` calls `renderFactionOverlay()` and `renderOver()` (screens.js) and `playBroadcast()` is called from engine.js — all safe because all scripts are parsed before any user interaction.

### screens.js — Layer 8 (overlays, wiring, boot)
All non-game screens and the DOM wiring live here:
- `renderFactionOverlay()` — boot menu with DIFFICULTY, BACKGROUND, WORLD NEWS (broadcast toggle), and faction grid.
- `renderMenu` — now includes 🌍 ONLINE MULTIPLAYER and BROADCAST ON/OFF toggle.
- `renderHelp`, `renderKeys`, `renderFirstMoves`, `renderOver`, `renderStats` — overlays.
- `bootSequence()` — staggered teletype boot lines.
- `applyTheme(t)` — sets `body.theme-{t}` class + persists to `localStorage['eixo-theme']`.
- ONE delegated `click` listener (reads `data-a`/`data-p`/`data-q`) and full keyboard handler.
- Bootstrap: `applyTheme(…); UI.broadcast=…; render();` at the very end (must remain last).

### multiplayer.js — Layer 9 (online MP, additive)
- `MP` object: `{ enabled, seat, host, roomCode, ref, canAct() }`. Default `enabled:false` — zero impact on single-player.
- `P()` in config.js reads `MP.seat` when `MP.enabled`; `G.activeSeat` tracks whose turn it is.
- Host is authoritative: runs `aiMacro` + end-of-round logic; pushes `G` to Firebase after each action/turn.
- Non-host clients are pure mirrors; their `afterAction` also pushes local changes.
- `renderLobby()` provides HOST / JOIN UI. Needs Firebase config in `FIREBASE_CONFIG` block (see `FIREBASE-SETUP.md`).

### Win conditions

`checkAll()` is called after every action and at end of turn:

- **Domination** (`winGame('domination')`) — either: ranked **#1** + you + allies + vassals ≥ 4 of the 6 nations + **at least 1 vassal** (pure alliances alone don't win), OR you eliminate every rival.
- **Nuclear** (`winGame('nuclear')`) — player deploys a warhead while ranked #1.
- **Defeat** — player's population hits 0 or all buildings destroyed.

**Coalition mechanic:** after ≥ `DCfg().coalition` consecutive turns at #1 (`G.streak >= threshold`), `G.coalition` is set; AI nations may declare war on the player (30% chance per turn via `aiDiplomacy`). Under coalition, allied AIs may also betray the player (20% chance, `aiDiplomacy`). Disabled on EASY (`coalition:false`); threshold shrinks on HARD (4) and EXTREME (3).

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
- **New player action = 3 edits:** add a handler to `H` (engine.js), emit a button with `data-a="yourKey"` in the appropriate render function, gate with `spend(n)` if it costs an action. Exception: view-state-only handlers like `H.setDifficulty`, `H.setTheme`, `H.setBroadcast` just update `UI.*` and call `render()` — no `spend()`.
- **New building/unit/tech/faction = a CONFIG entry** (config.js); render loops iterate `CONFIG` generically. New factions also need a `tip:` field and must use only the 7 wired bonus keys. New units need to be added to `newNation.army`, `troopCnt` (if combat), and `UW` description map (render.js TRAIN tab).
- **Player is `P()`** (`G.nations[MP.seat]` in MP, `G.nations[0]` in SP). Never hardcode `G.nations[0]`.
- **Win/lose flows through `checkDestroyed` → `checkAll`.** Never set `G.over` directly.
- **Overlays:** `menuOverlay`, `helpOverlay`, `keysOverlay`, `firstMovesOverlay`, `blastOverlay`, `overOverlay`, `statsOverlay`, `broadcastOverlay`, `lobbyOverlay`. Every new overlay must be registered in `closeOverlay` (engine.js), `loadGame`, Esc key handler, `renderOver()` hide list, and any button that opens it.
- **Difficulty gates:** use `DCfg()` (engine.js) — never hardcode threshold numbers.
- **Attack mode:** always pass `mode` to `resolveAttack(att,def,pct,mode)`. AI picks mode in `aiConsiderAttack`. The three modes use distinct unit pools and distinct `defPower(n,mode)` formulas.

## Version history (tags)
- `v1.2.0` — polish: keycap badges, [T#] color, scroll flash, diplo costs, collect 100/75/50/25%
- `v2.0.0` — Total War: Marine unit + ground/air/marine attack doctrines
- `v3.0.0` — World News: Elifoot-style full-screen turn-end broadcast reel
- `v4.0.0` — The World Stage: Firebase Realtime Database online multiplayer

## Conventions

Code style is terse and dense (single-letter locals, packed one-liners, `var`-free). Match it — do not clean up or reformat existing lines. The amber-terminal aesthetic (CSS `:root` design tokens, CRT scanline overlay, ASCII box-art) is intentional; preserve it.
