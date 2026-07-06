// FLAPPY CHAMP — layered parallax of the Burlington waterfront, looking west
// across Lake Champlain: sky → Adirondack ridges → the breakwater lighthouses
// → shoreline silhouettes (ECHO center, Community Boathouse, Waterfront Park)
// → open water. The palette drifts through a full Burlington day as you play,
// including the sunset the waterfront is famous for.

// ---------------------------------------------------------------- palette

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}
function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}

// One full day, looping: noon → golden hour → sunset → dusk → night → dawn.
const STOPS = [
  { // noon
    top: '#3f9fd4', mid: '#7cc4e8', low: '#c8e8f4', sun: '#fff6d0', sunH: 0.85,
    far: '#8aa7cc', near: '#6188b4', water: '#3d85b2', deep: '#1e5d8a',
    silh: '#3c5a74', wave: '#bfe6f2', cloud: '#ffffff', stars: 0,
  },
  { // golden hour
    top: '#4f97cc', mid: '#a3c4e0', low: '#ffd9a0', sun: '#ffe291', sunH: 0.45,
    far: '#8f97c2', near: '#6a74a4', water: '#4a80ae', deep: '#2a5586',
    silh: '#44506f', wave: '#ffe6b8', cloud: '#ffeed8', stars: 0,
  },
  { // sunset (the Burlington special)
    top: '#7d6bb0', mid: '#e08a96', low: '#ff9d5e', sun: '#ffb45a', sunH: 0.10,
    far: '#7a6899', near: '#584b7c', water: '#5a6ea6', deep: '#33406e',
    silh: '#3a3457', wave: '#ffb98a', cloud: '#f4b8a0', stars: 0,
  },
  { // dusk
    top: '#33406e', mid: '#5c5488', low: '#c2688a', sun: '#ff9e70', sunH: -0.12,
    far: '#4a4470', near: '#37335a', water: '#3a4a7c', deep: '#222c52',
    silh: '#262844', wave: '#8a7aa8', cloud: '#6a628e', stars: 0.35,
  },
  { // night
    top: '#0e1832', mid: '#1c2a4e', low: '#2c3c66', sun: '#e8ecf4', sunH: 0.55,
    far: '#243252', near: '#1a2540', water: '#1c2c50', deep: '#0e1a36',
    silh: '#131c32', wave: '#4a5e8a', cloud: '#2c3a5e', stars: 1,
  },
  { // dawn
    top: '#4a6296', mid: '#9a8cb0', low: '#ffc2a0', sun: '#ffd9a8', sunH: 0.06,
    far: '#6a7099', near: '#4c547e', water: '#3e6494', deep: '#24406c',
    silh: '#33415e', wave: '#d8c2b0', cloud: '#d8b8c2', stars: 0.1,
  },
];

// t in [0,1): position within the looping day.
export function palette(t) {
  const n = STOPS.length;
  const f = ((t % 1) + 1) % 1 * n;
  const i = Math.floor(f) % n, j = (i + 1) % n, k = f - Math.floor(f);
  const a = STOPS[i], b = STOPS[j];
  const p = {};
  for (const key of Object.keys(a)) {
    p[key] = typeof a[key] === 'number' ? a[key] + (b[key] - a[key]) * k : mix(a[key], b[key], k);
  }
  p.night = Math.max(a.stars, b.stars) > 0 ? p.stars : 0;
  return p;
}

// ---------------------------------------------------------------- helpers

// deterministic ridge line: sum of sines, tiles forever
function ridgeY(x, seed) {
  return (
    Math.sin(x * 0.0021 + seed) * 0.55 +
    Math.sin(x * 0.0043 + seed * 2.1) * 0.3 +
    Math.sin(x * 0.011 + seed * 4.7) * 0.15
  );
}

function drawRidge(ctx, W, horizon, scroll, amp, seed, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 2);
  const step = 14;
  for (let sx = 0; sx <= W + step; sx += step) {
    const wx = sx + scroll;
    ctx.lineTo(sx, horizon - amp * (0.55 + ridgeY(wx, seed) * 0.45));
  }
  ctx.lineTo(W, horizon + 2);
  ctx.closePath();
  ctx.fill();
}

function rand(seed) { // tiny deterministic prng for stars
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

// ---------------------------------------------------- shoreline landmarks
// All drawn as flat silhouettes sitting on the horizon line, unit = u.

function drawBoathouse(ctx, x, y, u, color) {
  // Burlington Community Boathouse: long two-story float, hipped roof,
  // square cupola with its own little roof and a flag.
  ctx.fillStyle = color;
  // pilings / float
  ctx.fillRect(x - u * 2.1, y - u * 0.16, u * 4.2, u * 0.16);
  // main hall
  ctx.fillRect(x - u * 1.8, y - u * 1.05, u * 3.6, u * 0.92);
  // wrap-around porch posts
  for (let i = -3; i <= 3; i++) ctx.fillRect(x + i * u * 0.55 - u * 0.03, y - u * 0.42, u * 0.06, u * 0.3);
  // hipped roof
  ctx.beginPath();
  ctx.moveTo(x - u * 2.0, y - u * 1.05);
  ctx.lineTo(x - u * 1.2, y - u * 1.5);
  ctx.lineTo(x + u * 1.2, y - u * 1.5);
  ctx.lineTo(x + u * 2.0, y - u * 1.05);
  ctx.closePath(); ctx.fill();
  // cupola
  ctx.fillRect(x - u * 0.32, y - u * 1.95, u * 0.64, u * 0.5);
  ctx.beginPath();
  ctx.moveTo(x - u * 0.44, y - u * 1.95);
  ctx.lineTo(x, y - u * 2.28);
  ctx.lineTo(x + u * 0.44, y - u * 1.95);
  ctx.closePath(); ctx.fill();
  // flagpole + pennant
  ctx.fillRect(x - u * 0.02, y - u * 2.75, u * 0.04, u * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + u * 0.02, y - u * 2.75);
  ctx.lineTo(x + u * 0.4, y - u * 2.66);
  ctx.lineTo(x + u * 0.02, y - u * 2.56);
  ctx.closePath(); ctx.fill();
}

function drawEcho(ctx, x, y, u, color) {
  // ECHO Leahy Center: low stone base, big glass prow, dramatic single-pitch
  // roof sweeping up toward the lake.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - u * 1.9, y);
  ctx.lineTo(x - u * 1.9, y - u * 0.85);
  ctx.lineTo(x - u * 0.4, y - u * 1.0);
  ctx.lineTo(x + u * 1.6, y - u * 1.75);  // the swooping roofline
  ctx.lineTo(x + u * 1.95, y - u * 0.6);
  ctx.lineTo(x + u * 1.95, y);
  ctx.closePath(); ctx.fill();
  // roof mast / vent
  ctx.fillRect(x + u * 0.9, y - u * 1.85, u * 0.05, u * 0.45);
}

function drawLighthouse(ctx, x, y, u, color) {
  // Breakwater light: squat white tower on a crib — silhouetted here.
  ctx.fillStyle = color;
  ctx.fillRect(x - u * 0.55, y - u * 0.14, u * 1.1, u * 0.14); // crib
  ctx.beginPath();
  ctx.moveTo(x - u * 0.3, y - u * 0.14);
  ctx.lineTo(x - u * 0.2, y - u * 1.0);
  ctx.lineTo(x + u * 0.2, y - u * 1.0);
  ctx.lineTo(x + u * 0.3, y - u * 0.14);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(x - u * 0.26, y - u * 1.12, u * 0.52, u * 0.12); // gallery
  ctx.fillRect(x - u * 0.14, y - u * 1.34, u * 0.28, u * 0.22); // lantern
  ctx.beginPath();
  ctx.moveTo(x - u * 0.18, y - u * 1.34);
  ctx.lineTo(x, y - u * 1.52);
  ctx.lineTo(x + u * 0.18, y - u * 1.34);
  ctx.closePath(); ctx.fill();
}

function drawMarinaMasts(ctx, x, y, u, color) {
  // sailing-center docks: cluster of bare masts
  ctx.fillStyle = color;
  ctx.fillRect(x - u * 1.4, y - u * 0.12, u * 2.8, u * 0.12);
  const hs = [1.3, 1.7, 1.1, 1.55, 1.25];
  hs.forEach((h, i) => {
    const mx = x - u * 1.1 + i * u * 0.55;
    ctx.fillRect(mx, y - u * h, u * 0.045, u * h);
    ctx.beginPath();
    ctx.moveTo(mx + u * 0.045, y - u * h);
    ctx.lineTo(mx + u * 0.22, y - u * h + u * 0.08);
    ctx.lineTo(mx + u * 0.045, y - u * h + u * 0.16);
    ctx.closePath(); ctx.fill();
  });
}

function drawTrees(ctx, x, y, u, color, n = 3) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const tx = x + (i - (n - 1) / 2) * u * 0.8;
    const r = u * (0.42 + rand(x + i) * 0.2);
    ctx.beginPath(); ctx.arc(tx, y - r * 1.1, r, 0, 7); ctx.fill();
    ctx.fillRect(tx - u * 0.04, y - r * 0.6, u * 0.08, r * 0.6);
  }
}

function drawLampposts(ctx, x, y, u, color, n = 4) {
  // Waterfront Park boardwalk lamps
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const lx = x + i * u * 0.9;
    ctx.fillRect(lx, y - u * 0.72, u * 0.045, u * 0.72);
    ctx.beginPath(); ctx.arc(lx + u * 0.022, y - u * 0.78, u * 0.09, 0, 7); ctx.fill();
  }
  ctx.fillRect(x - u * 0.2, y - u * 0.18, (n - 1) * u * 0.9 + u * 0.4, u * 0.07); // railing
}

// ---------------------------------------------------------------- scenery

// Everything above the water: sky, sun/moon, stars, clouds, Adirondacks,
// breakwater + shoreline strip. horizon = y of the far waterline.
export function drawBackdrop(ctx, W, H, horizon, scroll, pal, time) {
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, pal.top);
  sky.addColorStop(0.62, pal.mid);
  sky.addColorStop(1, pal.low);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizon + 1);

  // stars
  if (pal.stars > 0.02) {
    ctx.fillStyle = `rgba(255,255,255,${0.85 * pal.stars})`;
    for (let i = 0; i < 46; i++) {
      const sx = rand(i * 3.1) * W;
      const sy = rand(i * 7.7) * horizon * 0.8;
      const tw = 0.5 + 0.5 * Math.sin(time * 0.002 + i * 2.4);
      ctx.globalAlpha = pal.stars * (0.3 + 0.7 * tw);
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // sun (or, at night, the moon — same disc, cooler color)
  const sunX = W * 0.68;
  const sunY = horizon - pal.sunH * horizon * 0.85;
  if (pal.sunH > -0.2) {
    const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, W * 0.3);
    glow.addColorStop(0, pal.sun);
    glow.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, horizon);
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.sun;
    ctx.beginPath(); ctx.arc(sunX, sunY, Math.min(W, 800) * 0.045, 0, 7); ctx.fill();
  }

  // clouds: soft three-lobe puffs drifting slowly
  ctx.fillStyle = pal.cloud;
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 4; i++) {
    const span = W + 300;
    const cx = ((rand(i * 13.7) * span + time * 0.008 * (0.5 + rand(i) * 0.5) + scroll * 0.02) % span) - 150;
    const cy = horizon * (0.12 + rand(i * 5.3) * 0.4);
    const cs = 26 + rand(i * 9.1) * 30;
    ctx.beginPath();
    ctx.arc(cx, cy, cs * 0.62, 0, 7);
    ctx.arc(cx + cs * 0.7, cy + cs * 0.12, cs * 0.5, 0, 7);
    ctx.arc(cx - cs * 0.7, cy + cs * 0.14, cs * 0.46, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // the Adirondacks across the lake, two ridges
  drawRidge(ctx, W, horizon, scroll * 0.05, H * 0.17, 3.7, pal.far);
  drawRidge(ctx, W, horizon, scroll * 0.11, H * 0.115, 9.2, pal.near);

  // shoreline strip: repeating run of Burlington waterfront landmarks
  const u = Math.max(H * 0.028, 16);
  const period = u * 34;
  const sOff = scroll * 0.22;
  ctx.save();
  for (let k = Math.floor(sOff / period) - 1; k * period - sOff < W + period; k++) {
    const bx = k * period - sOff;
    drawTrees(ctx, bx + u * 2, horizon, u, pal.silh, 3);
    drawEcho(ctx, bx + u * 6.4, horizon, u, pal.silh);
    drawLampposts(ctx, bx + u * 9.6, horizon, u, pal.silh, 4);
    drawBoathouse(ctx, bx + u * 15.5, horizon, u, pal.silh);
    drawMarinaMasts(ctx, bx + u * 20.5, horizon, u, pal.silh);
    drawTrees(ctx, bx + u * 24, horizon, u, pal.silh, 4);
    drawLighthouse(ctx, bx + u * 29, horizon + u * 0.3, u, pal.silh); // out on the breakwater
    // breakwater line
    ctx.fillStyle = pal.silh;
    ctx.fillRect(bx + u * 26.6, horizon + u * 0.2, u * 4.8, u * 0.12);
  }
  ctx.restore();
}

// The lake itself, from the horizon to the bottom of the screen.
export function drawWater(ctx, W, H, horizon, scroll, pal, time) {
  const g = ctx.createLinearGradient(0, horizon, 0, H);
  g.addColorStop(0, pal.water);
  g.addColorStop(1, pal.deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon, W, H - horizon);

  // glitter path under a low sun
  if (pal.sunH < 0.5 && pal.sunH > -0.2) {
    const sunX = W * 0.68;
    ctx.globalAlpha = 0.28 * (1 - Math.abs(pal.sunH - 0.05) * 2.2);
    if (ctx.globalAlpha > 0.01) {
      const gl = ctx.createLinearGradient(0, horizon, 0, H);
      gl.addColorStop(0, pal.sun);
      gl.addColorStop(1, 'rgba(255,180,90,0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.moveTo(sunX - W * 0.03, horizon);
      ctx.lineTo(sunX + W * 0.03, horizon);
      ctx.lineTo(sunX + W * 0.16, H);
      ctx.lineTo(sunX - W * 0.16, H);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // scrolling wave strokes, three bands with increasing parallax
  ctx.strokeStyle = pal.wave;
  ctx.lineCap = 'round';
  for (let band = 0; band < 3; band++) {
    const by = horizon + (H - horizon) * (0.18 + band * 0.28);
    const speed = 0.35 + band * 0.45;
    const len = 26 + band * 26;
    const gap2 = 90 + band * 60;
    ctx.globalAlpha = 0.18 + band * 0.1;
    ctx.lineWidth = 1.5 + band * 1.3;
    const off = (scroll * speed + time * 0.02 * (band + 1)) % gap2;
    for (let sx = -off; sx < W; sx += gap2) {
      const wy = by + Math.sin(sx * 0.02 + time * 0.001 + band * 2) * 3;
      ctx.beginPath();
      ctx.moveTo(sx, wy);
      ctx.lineTo(sx + len, wy);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
