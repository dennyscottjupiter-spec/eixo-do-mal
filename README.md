# EIXO DO MAL — World Domination Terminal

A 2003-style amber-phosphor text terminal strategy game. Six rogue nations, one throne. Build, spy, invade, nuke.

## How to play locally

Double-click `index.html` — no server needed (plain `<script src>`).

**Keyboard shortcuts**
- `Enter` — end turn
- `↑↑↓↓←→←→BA` (Konami code) — +9,999 gold cheat

## How to deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Source** and set the branch to `master` / `main`, folder `/` (root).
3. GitHub Pages will serve `index.html` at `https://<user>.github.io/<repo>/`.

The `.nojekyll` file in this repo tells GitHub Pages to skip Jekyll processing, which keeps asset paths clean.

## File structure

```
index.html   — markup only (links to styles.css + game.js)
styles.css   — amber CRT design tokens, layout, widgets
game.js      — entire game engine: CONFIG, economy, combat, AI, rendering
.nojekyll    — empty; prevents GitHub Pages Jekyll build
```

## Win conditions

| Mode | Condition |
|------|-----------|
| Normal — Domination | You + vassals + allies ≥ 4 of 6 nations |
| Normal — Nuclear | Deploy warhead while ranked #1 |
| Easy | Reach $60,000 networth as #1, or eliminate all rivals |

## Architecture (quick ref)

`game.js` is organized as 8 explicitly-commented layers: CONFIG → Economy → Combat → Shared helpers → AI → Player handlers → Rendering → Wiring. Read the file top-to-bottom — each layer builds on the last.

See `CLAUDE.md` for the full developer guide.
