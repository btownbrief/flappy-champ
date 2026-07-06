// FLAPPY CHAMP — a Btown Games production for the Btown Brief.
// Tap to flap Champ, the Lake Champlain monster, through the sailboats.

import { sound } from './audio.js';
import { drawChamp } from './champ.js';
import { palette, drawBackdrop, drawWater } from './scenery.js';
import { VARIANTS, drawBottomBoat, drawTopSail } from './boats.js';
import {
  lbEnabled, getName, submitScore, renamePlayer, fetchTop, monthLabel, playerId,
} from './leaderboard.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');

const SHARE_URL = 'https://btownbrief.github.io/flappy-champ/';
const LS_BEST = 'flappy-champ-best';

/* ============================== tuning ============================== */
// Classic Flappy feel, expressed in fractions of the playable height so it
// plays identically on any screen: strong short flap, heavy gravity, slow
// difficulty ramp (narrower gap + faster sail traffic) capped at rampAt.
const T = {
  grav: 2.55,          // gravity, ×playH /s²
  flap: -0.76,         // flap impulse, ×playH /s
  vmax: 1.5,           // terminal fall speed, ×playH /s
  speed0: 0.45,        // scroll speed at score 0, ×playH /s
  speed1: 0.63,        // scroll speed at the cap
  gap0: 0.33,          // gap height at score 0, ×playH
  gap1: 0.235,         // gap height at the cap
  spacing: 0.60,       // distance between boats, ×playH (clamped in px)
  rampAt: 55,          // score where difficulty stops ramping
};

const MEDALS = [
  { at: 100, name: 'Maple', emoji: '🍁', line: '🍁 MAPLE MEDAL — a true lake legend!' },
  { at: 50, name: 'Gold', emoji: '🥇', line: '🥇 Gold! Champ salutes you.' },
  { at: 25, name: 'Silver', emoji: '🥈', line: '🥈 Silver! The boathouse cheers.' },
  { at: 10, name: 'Bronze', emoji: '🥉', line: '🥉 Bronze! Not bad for a cryptid.' },
];

/* ============================== layout ============================== */

let W = 0, H = 0, dpr = 1;
let horizon = 0, waterY = 0, playH = 0;
let champX = 0, champR = 0, champS = 0;
let obW = 0, obSpacing = 0;

function layout() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  horizon = H * 0.52;
  waterY = H * 0.865;
  playH = waterY;
  champX = Math.min(Math.max(W * 0.3, 80), 300);
  champR = Math.min(Math.max(playH * 0.033, 14), 26);
  champS = champR * 1.06;
  obW = Math.min(Math.max(playH * 0.068, 32), 54);
  obSpacing = Math.min(Math.max(playH * T.spacing, 235), 400);
}

/* ============================== state ============================== */

let state = 'menu';        // menu | ready | play | dying | over
let champY = 0, vy = 0, tilt = 0;
let flapT = 1;             // 0 right after a flap → 1 glide
let score = 0;
let best = Number(localStorage.getItem(LS_BEST) || 0);
let obstacles = [];        // { x, gapY, gapH, w, passed, v }
let scroll = 0;            // world distance travelled, drives parallax
let dayT = 0.06;           // position in the looping day (starts mid-morning)
let shake = 0;
let splashes = [];
let deadInWater = false;
let overShownAt = 0;
let lastT = performance.now();

const hud = $('hud'), scoreEl = $('score'), hintEl = $('hint');
const menuEl = $('menu'), gameoverEl = $('gameover');
const bestLineEl = $('best-line');

function difficulty() {
  const lvl = Math.min(score / T.rampAt, 1);
  return {
    speed: playH * (T.speed0 + (T.speed1 - T.speed0) * lvl),
    gap: playH * (T.gap0 - (T.gap0 - T.gap1) * lvl),
  };
}

function resetRun() {
  champY = playH * 0.42;
  vy = 0;
  tilt = 0;
  flapT = 1;
  score = 0;
  obstacles = [];
  splashes = [];
  shake = 0;
  deadInWater = false;
  scoreEl.textContent = '0';
}

function toReady() {
  resetRun();
  state = 'ready';
  menuEl.classList.add('hidden');
  gameoverEl.classList.add('hidden');
  hud.classList.remove('hidden');
  hintEl.classList.remove('hidden');
}

function beginPlay() {
  state = 'play';
  hintEl.classList.add('hidden');
  spawnObstacle(W + playH * 0.45);
}

function tap() {
  if (state === 'ready') beginPlay();
  if (state !== 'play') return;
  vy = T.flap * playH;
  flapT = 0;
  sound.flap();
}

/* ============================== obstacles ============================== */

function spawnObstacle(x) {
  const { gap } = difficulty();
  const prev = obstacles[obstacles.length - 1];
  const minC = gap / 2 + playH * 0.07;
  const maxC = waterY - gap / 2 - playH * 0.11;
  let gapY;
  if (!prev) {
    gapY = playH * 0.45;
  } else {
    // early gaps drift gently; seasoned players get bigger jumps
    const wildness = 0.42 + Math.min(score / T.rampAt, 1) * 0.18;
    const drift = (Math.random() - 0.5) * playH * wildness;
    gapY = Math.min(Math.max(prev.gapY + drift, minC), maxC);
  }
  obstacles.push({
    x,
    gapY,
    gapH: gap,
    w: obW,
    passed: false,
    v: VARIANTS[Math.floor(Math.random() * VARIANTS.length)],
  });
}

function circleRectHit(cx, cy, r, x0, y0, x1, y1) {
  const nx = Math.min(Math.max(cx, x0), x1);
  const ny = Math.min(Math.max(cy, y0), y1);
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function champHits(ob) {
  // two collision circles: head and body; 3px forgiveness on gap edges
  const s = champS;
  const pts = [
    [champX + s * 0.45, champY - s * 0.55, s * 0.66],
    [champX - s * 0.55, champY + s * 0.3, s * 0.6],
  ];
  const top = ob.gapY - ob.gapH / 2 - 3;
  const bot = ob.gapY + ob.gapH / 2 + 3;
  const x0 = ob.x - ob.w - 4, x1 = ob.x + ob.w + 4;
  for (const [px, py, pr] of pts) {
    if (circleRectHit(px, py, pr, x0, -200, x1, top)) return true;
    if (circleRectHit(px, py, pr, x0, bot, x1, waterY + 50)) return true;
  }
  return false;
}

/* ============================== update ============================== */

function update(dt) {
  const { speed } = difficulty();

  // the day rolls on while you fly
  if (state === 'play' || state === 'ready') dayT = (dayT + dt / 150) % 1;

  if (state === 'menu') {
    scroll += playH * 0.05 * dt;
    return;
  }

  if (state === 'ready') {
    scroll += speed * 0.35 * dt;
    champY = playH * 0.42 + Math.sin(performance.now() * 0.0035) * playH * 0.015;
    flapT = Math.min(1, flapT + dt * 3);
    tilt = Math.sin(performance.now() * 0.0035) * 0.06;
    return;
  }

  if (state === 'play' || state === 'dying') {
    // physics
    vy += T.grav * playH * dt;
    vy = Math.min(vy, T.vmax * playH);
    champY += vy * dt;
    flapT = Math.min(1, flapT + dt * 3);

    // tilt: snappy on the way up, nose-over on the way down
    const target = state === 'dying'
      ? 1.5
      : Math.min(Math.max(-0.45 + (vy / (playH * 0.9)) * 1.1, -0.45), 1.3);
    const rate = vy < 0 ? 14 : 4.6;
    tilt += (target - tilt) * Math.min(1, rate * dt);

    // ceiling: soft clamp
    if (champY < champS * 1.3) { champY = champS * 1.3; vy = Math.max(vy, 0); }
  }

  if (state === 'play') {
    scroll += speed * dt;
    for (const ob of obstacles) ob.x -= speed * dt;
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < W - obSpacing) {
      spawnObstacle(Math.max(W + obW + 12, (obstacles[obstacles.length - 1]?.x ?? 0) + obSpacing));
    }
    while (obstacles.length && obstacles[0].x < -obW * 2.4) obstacles.shift();

    // scoring
    for (const ob of obstacles) {
      if (!ob.passed && ob.x + ob.w < champX - champR) {
        ob.passed = true;
        score++;
        scoreEl.textContent = String(score);
        scoreEl.classList.remove('pop');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('pop');
        sound.score();
      }
    }

    // collisions
    for (const ob of obstacles) {
      if (Math.abs(ob.x - champX) < ob.w + champS * 3 && champHits(ob)) {
        sound.thunk();
        shake = 1;
        state = 'dying';
        vy = Math.min(vy, -playH * 0.25); // little bounce off the sail
        break;
      }
    }
  }

  // hitting the lake (from play or dying)
  if ((state === 'play' || state === 'dying') && champY + champS * 0.5 >= waterY && !deadInWater) {
    deadInWater = true;
    champY = waterY - champS * 0.5;
    sound.splash();
    shake = Math.max(shake, 0.7);
    for (let i = 0; i < 22; i++) {
      splashes.push({
        x: champX + (Math.random() - 0.5) * champS * 3,
        y: waterY + Math.random() * 4,
        vx: (Math.random() - 0.5) * playH * 0.6,
        vy: -Math.random() * playH * 0.9 - playH * 0.15,
        r: 2 + Math.random() * 4,
        life: 0.55 + Math.random() * 0.3,
      });
    }
    if (state === 'play') state = 'dying';
    setTimeout(gameOver, 620);
  }

  // splash droplets
  for (const p of splashes) {
    p.life -= dt;
    p.vy += playH * 2.6 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  splashes = splashes.filter((p) => p.life > 0);

  // dying champ sinks a beat below the surface
  if (state === 'dying' && deadInWater) {
    champY += playH * 0.12 * dt;
  }

  shake = Math.max(0, shake - dt * 2.4);
}

/* ============================== render ============================== */

function render(time) {
  const pal = palette(dayT);

  ctx.save();
  if (shake > 0.01) {
    ctx.translate((Math.random() - 0.5) * shake * 14, (Math.random() - 0.5) * shake * 14);
  }

  drawBackdrop(ctx, W, H, horizon, scroll, pal, time);
  drawWater(ctx, W, H, horizon, scroll, pal, time);

  for (const ob of obstacles) {
    drawTopSail(ctx, ob.x, ob.w, ob.gapY - ob.gapH / 2, ob.v, time);
    drawBottomBoat(ctx, ob.x, ob.w, ob.gapY + ob.gapH / 2, waterY, ob.v, time);
  }

  // Champ
  if (state === 'menu') {
    // swimming across the lake on the title screen, humps in the water
    const swimY = waterY - champS * 0.4 + Math.sin(time * 0.002) * 4;
    drawChamp(ctx, W * 0.5, swimY, champS * 1.35, 0, time, 1, false);
  } else if (!(deadInWater && state === 'over')) {
    const dead = state === 'dying' || state === 'over';
    drawChamp(ctx, champX, champY, champS, tilt, time, flapT, dead);
  }

  // splash droplets
  if (splashes.length) {
    ctx.fillStyle = pal.wave;
    for (const p of splashes) {
      ctx.globalAlpha = Math.min(1, p.life * 2.4);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function frame(time) {
  const dt = Math.min((time - lastT) / 1000, 0.05);
  lastT = time;
  update(dt);
  render(time);
  requestAnimationFrame(frame);
}

/* ============================== game over ============================== */

function medalFor(s) {
  return MEDALS.find((m) => s >= m.at) || null;
}

function drawMedal(s) {
  const mc = $('medal');
  const c = mc.getContext('2d');
  const size = mc.width;
  c.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2 + 8, r = size * 0.34;
  const medal = medalFor(s);

  if (!medal) {
    c.strokeStyle = 'rgba(246,239,220,0.3)';
    c.lineWidth = 5;
    c.setLineDash([9, 8]);
    c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
    c.setLineDash([]);
    c.fillStyle = 'rgba(246,239,220,0.5)';
    c.font = `700 ${size * 0.13}px Arial, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('10 TO', cx, cy - size * 0.08);
    c.fillText('MEDAL', cx, cy + size * 0.08);
    return;
  }

  const colors = {
    Bronze: ['#e0a068', '#9c6434'],
    Silver: ['#e8ecf2', '#9aa2b0'],
    Gold: ['#ffd970', '#d09a28'],
    Maple: ['#ff9d4e', '#c9502f'],
  }[medal.name];

  // ribbon
  c.fillStyle = '#c9502f';
  c.save(); c.translate(cx, cy - r * 0.9);
  c.rotate(-0.35); c.fillRect(-9, -r * 0.9, 18, r * 0.95);
  c.rotate(0.7); c.fillRect(-9, -r * 0.9, 18, r * 0.95);
  c.restore();

  // disc
  const g = c.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, colors[0]);
  g.addColorStop(1, colors[1]);
  c.fillStyle = g;
  c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
  c.lineWidth = 4;
  c.strokeStyle = 'rgba(14,34,56,0.35)';
  c.stroke();
  c.beginPath(); c.arc(cx, cy, r * 0.78, 0, 7);
  c.strokeStyle = 'rgba(14,34,56,0.2)';
  c.stroke();

  // emblem
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (medal.name === 'Maple') {
    c.font = `${r * 0.95}px serif`;
    c.fillText('🍁', cx, cy + 2);
  } else {
    c.fillStyle = 'rgba(14,34,56,0.55)';
    c.font = `900 ${r * 0.9}px Arial, sans-serif`;
    c.fillText('★', cx, cy + 2);
  }
}

function gameOver() {
  if (state === 'over') return;
  state = 'over';
  sound.gameover();
  const s = score;
  const isBest = s > best;
  if (isBest) {
    best = s;
    localStorage.setItem(LS_BEST, String(best));
  }
  $('go-score').textContent = s;
  $('go-best').textContent = best;
  const goTitle = $('go-title');
  goTitle.textContent = isBest ? 'NEW BEST!' : 'SPLASHED!';
  goTitle.className = isBest ? 'new-best' : '';
  const medal = medalFor(s);
  $('medal-line').textContent = medal
    ? medal.line
    : s > 0 ? `${MEDALS[MEDALS.length - 1].at - s} more for a medal` : 'Even Champ has off days.';
  drawMedal(s);
  if (medal || isBest) sound.fanfare();
  hud.classList.add('hidden');
  overShownAt = performance.now();
  gameoverEl.classList.remove('hidden');
  updateLeaderboard(s); // submits exactly once, right here
}

function updateBestLine() {
  bestLineEl.textContent = best > 0 ? `🏅 BEST: ${best}` : '';
}

/* ============================== share ============================== */

$('shareBtn').addEventListener('click', async () => {
  sound.unlock(); sound.blip();
  const medal = medalFor(score);
  const text = `I flew Champ past ${score} sailboat${score === 1 ? '' : 's'} on Lake Champlain${medal ? ` and took ${medal.name} ${medal.emoji}` : ''} 🐉 Beat that:`;
  const btn = $('shareBtn');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'FLAPPY CHAMP', text, url: SHARE_URL });
      return;
    }
    throw new Error('no web share');
  } catch (err) {
    if (err && err.name === 'AbortError') return; // user closed the sheet
    try {
      await navigator.clipboard.writeText(`${text} ${SHARE_URL}`);
      btn.textContent = '✅ COPIED!';
    } catch {
      btn.textContent = SHARE_URL.replace('https://', '');
    }
    setTimeout(() => { btn.textContent = '📣 SHARE'; }, 1800);
  }
});

/* ============================== leaderboard ============================== */

const lbBox = $('lb'), lbList = $('lbList'), lbStatus = $('lbStatus');
const lbForm = $('lbForm'), lbNameInput = $('lbNameInput');
const lbThisBtn = $('lbThisBtn'), lbLastBtn = $('lbLastBtn'), lbRenameBtn = $('lbRenameBtn');
let lbMonthOffset = 0;

if (lbEnabled()) {
  lbBox.classList.remove('hidden');
  lbThisBtn.textContent = `🏆 ${monthLabel(0).toUpperCase()}`;
  lbLastBtn.textContent = monthLabel(-1).toUpperCase();
}

async function updateLeaderboard(s) {
  if (!lbEnabled()) return;
  if (!getName()) {
    // first run: ask for a name; the score waits until it's saved
    lbForm.classList.remove('hidden');
    lbRenameBtn.classList.add('hidden');
    lbStatus.textContent = 'Pick a name to join the monthly leaderboard!';
    lbList.innerHTML = '';
    lbForm.dataset.pendingScore = String(s);
    return;
  }
  try {
    await submitScore(s);
  } catch { /* offline — still try to show the board */ }
  renderBoard();
}

async function renderBoard() {
  lbForm.classList.add('hidden');
  lbRenameBtn.classList.remove('hidden');
  lbStatus.textContent = 'Loading…';
  try {
    const rows = await fetchTop(lbMonthOffset);
    const me = playerId();
    lbList.innerHTML = '';
    rows.slice(0, 10).forEach((r, i) => {
      const li = document.createElement('li');
      if (r.player_id === me) li.className = 'me';
      const medal = ['🥇', '🥈', '🥉'][i];
      li.innerHTML = '<span class="rank"></span><span class="nm"></span><span class="sc"></span>';
      li.querySelector('.rank').textContent = medal || String(i + 1);
      li.querySelector('.nm').textContent = r.name;
      li.querySelector('.sc').textContent = r.score;
      lbList.appendChild(li);
    });
    const myRank = rows.findIndex((r) => r.player_id === me);
    const when = lbMonthOffset === 0 ? 'this month' : `in ${monthLabel(-1)}`;
    lbStatus.textContent = rows.length === 0
      ? `No scores yet ${when} — be the first!`
      : myRank >= 0 ? `You're #${myRank + 1} of ${rows.length} ${when}` : '';
  } catch {
    lbStatus.textContent = 'Leaderboard unavailable (offline?)';
  }
}

$('lbSaveBtn').addEventListener('click', async () => {
  const name = lbNameInput.value.trim();
  if (!name) { lbNameInput.focus(); return; }
  sound.unlock(); sound.blip();
  const pending = Number(lbForm.dataset.pendingScore || 0);
  lbForm.dataset.pendingScore = '';
  try {
    await renamePlayer(name); // saves locally + renames any existing rows
    if (pending > 0) await submitScore(pending);
  } catch { /* offline */ }
  renderBoard();
});
lbNameInput.addEventListener('keydown', (e) => {
  e.stopPropagation(); // typing a name must never flap or restart
  if (e.key === 'Enter') $('lbSaveBtn').click();
});
lbRenameBtn.addEventListener('click', () => {
  sound.unlock(); sound.blip();
  lbNameInput.value = getName();
  lbForm.classList.remove('hidden');
  lbRenameBtn.classList.add('hidden');
  lbNameInput.focus();
});
lbThisBtn.addEventListener('click', () => {
  lbMonthOffset = 0;
  lbThisBtn.classList.add('sel');
  lbLastBtn.classList.remove('sel');
  renderBoard();
});
lbLastBtn.addEventListener('click', () => {
  lbMonthOffset = -1;
  lbLastBtn.classList.add('sel');
  lbThisBtn.classList.remove('sel');
  renderBoard();
});

/* ============================== input ============================== */

function startFromMenu() {
  sound.unlock(); sound.blip();
  toReady();
}

$('startBtn').addEventListener('click', startFromMenu);
menuEl.addEventListener('pointerdown', (e) => {
  if (e.target.closest('a, button')) return;
  e.preventDefault();
  startFromMenu();
});

$('retryBtn').addEventListener('click', () => {
  sound.unlock(); sound.blip();
  toReady();
});
gameoverEl.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#lb, a, .no-restart, #retryBtn')) return; // retry handles itself
  if (performance.now() - overShownAt < 450) return;
  e.preventDefault();
  sound.unlock();
  toReady();
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sound.unlock();
  tap();
}, { passive: false });

// block scrolling / pinch / double-tap zoom mid-game
['touchmove', 'touchstart'].forEach((ev) =>
  document.addEventListener(ev, (e) => {
    if (state === 'ready' || state === 'play' || state === 'dying') e.preventDefault();
  }, { passive: false })
);
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => {
  if (state === 'play') e.preventDefault();
});

window.addEventListener('keydown', (e) => {
  if (document.activeElement === lbNameInput) return; // typing a name
  const flapKey = e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'KeyW';
  if (!flapKey) return;
  e.preventDefault();
  if (e.repeat) return;
  sound.unlock();
  if (state === 'menu') startFromMenu();
  else if (state === 'ready' || state === 'play') tap();
  else if (state === 'over' && performance.now() - overShownAt > 450) toReady();
});

const muteBtn = $('mute');
muteBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault(); e.stopPropagation();
  sound.unlock();
  sound.setMuted(!sound.muted);
  muteBtn.textContent = sound.muted ? '🔇' : '🔊';
});

window.addEventListener('resize', () => {
  const yFrac = playH ? champY / playH : 0.42;
  layout();
  champY = yFrac * playH;
});
window.addEventListener('orientationchange', () => setTimeout(() => window.dispatchEvent(new Event('resize')), 250));
document.addEventListener('visibilitychange', () => { lastT = performance.now(); });

/* ============================== boot ============================== */

muteBtn.textContent = sound.muted ? '🔇' : '🔊';
layout();
resetRun();
updateBestLine();
// keep the menu best-line fresh when returning via retry → menu isn't a flow,
// so refresh it whenever the menu becomes visible again
new MutationObserver(() => {
  if (!menuEl.classList.contains('hidden')) updateBestLine();
}).observe(menuEl, { attributes: true, attributeFilter: ['class'] });
requestAnimationFrame(frame);

// tiny debug hook for automated testing (safe to leave in)
window.__champ = {
  get state() { return state; },
  get score() { return score; },
  get best() { return best; },
  get obstacles() { return obstacles.length; },
  get dayT() { return dayT; },
  set dayT(v) { dayT = v; },
  get y() { return champY; },
  get waterY() { return waterY; },
  get next() {
    const ob = obstacles.find((o) => o.x + o.w > champX - champR);
    return ob ? { x: ob.x, gapY: ob.gapY, gapH: ob.gapH } : null;
  },
  tap, toReady, beginPlay,
  setScore(v) { score = v; scoreEl.textContent = String(v); },
  die() { if (state === 'play' || state === 'ready') { state = 'dying'; } gameOver(); },
  step(dt) { update(dt); },
  renderNow() { render(performance.now()); },
};
