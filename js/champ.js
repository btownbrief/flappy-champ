// FLAPPY CHAMP — Champ, the Lake Champlain monster, drawn entirely in code,
// styled after the classic ECHO Center mascot art: friendly plesiosaur with a
// smooth green body, darker green back, cream belly plates up the neck,
// rounded crest bumps (no spikes), stubby flippers, and a big happy eye.
//
// drawChamp(ctx, x, y, s, tilt, time, flapT, dead)
//   (x, y)  = center of the head/neck mass (the collision circle)
//   s       = scale unit ≈ collision radius; whole serpent spans ~5s wide
//   tilt    = body rotation in radians (0 = level, + = nose down)
//   flapT   = 0..1 progress of the current flipper flap (0 = just flapped)
//   dead    = true → X eyes and a worried mouth

export const CHAMP = {
  body: '#54b06e',
  bodyDark: '#379052',
  belly: '#f4ecc9',
  bellyLine: '#cdb98d',
  scute: '#2e7d49',
  cheek: '#f2a24a',
};

// fill a polyline as a smooth ribbon whose width varies point to point —
// this is how the whole body stays one connected organic shape
function ribbon(ctx, pts, widths, color) {
  const left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const A = pts[Math.max(0, i - 1)], B = pts[Math.min(pts.length - 1, i + 1)];
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const L = Math.hypot(dx, dy) || 1;
    const w = widths[i] / 2;
    left.push([pts[i][0] - dy / L * w, pts[i][1] + dx / L * w]);
    right.push([pts[i][0] + dy / L * w, pts[i][1] - dx / L * w]);
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (const p of left) ctx.lineTo(p[0], p[1]);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
}

// sample a chain of two quadratic curves, then fill it as a tapered ribbon
// (width w0 at the start easing to w1 at the end)
function taperedCurve(ctx, p0, c1, p1, c2, p2, w0, w1, color) {
  const N = 16;
  const pts = [], widths = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let a, b, c, tt;
    if (t < 0.5) { a = p0; b = c1; c = p1; tt = t * 2; }
    else { a = p1; b = c2; c = p2; tt = (t - 0.5) * 2; }
    const m = 1 - tt;
    pts.push([
      m * m * a[0] + 2 * m * tt * b[0] + tt * tt * c[0],
      m * m * a[1] + 2 * m * tt * b[1] + tt * tt * c[1],
    ]);
    widths.push(w0 + (w1 - w0) * t);
  }
  ribbon(ctx, pts, widths, color);
  return pts;
}

export function drawChamp(ctx, x, y, s, tilt = 0, time = 0, flapT = 1, dead = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  const wob = Math.sin(time * 0.006);      // gentle idle wobble
  const B = CHAMP.body, BD = CHAMP.bodyDark, BL = CHAMP.belly;

  // ---- one continuous body: an undulating tapered spine, tail → chest ----
  // A traveling sine wave gives the classic serpent humps while keeping the
  // whole body a single connected shape, in the air or in the water.
  const M = 24;
  const spine = [], widths = [];
  const ph = time * 0.005;
  for (let i = 0; i <= M; i++) {
    const t = i / M;
    const bx = -s * (4.0 - 2.8 * t);          // tail tip → chest
    const amp = s * 0.3 * (1 - t * t);        // wave dies out at the chest
    const by = s * 0.5 + Math.sin(t * Math.PI * 2.2 - ph) * amp;
    spine.push([bx, by]);
    widths.push(s * (0.3 + 0.95 * Math.pow(t, 0.75)));
  }
  ribbon(ctx, spine, widths, B);

  // darker green running along the whole back
  const backPts = spine.map(([px, py], i) => [px, py - widths[i] * 0.3]);
  ribbon(ctx, backPts, widths.map((w) => w * 0.36), BD);

  // cream belly along the underside of the rear body (fades in mid-body,
  // meets the neck belly at the chest)
  const bi = Math.round(M * 0.35);
  const bellyBody = spine.slice(bi).map(([px, py], i) => [px, py + widths[bi + i] * 0.28]);
  ribbon(ctx, bellyBody, widths.slice(bi).map((w) => w * 0.4), BL);

  // tail fin, anchored at the spine's tail tip — mostly holds its upswept
  // pose, only gently nodding with the wave so it never pitches oddly
  const [tx, ty] = spine[0];
  const tailAng = Math.atan2(spine[1][1] - ty, spine[1][0] - tx);
  ctx.fillStyle = BD;
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(-0.5 + tailAng * 0.35 + wob * 0.1);
  ctx.beginPath();
  ctx.moveTo(s * 0.12, 0.1 * s);
  ctx.quadraticCurveTo(-s * 0.75, -s * 0.35, -s * 0.95, -s * 1.05);
  ctx.quadraticCurveTo(-s * 0.45, -s * 0.75, -s * 0.28, -s * 0.72);
  ctx.quadraticCurveTo(-s * 0.28, -s * 0.28, 0.15 * s, -0.12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ---- neck: smooth tapered sweep growing straight out of the chest ----
  taperedCurve(
    ctx,
    [-s * 1.45, s * 0.5], [-s * 0.7, s * 0.35],
    [-s * 0.28, -s * 0.05], [-s * 0.02, -s * 0.3],
    [s * 0.28, -s * 0.5],
    s * 1.32, s * 0.85, B
  );

  // cream belly plates up the front of the neck
  const bellyPts = taperedCurve(
    ctx,
    [-s * 1.0, s * 0.72], [-s * 0.42, s * 0.42],
    [-s * 0.12, s * 0.02], [s * 0.02, -s * 0.18],
    [s * 0.22, -s * 0.32],
    s * 0.72, s * 0.42, BL
  );
  // plate seams: short lines across the belly ribbon
  ctx.strokeStyle = CHAMP.bellyLine;
  ctx.lineWidth = s * 0.045;
  ctx.lineCap = 'round';
  for (let i = 2; i < bellyPts.length - 3; i += 3) {
    const [px, py] = bellyPts[i];
    const [qx, qy] = bellyPts[i + 1];
    let dx = qx - px, dy = qy - py;
    const L = Math.hypot(dx, dy) || 1;
    const t = i / (bellyPts.length - 1);
    const w = (s * 0.72 + (s * 0.42 - s * 0.72) * t) * 0.36;
    ctx.beginPath();
    ctx.moveTo(px - dy / L * w, py + dx / L * w);
    ctx.lineTo(px + dy / L * w, py - dx / L * w);
    ctx.stroke();
  }

  // ---- flipper (flaps!) ----
  // flapT 0 → wing snapped up; eases back down to a glide.
  const fl = Math.max(0, 1 - flapT);
  const flapAng = 0.85 - fl * 1.9 + wob * 0.06;
  ctx.save();
  ctx.translate(-s * 0.9, s * 0.28);   // rooted inside the chest
  ctx.rotate(flapAng);
  ctx.fillStyle = BD;
  ctx.beginPath();
  ctx.ellipse(s * 0.5, 0, s * 0.62, s * 0.27, 0.15, 0, 7);
  ctx.fill();
  ctx.restore();

  // ---- head ----
  const hx = s * 0.45, hy = -s * 0.55;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(wob * 0.03);

  // skull: rounded, with a gentle snout — one blob plus a soft muzzle
  ctx.fillStyle = B;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.74, s * 0.6, -0.08, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.52, s * 0.1, s * 0.4, s * 0.3, 0.12, 0, 7);
  ctx.fill();

  // darker green crown patch, like the mascot's shaded back
  ctx.fillStyle = BD;
  ctx.beginPath();
  ctx.ellipse(-s * 0.12, -s * 0.34, s * 0.52, s * 0.24, -0.18, Math.PI, 0);
  ctx.fill();

  // pale muzzle
  ctx.fillStyle = BL;
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.22, s * 0.36, s * 0.24, 0.1, 0, 7);
  ctx.fill();

  // nostril
  ctx.fillStyle = CHAMP.scute;
  ctx.beginPath();
  ctx.arc(s * 0.76, s * 0.02, s * 0.045, 0, 7);
  ctx.fill();

  // mouth
  ctx.strokeStyle = '#1d5c33';
  ctx.lineWidth = s * 0.055;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (dead) {
    ctx.arc(s * 0.5, s * 0.42, s * 0.14, Math.PI * 1.15, Math.PI * 1.85); // worried
  } else {
    ctx.arc(s * 0.42, s * 0.18, s * 0.3, 0.35, 1.25); // easy grin
  }
  ctx.stroke();

  // eye — big and friendly, like the mascot
  if (dead) {
    ctx.strokeStyle = '#1d3a28';
    ctx.lineWidth = s * 0.07;
    const ex = s * 0.18, ey = -s * 0.18, er = s * 0.13;
    ctx.beginPath();
    ctx.moveTo(ex - er, ey - er); ctx.lineTo(ex + er, ey + er);
    ctx.moveTo(ex + er, ey - er); ctx.lineTo(ex - er, ey + er);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(s * 0.22, -s * 0.14, s * 0.22, s * 0.25, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1d2733';
    ctx.beginPath(); ctx.arc(s * 0.29, -s * 0.13, s * 0.12, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.33, -s * 0.18, s * 0.045, 0, 7); ctx.fill();
    // soft eyelid line
    ctx.strokeStyle = BD;
    ctx.lineWidth = s * 0.045;
    ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.14, s * 0.24, -2.5, -0.9); ctx.stroke();
  }

  // rosy cheek
  ctx.fillStyle = 'rgba(242,162,74,0.45)';
  ctx.beginPath(); ctx.arc(s * 0.08, s * 0.2, s * 0.11, 0, 7); ctx.fill();

  // soft rounded crest bumps from the crown down the back of the neck
  ctx.fillStyle = CHAMP.scute;
  const bumps = [
    [-s * 0.3, -s * 0.5, s * 0.17, -0.35],
    [-s * 0.58, -s * 0.26, s * 0.15, -0.75],
    [-s * 0.8, s * 0.08, s * 0.13, -1.1],
  ];
  for (const [bx, by, br, ba] of bumps) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(ba);
    ctx.beginPath();
    ctx.ellipse(0, -br * 0.4, br, br * 0.75, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore(); // head

  // rounded crest bumps riding the spine's wave down the back
  ctx.fillStyle = CHAMP.scute;
  for (const t of [0.85, 0.6, 0.35, 0.12]) {
    const i2 = Math.round(t * M);
    const [px, py] = spine[i2];
    const sr2 = s * (0.09 + t * 0.1);
    ctx.beginPath();
    ctx.ellipse(px, py - widths[i2] * 0.48, sr2, sr2 * 0.8, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// Compact bust of Champ (head + neck arc) for icons and menu flourishes.
export function drawChampBadge(ctx, x, y, s, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = CHAMP.body;
  ctx.lineWidth = s * 1.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, s * 1.6);
  ctx.quadraticCurveTo(-s * 0.35, s * 0.3, s * 0.05, -s * 0.35);
  ctx.stroke();
  drawChampHeadOnly(ctx, s * 0.35, -s * 0.55, s, time);
  ctx.restore();
}

function drawChampHeadOnly(ctx, hx, hy, s, time) {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.fillStyle = CHAMP.body;
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.74, s * 0.6, -0.08, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * 0.52, s * 0.1, s * 0.4, s * 0.3, 0.12, 0, 7); ctx.fill();
  ctx.fillStyle = CHAMP.bodyDark;
  ctx.beginPath(); ctx.ellipse(-s * 0.12, -s * 0.34, s * 0.52, s * 0.24, -0.18, Math.PI, 0); ctx.fill();
  ctx.fillStyle = CHAMP.belly;
  ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.22, s * 0.36, s * 0.24, 0.1, 0, 7); ctx.fill();
  ctx.fillStyle = CHAMP.scute;
  ctx.beginPath(); ctx.arc(s * 0.76, s * 0.02, s * 0.045, 0, 7); ctx.fill();
  ctx.strokeStyle = '#1d5c33'; ctx.lineWidth = s * 0.055; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(s * 0.42, s * 0.18, s * 0.3, 0.35, 1.25); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(s * 0.22, -s * 0.14, s * 0.22, s * 0.25, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1d2733';
  ctx.beginPath(); ctx.arc(s * 0.29, -s * 0.13, s * 0.12, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(s * 0.33, -s * 0.18, s * 0.045, 0, 7); ctx.fill();
  ctx.fillStyle = CHAMP.scute;
  for (const [bx, by, br, ba] of [[-s * 0.3, -s * 0.5, s * 0.17, -0.35], [-s * 0.58, -s * 0.26, s * 0.15, -0.75]]) {
    ctx.save(); ctx.translate(bx, by); ctx.rotate(ba);
    ctx.beginPath();
    ctx.ellipse(0, -br * 0.4, br, br * 0.75, 0, Math.PI, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
