// FLAPPY CHAMP — layered parallax of the view WEST from the Burlington
// waterfront, out over open Lake Champlain: sky → Adirondack ridges → low
// tree-covered points hugging the horizon → open water, with the famous
// white breakwater lighthouse standing out in the lake. No buildings across
// the water — from Burlington you see mountains, trees, and the light.
// The palette drifts through a full Burlington day as you play, and the game
// opens at the sunset the waterfront is famous for.

// ---------------------------------------------------------------- palette

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}
function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}
function lerpRGB(a, b, t) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

// One full day, looping: noon → golden hour → sunset → dusk → night → dawn.
// `hor` is the color right at the waterline — where a real sunset burns hottest.
const STOPS = [
  { // noon
    top: '#3f9fd4', mid: '#7cc4e8', low: '#c8e8f4', hor: '#e2f3f9', sun: '#fff6d0', sunH: 0.85,
    far: '#8aa7cc', near: '#6188b4', water: '#3d85b2', deep: '#1e5d8a',
    silh: '#3c5a74', wave: '#bfe6f2', cloud: '#ffffff', stars: 0,
  },
  { // golden hour — the sky starts to catch fire
    top: '#4884c2', mid: '#e09a6e', low: '#ffb84e', hor: '#ffcf72', sun: '#ffe088', sunH: 0.45,
    far: '#8f80ae', near: '#6a628e', water: '#4e7aac', deep: '#2a5586',
    silh: '#443c62', wave: '#ffd9a0', cloud: '#ffddb0', stars: 0,
  },
  { // sunset (the Burlington special) — blazing orange and red
    top: '#54489c', mid: '#e8606a', low: '#ff8124', hor: '#ff6224', sun: '#ffca55', sunH: 0.10,
    far: '#84588a', near: '#5e4270', water: '#6b64a8', deep: '#38386e',
    silh: '#3c2c50', wave: '#ffab6e', cloud: '#ff8a62', stars: 0,
  },
  { // dusk — embers on the horizon
    top: '#343070', mid: '#6e4c8e', low: '#e06048', hor: '#c04844', sun: '#ff8450', sunH: -0.12,
    far: '#4a3e6e', near: '#362e58', water: '#42447c', deep: '#242850',
    silh: '#282242', wave: '#c8829c', cloud: '#a05e74', stars: 0.35,
  },
  { // night
    top: '#0e1832', mid: '#1c2a4e', low: '#2c3c66', hor: '#33436e', sun: '#e8ecf4', sunH: 0.55,
    far: '#243252', near: '#1a2540', water: '#1c2c50', deep: '#0e1a36',
    silh: '#131c32', wave: '#4a5e8a', cloud: '#2c3a5e', stars: 1,
  },
  { // dawn
    top: '#4a6296', mid: '#9a80ac', low: '#ffab72', hor: '#ff9860', sun: '#ffd9a8', sunH: 0.06,
    far: '#6a7099', near: '#4c547e', water: '#3e6494', deep: '#24406c',
    silh: '#33415e', wave: '#ecbc9c', cloud: '#e0a8a8', stars: 0.1,
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
  // how "golden" the light is right now (peaks when the sun sits on the water)
  p.glow = Math.max(0, 1 - Math.abs(p.sunH - 0.08) * 3) * (1 - p.night);
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

function rand(seed) { // tiny deterministic prng
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

// -------------------------------------------------- horizon landmasses
// Low, tree-covered points and islands hugging the far waterline — the way
// Juniper Island and the Adirondack shore actually read from the waterfront.
// `seed` is a stable per-instance value so nothing jitters frame to frame.

function drawPoint(ctx, x, y, u, color, seed, wMul = 1) {
  ctx.fillStyle = color;
  // low mound of land
  ctx.beginPath();
  ctx.moveTo(x - u * 4.2 * wMul, y + 1.5);
  ctx.quadraticCurveTo(x - u * 2.2 * wMul, y - u * 0.5, x, y - u * 0.55);
  ctx.quadraticCurveTo(x + u * 2.3 * wMul, y - u * 0.48, x + u * 4.2 * wMul, y + 1.5);
  ctx.closePath();
  ctx.fill();
  // ragged tree line along the top — sizes seeded per-tree, never per-frame
  for (let i = 0; i < 7; i++) {
    const tx = x + (i - 3) * u * 0.95 * wMul;
    const r = u * (0.26 + rand(seed * 7.31 + i * 1.7) * 0.24);
    ctx.beginPath();
    ctx.arc(tx, y - u * 0.42, r, Math.PI, 0);
    ctx.fill();
  }
}

// ---------------------------------------------------------------- scenery

// Everything above the water: sky, sun/moon, stars, clouds, Adirondacks,
// and the low treed points across the lake. horizon = y of the far waterline.
export function drawBackdrop(ctx, W, H, horizon, scroll, pal, time) {
  // sky — four stops so the band right at the water burns hottest
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, pal.top);
  sky.addColorStop(0.52, pal.mid);
  sky.addColorStop(0.84, pal.low);
  sky.addColorStop(1, pal.hor);
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
    // glow swells as the sun drops — a low sun sets the whole sky ablaze
    const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, W * (0.3 + pal.glow * 0.14));
    glow.addColorStop(0, pal.sun);
    glow.addColorStop(0.4, `rgba(255,140,60,${0.35 * pal.glow})`);
    glow.addColorStop(1, 'rgba(255,110,50,0)');
    ctx.globalAlpha = 0.5 + pal.glow * 0.25;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, horizon);
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.sun;
    ctx.beginPath(); ctx.arc(sunX, sunY, Math.min(W, 800) * (0.045 + pal.glow * 0.012), 0, 7); ctx.fill();
  }

  // clouds: soft three-lobe puffs drifting slowly, streaked like a lake sunset
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
  // long flat sunset bands low in the sky
  if (pal.glow > 0.05) {
    ctx.globalAlpha = 0.45 * pal.glow;
    for (let i = 0; i < 5; i++) {
      const by = horizon * (0.5 + i * 0.1);
      const bx = ((rand(i * 21.3) * (W + 400) + time * 0.004) % (W + 400)) - 200;
      const bw = W * (0.3 + rand(i * 3.3) * 0.3);
      ctx.beginPath();
      ctx.ellipse(bx, by, bw / 2, 4 + i * 2.2, 0, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // the Adirondacks across the lake, two ridges
  drawRidge(ctx, W, horizon, scroll * 0.05, H * 0.17, 3.7, pal.far);
  drawRidge(ctx, W, horizon, scroll * 0.11, H * 0.115, 9.2, pal.near);

  // low tree-covered points across the water (no buildings out here —
  // Burlington looks west over open lake)
  const u = Math.max(H * 0.028, 16);
  const period = u * 56;
  const sOff = scroll * 0.16;
  for (let k = Math.floor(sOff / period) - 1; k * period - sOff < W + period; k++) {
    const bx = k * period - sOff;
    drawPoint(ctx, bx + u * 9, horizon, u, pal.silh, k * 3 + 11, 1.25);
    drawPoint(ctx, bx + u * 34, horizon, u * 0.75, pal.silh, k * 5 + 3, 0.9);
  }

  // tiny distant sails out on the broad lake, just off the horizon
  const day = 1 - (pal.night || 0);
  if (day > 0.3) {
    ctx.fillStyle = pal.cloud;
    ctx.globalAlpha = 0.85 * day;
    const sPeriod = u * 22;
    const ssOff = scroll * 0.12;
    for (let k = Math.floor(ssOff / sPeriod) - 1; k * sPeriod - ssOff < W + sPeriod; k++) {
      if (rand(k * 5.7) < 0.45) continue; // not every slot has a boat
      const sx = k * sPeriod - ssOff + rand(k * 2.9) * sPeriod * 0.5;
      const sh = u * (0.38 + rand(k * 8.3) * 0.25);
      const lean = Math.sin(time * 0.0016 + k) * 0.5;
      ctx.beginPath();
      ctx.moveTo(sx + lean, horizon - sh);
      ctx.lineTo(sx - sh * 0.32, horizon - 1);
      ctx.lineTo(sx + sh * 0.28, horizon - 1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // the ferry, gliding steadily across toward Port Kent
  const fu = Math.max(H * 0.02, 12);
  const fSpan = W + fu * 14;
  const fx = W + fu * 7 - ((scroll * 0.06 + time * 0.014) % fSpan);
  ctx.fillStyle = pal.silh;
  ctx.beginPath();
  ctx.moveTo(fx - fu * 2.1, horizon);
  ctx.lineTo(fx - fu * 1.8, horizon - fu * 0.5);
  ctx.lineTo(fx + fu * 1.8, horizon - fu * 0.5);
  ctx.lineTo(fx + fu * 2.1, horizon);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(fx - fu * 1.3, horizon - fu * 0.95, fu * 2.5, fu * 0.5);
  ctx.fillRect(fx - fu * 0.75, horizon - fu * 1.25, fu * 1.4, fu * 0.34);
  // deck windows glow after dark
  if (pal.night > 0.15) {
    ctx.fillStyle = `rgba(255,220,150,${0.85 * pal.night})`;
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(fx - fu * 1.15 + i * fu * 0.5, horizon - fu * 0.86, fu * 0.26, fu * 0.16);
    }
  }

  // gulls wheeling over the water (they roost after dark)
  if ((pal.night || 0) < 0.4) {
    ctx.strokeStyle = pal.silh;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8 * (1 - (pal.night || 0) * 2.2);
    for (let i = 0; i < 3; i++) {
      const span2 = W + 240;
      const drift = scroll * 0.3 + time * (0.02 + rand(i * 3.7) * 0.014);
      const gx = ((rand(i * 4.2) * span2 - drift) % span2 + span2) % span2 - 120;
      const gy = horizon * (0.26 + rand(i * 8.8) * 0.3) + Math.sin(time * 0.0028 + i * 2.1) * 7;
      const gw = 5.5 + rand(i * 2.2) * 3.5;
      const flap = 0.35 + 0.55 * Math.abs(Math.sin(time * 0.011 + i * 2.7));
      ctx.beginPath();
      ctx.moveTo(gx - gw, gy - gw * flap * 0.7);
      ctx.quadraticCurveTo(gx - gw * 0.35, gy + gw * 0.18, gx, gy);
      ctx.quadraticCurveTo(gx + gw * 0.35, gy + gw * 0.18, gx + gw, gy - gw * flap * 0.7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// The lake itself, from the horizon to the bottom of the screen.
export function drawWater(ctx, W, H, horizon, scroll, pal, time) {
  const g = ctx.createLinearGradient(0, horizon, 0, H);
  g.addColorStop(0, pal.water);
  g.addColorStop(1, pal.deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon, W, H - horizon);

  // glitter path under a low sun: soft horizontal shimmer streaks fanning
  // out toward the viewer, like the real thing off the Burlington waterfront
  if (pal.sunH < 0.5 && pal.sunH > -0.2) {
    const sunX = W * 0.68;
    const strength = Math.max(0, 1 - Math.abs(pal.sunH - 0.05) * 2.2);
    if (strength > 0.03) {
      ctx.fillStyle = pal.sun;
      const rows = 14;
      for (let i = 0; i < rows; i++) {
        const t = i / (rows - 1);
        const gy = horizon + (H - horizon) * t * 0.92 + 4;
        const halfW = W * (0.035 + t * 0.13);
        const fade = (1 - t * 0.75) * strength;
        // 2-3 dashes per row, swaying independently
        for (let d = 0; d < 3; d++) {
          const ph = time * (0.0012 + d * 0.0005) + i * 1.7 + d * 2.6;
          const dx = Math.sin(ph) * halfW * 0.7;
          const dw = halfW * (0.35 + 0.3 * Math.sin(ph * 1.7 + d));
          if (dw <= 0) continue;
          ctx.globalAlpha = 0.16 * fade * (0.6 + 0.4 * Math.sin(ph * 2.3));
          ctx.beginPath();
          ctx.ellipse(sunX + dx, gy, dw, 1.6 + t * 3.2, 0, 0, 7);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
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

// ------------------------------------------------ the breakwater lighthouse
// Burlington's white breakwater light, standing on its stone crib out in the
// lake. Drawn AFTER the water so it sits on the surface, with a shimmering
// reflection. Lit windows and a pulsing beacon after dark.
export function drawBreakwater(ctx, W, H, horizon, scroll, pal, time) {
  const u = Math.max(H * 0.052, 26);          // scale unit ≈ tower half-width
  const period = Math.max(W * 1.7, u * 42);   // one light per ~1.7 screens
  const sOff = scroll * 0.3;                  // closer than the far shore
  const n = pal.night || 0;
  const glow = pal.glow || 0;

  // daylight cream → warm sunset cream → cold night blue
  const cream = [
    244 + (255 - 244) * glow * 0.4,
    238 + (214 - 238) * glow * 0.5,
    226 + (172 - 226) * glow * 0.7,
  ];
  const white = lerpRGB(cream, [86, 98, 132], n * 0.85);
  const dark = lerpRGB([94, 74, 66], [30, 34, 54], n * 0.8);   // trim / base
  const rock = lerpRGB([88, 90, 100], [26, 32, 50], n * 0.8);
  const rockLit = lerpRGB([128, 118, 118], [40, 48, 68], n * 0.8);

  for (let k = Math.floor(sOff / period) - 1; k * period - sOff < W + period; k++) {
    const x = k * period - sOff + period * 0.55;
    if (x < -u * 6 || x > W + u * 6) continue;
    const y = horizon + (H - horizon) * 0.12;  // waterline at the crib

    // --- the long stone breakwater the light stands at the end of:
    // a run of piled blocks, tops catching the light, sitting IN the water
    const wallStart = x - u * 15, wallEnd = x - u * 1.1;
    ctx.fillStyle = rock;
    ctx.fillRect(wallStart, y - u * 0.08, wallEnd - wallStart, u * 0.2);
    for (let i = 0; i < 26; i++) {
      const wx = wallStart + (i / 25) * (wallEnd - wallStart);
      const wr = u * (0.09 + rand(k * 31.7 + i) * 0.1);
      ctx.fillStyle = i % 3 ? rock : rockLit;
      ctx.beginPath();
      ctx.ellipse(wx, y - u * 0.08, wr * 1.5, wr, 0, 0, 7);
      ctx.fill();
    }
    // faint reflection under the wall
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = rock;
    ctx.fillRect(wallStart, y + u * 0.16, wallEnd - wallStart, u * 0.14);
    ctx.globalAlpha = 1;

    // --- stone crib / jetty: two rows of blocks, catching the light ---
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.ellipse(x, y + u * 0.05, u * 1.7, u * 0.34, 0, 0, 7);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const rx = x + (i - 2) * u * 0.62;
      const rr = u * (0.28 + rand(k * 9.1 + i) * 0.14);
      ctx.fillStyle = i % 2 ? rock : rockLit;
      ctx.beginPath();
      ctx.ellipse(rx, y - u * 0.14, rr, rr * 0.62, 0, 0, 7);
      ctx.fill();
    }

    // --- open braced base (the brown timber cross-frame) ---
    ctx.strokeStyle = dark;
    ctx.lineWidth = u * 0.09;
    ctx.beginPath();
    ctx.moveTo(x - u * 0.62, y - u * 0.2); ctx.lineTo(x - u * 0.42, y - u * 0.86);
    ctx.moveTo(x + u * 0.62, y - u * 0.2); ctx.lineTo(x + u * 0.42, y - u * 0.86);
    ctx.moveTo(x - u * 0.58, y - u * 0.3); ctx.lineTo(x + u * 0.44, y - u * 0.8);
    ctx.moveTo(x + u * 0.58, y - u * 0.3); ctx.lineTo(x - u * 0.44, y - u * 0.8);
    ctx.stroke();

    // --- white tapered tower ---
    const baseY = y - u * 0.82, topY = y - u * 2.35;
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.moveTo(x - u * 0.52, baseY);
    ctx.lineTo(x - u * 0.3, topY);
    ctx.lineTo(x + u * 0.3, topY);
    ctx.lineTo(x + u * 0.52, baseY);
    ctx.closePath();
    ctx.fill();
    // shaded edge for a little roundness
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.beginPath();
    ctx.moveTo(x + u * 0.24, topY);
    ctx.lineTo(x + u * 0.3, topY);
    ctx.lineTo(x + u * 0.52, baseY);
    ctx.lineTo(x + u * 0.36, baseY);
    ctx.closePath();
    ctx.fill();
    // little window
    ctx.fillStyle = n > 0.25 ? '#ffd98a' : dark;
    ctx.fillRect(x - u * 0.06, y - u * 1.6, u * 0.12, u * 0.18);

    // --- gallery deck + railing ---
    ctx.fillStyle = dark;
    ctx.fillRect(x - u * 0.42, topY - u * 0.08, u * 0.84, u * 0.1);
    ctx.strokeStyle = dark;
    ctx.lineWidth = u * 0.035;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * u * 0.17, topY - u * 0.08);
      ctx.lineTo(x + i * u * 0.17, topY - u * 0.3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - u * 0.38, topY - u * 0.3);
    ctx.lineTo(x + u * 0.38, topY - u * 0.3);
    ctx.stroke();

    // --- lantern room + roof + finial ---
    const lanY = topY - u * 0.3;
    ctx.fillStyle = white;
    ctx.fillRect(x - u * 0.24, lanY - u * 0.42, u * 0.48, u * 0.44);
    ctx.fillStyle = n > 0.12 || glow > 0.4 ? '#ffe9a8' : lerpRGB([60, 70, 90], [16, 22, 40], n);
    ctx.fillRect(x - u * 0.16, lanY - u * 0.38, u * 0.32, u * 0.34);
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(x - u * 0.3, lanY - u * 0.42);
    ctx.lineTo(x, lanY - u * 0.72);
    ctx.lineTo(x + u * 0.3, lanY - u * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x - u * 0.025, lanY - u * 0.84, u * 0.05, u * 0.14);

    // --- beacon glow after dark ---
    if (n > 0.12) {
      const pulse = 0.55 + 0.45 * Math.sin(time * 0.004 + k * 2.1);
      const gl = ctx.createRadialGradient(x, lanY - u * 0.2, 2, x, lanY - u * 0.2, u * 1.6);
      gl.addColorStop(0, `rgba(255,236,170,${0.75 * n * pulse})`);
      gl.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(x - u * 1.6, lanY - u * 1.8, u * 3.2, u * 3.2);
    }

    // --- reflection shimmering below the crib ---
    ctx.save();
    ctx.globalAlpha = 0.22 + glow * 0.14;
    ctx.fillStyle = white;
    const refTop = y + u * 0.3;
    for (let i = 0; i < 7; i++) {
      const ry = refTop + i * u * 0.3;
      const wob = Math.sin(time * 0.0022 + i * 1.4 + k) * u * 0.12;
      const rw = u * (0.5 - i * 0.055);
      if (rw <= 0) break;
      ctx.beginPath();
      ctx.ellipse(x + wob, ry, rw, u * 0.07, 0, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- sailboats swinging at their moorings inside the breakwater ----
  // (like the fleet you see anchored off Waterfront Park)
  const bu = Math.max(H * 0.032, 17);
  const bPeriod = Math.max(W * 0.85, bu * 34);
  const bOff = scroll * 0.42;
  for (let k = Math.floor(bOff / bPeriod) - 1; k * bPeriod - bOff < W + bPeriod; k++) {
    const base = k * bPeriod - bOff;
    for (let j = 0; j < 3; j++) {
      const sd = k * 17.3 + j * 5.1;
      const bx = base + (0.08 + j * 0.32 + rand(sd) * 0.2) * bPeriod;
      const depth = 0.26 + rand(sd * 1.7) * 0.3;           // how far down the water
      const by = horizon + (H - horizon) * depth + Math.sin(time * 0.0014 + sd) * 2;
      const sc = bu * (0.55 + depth * 1.1);                 // nearer = bigger
      const heel = Math.sin(time * 0.0011 + sd * 2) * 0.05; // gentle sway
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(heel);
      // hull with a proper freeboard so it reads as a boat, not a dash
      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(-sc * 0.9, -sc * 0.34);
      ctx.quadraticCurveTo(-sc * 0.82, sc * 0.1, -sc * 0.5, sc * 0.14);
      ctx.lineTo(sc * 0.55, sc * 0.14);
      ctx.quadraticCurveTo(sc * 0.92, sc * 0.08, sc * 0.98, -sc * 0.34);
      ctx.closePath();
      ctx.fill();
      // low cabin
      ctx.fillRect(-sc * 0.32, -sc * 0.56, sc * 0.6, sc * 0.24);
      // dark waterline stripe
      ctx.fillStyle = dark;
      ctx.fillRect(-sc * 0.72, sc * 0.05, sc * 1.5, sc * 0.09);
      // bare mast + forestay
      ctx.strokeStyle = dark;
      ctx.lineWidth = Math.max(1, sc * 0.06);
      ctx.beginPath();
      ctx.moveTo(sc * 0.08, -sc * 0.34);
      ctx.lineTo(sc * 0.08, -sc * 1.8);
      ctx.moveTo(sc * 0.08, -sc * 1.8);
      ctx.lineTo(sc * 0.85, -sc * 0.3);
      ctx.stroke();
      ctx.restore();
      // reflection smudge
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.ellipse(bx, by + sc * 0.28, sc * 0.6, sc * 0.09, 0, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // a couple of little mooring buoys between the boats
    for (let j = 0; j < 2; j++) {
      const sd = k * 23.1 + j * 9.7;
      const px = base + rand(sd) * bPeriod;
      const py = horizon + (H - horizon) * (0.22 + rand(sd * 3.1) * 0.4) + Math.sin(time * 0.002 + sd) * 1.5;
      const pr = 2 + rand(sd * 1.3) * 2;
      ctx.fillStyle = j % 2 ? '#d05848' : white;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.2;
      ctx.beginPath(); ctx.ellipse(px, py + pr * 2.2, pr * 1.4, pr * 0.4, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
