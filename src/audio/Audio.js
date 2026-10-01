// Sound, synthesized with WebAudio: no audio files to download or license. Created lazily on
// the first key press or click (browsers block audio before a user gesture) and fully optional:
// if WebAudio is missing or fails, the game simply stays silent.
//
// Music is a gentle generative music box: soft pentatonic notes over a slow bass, sparser and
// lower in the evening. It suspends while the tab is hidden, so it costs nothing in the background.

const PENTA = [0, 2, 4, 7, 9];             // major pentatonic, in semitones
const BASS = [0, -5, -3, -7];              // I, IV-ish, vi-ish, V-ish (relative to the root)
const ROOT = 60;                            // middle C
const BEAT = 0.42;                          // seconds per music-box beat

function midi(n) {
  return 440 * 2 ** ((n - 69) / 12);
}

export class Audio {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.failed = !(window.AudioContext || window.webkitAudioContext);
    this.darkness = () => 0;
    this.beat = 0;
    this.timer = 0;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') this.ctx.suspend();
      else this.ctx.resume();
    });
  }

  // Call from a user gesture.
  unlock() {
    if (this.ctx || this.failed) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.connect(this.ctx.destination);
      // One second of white noise, reused for every noisy sound.
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      this.timer = setInterval(() => this.musicTick(), BEAT * 1000);
    } catch (err) {
      console.warn('Little Meadow: audio unavailable:', err);
      this.failed = true;
      this.ctx = null;
    }
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings;
    this.sfxGain.gain.value = (s.sfxVolume / 10) ** 2 * 0.7;
    this.musicGain.gain.value = (s.musicVolume / 10) ** 2 * 0.3;
  }

  // ---------------------------------------------------------------- building blocks

  tone(freq, dur, { type = 'sine', vol = 0.3, slide = 0, delay = 0, attack = 0.005, dest = this.sfxGain } = {}) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // attack > 0 fades the noise in instead of starting at full volume (softer, less "slappy").
  noise(dur, { vol = 0.3, freq = 1000, type = 'lowpass', delay = 0, q = 1, attack = 0 } = {}) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    if (attack > 0) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
    } else {
      g.gain.setValueAtTime(vol, t);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // ---------------------------------------------------------------- sound effects

  play(name) {
    if (!this.ctx || this.settings.sfxVolume === 0) return;
    const fx = SFX[name];
    if (fx) fx(this);
  }

  // ---------------------------------------------------------------- music

  musicTick() {
    if (!this.ctx || this.settings.musicVolume === 0 || this.ctx.state !== 'running') return;
    const b = this.beat++;
    const night = this.darkness();
    const bar = Math.floor(b / 8) % BASS.length;
    const root = ROOT + BASS[bar] - Math.round(night * 5);
    const m = this.musicGain;
    if (b % 8 === 0) this.tone(midi(root - 12), BEAT * 7, { type: 'triangle', vol: 0.22, attack: 0.3, dest: m });
    if (b % 8 === 4) this.tone(midi(root - 5), BEAT * 3.5, { type: 'triangle', vol: 0.12, attack: 0.2, dest: m });
    // Melody: sparse, and sparser at night.
    if (Math.random() < 0.55 - night * 0.3 && b % 2 === 0) {
      const n = root + PENTA[(Math.random() * PENTA.length) | 0] + (Math.random() < 0.4 ? 12 : 0);
      this.tone(midi(n), BEAT * 2.5, { vol: 0.16, attack: 0.01, dest: m });
      this.tone(midi(n + 12), BEAT * 1.2, { vol: 0.03, attack: 0.01, dest: m }); // a little shimmer
    }
  }
}

const SFX = {
  hoe: (a) => { a.noise(0.14, { vol: 0.5, freq: 700 }); a.tone(110, 0.1, { slide: -50, vol: 0.2 }); },
  // A soft pour that fades in, with a few droplets: sine "bloops" sliding upward like bubbles.
  water: (a) => {
    a.noise(0.42, { vol: 0.07, freq: 900, q: 0.5, attack: 0.08 });
    for (let i = 0; i < 3; i++) {
      const f = 520 + Math.random() * 380;
      a.tone(f, 0.07, { slide: f * 0.7, vol: 0.06, attack: 0.012, delay: 0.05 + i * 0.08 + Math.random() * 0.03 });
    }
  },
  // Refilling at the pond: lower, rounder glugs.
  fill: (a) => {
    a.noise(0.5, { vol: 0.06, freq: 500, q: 0.5, attack: 0.1 });
    for (let i = 0; i < 4; i++) {
      const f = 260 + Math.random() * 120 + i * 40;
      a.tone(f, 0.1, { slide: f * 0.9, vol: 0.08, attack: 0.015, delay: i * 0.1 });
    }
  },
  // Furniture: a soft wooden "tok" when set down, a little lift when picked up.
  place: (a) => { a.tone(240, 0.09, { type: 'triangle', vol: 0.2, slide: -60 }); a.noise(0.05, { vol: 0.08, freq: 900, attack: 0.005 }); },
  pickup: (a) => { a.tone(330, 0.08, { type: 'triangle', vol: 0.14, slide: 160 }); },
  // New farmland: a rustle and a rising, happy arpeggio.
  expand: (a) => {
    a.noise(0.35, { vol: 0.08, freq: 1500, q: 0.6, attack: 0.05 });
    [523, 659, 784, 1047].forEach((f, i) => a.tone(f, 0.22, { type: 'triangle', vol: 0.13, delay: 0.05 + i * 0.09 }));
  },
  // The forge: a bright anvil ring.
  upgrade: (a) => {
    a.noise(0.05, { vol: 0.15, freq: 3000, type: 'highpass' });
    a.tone(1047, 0.7, { type: 'triangle', vol: 0.16 });
    a.tone(1568, 0.5, { vol: 0.07, delay: 0.01 });
    a.tone(2093, 0.3, { vol: 0.04, delay: 0.02 });
    a.tone(1319, 0.6, { type: 'triangle', vol: 0.1, delay: 0.25 });
  },
  chop: (a) => { a.tone(190, 0.09, { type: 'triangle', vol: 0.35, slide: -60 }); a.noise(0.06, { vol: 0.25, freq: 1400, type: 'bandpass' }); },
  pick: (a) => { a.tone(1250, 0.07, { type: 'square', vol: 0.08 }); a.tone(1870, 0.12, { vol: 0.12, delay: 0.02 }); },
  break: (a) => { a.noise(0.22, { vol: 0.45, freq: 600 }); a.tone(130, 0.18, { slide: -70, vol: 0.2 }); },
  harvest: (a) => { a.tone(523, 0.12, { slide: 260, vol: 0.2 }); a.tone(1047, 0.18, { vol: 0.12, delay: 0.08 }); },
  plant: (a) => { a.tone(420, 0.08, { slide: -120, vol: 0.18 }); },
  eat: (a) => { a.tone(300, 0.07, { slide: 150, vol: 0.18 }); a.tone(360, 0.07, { slide: 150, vol: 0.18, delay: 0.1 }); },
  buy: (a) => { a.tone(988, 0.06, { vol: 0.15 }); a.tone(1319, 0.14, { vol: 0.15, delay: 0.06 }); },
  ship: (a) => { a.tone(660, 0.08, { vol: 0.15 }); a.tone(880, 0.12, { vol: 0.15, delay: 0.07 }); },
  select: (a) => { a.tone(760, 0.035, { type: 'square', vol: 0.05 }); },
  deny: (a) => { a.tone(170, 0.14, { type: 'square', vol: 0.07 }); },
  talk: (a) => { a.tone(520, 0.05, { type: 'triangle', vol: 0.15 }); a.tone(660, 0.07, { type: 'triangle', vol: 0.12, delay: 0.05 }); },
  sleep: (a) => { [523, 659, 784, 1047].forEach((f, i) => a.tone(f, 0.5, { vol: 0.12, delay: i * 0.12, attack: 0.02 })); },
  door: (a) => { a.noise(0.12, { vol: 0.2, freq: 400 }); },
};
