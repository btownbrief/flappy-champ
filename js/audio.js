// FLAPPY CHAMP — procedural Web Audio sound effects. No external assets.

const LS_MUTE = 'flappy-champ.muted';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = localStorage.getItem(LS_MUTE) === '1';
    this._noiseBuf = null;
  }

  // Must be called from a user gesture at least once.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      // 1s of white noise, reused by every effect
      const len = this.ctx.sampleRate;
      this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    localStorage.setItem(LS_MUTE, m ? '1' : '0');
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.value = m ? 0 : 0.9;
    }
  }

  get t() { return this.ctx.currentTime; }

  _noise(dur, { type = 'lowpass', freq = 1000, q = 1, gain = 0.5, sweepTo = null, attack = 0.002, delay = 0 } = {}) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    src.loop = true;
    const start = this.t + delay;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, start); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(start, Math.random());
    src.stop(start + dur + 0.05);
  }

  _tone(freq, dur, { type = 'sine', gain = 0.3, slideTo = null, attack = 0.003, delay = 0 } = {}) {
    const o = this.ctx.createOscillator();
    o.type = type;
    const start = this.t + delay;
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(this.master);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  ready() { return !!this.ctx && !this.muted; }

  // Wing flap: airy whoosh with a springy up-chirp. Slight pitch variance.
  flap() {
    if (!this.ready()) return;
    const v = 0.92 + Math.random() * 0.16;
    this._noise(0.09, { type: 'bandpass', freq: 900 * v, q: 0.8, gain: 0.16, sweepTo: 2400 * v });
    this._tone(300 * v, 0.1, { type: 'triangle', gain: 0.1, slideTo: 620 * v });
  }

  // Passed between the sails: bright marina-bell ding.
  score() {
    if (!this.ready()) return;
    this._tone(1174.7, 0.16, { type: 'sine', gain: 0.16, attack: 0.001 });
    this._tone(1568, 0.3, { type: 'sine', gain: 0.14, delay: 0.05, attack: 0.001 });
    this._tone(3136, 0.12, { type: 'sine', gain: 0.04, delay: 0.05, attack: 0.001 });
  }

  // Bonked a mast: hollow wooden thunk.
  thunk() {
    if (!this.ready()) return;
    this._tone(180, 0.12, { type: 'square', gain: 0.22, slideTo: 70 });
    this._noise(0.08, { type: 'lowpass', freq: 900, gain: 0.3 });
  }

  // Into the lake: big splash.
  splash() {
    if (!this.ready()) return;
    this._noise(0.45, { type: 'lowpass', freq: 1500, gain: 0.5, sweepTo: 300 });
    this._noise(0.6, { type: 'bandpass', freq: 3800, q: 1.2, gain: 0.18, sweepTo: 800, attack: 0.03 });
    this._tone(220, 0.35, { type: 'sine', gain: 0.2, slideTo: 55 });
    // droplets
    for (let i = 0; i < 4; i++) {
      this._tone(900 + Math.random() * 900, 0.06, { type: 'sine', gain: 0.05, delay: 0.15 + i * 0.07, slideTo: 400 });
    }
  }

  // Sad little slide for the game-over card.
  gameover() {
    if (!this.ready()) return;
    this._tone(392, 0.5, { type: 'triangle', gain: 0.1, slideTo: 196, delay: 0.1 });
  }

  // Medal earned: nautical fanfare.
  fanfare() {
    if (!this.ready()) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this._tone(f, 0.28, { type: 'triangle', gain: 0.12, delay: i * 0.09 }));
  }

  // UI select blip
  blip() {
    if (!this.ready()) return;
    this._tone(660, 0.08, { type: 'square', gain: 0.07, slideTo: 990 });
  }
}

export const sound = new SoundEngine();
