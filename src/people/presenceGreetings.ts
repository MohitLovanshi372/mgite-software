import { FaceTrack, faceDistance } from './faceMemory.ts';

/** A greeting belongs to an arrival, not to every detection frame. */
export class PresenceGreetings {
  private known = new Map<string, { lastSeen: number; lastGreet: number; greetedThisVisit: boolean }>();
  private introduced: { descriptor: number[]; at: number }[] = [];
  private lastSpoken = -Infinity;

  observe(faces: FaceTrack[], now: number) {
    for (const face of faces) {
      if (!face.person) continue;
      const previous = this.known.get(face.person.id);
      this.known.set(face.person.id, {
        lastSeen: now,
        lastGreet: previous?.lastGreet ?? -Infinity,
        greetedThisVisit: Boolean(previous?.greetedThisVisit && now - previous.lastSeen < 15000),
      });
    }
    this.introduced = this.introduced.filter(item => now - item.at < 300000);
  }

  next(faces: FaceTrack[], now: number, busy: boolean): FaceTrack | null {
    if (busy || now - this.lastSpoken < 15000) return null;
    return faces.filter(face => {
      const center = face.x + face.width / 2;
      // Greet when someone approaches the front, rather than addressing every passer-by.
      if (face.frames < 4 || center < .25 || center > .75 || face.width < .12) return false;
      if (face.person) {
        const visit = this.known.get(face.person.id);
        return !visit?.greetedThisVisit && now - (visit?.lastGreet ?? -Infinity) >= 60000;
      }
      return !this.introduced.some(item => faceDistance(item.descriptor, face.descriptor) < .42);
    }).sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? null;
  }

  mark(face: FaceTrack, now: number) {
    this.lastSpoken = now;
    if (face.person) this.known.set(face.person.id, { lastSeen: now, lastGreet: now, greetedThisVisit: true });
    else this.introduced.push({ descriptor: [...face.descriptor], at: now });
  }
  reset() { this.known.clear(); this.introduced = []; this.lastSpoken = -Infinity; }
}

export function greetingText(name: string | null, language: string): string {
  if (language === 'hi-IN') return name
    ? `नमस्ते ${name}! कैसे हो? आपसे फिर मिलकर अच्छा लगा।`
    : 'नमस्ते! कैसे हो? आपसे मिलकर अच्छा लगा। कैमरे के सामने आए नए दोस्त, आपका नाम क्या है?';
  return name ? `Hello ${name}! How are you? It is lovely to see you again.`
    : 'Hello! How are you? It is lovely to meet you. My new friend in front of the camera, what is your name?';
}

/** Small greeting exchanges work even when no cloud AI provider is configured. */
export function smallTalkReply(text: string, language: string): string | null {
  const normalized = text.toLowerCase().trim().replace(/[.!?।]+$/u, '').trim();
  const hindi = language === 'hi-IN';
  if (/^(main |mai |mein |i am |i'm |i’m |मैं )?(theek hoon|thik hu|theek hu|thik hoon|fine|good|great|well|ठीक हूं|ठीक हूँ|अच्छा हूं|अच्छा हूँ)( thanks| thank you| shukriya| धन्यवाद)?$/u.test(normalized)) {
    return hindi ? 'यह सुनकर अच्छा लगा! बताइए, आज मैं आपकी किस काम में मदद करूँ?' : 'That is lovely to hear! What can I help you with today?';
  }
  if (/^(aur |and )?(aap kaise ho|aap kaise hain|tum kaise ho|how are you|you|आप कैसे हो|आप कैसे हैं|तुम कैसे हो)$/u.test(normalized)) {
    return hindi ? 'मैं तैयार हूँ, आपकी मदद के लिए! आज आपका दिन कैसा जा रहा है?' : 'I am ready to help! How is your day going?';
  }
  if (/^(thanks|thank you|shukriya|धन्यवाद|शुक्रिया)$/u.test(normalized)) {
    return hindi ? 'आपका स्वागत है! बताइए, और क्या मदद करूँ?' : 'You are welcome! What else can I help with?';
  }
  return null;
}
