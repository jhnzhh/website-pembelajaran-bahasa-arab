import correctAudioUrl from "./imports/correct.mp3";
import wrongAudioUrl from "./imports/wrong.mp3";

let activeAudio: HTMLAudioElement | null = null;
let soundContext: AudioContext | null = null;
const soundBuffers = new Map<string, Promise<AudioBuffer>>();

function getSoundContext(): AudioContext | null {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) return null;
  if (!soundContext) soundContext = new AudioContextConstructor();
  return soundContext;
}

function loadSoundBuffer(context: AudioContext, src: string): Promise<AudioBuffer> {
  const cached = soundBuffers.get(src);
  if (cached) return cached;

  const bufferPromise = fetch(src)
    .then((response) => {
      if (!response.ok) throw new Error(`Sound effect request failed (${response.status}): ${src}`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data));

  soundBuffers.set(src, bufferPromise);
  void bufferPromise.catch(() => {
    if (soundBuffers.get(src) === bufferPromise) soundBuffers.delete(src);
  });
  return bufferPromise;
}

export function playFeedbackSound(correct: boolean): void {
  const src = correct ? correctAudioUrl : wrongAudioUrl;
  const context = getSoundContext();

  if (!context) {
    const audio = new Audio(src);
    void audio.play().catch((error: unknown) => console.error("Efek suara gagal diputar:", error));
    return;
  }

  const resume = context.state === "suspended" ? context.resume() : Promise.resolve();
  void Promise.all([loadSoundBuffer(context, src), resume])
    .then(([buffer]) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
    })
    .catch((error: unknown) => console.error("Efek suara gagal diputar:", error));
}

if (typeof window !== "undefined") {
  const context = getSoundContext();
  if (context) {
    for (const src of [correctAudioUrl, wrongAudioUrl]) {
      void loadSoundBuffer(context, src).catch((error: unknown) =>
        console.error("Efek suara gagal dimuat:", error),
      );
    }
  }
}

export function claimAudioPlayback(audio: HTMLAudioElement): void {
  if (activeAudio && activeAudio !== audio) {
    activeAudio.pause();
  }
  activeAudio = audio;
}

export async function playExclusiveAudio(audio: HTMLAudioElement): Promise<void> {
  claimAudioPlayback(audio);

  try {
    await audio.play();
  } catch (error) {
    if (activeAudio === audio) activeAudio = null;
    throw error;
  }
}

export function stopExclusiveAudio(audio: HTMLAudioElement): void {
  if (activeAudio === audio) activeAudio = null;
  audio.pause();
}
