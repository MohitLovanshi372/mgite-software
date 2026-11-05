/** Mouth pose from real audio amplitude, or a speech-timing fallback for Web Speech. */
export interface SpeechAnimationInput {
  speaking: boolean;
  elapsed: number;
  text: string;
  charIndex?: number;
  amplitude?: number;
}
export interface SpeechAnimationFrame {
  speaking: boolean;
  mouthOpen: number;
  mouthWidth: number;
  source: 'audio' | 'timing' | 'idle';
}
export function sampleSpeechAnimation(input: SpeechAnimationInput): SpeechAnimationFrame {
  if (!input.speaking) return { speaking: false, mouthOpen: 0, mouthWidth: 1, source: 'idle' };
  const elapsed = Math.max(0, input.elapsed);
  const index = input.charIndex ?? Math.floor(elapsed * 13);
  const character = input.text[index % Math.max(1, input.text.length)]?.toLowerCase() || 'a';
  const rounded = /[ouोौूु]/u.test(character);
  const wide = /[eiइईिी]/u.test(character);
  const hasAudio = input.amplitude !== undefined && Number.isFinite(input.amplitude);
  const pulse = Math.pow(Math.max(0, Math.sin(elapsed * Math.PI * 8)), .7);
  const silence = /[\s.,!?।]/u.test(character);
  const openness = hasAudio
    ? Math.min(1, Math.max(0, (input.amplitude! - .012) * 7))
    : silence || /[mbp]/u.test(character) ? 0 : .12 + pulse * .65;
  return {
    speaking: true,
    mouthOpen: openness,
    mouthWidth: rounded ? .78 : wide ? 1.12 : 1,
    source: hasAudio ? 'audio' : 'timing',
  };
}
