import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AudioLines, Mic, Play, Square, UserRound } from 'lucide-react';
import { AIStateMode } from '../../types/index.ts';
import { AvatarEmotion } from '../../avatar/types.ts';
import { HumanBoyRig } from '../../avatar/HumanBoyRig.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface Props {
  avatarState: AIStateMode;
  lastAssistantMessage?: string;
  interimTranscript?: string;
  controlledEmote?: AvatarEmotion | null;
  onEmoteChange?: (emote: AvatarEmotion) => void;
  isMusicPlaying?: boolean;
  isAutoSpeechActive?: boolean;
  onToggleAutoSpeech?: () => void;
}

export const JarvisAvatarCenterpiece: React.FC<Props> = ({ avatarState, lastAssistantMessage, interimTranscript, isAutoSpeechActive, onToggleAutoSpeech }) => {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gaze = useRef({ x: 0, y: 0 });
  const [unavailable, setUnavailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);

  useEffect(() => {
    const container = host.current;
    const element = canvas.current;
    if (!container || !element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: element, antialias: true, alpha: true });
    } catch {
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
    camera.position.set(0, .36, 5.2);
    camera.lookAt(0, .3, 0);
    scene.add(new THREE.HemisphereLight('#edf4ff', '#565060', 2.5));
    const key = new THREE.DirectionalLight('#ffe3bf', 3.5); key.position.set(-3, 4, 5); scene.add(key);
    const fill = new THREE.DirectionalLight('#b4d1ff', 1.7); fill.position.set(3, 2, 2); scene.add(fill);
    const rim = new THREE.DirectionalLight('#e5be78', 3); rim.position.set(-2, 2, -2); scene.add(rim);
    const rig = new HumanBoyRig(); scene.add(rig.group);
    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < .9 ? 5.7 : 5.2;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = 0, previous = performance.now();
    const frame = (now: number) => {
      const delta = Math.min((now - previous) / 1000, .05); previous = now;
      const speech = ultronVoice.getSpeechAnimationFrame();
      if (speech.speaking !== speakingRef.current) { speakingRef.current = speech.speaking; setSpeaking(speech.speaking); }
      const opening = rig.update(delta, now / 1000, speech, gaze.current, motion.matches);
      // Expose playback diagnostics for browser integration checks.
      element.dataset.mouthOpen = opening.toFixed(3);
      element.dataset.speechSource = speech.source;
      if (!document.hidden) renderer.render(scene, camera);
      animation = requestAnimationFrame(frame);
    };
    animation = requestAnimationFrame(frame);
    const lost = (event: Event) => { event.preventDefault(); setUnavailable(true); };
    element.addEventListener('webglcontextlost', lost);
    return () => { cancelAnimationFrame(animation); observer.disconnect(); element.removeEventListener('webglcontextlost', lost); rig.dispose(); renderer.dispose(); };
  }, []);

  const status = speaking ? 'Speaking with you' : avatarState === 'LISTENING' ? 'Listening to you' : ['THINKING', 'EXECUTING'].includes(avatarState) ? 'Thinking it through' : 'Ready when you are';
  return <section className="human-avatar-stage" aria-label="JARVIS human companion">
    <div className="human-avatar-portrait" ref={host} onPointerMove={event => { const rect = event.currentTarget.getBoundingClientRect(); gaze.current = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: -((event.clientY - rect.top) / rect.height * 2 - 1) }; }} onPointerLeave={() => { gaze.current = { x: 0, y: 0 }; }}>
      <div className="avatar-halo" aria-hidden="true" />
      <div className="avatar-nameplate"><span>MEET YOUR COMPANION</span><strong>JARVIS<span>Human edition</span></strong></div>
      <canvas ref={canvas} role="img" aria-label="Human boy JARVIS with animated eyes and speech-synchronized lips" />
      {unavailable && <div className="avatar-unavailable" role="status"><UserRound size={56} /><p>3D view is unavailable on this device.</p><span>You can still chat and use voice.</span></div>}
      <div className="avatar-presence"><i className={speaking ? 'speaking' : ''} />{status}</div>
    </div>
    <div className="avatar-controls"><button type="button" onClick={() => { if (speaking) ultronVoice.stop(); else ultronVoice.speak('Namaste! Main JARVIS hoon. Aapka personal AI companion. Bataiye, aaj hum kya karein?'); }}>{speaking ? <Square size={14} /> : <Play size={14} />}{speaking ? 'Stop voice' : 'Meet JARVIS'}</button>{onToggleAutoSpeech && <button type="button" aria-pressed={Boolean(isAutoSpeechActive)} onClick={onToggleAutoSpeech}><Mic size={14} />{isAutoSpeechActive ? 'Hands-free on' : 'Hands-free chat'}</button>}<span><AudioLines size={14} />{speaking ? 'Voice in motion' : 'Here to help'}</span></div>
    <div className="assistant-readout avatar-transcript" role="status" aria-live="polite"><p className="assistant-message">{interimTranscript || lastAssistantMessage || 'Hi, I’m JARVIS. What’s on your mind?'}</p></div>
  </section>;
};
