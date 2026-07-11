# FLAPPY CHAMP 🐉⛵

Fly **Champ**, Burlington's beloved Lake Champlain monster, through the
sailboats of the lake. A Flappy Bird–style arcade game for
[Btown Games](https://btownbrief.github.io/), the browser arcade of the
[BTown Brief](https://www.btownbrief.com).

**Play it live:** https://btownbrief.github.io/flappy-champ/

## How it works

Plain static site — no build step. `index.html` + `style.css` + ES modules in `js/`:

| file | what it does |
| --- | --- |
| `js/main.js` | game loop, flappy physics, states, HUD, game-over UI, leaderboard wiring |
| `js/champ.js` | Champ drawn procedurally on canvas (green serpent, humps, scutes) |
| `js/boats.js` | sailboat obstacles — hulls, masts, yards, sails |
| `js/scenery.js` | parallax Burlington waterfront: Adirondacks, ECHO, the boathouse, breakwater light; day/night palette cycle |
| `js/audio.js` | procedural WebAudio sfx, no audio files |
| `js/leaderboard.js` | shared monthly Supabase leaderboard (game slug `flappy-champ`) |

Every push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Regenerating the social/app images

`og-image.png` and `icon-180.png` are rendered by the game's own art code:

```bash
python3 -m http.server 8000  # from the repo root
chrome --headless --screenshot=og-image.png --window-size=1200,630 "http://localhost:8000/tools/og.html"
chrome --headless --screenshot=icon-180.png --window-size=180,180 "http://localhost:8000/tools/og.html?icon"
```

## Medals

🥉 10 · 🥈 25 · 🥇 50 · 🍁 100
