/**
 * Automated Test Script: Assistant Hindi/Hinglish Feminine Grammatical Gender Validation
 *
 * Verifies that the assistant's Hindi and Hinglish responses consistently use
 * feminine grammatical forms for verbs, adjectives, and self-referential terms.
 *
 * User Mandates Verified:
 * - "Main check karti hoon." (NOT "karta hoon")
 * - "Main bata deti hoon." / "Main bata dungi." (NOT "bata dunga" / "bata deta hoon")
 * - "Main kar dungi." / "Main kar rahi hoon." (NOT "kar dunga" / "kar raha hoon")
 * - "Main dekh leti hoon." / "Main dekh lungi." (NOT "dekh leta hoon" / "dekh lunga")
 * - "Main samajh gayi." (NOT "samajh gaya")
 * - "Main ready hoon." / "Main taiyyar hoon."
 * - "Maine check kar liya hai." (NOT "Maine check kar liya")
 * - "Main aapki kya madad kar sakti hoon?" (NOT "kar sakta hoon")
 * - Feminine assistant self-identification ("Main aapki assistant hoon", NOT "aapka")
 * - Devanagari Hindi feminine forms (करती हूँ, कर रही हूँ, कर दूँगी, देख लेती हूँ, समझ गई, आदि)
 * - User gender preservation (the rule applies strictly to the ASSISTANT, not the user)
 * - Across all contexts: normal conversation, tool results, system status, reminders, confirmations, notifications, voice responses.
 */

import { SpeechTextNormalizer } from '../core/voice/speechTextNormalizer.ts';

export interface GrammarViolation {
  matchedText: string;
  category: 'verb' | 'adjective' | 'self_identification' | 'missing_particle';
  issue: string;
  expectedForm: string;
  index: number;
}

export interface GrammarValidationResult {
  isValid: boolean;
  violations: GrammarViolation[];
  normalizedText?: string;
}

// Patterns that indicate masculine self-referential verbs or adjectives in Hinglish
const HINGLISH_MASCULINE_PATTERNS: Array<{
  regex: RegExp;
  category: GrammarViolation['category'];
  issue: string;
  expectedForm: string;
}> = [
  // 1. Present habitual: "karta hoon", "dekh leta hoon", "bata deta hoon", "bolta hoon", etc.
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?karta\s+(?:hoon|hu|hun)\b/gi,
    category: 'verb',
    issue: 'Used masculine present habitual "karta hoon/hu"',
    expectedForm: 'karti hoon',
  },
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?bata\s+deta\s+(?:hoon|hu|hun)\b/gi,
    category: 'verb',
    issue: 'Used masculine "bata deta hoon/hu"',
    expectedForm: 'bata deti hoon',
  },
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?dekh\s+leta\s+(?:hoon|hu|hun)\b/gi,
    category: 'verb',
    issue: 'Used masculine "dekh leta hoon/hu"',
    expectedForm: 'dekh leti hoon',
  },
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?(?:sochta|bolta|chalta|jaanta|kehta)\s+(?:hoon|hu|hun)\b/gi,
    category: 'verb',
    issue: 'Used masculine habitual verb with "hoon/hu"',
    expectedForm: 'feminine form (e.g. sochti/bolti/chalti/jaanti hoon)',
  },

  // 2. Present continuous: "kar raha hoon", "dekh raha hoon", "chal raha hoon", etc.
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?raha\s+(?:hoon|hu|hun)\b/gi,
    category: 'verb',
    issue: 'Used masculine continuous aspect "raha hoon/hu"',
    expectedForm: 'rahi hoon',
  },

  // 3. Future tense: "kar dunga", "karunga", "bata dunga", "bataunga", "dekh lunga", etc.
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?(?:kar|bata|dekh|bana|sun|rakh|samjha|bhej|chala|padh|likh)\s+dunga\b/gi,
    category: 'verb',
    issue: 'Used masculine future auxiliary "... dunga"',
    expectedForm: '... dungi',
  },
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?(?:karunga|bataunga|dekhunga|banaunga|sununga|bolunga|chalaunga|rahunga)\b/gi,
    category: 'verb',
    issue: 'Used masculine 1st person future inflected verb (...unga)',
    expectedForm: '...ungi (e.g. karungi, bataungi, dekhungi)',
  },
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?dekh\s+lunga\b/gi,
    category: 'verb',
    issue: 'Used masculine future "dekh lunga"',
    expectedForm: 'dekh lungi',
  },

  // 4. Modal verbs: "kar sakta hoon", "bata sakta hoon", etc.
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?sakta\s+(?:hoon|hu|hun)\b/gi,
    category: 'verb',
    issue: 'Used masculine potential modal "sakta hoon/hu"',
    expectedForm: 'sakti hoon',
  },

  // 5. Past / Perfective: "samajh gaya", etc.
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?samajh\s+gaya\b/gi,
    category: 'verb',
    issue: 'Used masculine past perfective "samajh gaya"',
    expectedForm: 'samajh gayi',
  },

  // 6. Reminders: "yaad dilaunga"
  {
    regex: /\byaad\s+dilaunga\b/gi,
    category: 'verb',
    issue: 'Used masculine reminder phrasing "yaad dilaunga"',
    expectedForm: 'yaad dilaungi',
  },

  // 7. Check completion: "maine check kar liya" without "hai"
  {
    regex: /\bmaine\s+check\s+kar\s+liya\b(?!\s*hai)/gi,
    category: 'missing_particle',
    issue: 'Used incomplete form "maine check kar liya" without auxiliary "hai"',
    expectedForm: 'maine check kar liya hai',
  },

  // 8. Adjectives & states: "thaka hua hoon", "akela hoon"
  {
    regex: /\b(?:main|mai)?\s*(?:[a-zA-Z\s]{0,25}?\b)?thaka\s+hua\s*(?:hoon|hu|hun)?\b/gi,
    category: 'adjective',
    issue: 'Used masculine participle/adjective "thaka hua"',
    expectedForm: 'thaki hui',
  },
  {
    regex: /\b(?:main|mai)\s+(?:[a-zA-Z\s]{0,20}?\b)?akela\s+(?:hoon|hu|hun)\b/gi,
    category: 'adjective',
    issue: 'Used masculine adjective "akela hoon"',
    expectedForm: 'akeli hoon',
  },

  // 9. Self-identification: "Main aapka assistant / sathi / madadgar"
  {
    regex: /\b(?:main|mai)\s+aapka\s+(?:[a-zA-Z\s]{0,20}?\b)?(?:assistant|sathi|madadgar)\b/gi,
    category: 'self_identification',
    issue: 'Used masculine possessive "aapka" for female assistant identity',
    expectedForm: 'aapki assistant / sathi / madadgar',
  },
];

// Patterns that indicate masculine self-referential verbs or adjectives in Devanagari Hindi
const DEVANAGARI_MASCULINE_PATTERNS: Array<{
  regex: RegExp;
  category: GrammarViolation['category'];
  issue: string;
  expectedForm: string;
}> = [
  // करता हूँ
  {
    regex: /करता\s+(?:हूँ|हूं)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari habitual "करता हूँ"',
    expectedForm: 'करती हूँ',
  },
  // रहा हूँ
  {
    regex: /रहा\s+(?:हूँ|हूं)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari continuous "रहा हूँ"',
    expectedForm: 'रही हूँ',
  },
  // सकता हूँ
  {
    regex: /सकता\s+(?:हूँ|हूं)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari modal "सकता हूँ"',
    expectedForm: 'सकती हूँ',
  },
  // दूँगा / दूंगा
  {
    regex: /(?:कर|बता|देख|बना|भेज|चला|रख)\s+(?:दूँगा|दूंगा)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari future auxiliary "दूँगा/दूंगा"',
    expectedForm: 'दूँगी / दूंगी',
  },
  // करूँगा, बताऊँगा, देखूँगा
  {
    regex: /(?:करूँगा|करूंगा|बताऊँगा|बताऊंगा|देखूँगा|देखूंगा|रहूँगा|रहूंगा|बोलूँगा|बोलूंगा|सुनूँगा|सुनूंगा)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari inflected future verb form (...ऊंगा)',
    expectedForm: '...ऊँगी / ...ऊंगी',
  },
  // बता देता हूँ
  {
    regex: /बता\s+देता\s+(?:हूँ|हूं)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari "बता देता हूँ"',
    expectedForm: 'बता देती हूँ',
  },
  // देख लेता हूँ
  {
    regex: /देख\s+लेता\s+(?:हूँ|हूं)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari "देख लेता हूँ"',
    expectedForm: 'देख लेती हूँ',
  },
  // देख लूँगा
  {
    regex: /देख\s+(?:लूँगा|लूंगा)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari "देख लूँगा"',
    expectedForm: 'देख लूँगी',
  },
  // समझ गया
  {
    regex: /समझ\s+गया/g,
    category: 'verb',
    issue: 'Used masculine Devanagari past perfective "समझ गया"',
    expectedForm: 'समझ गई',
  },
  // याद दिलाऊँगा
  {
    regex: /याद\s+(?:दिलाऊँगा|दिलाऊंगा)/g,
    category: 'verb',
    issue: 'Used masculine Devanagari reminder "याद दिलाऊँगा"',
    expectedForm: 'याद दिलाऊँगी',
  },
  // थका हुआ
  {
    regex: /थका\s+हुआ\s+(?:हूँ|हूं)/g,
    category: 'adjective',
    issue: 'Used masculine Devanagari adjective "थका हुआ"',
    expectedForm: 'थकी हुई हूँ',
  },
  // अकेला
  {
    regex: /अकेला\s+(?:हूँ|हूं)/g,
    category: 'adjective',
    issue: 'Used masculine Devanagari adjective "अकेला"',
    expectedForm: 'अकेली हूँ',
  },
  // आपका असिस्टेंट
  {
    regex: /मैं\s+आपका\s+(?:.+?\s+)?(?:असिस्टेंट|साथी|मददगार)/g,
    category: 'self_identification',
    issue: 'Used masculine possessive "आपका" for assistant self-identification',
    expectedForm: 'आपकी असिस्टेंट / साथी / मददगार',
  },
];

/**
 * Validates whether an assistant response string strictly follows feminine grammatical forms.
 * Returns isValid=true if zero masculine self-referential violations are detected.
 */
export function validateFemaleHindiGrammar(text: string): GrammarValidationResult {
  if (!text || !text.trim()) {
    return { isValid: true, violations: [] };
  }

  const violations: GrammarViolation[] = [];

  // 1. Check Romanized Hinglish patterns
  for (const rule of HINGLISH_MASCULINE_PATTERNS) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      violations.push({
        matchedText: match[0],
        category: rule.category,
        issue: rule.issue,
        expectedForm: rule.expectedForm,
        index: match.index,
      });
    }
  }

  // 2. Check Devanagari Hindi patterns
  for (const rule of DEVANAGARI_MASCULINE_PATTERNS) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      violations.push({
        matchedText: match[0],
        category: rule.category,
        issue: rule.issue,
        expectedForm: rule.expectedForm,
        index: match.index,
      });
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Test Suite Execution
 */
export async function runFeminineVoicePersonaGrammarTests(): Promise<void> {
  console.log('\n================================================================');
  console.log('STARTING HINDI/HINGLISH FEMININE VOICE PERSONA GRAMMAR TEST SUITE');
  console.log('================================================================\n');

  let passedAssertions = 0;

  // -------------------------------------------------------------
  // SUITE 1: Explicit User Mandate Verification ("Use" vs "Avoid")
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Canonical Mandated Phrases ("Use" vs "Avoid") ---');

  const canonicalApprovedUsePhrases = [
    'Main check karti hoon.',
    'Main bata deti hoon.',
    'Main kar dungi.',
    'Main dekh leti hoon.',
    'Main samajh gayi.',
    'Main ready hoon.',
    'Maine check kar liya hai.',
    'Main aapki kya madad kar sakti hoon?',
  ];

  for (const phrase of canonicalApprovedUsePhrases) {
    const res = validateFemaleHindiGrammar(phrase);
    assert(
      res.isValid,
      `Expected "${phrase}" to be VALID feminine grammar, but got violations: ${JSON.stringify(res.violations)}`
    );
    passedAssertions++;
  }
  console.log(`  ✓ All ${canonicalApprovedUsePhrases.length} canonical "Use" phrases validated as 100% compliant.`);

  const canonicalAvoidPhrases = [
    { text: 'Main check karta hoon.', expectedViolation: 'karta hoon' },
    { text: 'Main bata dunga.', expectedViolation: 'bata dunga' },
    { text: 'Main kar dunga.', expectedViolation: 'kar dunga' },
    { text: 'Main dekh leta hoon.', expectedViolation: 'dekh leta hoon' },
    { text: 'Main samajh gaya.', expectedViolation: 'samajh gaya' },
    { text: 'Maine check kar liya.', expectedViolation: 'maine check kar liya' },
    { text: 'Main kar sakta hoon.', expectedViolation: 'sakta hoon' },
    { text: 'Main kar raha hoon.', expectedViolation: 'raha hoon' },
    { text: 'Main aapka assistant hoon.', expectedViolation: 'aapka' },
  ];

  for (const item of canonicalAvoidPhrases) {
    const res = validateFemaleHindiGrammar(item.text);
    assert(
      !res.isValid,
      `Expected masculine phrase "${item.text}" to be flagged as INVALID, but validation passed.`
    );
    assert(
      res.violations.length > 0,
      `Expected violations for "${item.text}"`
    );
    passedAssertions++;
  }
  console.log(`  ✓ All ${canonicalAvoidPhrases.length} canonical "Avoid" masculine phrases correctly flagged as invalid.`);

  // -------------------------------------------------------------
  // SUITE 2: Hinglish Verb Tense & Aspect Conjugation Tests
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: Hinglish Verbs & Aspect Conjugations ---');

  const hinglishVerbTestCases = [
    // Present Habitual
    { valid: 'Main aapki file check karti hoon.', invalid: 'Main aapki file check karta hoon.' },
    { valid: 'Main updates bata deti hoon.', invalid: 'Main updates bata deta hoon.' },
    { valid: 'Main system log dekh leti hoon.', invalid: 'Main system log dekh leta hoon.' },
    { valid: 'Main daily report taiyyar karti hoon.', invalid: 'Main daily report taiyyar karta hoon.' },
    { valid: 'Main har command verify karti hoon.', invalid: 'Main har command verify karta hoon.' },

    // Present Continuous
    { valid: 'Main process start kar rahi hoon.', invalid: 'Main process start kar raha hoon.' },
    { valid: 'Main data search kar rahi hoon.', invalid: 'Main data search kar raha hoon.' },
    { valid: 'Main system telemetry inspect kar rahi hoon.', invalid: 'Main system telemetry inspect kar raha hoon.' },
    { valid: 'Main background tasks check kar rahi hoon.', invalid: 'Main background tasks check kar raha hoon.' },

    // Future Tense
    { valid: 'Main kaam kar dungi.', invalid: 'Main kaam kar dunga.' },
    { valid: 'Main report bhej dungi.', invalid: 'Main report bhej dunga.' },
    { valid: 'Main application open kar dungi.', invalid: 'Main application open kar dunga.' },
    { valid: 'Main sab kuch dekh lungi.', invalid: 'Main sab kuch dekh lunga.' },
    { valid: 'Main kal tak kaam karungi.', invalid: 'Main kal tak kaam karunga.' },
    { valid: 'Main jald hi aapko bataungi.', invalid: 'Main jald hi aapko bataunga.' },

    // Modals
    { valid: 'Main aapki help kar sakti hoon.', invalid: 'Main aapki help kar sakta hoon.' },
    { valid: 'Main ye issue solve kar sakti hoon.', invalid: 'Main ye issue solve kar sakta hoon.' },

    // Without explicit "Main" prefix
    { valid: 'Bilkul, YouTube open kar rahi hoon.', invalid: 'Bilkul, YouTube open kar raha hoon.' },
    { valid: 'Abhi dekh leti hoon.', invalid: 'Abhi dekh leta hoon.' },
    { valid: 'Status check karti hoon.', invalid: 'Status check karta hoon.' },
    { valid: 'Command execute kar dungi.', invalid: 'Command execute kar dunga.' },
    { valid: 'Samajh gayi, turant karti hoon.', invalid: 'Samajh gaya, turant karta hoon.' },
  ];

  for (const tc of hinglishVerbTestCases) {
    const validRes = validateFemaleHindiGrammar(tc.valid);
    assert(validRes.isValid, `Expected "${tc.valid}" to be valid: ${JSON.stringify(validRes.violations)}`);

    const invalidRes = validateFemaleHindiGrammar(tc.invalid);
    assert(!invalidRes.isValid, `Expected "${tc.invalid}" to be rejected`);
    passedAssertions += 2;
  }
  console.log(`  ✓ Verified ${hinglishVerbTestCases.length * 2} Hinglish verb conjugation test cases.`);

  // -------------------------------------------------------------
  // SUITE 3: Adjectives & States Agreement
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Adjectives & Assistant State Forms ---');

  const adjectiveCases = [
    { valid: 'Main abhi taiyyar hoon.', invalid: 'Main abhi thaka hua hoon.' },
    { valid: 'Main ready hoon aur alert hoon.', invalid: 'Main bilkul akela hoon.' },
    { valid: 'Main har request ke liye upasthit hoon.', invalid: 'Main thaka hua mehsoos kar raha hoon.' },
    { valid: 'Main thaki hui nahi hoon.', invalid: 'Main thaka hua nahi hoon.' },
    { valid: 'Main aapki personal AI sathi hoon.', invalid: 'Main aapka personal AI sathi hoon.' },
    { valid: 'Main aapki madadgar hoon.', invalid: 'Main aapka madadgar hoon.' },
  ];

  for (const ac of adjectiveCases) {
    const vRes = validateFemaleHindiGrammar(ac.valid);
    assert(vRes.isValid, `Expected valid adjective agreement in "${ac.valid}"`);

    const iRes = validateFemaleHindiGrammar(ac.invalid);
    assert(!iRes.isValid, `Expected invalid adjective agreement in "${ac.invalid}"`);
    passedAssertions += 2;
  }
  console.log(`  ✓ Verified ${adjectiveCases.length * 2} assistant adjective and state agreement tests.`);

  // -------------------------------------------------------------
  // SUITE 4: Devanagari Hindi Feminine Grammar Tests
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Devanagari Hindi Grammar Validation ---');

  const devanagariTestCases = [
    { valid: 'मैं चेक करती हूँ।', invalid: 'मैं चेक करता हूँ।' },
    { valid: 'मैं बता देती हूँ।', invalid: 'मैं बता देता हूँ।' },
    { valid: 'मैं काम कर दूँगी।', invalid: 'मैं काम कर दूँगा।' },
    { valid: 'मैं काम कर दूंगी।', invalid: 'मैं काम कर दूंगा।' },
    { valid: 'मैं देख लेती हूँ।', invalid: 'मैं देख लेता हूँ।' },
    { valid: 'मैं देख लूँगी।', invalid: 'मैं देख लूँगा।' },
    { valid: 'मैं समझ गई।', invalid: 'मैं समझ गया।' },
    { valid: 'मैं तैयार हूँ।', invalid: 'मैं थका हुआ हूँ।' },
    { valid: 'मैं आपकी सहायता कर सकती हूँ।', invalid: 'मैं आपकी सहायता कर सकता हूँ।' },
    { valid: 'मैं बैकग्राउंड टास्क चला रही हूँ।', invalid: 'मैं बैकग्राउंड टास्क चला रहा हूँ।' },
    { valid: 'मैं आपको याद दिलाऊँगी।', invalid: 'मैं आपको याद दिलाऊँगा।' },
    { valid: 'मैं आपकी एआई असिस्टेंट हूँ।', invalid: 'मैं आपका एआई असिस्टेंट हूँ।' },
  ];

  for (const dc of devanagariTestCases) {
    const vRes = validateFemaleHindiGrammar(dc.valid);
    assert(vRes.isValid, `Expected Devanagari valid in "${dc.valid}": ${JSON.stringify(vRes.violations)}`);

    const iRes = validateFemaleHindiGrammar(dc.invalid);
    assert(!iRes.isValid, `Expected Devanagari invalid in "${dc.invalid}"`);
    passedAssertions += 2;
  }
  console.log(`  ✓ Verified ${devanagariTestCases.length * 2} Devanagari Hindi feminine grammatical tests.`);

  // -------------------------------------------------------------
  // SUITE 5: User Invariant - User's Gender & Second Person Preservation
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: User Invariant (User Gender & Addressing Not Altered) ---');

  const userAddressingCases = [
    'Aap kaise hain? Main aapki kya madad kar sakti hoon?',
    'Aap kya dhoondh rahe hain? Main search kar deti hoon.',
    'Aap aaram kijiye, main saara kaam sambhaal lungi.',
    'Aapka din kaisa raha? Main ready hoon.',
    'क्या आप तैयार हैं? मैं अभी फाइल चेक करती हूँ।',
  ];

  for (const uac of userAddressingCases) {
    const res = validateFemaleHindiGrammar(uac);
    assert(res.isValid, `User addressing should be valid in "${uac}"`);
    passedAssertions++;
  }
  console.log(`  ✓ Verified ${userAddressingCases.length} user-directed preservation expressions.`);

  // -------------------------------------------------------------
  // SUITE 6: Assistant Operational Contexts
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 6: Functional Assistant Contexts ---');

  const systemContexts = [
    // Tool Result Context
    {
      context: 'Tool Result Response',
      text: 'Tool execution complete ho gaya hai. Main output verify kar rahi hoon.',
    },
    // System Status Context
    {
      context: 'System Status Response',
      text: 'System telemetry nominal hai. Main CPU load aur memory monitor karti hoon.',
    },
    // Reminders Context
    {
      context: 'Reminder Scheduling Response',
      text: 'Main theek shaam 5 baje aapko meeting ke baare mein yaad dilaungi.',
    },
    // Confirmations Context
    {
      context: 'Action Confirmation Response',
      text: 'Bilkul, main ye temporary files clean kar dungi.',
    },
    // Notifications Context
    {
      context: 'Proactive Notification Response',
      text: 'Naya alert mila hai. Main turant details check kar leti hoon.',
    },
  ];

  for (const sc of systemContexts) {
    const res = validateFemaleHindiGrammar(sc.text);
    assert(res.isValid, `Failed for ${sc.context}: "${sc.text}"`);
    passedAssertions++;
  }
  console.log(`  ✓ Verified all ${systemContexts.length} operational assistant response contexts.`);

  // -------------------------------------------------------------
  // SUITE 7: SpeechTextNormalizer Automatic Pipeline Correction
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 7: Normalization Pipeline Auto-Remediation ---');

  const rawInputsToNormalize = [
    {
      raw: 'Main check karta hoon.',
      expectedFragment: 'Main check karti hoon',
    },
    {
      raw: 'Main bata dunga aur sab kuch dekh leta hoon.',
      expectedFragment: 'Main bata dungi aur sab kuch dekh leti hoon',
    },
    {
      raw: 'Main kar dunga, main samajh gaya.',
      expectedFragment: 'Main kar dungi, main samajh gayi',
    },
    {
      raw: 'Maine check kar liya.',
      expectedFragment: 'Maine check kar liya hai',
    },
    {
      raw: 'Main aapka assistant hoon aur main madad kar sakta hoon.',
      expectedFragment: 'Main aapki assistant hoon aur main madad kar sakti hoon',
    },
    {
      raw: 'YouTube open kar raha hoon, bilkul dekh lunga.',
      expectedFragment: 'YouTube open kar rahi hoon, bilkul dekh lungi',
    },
    {
      raw: 'मैं चेक करता हूँ और बता देता हूँ। समझ गया।',
      expectedFragment: 'मैं चेक करती हूँ और बता देती हूँ. समझ गई',
    },
    {
      raw: 'मैं काम कर दूँगा और देख लूँगा।',
      expectedFragment: 'मैं काम कर दूँगी और देख लूँगी',
    },
  ];

  for (const item of rawInputsToNormalize) {
    // 1. Verify raw input starts as invalid
    const rawVal = validateFemaleHindiGrammar(item.raw);
    assert(!rawVal.isValid, `Raw input "${item.raw}" should have violations before normalization`);

    // 2. Pass through SpeechTextNormalizer
    const norm = SpeechTextNormalizer.normalize(item.raw);

    // 3. Normalized text must contain the feminine fragment
    assert(
      norm.normalizedText.includes(item.expectedFragment),
      `Normalized text "${norm.normalizedText}" did not include expected fragment "${item.expectedFragment}"`
    );

    // 4. Normalized text must pass grammar validation with 0 violations
    const normVal = validateFemaleHindiGrammar(norm.normalizedText);
    assert(
      normVal.isValid,
      `Normalized output "${norm.normalizedText}" failed validation: ${JSON.stringify(normVal.violations)}`
    );
    passedAssertions += 3;
  }
  console.log(`  ✓ Verified SpeechTextNormalizer transforms all masculine responses to 100% compliant feminine speech.`);

  // -------------------------------------------------------------
  // SUITE 8: English Natural Speech Immunity
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 8: English Natural Speech Immunity ---');

  const englishPhrases = [
    'I am monitoring the system telemetry.',
    'I will execute the command for you.',
    'All systems are operational.',
    'The requested task has been finished successfully.',
  ];

  for (const eng of englishPhrases) {
    const res = validateFemaleHindiGrammar(eng);
    assert(res.isValid, `English phrase "${eng}" should not trigger Hindi grammar violations`);
    passedAssertions++;
  }
  console.log(`  ✓ Verified ${englishPhrases.length} English responses remain unaffected.`);

  console.log('\n================================================================');
  console.log(`ALL HINDI/HINGLISH FEMININE GRAMMAR TESTS PASSED! (${passedAssertions} assertions verified)`);
  console.log('================================================================\n');
}

// Standalone execution support: tsx tests/validate_female_hindi_grammar.test.ts
if (import.meta.url.endsWith(process.argv[1] || '')) {
  runFeminineVoicePersonaGrammarTests().catch((err) => {
    console.error('Feminine Voice Persona Grammar Test Suite Failed:', err);
    process.exit(1);
  });
}
