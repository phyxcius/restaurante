// Reproductor de música ambiental para el Menú Digital (Web Audio API + URL MP3 opcional)

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let loopTimer: number | null = null;
let htmlAudio: HTMLAudioElement | null = null;
let activePlaying = false;

// Progresión cálida estilo acoustic lounge / chill (Am7 - Fmaj7 - Cmaj7 - G6)
const CHORD_SEQUENCE: number[][] = [
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [196.0, 246.94, 293.66, 329.63], // G6
];

const MELODY_NOTES = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.0];

let stepIndex = 0;

function playSoftVoice(ctx: AudioContext, dest: AudioNode, freq: number, startTime: number, duration: number, peakGain: number, wave: OscillatorType = 'triangle') {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const env = ctx.createGain();

  osc.type = wave;
  osc.frequency.setValueAtTime(freq, startTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1100, startTime);

  env.gain.setValueAtTime(0.0001, startTime);
  env.gain.linearRampToValueAtTime(peakGain, startTime + 0.12);
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(filter);
  filter.connect(env);
  env.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function scheduleLoungeBar() {
  if (!audioCtx || !masterGain || !activePlaying) return;

  const now = audioCtx.currentTime;
  const chord = CHORD_SEQUENCE[stepIndex % CHORD_SEQUENCE.length];

  // Pad armónico suave
  chord.forEach((freq, idx) => {
    playSoftVoice(audioCtx!, masterGain!, freq, now + idx * 0.06, 2.3, 0.045, 'sine');
  });

  // Arpegio melódico tipo guitarra / marimba suave
  const m1 = MELODY_NOTES[stepIndex % MELODY_NOTES.length];
  const m2 = MELODY_NOTES[(stepIndex + 2) % MELODY_NOTES.length];
  playSoftVoice(audioCtx, masterGain, m1, now + 0.35, 0.9, 0.04, 'triangle');
  playSoftVoice(audioCtx, masterGain, m2, now + 1.15, 0.9, 0.035, 'triangle');

  stepIndex = (stepIndex + 1) % 64;
}

function startSynthLoop() {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;

    if (!audioCtx) {
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    if (!masterGain) {
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.55, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }

    if (loopTimer !== null) {
      window.clearInterval(loopTimer);
      loopTimer = null;
    }

    scheduleLoungeBar();
    loopTimer = window.setInterval(scheduleLoungeBar, 2200);
  } catch {
    // Ignorar si el navegador restringe Web Audio
  }
}

export function startAmbientMusic(customUrl?: string): void {
  activePlaying = true;
  const cleanUrl = (customUrl || '').trim();

  if (cleanUrl && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:'))) {
    try {
      if (htmlAudio) {
        htmlAudio.pause();
        htmlAudio = null;
      }
      htmlAudio = new Audio(cleanUrl);
      htmlAudio.loop = true;
      htmlAudio.volume = 0.35;
      void htmlAudio.play().catch(() => {
        if (activePlaying) {
          startSynthLoop();
        }
      });
      return;
    } catch {
      // Fallback al sintetizador ambiente
    }
  }

  startSynthLoop();
}

export function stopAmbientMusic(): void {
  activePlaying = false;
  if (loopTimer !== null) {
    window.clearInterval(loopTimer);
    loopTimer = null;
  }
  if (htmlAudio) {
    try {
      htmlAudio.pause();
      htmlAudio.currentTime = 0;
    } catch {}
    htmlAudio = null;
  }
}

export function isAmbientMusicPlaying(): boolean {
  return activePlaying;
}
