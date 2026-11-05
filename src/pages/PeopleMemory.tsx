import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, Users, Trash2, UserRound, Volume2 } from 'lucide-react';
import { FaceTracker, FaceTrack, PersonProfile, loadPeople, savePerson, deletePerson, clearPeople, spokenName } from '../people/faceMemory.ts';
import { PresenceGreetings, greetingText, smallTalkReply } from '../people/presenceGreetings.ts';
import { detectFaces, loadFaceDetector } from '../people/faceDetector.ts';
import { ultronVoice } from '../utils/ultronVoice.ts';

interface PeopleMemoryProps {
  visible?: boolean;
  busy?: boolean;
  onBeforeListen: () => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onGreeting?: (text: string) => void;
  onConversation?: (text: string) => void;
  onOpenPeople?: () => void;
}
export function PeopleMemory({ visible = true, busy = false, onBeforeListen, onSpeakingChange, onGreeting, onConversation, onOpenPeople }: PeopleMemoryProps) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const session = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognizer = useRef<any>(null);
  const ownsSpeech = useRef(false);
  const playbackId = useRef(-1);
  const policy = useRef(new PresenceGreetings());
  const busyRef = useRef(busy); busyRef.current = busy;
  const voiceBusy = useRef(false);
  const replyHandler = useRef<(text: string, id: number) => void>(() => {});
  const voiceToken = useRef(0);
  const tracker = useRef(new FaceTracker());
  const [people, setPeople] = useState<PersonProfile[]>([]);
  const peopleRef = useRef(people); peopleRef.current = people;
  const [faces, setFaces] = useState<FaceTrack[]>([]);
  const facesRef = useRef(faces); facesRef.current = faces;
  const [selected, setSelected] = useState<number | null>(null);
  const selectedRef = useRef(selected); selectedRef.current = selected;
  const [name, setName] = useState('');
  const [reply, setReply] = useState('');
  const [autoAsk, setAutoAsk] = useState(true);
  const autoAskRef = useRef(autoAsk); autoAskRef.current = autoAsk;
  const [phase, setPhase] = useState<'off' | 'loading' | 'on'>('off');
  const [voicePhase, setVoicePhase] = useState<'off' | 'asking' | 'listening'>('off');
  const [message, setMessage] = useState('Enable greetings to let JARVIS notice who is in front of the camera.');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [language, setLanguage] = useState('hi-IN');
  const languageRef = useRef(language); languageRef.current = language;
  const selectedFace = faces.find(face => face.id === selected);

  const stopVoice = () => {
    voiceToken.current++;
    if (voiceTimer.current) clearTimeout(voiceTimer.current);
    if (ownsSpeech.current) { ownsSpeech.current = false; if (playbackId.current === ultronVoice.getPlaybackId()) { ultronVoice.stop(); onSpeakingChange?.(false); } }
    voiceBusy.current = false;
    if (recognizer.current) { recognizer.current.onend = null; recognizer.current.onerror = null; recognizer.current.onresult = null; recognizer.current.abort(); recognizer.current = null; }
    setVoicePhase('off');
  };
  const stopCamera = () => {
    session.current++;
    if (timer.current) clearTimeout(timer.current);
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
    tracker.current.reset(); facesRef.current = []; setFaces([]);
    selectedRef.current = null; setSelected(null); setName(''); setReply(''); stopVoice(); setPhase('off');
    setMessage('Camera is off. Saved names stay in this browser.');
  };
  const release = useRef(stopCamera); release.current = stopCamera;
  useEffect(() => {
    let alive = true;
    loadPeople().then(result => { if (alive) { setPeople(result); setStorageReady(true); } }).catch(err => { if (alive) setError(err.message); });
    return () => { alive = false; release.current(); };
  }, []);

  const listen = (id: number, token: number, purpose: 'name' | 'conversation' = 'name') => {
    if (token !== voiceToken.current || selectedRef.current !== id || !facesRef.current.some(face => face.id === id)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { voiceBusy.current = false; setVoicePhase('off'); setMessage(purpose === 'name' ? 'Type your name below.' : 'Type your reply below.'); return; }
    onBeforeListen();
    voiceBusy.current = true;
    const recognition = new SpeechRecognition(); recognizer.current = recognition;
    recognition.lang = languageRef.current; recognition.interimResults = false; recognition.continuous = false;
    recognition.onstart = () => { if (token === voiceToken.current) { setVoicePhase('listening'); setMessage(purpose === 'name' ? 'Listening for your name…' : 'Listening to you. How are you?'); } };
    recognition.onresult = (event: any) => {
      if (token !== voiceToken.current || selectedRef.current !== id) return;
      const heard = event.results[0][0].transcript.trim();
      if (purpose === 'name') {
        setName(spokenName(heard)); setMessage('Check your name below, then choose Save name.');
      } else if (heard) {
        stopVoice(); setReply(''); replyHandler.current(heard, id);
      }
    };
    recognition.onerror = (event: any) => {
      if (token !== voiceToken.current) return;
      setMessage(event.error === 'not-allowed' ? 'Microphone permission was denied. You can type instead.' : 'No clear reply heard. Try again or type instead.');
    };
    recognition.onend = () => { if (token === voiceToken.current) { voiceBusy.current = false; setVoicePhase('off'); recognizer.current = null; if (voiceTimer.current) clearTimeout(voiceTimer.current); } };
    try { recognition.start(); voiceTimer.current = setTimeout(() => { if (token === voiceToken.current) recognition.stop(); }, 10000); }
    catch { voiceBusy.current = false; setVoicePhase('off'); setMessage('Microphone could not start. You can type instead.'); }
  };
  const speakLine = (text: string, after?: (token: number) => void) => {
    stopVoice(); onBeforeListen(); ultronVoice.stop();
    const token = voiceToken.current;
    ownsSpeech.current = true; voiceBusy.current = true; setVoicePhase('asking');
    setMessage(text); onGreeting?.(text);
    let completed = false;
    const finish = () => {
      if (completed || token !== voiceToken.current) return;
      completed = true;
      if (voiceTimer.current) clearTimeout(voiceTimer.current);
      const interrupted = playbackId.current !== ultronVoice.getPlaybackId();
      if (ownsSpeech.current && !interrupted) ultronVoice.stop();
      ownsSpeech.current = false; voiceBusy.current = false; setVoicePhase('off');
      if (!interrupted) { onSpeakingChange?.(false); after?.(token); }
    };
    voiceTimer.current = setTimeout(finish, 15000);
    ultronVoice.speakViaWebSpeech(text, {
      lang: languageRef.current,
      onStart: () => { if (token === voiceToken.current) onSpeakingChange?.(true); },
      onEnd: finish,
      onError: finish,
    });
    playbackId.current = ultronVoice.getPlaybackId();
  };
  replyHandler.current = (text, id) => {
    const localReply = smallTalkReply(text, languageRef.current);
    if (localReply && facesRef.current.some(face => face.id === id)) {
      speakLine(localReply, token => listen(id, token, 'conversation'));
    } else {
      selectedRef.current = null; setSelected(null);
      setMessage(`You said: ${text}`); onConversation?.(text);
    }
  };
  const askName = (id: number) => {
    const face = facesRef.current.find(item => item.id === id);
    if (!face) return;
    selectedRef.current = id; setSelected(id); setName(''); setReply('');
    policy.current.mark(face, Date.now());
    speakLine(greetingText(face.person?.name ?? null, languageRef.current), token => listen(id, token, face.person ? 'conversation' : 'name'));
  };
  const askRef = useRef(askName); askRef.current = askName;
  const startCamera = async () => {
    stopCamera(); setError(''); setPhase('loading'); setMessage('Preparing local face recognition…'); policy.current.reset();
    const current = session.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs HTTPS or localhost and a supported browser.');
      await loadFaceDetector(); if (current !== session.current) return;
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (current !== session.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      media.getVideoTracks()[0].onended = () => { if (current === session.current) { stopCamera(); setError('Camera disconnected. Reconnect it and start again.'); } };
      video.current!.srcObject = media; await video.current!.play();
      if (current !== session.current) return;
      setPhase('on'); setMessage('Camera on, preview hidden. Come in front of JARVIS to say hello.');
      const scan = async () => {
        if (current !== session.current || !video.current) return;
        try {
          if (document.hidden) { timer.current = setTimeout(scan, 600); return; }
          const observations = await detectFaces(video.current);
          if (current !== session.current) return;
          const tracks = tracker.current.update(observations, peopleRef.current, Date.now()); facesRef.current = tracks; setFaces(tracks);
          if (selectedRef.current !== null && !tracks.some(face => face.id === selectedRef.current)) {
            selectedRef.current = null; setSelected(null); setName(''); stopVoice(); setMessage('That person moved away. Come back in front of the camera to continue.');
          }
          const now = Date.now();
          policy.current.observe(tracks, now);
          const arrival = policy.current.next(tracks, now, busyRef.current || ultronVoice.getSpeakingStatus() || voiceBusy.current || selectedRef.current !== null);
          if (autoAskRef.current && arrival) askRef.current(arrival.id);
          timer.current = setTimeout(scan, 350);
        } catch { if (current === session.current) { stopCamera(); setError('Face detection stopped. Restart the camera to try again.'); } }
      };
      void scan();
    } catch (err: any) {
      if (current !== session.current) return;
      stopCamera();
      setError(err.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in browser settings.' : err.name === 'NotFoundError' ? 'No camera found on this device.' : err.message || 'Camera could not start.');
    }
  };
  const remember = async () => {
    const face = facesRef.current.find(item => item.id === selectedRef.current);
    if (!face || face.frames < 4 || face.person || !name.trim() || !storageReady || saving) return;
    setSaving(true); setError(''); stopVoice();
    const person: PersonProfile = { id: crypto.randomUUID(), name: name.trim(), descriptor: [...face.descriptor], createdAt: new Date().toISOString() };
    try {
      await savePerson(person); const next = [...peopleRef.current, person]; peopleRef.current = next; setPeople(next);
      setName('');
      const currentFace = facesRef.current.find(item => item.id === face.id);
      if (currentFace) {
        policy.current.mark({ ...currentFace, person }, Date.now());
        const hello = languageRef.current === 'hi-IN'
          ? `नमस्ते ${person.name}! आपका नाम याद रख लिया है। आपसे मिलकर अच्छा लगा। कैसे हो?`
          : `Hello ${person.name}! I will remember your name. It is lovely to meet you. How are you?`;
        speakLine(hello, token => listen(face.id, token, 'conversation'));
      } else { selectedRef.current = null; setSelected(null); setMessage(`${person.name} is saved on this device.`); }
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    const id = selectedRef.current;
    stopVoice(); const text = reply.trim(); setReply('');
    if (id !== null) replyHandler.current(text, id);
  };
  const displayPosition = (face: FaceTrack) => {
    const center = face.x + face.width / 2;
    return center < .3 ? 'Camera left' : center > .7 ? 'Camera right' : 'In front';
  };

  return <div className={visible ? 'people-page' : 'presence-panel'}>
    <video ref={video} muted playsInline aria-hidden="true" className="presence-video-hidden" />
    {visible && <header className="people-heading"><div><span className="section-kicker">A WARM WELCOME, WITHOUT THE CAMERA FEED</span><h1>Good to see you.</h1><p>Come in front of JARVIS. Say hello, share your name, and have a chat.</p></div><span className="people-local"><Users size={15} />{people.length} remembered</span></header>}
    <div className="presence-toolbar">
      <span className={`presence-indicator ${phase === 'on' ? 'active' : ''}`}><Camera size={15} />{phase === 'on' ? `Camera on · ${faces.length} in view` : phase === 'loading' ? 'Starting camera…' : 'Camera off'}</span>
      <span className="presence-hidden-label">Preview hidden</span>
      {!visible && <button type="button" onClick={onOpenPeople} aria-label="Open people memory">People</button>}
      <button type="button" onClick={phase === 'off' ? startCamera : stopCamera}>{phase === 'off' ? <Camera size={15} /> : <CameraOff size={15} />}{phase === 'off' ? 'Enable greetings' : 'Stop camera'}</button>
    </div>
    {visible && <div className="people-options"><label><input type="checkbox" checked={autoAsk} onChange={event => { setAutoAsk(event.target.checked); if (!event.target.checked) stopVoice(); }} />Greet arrivals and ask new people their name</label><select aria-label="Name conversation language" value={language} onChange={event => setLanguage(event.target.value)}><option value="hi-IN">हिन्दी / Hinglish</option><option value="en-IN">English</option></select></div>}
    {(phase !== 'off' || visible) && <div className="people-message" role="status" aria-live="polite">{voicePhase === 'listening' ? <Mic size={16} /> : <Volume2 size={16} />}{message}</div>}
    {error && <p className="people-error" role="alert">{error}</p>}
    {visible && faces.length > 0 && <div className="presence-people" aria-label="Detected people">{faces.map(face => <button type="button" key={face.id} aria-pressed={selected === face.id} onClick={() => { stopVoice(); selectedRef.current = face.id; setSelected(face.id); setName(''); setReply(''); }}><UserRound size={17} /><span>{face.person ? `Likely ${face.person.name}` : `Guest ${face.id}`}<small>{displayPosition(face)}</small></span></button>)}</div>}
    {selectedFace && <section className="workspace-card people-enroll"><div><h2>{selectedFace.person ? `Chat with ${selectedFace.person.name}` : `Hello, new friend · ${displayPosition(selectedFace)}`}</h2><p className="card-description">{selectedFace.person ? 'You can speak after the greeting, or type your reply.' : 'One person at a time, please. Stay in front of the camera and check your name before saving.'}</p></div>{!selectedFace.person ? <>
      <div className="people-name-form"><label>Name<input value={name} maxLength={60} onChange={event => setName(event.target.value)} placeholder="Say or type your name" autoComplete="off" /></label><button type="button" onClick={() => askName(selectedFace.id)} disabled={selectedFace.frames < 4}><Mic size={15} />Ask & listen</button><button type="button" onClick={remember} disabled={!name.trim() || selectedFace.frames < 4 || saving || !storageReady}>{saving ? 'Saving…' : 'Save name'}</button></div>
      <p className="card-description">Save only people who agree to be remembered. You can delete your saved profile anytime.</p>
    </> : <form className="people-name-form" onSubmit={event => { event.preventDefault(); sendReply(); }}><label>Your reply<input value={reply} onChange={event => setReply(event.target.value)} placeholder="How are you today?" /></label><button type="button" onClick={() => { stopVoice(); listen(selectedFace.id, voiceToken.current, 'conversation'); }}><Mic size={15} />Speak reply</button><button type="submit" disabled={!reply.trim()}>Send reply</button></form>}<button type="button" className="people-dismiss" onClick={() => { stopVoice(); policy.current.mark(selectedFace, Date.now()); selectedRef.current = null; setSelected(null); setName(''); }}>Dismiss</button></section>}
    {visible && <section className="workspace-card people-saved"><div className="people-saved-heading"><h2>People you remember</h2>{people.length > 0 && <button type="button" onClick={async () => { if (!window.confirm('Delete every saved face and name from this browser?')) return; try { await clearPeople(); peopleRef.current = []; setPeople([]); setMessage('All saved face profiles were deleted.'); } catch (err: any) { setError(err.message); } }}>Delete all</button>}</div>
      {!people.length ? <p className="card-description">No faces saved yet. Enable greetings and introduce yourself.</p> : <ul>{people.map(person => <li key={person.id}><span className="people-person-icon"><UserRound size={18} /></span><div><strong>{person.name}</strong><small>Saved on this device</small></div><button type="button" aria-label={`Forget ${person.name}`} onClick={async () => { try { await deletePerson(person.id); const next = peopleRef.current.filter(item => item.id !== person.id); peopleRef.current = next; setPeople(next); setMessage(`${person.name} was removed from face memory.`); } catch (err: any) { setError(err.message); } }}><Trash2 size={16} /></button></li>)}</ul>}
      <p className="people-storage-note">The camera feed is never displayed. Face profiles stay in this browser; browser voice recognition may use its provider’s online service. Face matching is approximate and is not a login check. Detection stays on while navigating this app until you choose Stop camera. Closing or reloading the app stops it.</p>
    </section>}
  </div>;
}
