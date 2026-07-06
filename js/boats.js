// FLAPPY CHAMP — sailboat obstacles.
// Each obstacle is a vertical pair on one x line: a sailboat below the gap
// (hull on the lake, gaff-rigged sail up to a wooden yard) and a great
// hanging regatta sail above it. Both end in a full-width spar at the gap
// edge — the "pipe cap" — so the safe window reads instantly.

export const VARIANTS = [
  { hull: '#b6402f', sail: '#f6f1e3', accent: '#c9502f', num: '4' },
  { hull: '#2e5f8a', sail: '#f4efdd', accent: '#3f87b5', num: '7' },
  { hull: '#2f7d4f', sail: '#fdf8ea', accent: '#e8a23a', num: '2' },
  { hull: '#54468a', sail: '#f6ead8', accent: '#8a5fb0', num: '9' },
];

const WOOD = '#7c5a34';
const WOOD_DARK = '#5e4326';
const MASTC = '#8a6a40';

function spar(ctx, x, y, halfW, h) {
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.roundRect(x - halfW, y - h / 2, halfW * 2, h, h / 2);
  ctx.fill();
  ctx.fillStyle = WOOD_DARK;
  ctx.beginPath();
  ctx.roundRect(x - halfW, y + h * 0.08, halfW * 2, h * 0.34, h * 0.17);
  ctx.fill();
}

// Boat + sail below the gap. Rect: [x±w] from gapBot down to waterY.
export function drawBottomBoat(ctx, x, w, gapBot, waterY, v, time) {
  const bob = Math.sin(time * 0.0018 + x * 0.013) * 2;
  const hullH = Math.min(w * 0.55, (waterY - gapBot) * 0.35);
  const deckY = waterY - hullH * 0.72 + bob;
  const sparW = w + 7;

  // sail cloth: hangs from the yard, billows a touch past the spar tips
  ctx.fillStyle = v.sail;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.92, gapBot + 5);
  ctx.lineTo(x + w * 0.92, gapBot + 5);
  ctx.quadraticCurveTo(x + w * 1.12, (gapBot + deckY) / 2, x + w * 0.72, deckY - 4);
  ctx.lineTo(x - w * 0.72, deckY - 4);
  ctx.quadraticCurveTo(x - w * 1.12, (gapBot + deckY) / 2, x - w * 0.92, gapBot + 5);
  ctx.closePath();
  ctx.fill();
  // accent stripe + shading seam
  ctx.save();
  ctx.clip();
  ctx.fillStyle = v.accent;
  ctx.fillRect(x - w * 1.2, gapBot + (deckY - gapBot) * 0.55, w * 2.4, (deckY - gapBot) * 0.11);
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.fillRect(x + w * 0.35, gapBot, w, deckY - gapBot);
  ctx.restore();
  // sail number
  const sailH = deckY - gapBot;
  if (sailH > 70) {
    ctx.fillStyle = 'rgba(40,50,70,0.7)';
    ctx.font = `800 ${Math.min(24, w * 0.42)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`VT ${v.num}`, x, gapBot + sailH * 0.32);
  }

  // mast in front of the cloth so it reads "sailboat" at a glance
  ctx.fillStyle = MASTC;
  ctx.fillRect(x - 3, gapBot, 6, deckY - gapBot);

  // the yard across the gap edge
  spar(ctx, x, gapBot, sparW, 9);
  // masthead pennant poking into the gap (decorative only)
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(x, gapBot - 4);
  ctx.lineTo(x + 16, gapBot - 9);
  ctx.lineTo(x, gapBot - 14);
  ctx.closePath();
  ctx.fill();

  // hull: sheer curve, floating on the waterline
  ctx.fillStyle = v.hull;
  ctx.beginPath();
  ctx.moveTo(x - w * 1.18, deckY);
  ctx.lineTo(x + w * 1.18, deckY);
  ctx.quadraticCurveTo(x + w * 1.05, waterY + bob + 2, x + w * 0.62, waterY + bob + 3);
  ctx.lineTo(x - w * 0.62, waterY + bob + 3);
  ctx.quadraticCurveTo(x - w * 1.05, waterY + bob + 2, x - w * 1.18, deckY);
  ctx.closePath();
  ctx.fill();
  // gunwale
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x - w * 1.14, deckY, w * 2.28, 3);
  // boom shadow on deck
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x - w * 0.7, deckY + 4, w * 1.4, 3);

  // bow ripple
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w * 1.35, waterY + bob + 4);
  ctx.quadraticCurveTo(x, waterY + bob + 8, x + w * 1.35, waterY + bob + 4);
  ctx.stroke();
}

// Hanging regatta sail above the gap. Rect: [x±w] from 0 down to gapTop.
export function drawTopSail(ctx, x, w, gapTop, v, time) {
  const sway = Math.sin(time * 0.0021 + x * 0.017) * 2;
  const sparW = w + 7;

  // cloth: fills from the top of the screen down to the yard
  ctx.fillStyle = v.sail;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.92, gapTop - 5);
  ctx.lineTo(x + w * 0.92, gapTop - 5);
  ctx.quadraticCurveTo(x + w * 1.12 + sway, gapTop * 0.5, x + w * 0.8, -4);
  ctx.lineTo(x - w * 0.8, -4);
  ctx.quadraticCurveTo(x - w * 1.12 + sway, gapTop * 0.5, x - w * 0.92, gapTop - 5);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = v.accent;
  ctx.fillRect(x - w * 1.2, gapTop * 0.34, w * 2.4, Math.max(10, gapTop * 0.11));
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.fillRect(x + w * 0.35, -4, w, gapTop + 4);
  ctx.restore();

  // mast pole in front of the cloth, up and off-screen
  ctx.fillStyle = MASTC;
  ctx.fillRect(x - 3 + sway * 0.4, -4, 6, gapTop + 4);

  // yard at the gap edge
  spar(ctx, x, gapTop, sparW, 9);
  // little burgee hanging below the yard (decorative only)
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  ctx.moveTo(x, gapTop + 4);
  ctx.lineTo(x + 14 + sway, gapTop + 10);
  ctx.lineTo(x, gapTop + 15);
  ctx.closePath();
  ctx.fill();
}
