const TRACKS = {
  intro: {
    name: "เสียงสะท้อนจากดันเจี้ยน",
    bpm: 76,
    root: 45,
    wave: "triangle",
    melody: [
      0,
      null,
      7,
      null,
      3,
      null,
      10,
      null,
      0,
      null,
      5,
      null,
      7,
      null,
      2,
      null,
    ],
  },
  map: {
    name: "เส้นทางนักผจญภัย",
    bpm: 92,
    root: 48,
    wave: "triangle",
    melody: [0, 7, 12, 7, 3, 10, 12, 10, 5, 12, 15, 12, 3, 10, 7, null],
  },
  floor0: {
    name: "ประตูหินโบราณ",
    bpm: 84,
    root: 43,
    wave: "square",
    melody: [0, null, 3, 5, 7, null, 5, 3, 0, null, -2, 0, 3, null, 2, null],
  },
  floor1: {
    name: "กองกระดูกเดินทัพ",
    bpm: 102,
    root: 38,
    wave: "square",
    melody: [0, 3, 7, 3, 0, 5, 8, 5, -2, 2, 5, 2, 0, 3, 2, null],
  },
  floor2: {
    name: "ใยพิษใต้สุสาน",
    bpm: 88,
    root: 41,
    wave: "sawtooth",
    melody: [0, null, 1, 6, 5, null, 1, 0, 8, null, 6, 5, 1, null, -1, null],
  },
  floor3: {
    name: "เงาในถ้ำลึก",
    bpm: 96,
    root: 36,
    wave: "triangle",
    melody: [0, 7, 6, 3, 0, 10, 7, 6, 3, 7, 6, 1, 0, 3, 1, null],
  },
  floor4: {
    name: "คัมภีร์แห่งเวท",
    bpm: 112,
    root: 45,
    wave: "square",
    melody: [0, 4, 7, 11, 12, 11, 7, 4, 2, 5, 9, 12, 14, 12, 9, 5],
  },
  floor5: {
    name: "บัลลังก์เนโครแมนเซอร์",
    bpm: 118,
    root: 33,
    wave: "sawtooth",
    melody: [0, 1, 6, 5, 0, 8, 6, 1, 0, -1, 5, 3, 0, 6, 5, 1],
  },
};

let context;
let master;
let musicBus;
let sfxBus;
let muted = true;
let trackKey = "intro";
let step = 0;
let timer;

function ensureAudio() {
  if (context) return context;
  context = new (window.AudioContext || window.webkitAudioContext)();
  master = context.createGain();
  musicBus = context.createGain();
  sfxBus = context.createGain();
  master.gain.value = 0.7;
  musicBus.gain.value = 0.34;
  sfxBus.gain.value = 0.7;
  musicBus.connect(master);
  sfxBus.connect(master);
  master.connect(context.destination);
  return context;
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function note(midi, when, duration, wave, volume, destination = musicBus) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  osc.type = wave;
  osc.frequency.setValueAtTime(hz(midi), when);
  filter.type = "lowpass";
  filter.frequency.value = wave === "sawtooth" ? 1050 : 1600;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(filter).connect(gain).connect(destination);
  osc.start(when);
  osc.stop(when + duration + 0.03);
}

function percussion(when, strong = false) {
  const length = Math.floor(context.sampleRate * 0.055);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = strong ? "lowpass" : "highpass";
  filter.frequency.value = strong ? 260 : 1800;
  gain.gain.value = strong ? 0.035 : 0.018;
  source.connect(filter).connect(gain).connect(musicBus);
  source.start(when);
}

function tick() {
  if (muted || !context) return;
  const track = TRACKS[trackKey] || TRACKS.map;
  const seconds = 60 / track.bpm / 2;
  const when = context.currentTime + 0.025;
  const offset = track.melody[step % track.melody.length];
  if (offset !== null)
    note(track.root + 12 + offset, when, seconds * 0.78, track.wave, 0.035);
  if (step % 4 === 0)
    note(
      track.root + (step % 8 ? 5 : 0),
      when,
      seconds * 3.5,
      "triangle",
      0.05,
    );
  if (step % 2 === 0) percussion(when, step % 8 === 0);
  step++;
  clearTimeout(timer);
  timer = setTimeout(tick, seconds * 1000);
}

function restartMusic() {
  clearTimeout(timer);
  step = 0;
  if (!muted) tick();
}

export async function setMuted(value) {
  muted = value;
  if (!muted) {
    ensureAudio();
    await context.resume();
    restartMusic();
  } else {
    clearTimeout(timer);
    if (context) master.gain.setTargetAtTime(0.0001, context.currentTime, 0.05);
  }
  if (context && !muted)
    master.gain.setTargetAtTime(0.7, context.currentTime, 0.05);
}

export function switchTrack(key) {
  if (!TRACKS[key] || key === trackKey) return TRACKS[trackKey]?.name || "";
  trackKey = key;
  restartMusic();
  return TRACKS[key].name;
}

export function currentTrackName() {
  return TRACKS[trackKey]?.name || "";
}

export function playSfx(kind) {
  if (muted) return;
  ensureAudio();
  const now = context.currentTime;
  const sweep = (from, to, duration, wave = "square", volume = 0.09) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(30, to),
      now + duration,
    );
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(sfxBus);
    osc.start(now);
    osc.stop(now + duration);
  };
  if (kind === "attack") sweep(520, 120, 0.16, "sawtooth");
  else if (kind === "enemy") sweep(150, 75, 0.22, "square", 0.11);
  else if (kind === "skill") {
    sweep(180, 980, 0.38, "triangle", 0.1);
    setTimeout(() => playSfx("impact"), 260);
  } else if (kind === "impact") sweep(380, 55, 0.18, "square", 0.12);
  else if (kind === "hurt") sweep(190, 85, 0.12, "sawtooth", 0.08);
  else if (kind === "potion") {
    note(72, now, 0.12, "square", 0.08, sfxBus);
    note(76, now + 0.1, 0.15, "square", 0.07, sfxBus);
    note(79, now + 0.2, 0.2, "square", 0.06, sfxBus);
  } else if (kind === "victory")
    [0, 4, 7, 12].forEach((n, i) =>
      note(60 + n, now + i * 0.11, 0.28, "square", 0.08, sfxBus),
    );
  else if (kind === "error") sweep(130, 92, 0.2, "square", 0.06);
  else note(72, now, 0.08, "square", 0.045, sfxBus);
}
