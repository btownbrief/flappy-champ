// FLAPPY CHAMP — Champ, the Lake Champlain monster, drawn entirely in code.
// Friendly cartoon sea serpent: green body, cream belly, little humps trailing
// behind, stubby flippers, long neck, big happy eye, spiky scutes down the neck.
//
// drawChamp(ctx, x, y, s, tilt, time, flapT, dead)
//   (x, y)  = center of the head/neck mass (the collision circle)
//   s       = scale unit ≈ collision radius; whole serpent spans ~5s wide
//   tilt    = body rotation in radians (0 = level, + = nose down)
//   flapT   = 0..1 progress of the current flipper flap (0 = just flapped)
//   dead    = true → X eyes and a worried mouth

export const CHAMP = {
  body: '#3fa860',
  bodyDark: '#2e8149',
  belly: '#f3e9c8',
  scute: '#2a7d45',
  cheek: '#f2a24a',
};

export function drawChamp(ctx, x, y, s, tilt = 0, time = 0, flapT = 1, dead = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  const wob = Math.sin(time * 0.006);      // gentle idle wobble
  const B = CHAMP.body, BD = CHAMP.bodyDark, BL = CHAMP.belly;

  // ---- trailing humps (the classic three-bump silhouette) ----
  // Drawn back-to-front behind the neck; they bob slightly out of phase.
  for (let i = 2; i >= 0; i--) {
    const hx = -s * (1.35 + i * 1.05);
    const hy = s * (0.55 + Math.sin(time * 0.006 + i * 1.9) * 0.07);
    const hr = s * (0.78 - i * 0.16);
    ctx.fillStyle = i === 0 ? B : BD;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // waterline shading under each hump
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.ellipse(hx, hy, hr, hr * 0.16, 0, 0, 7);
    ctx.fill();
  }
  // tail fin flicking up behind the last hump
  const tx = -s * 4.15, ty = s * 0.45;
  ctx.fillStyle = BD;
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(-0.5 + wob * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-s * 0.75, -s * 0.35, -s * 0.95, -s * 1.05);
  ctx.quadraticCurveTo(-s * 0.45, -s * 0.75, -s * 0.28, -s * 0.72);
  ctx.quadraticCurveTo(-s * 0.28, -s * 0.28, 0.15 * s, -0.12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ---- neck: thick swoosh from the front hump up to the head ----
  ctx.strokeStyle = B;
  ctx.lineWidth = s * 1.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 1.3, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.75, s * 0.25, -s * 0.3, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.05, -s * 0.32, s * 0.12, -s * 0.38);
  ctx.stroke();

  // belly stripe up the neck
  ctx.strokeStyle = BL;
  ctx.lineWidth = s * 0.52;
  ctx.beginPath();
  ctx.moveTo(-s * 1.05, s * 0.72);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.42, -s * 0.08, 0);
  ctx.stroke();

  // ---- flipper (flaps!) ----
  // flapT 0 → wing snapped up; eases back down to a glide.
  const fl = Math.max(0, 1 - flapT);
  const flapAng = 0.85 - fl * 1.9 + wob * 0.06;
  ctx.save();
  ctx.translate(-s * 0.95, s * 0.45);
  ctx.rotate(flapAng);
  ctx.fillStyle = BD;
  ctx.beginPath();
  ctx.ellipse(s * 0.52, 0, s * 0.62, s * 0.26, 0.15, 0, 7);
  ctx.fill();
  ctx.restore();

  // ---- head ----
  const hx = s * 0.45, hy = -s * 0.55;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(wob * 0.03);

  // snout + skull as one rounded blob, nose pointing +x
  ctx.fillStyle = B;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.78, s * 0.62, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.55, s * 0.12, s * 0.42, s * 0.32, 0.1, 0, 7);
  ctx.fill();

  // pale muzzle
  ctx.fillStyle = BL;
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.22, s * 0.36, s * 0.24, 0.1, 0, 7);
  ctx.fill();

  // nostril
  ctx.fillStyle = BD;
  ctx.beginPath();
  ctx.arc(s * 0.78, s * 0.02, s * 0.045, 0, 7);
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

  // eye
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
    ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.15, s * 0.21, s * 0.24, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1d2733';
    ctx.beginPath(); ctx.arc(s * 0.27, -s * 0.14, s * 0.115, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.31, -s * 0.19, s * 0.04, 0, 7); ctx.fill();
  }

  // rosy cheek
  ctx.fillStyle = 'rgba(242,162,74,0.5)';
  ctx.beginPath(); ctx.arc(s * 0.05, s * 0.18, s * 0.11, 0, 7); ctx.fill();

  // scutes: spiky little fins from forehead down the back of the neck
  ctx.fillStyle = CHAMP.scute;
  const spikes = [
    [-s * 0.25, -s * 0.52, s * 0.3, -0.5],
    [-s * 0.55, -s * 0.28, s * 0.26, -0.9],
    [-s * 0.78, s * 0.08, s * 0.22, -1.25],
  ];
  for (const [sx, sy, sr, sa] of spikes) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(sa);
    ctx.beginPath();
    ctx.moveTo(-sr * 0.55, 0);
    ctx.quadraticCurveTo(-sr * 0.1, -sr * 1.25, sr * 0.5, -sr * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore(); // head

  // scutes continuing along the humps
  ctx.fillStyle = CHAMP.scute;
  for (let i = 0; i < 3; i++) {
    const sx2 = -s * (1.35 + i * 1.05);
    const sy2 = s * (0.55 + Math.sin(time * 0.006 + i * 1.9) * 0.07) - s * (0.76 - i * 0.16);
    const sr2 = s * (0.2 - i * 0.04);
    ctx.beginPath();
    ctx.moveTo(sx2 - sr2, sy2 + sr2 * 0.4);
    ctx.quadraticCurveTo(sx2, sy2 - sr2 * 1.3, sx2 + sr2, sy2 + sr2 * 0.4);
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
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.78, s * 0.62, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * 0.55, s * 0.12, s * 0.42, s * 0.32, 0.1, 0, 7); ctx.fill();
  ctx.fillStyle = CHAMP.belly;
  ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.22, s * 0.36, s * 0.24, 0.1, 0, 7); ctx.fill();
  ctx.fillStyle = CHAMP.bodyDark;
  ctx.beginPath(); ctx.arc(s * 0.78, s * 0.02, s * 0.045, 0, 7); ctx.fill();
  ctx.strokeStyle = '#1d5c33'; ctx.lineWidth = s * 0.055; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(s * 0.42, s * 0.18, s * 0.3, 0.35, 1.25); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.15, s * 0.21, s * 0.24, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1d2733';
  ctx.beginPath(); ctx.arc(s * 0.27, -s * 0.14, s * 0.115, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(s * 0.31, -s * 0.19, s * 0.04, 0, 7); ctx.fill();
  ctx.fillStyle = CHAMP.scute;
  for (const [sx, sy, sr, sa] of [[-s * 0.25, -s * 0.52, s * 0.3, -0.5], [-s * 0.55, -s * 0.28, s * 0.26, -0.9]]) {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(sa);
    ctx.beginPath();
    ctx.moveTo(-sr * 0.55, 0);
    ctx.quadraticCurveTo(-sr * 0.1, -sr * 1.25, sr * 0.5, -sr * 0.15);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
