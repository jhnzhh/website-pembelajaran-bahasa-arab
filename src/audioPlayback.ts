let activeAudio: HTMLAudioElement | null = null;

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
