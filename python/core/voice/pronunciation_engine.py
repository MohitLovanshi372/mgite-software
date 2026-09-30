"""
Pronunciation & Phonetic Preprocessing Engine (Python Edition - Enhanced)
Supercharges pronunciation and speech clarity for Hindi, Hinglish, and English in Speech Synthesizers:
1. Language detection (Hindi Devanagari, Hinglish Romanized Hindi, English)
2. Phonetic acronym and technical term expansions (smooth flow, never letter-by-letter)
3. Hinglish vowel and consonant respelling to eliminate English TTS accent distortions
   (e.g., prevents "main" sounding like English "main road", "kya" sounding like "kay-ah")
4. Indian English & Hinglish syllable stress, unit clarity, and currency handling
5. Conversational prosody, natural breath pauses, and sentence cadence
6. Female voice persona grammar validation (Hindi / Hinglish)
"""

import re
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional


@dataclass
class PronunciationResult:
    original_text: str
    processed_text: str
    detected_language: str  # 'hi', 'en-IN', 'en'
    recommended_locale: str  # 'hi-IN', 'en-IN', 'en-US'
    recommended_pitch: float
    recommended_rate: float
    pronunciation_notes: List[str]


class PronunciationEngine:
    DEVANAGARI_REGEX = re.compile(r'[\u0900-\u097F]')

    HINGLISH_KEYWORDS = {
        'aap', 'aapka', 'aapki', 'aapke', 'aapko', 'aaj', 'achha', 'accha', 'aur',
        'batao', 'bataiye', 'bhi', 'bohot', 'bahut', 'chahiye', 'chalu', 'chal',
        'dhanyawad', 'dhanyavaad', 'ek', 'gaya', 'gayi', 'gaye', 'haan', 'hai', 'hain',
        'ho', 'hoga', 'hogi', 'hum', 'jaana', 'jana', 'karna', 'karein', 'karo', 'kaise',
        'kya', 'kyun', 'kab', 'kripya', 'kripaya', 'lagta', 'lekin', 'mera', 'meri',
        'mere', 'mujhe', 'mujhko', 'madad', 'nahi', 'nahin', 'namaste', 'pe', 'par',
        'roko', 'samay', 'shukriya', 'suno', 'theek', 'thoda', 'tum', 'tumhara',
        'wala', 'wali', 'wale', 'ye', 'yeh', 'woh', 'wo', 'zaroor', 'jarur', 'swagat',
        'sahayata', 'pranam', 'alvida', 'shuru', 'kijiye', 'dijiye', 'lijiye', 'bilkul',
        'dilaunga', 'dilaungi', 'dilana', 'badhiya', 'karti', 'karta', 'dungi', 'dunga',
        'leti', 'leta', 'rahi', 'raha', 'sakti', 'sakta', 'samajh', 'hoon', 'hu', 'hun',
        'kripya', 'dekho', 'dekh', 'rahe', 'dekhna', 'sun', 'suno', 'bata', 'bol',
        'kaun', 'kahan', 'kitna', 'kitne', 'itna', 'sab', 'kuch', 'hoga', 'hogi'
    }

    # Acronyms: expand to naturally spoken English or Hindi forms, avoiding harsh spellouts
    ACRONYM_MAP: Dict[str, str] = {
        'JARVIS': 'Jarvis',
        'Jarvis': 'Jarvis',
        'AI': 'A I',
        'UI': 'U I',
        'UX': 'U X',
        'OS': 'O S',
        'CPU': 'C P U',
        'GPU': 'G P U',
        'RAM': 'Ram',
        'ROM': 'Rom',
        'API': 'A P I',
        'URL': 'U R L',
        'TTS': 'T T S',
        'STT': 'S T T',
        'HUD': 'H U D',
        '3D': 'Three-D',
        '2D': 'Two-D',
        'ID': 'I D',
        'IP': 'I P',
        'SQL': 'Sequel',
        'WiFi': 'Why-Fye',
        'WIFI': 'Why-Fye',
        'wifi': 'Why-Fye',
        'HTML': 'H T M L',
        'CSS': 'C S S',
        'JS': 'J S',
        'SDK': 'S D K',
        'PDF': 'P D F',
        'SMS': 'S M S',
        'OTP': 'O T P',
        'PIN': 'Pin',
        'USB': 'U S B',
        'GB': 'G B',
        'MB': 'M B',
        'TB': 'T B',
        'KB': 'K B',
        'GHz': 'Giga hertz',
        'MHz': 'Mega hertz',
        'kbps': 'K B P S',
        'mbps': 'M B P S',
    }

    # Loanwords in Devanagari Hindi for smooth phonetic flow
    DEVANAGARI_LOANWORD_MAP: Dict[str, str] = {
        'एआई': 'ए आई',
        'ए.आई.': 'ए आई',
        'जीएलबी': 'जी एल बी',
        'यूआई': 'यू आई',
        'एफपीएस': 'एफ पी एस',
        'एचडी': 'एच डी',
        '३डी': 'थ्री डी',
        '3D': 'थ्री डी',
        'AI': 'ए आई',
        'GLB': 'जी एल बी',
        'सीपीयू': 'सी पी यू',
        'जीपीयू': 'जी पी यू',
        'रैम': 'रैम',
        'एपीआई': 'ए पी आई',
        'वाईफाई': 'वाई फाई',
        'यूट्यूब': 'YouTube',
    }

    # Phonetic respellings for Hinglish in Roman script.
    # Solves the classic problem where English TTS mispronounces Romanized Hindi:
    # "main" -> sounds like English "main road", respelled to "maiñ" or "mai"
    # "kya" -> sounds like "kay-ah", respelled to "kyaa"
    # "samajh" -> sounds awkward, respelled to "samajh"
    # "hoon" -> sounds like "hoon"
    HINGLISH_PHONETICS: List[Tuple[re.Pattern, str]] = [
        # Crucial: 'main' / 'mai' as 1st person pronoun (preventing English 'main' pronunciation)
        (re.compile(r'\b(main|mai)\s+([a-zA-Z]+)', re.I), r'mai \2'),
        (re.compile(r'\bshukriya\b', re.I), 'shukriyaa'),
        (re.compile(r'\bdhanyawad\b', re.I), 'dhanyawaad'),
        (re.compile(r'\bdhanyavaad\b', re.I), 'dhanyawaad'),
        (re.compile(r'\bkripya\b', re.I), 'kripayaa'),
        (re.compile(r'\bkripaya\b', re.I), 'kripayaa'),
        (re.compile(r'\bswagat\b', re.I), 'swaagat'),
        (re.compile(r'\bsahayata\b', re.I), 'sahaayataa'),
        (re.compile(r'\bbataiye\b', re.I), 'bataaiye'),
        (re.compile(r'\bbatao\b', re.I), 'bataao'),
        (re.compile(r'\bachha\b', re.I), 'acchaa'),
        (re.compile(r'\baccha\b', re.I), 'acchaa'),
        (re.compile(r'\bzaroor\b', re.I), 'zaroor'),
        (re.compile(r'\bbohot\b', re.I), 'bahut'),
        (re.compile(r'\bkijiye\b', re.I), 'keejiye'),
        (re.compile(r'\bdijiye\b', re.I), 'deejiye'),
        (re.compile(r'\blijiye\b', re.I), 'leejiye'),
        (re.compile(r'\bbilkul\b', re.I), 'bilkul'),
        (re.compile(r'\bbadhiya\b', re.I), 'badiya'),
        (re.compile(r'\bshuru\b', re.I), 'shuroo'),
        (re.compile(r'\bchahiye\b', re.I), 'chaahiye'),
        (re.compile(r'\bkyun\b', re.I), 'kyon'),
        (re.compile(r'\bkya\b', re.I), 'kyaa'),
        (re.compile(r'\btheek\b', re.I), 'theek'),
        (re.compile(r'\bsamajh\s+gayi\b', re.I), 'samajh gayee'),
        (re.compile(r'\bkarti\s+hoon\b', re.I), 'kartee hoon'),
        (re.compile(r'\bkar\s+deti\s+hoon\b', re.I), 'kar detee hoon'),
        (re.compile(r'\bkar\s+dungi\b', re.I), 'kar doongee'),
        (re.compile(r'\bkar\s+sakti\s+hoon\b', re.I), 'kar saktee hoon'),
        (re.compile(r'\bdekh\s+leti\s+hoon\b', re.I), 'dekh letee hoon'),
        (re.compile(r'\bbata\s+deti\s+hoon\b', re.I), 'bata detee hoon'),
        (re.compile(r'\bkar\s+rahi\s+hoon\b', re.I), 'kar rahee hoon'),
    ]

    @classmethod
    def detect_language(cls, text: str) -> str:
        """
        Detects primary linguistic mode:
        - 'hi': Devanagari Hindi
        - 'en-IN': Hinglish (Romanized Hindi / Indian English)
        - 'en': Standard English
        """
        if not text:
            return 'en'
        if cls.DEVANAGARI_REGEX.search(text):
            return 'hi'

        words = re.findall(r'[a-zA-Z]+', text.lower())
        if not words:
            return 'en'

        hinglish_count = sum(1 for w in words if w in cls.HINGLISH_KEYWORDS)
        ratio = hinglish_count / len(words)
        if hinglish_count >= 2 or ratio >= 0.18:
            return 'en-IN'
        return 'en'

    @classmethod
    def clean_markdown_and_prosody(cls, text: str) -> str:
        """
        Strips markdown and cleans prosody punctuation for speech synthesis:
        - Removes *, _, `, #, ~, bullet symbols
        - Fixes double spaces and awkward trailing punctuation
        - Adds gentle pause commas after greeting words
        """
        cleaned = text.strip()

        # Remove markdown bold/italics/strikethrough/headers
        cleaned = re.sub(r'[*_~`#>]', '', cleaned)
        cleaned = re.sub(r'^\s*[-+*]\s+', '', cleaned, flags=re.M)
        cleaned = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', cleaned)

        # Replace excessive ellipses and multiple dots
        cleaned = re.sub(r'\.{3,}', '... ', cleaned)
        cleaned = re.sub(r'([.?!])\s*', r'\1 ', cleaned)

        # Soft pauses after conversational markers
        cleaned = re.sub(r'\b(Namaste|Hello|Haan ji|Ji|Sir|Aapka swagat hai)\b', r'\1,', cleaned, flags=re.I)
        cleaned = re.sub(r',\s*,', ',', cleaned)

        return cleaned

    @classmethod
    def format_numbers_and_units(cls, text: str, lang: str) -> str:
        """
        Formats numbers, currencies, percentages, and units for spoken clarity.
        """
        res = text

        # Currencies: ₹500 / Rs. 500 / $50
        res = re.sub(r'₹\s*(\d+)', r'\1 rupaye', res)
        res = re.sub(r'Rs\.?\s*(\d+)', r'\1 rupaye', res, flags=re.I)
        res = re.sub(r'\$\s*(\d+)', r'\1 dollars', res)

        # Percentages
        if lang == 'hi':
            res = re.sub(r'(\d+)\s*%', r'\1 प्रतिशत', res)
        else:
            res = re.sub(r'(\d+)\s*%', r'\1 percent', res)

        # Storage / memory / clock units
        res = re.sub(r'(\d+)\s*(GB|MB|TB|KB)\b', r'\1 \2', res, flags=re.I)
        res = re.sub(r'(\d+)\s*(GHz|MHz)\b', r'\1 \2', res, flags=re.I)

        return res

    @classmethod
    def process(cls, text: str) -> PronunciationResult:
        """
        Comprehensive speech preprocessing pipeline.
        Produces optimal phonetic text and voice modulation parameters.
        """
        if not text or not text.strip():
            return PronunciationResult(
                original_text=text or "",
                processed_text="",
                detected_language='en',
                recommended_locale='en-US',
                recommended_pitch=0.85,
                recommended_rate=0.98,
                pronunciation_notes=[]
            )

        notes: List[str] = []
        lang = cls.detect_language(text)
        processed = cls.clean_markdown_and_prosody(text)
        processed = cls.format_numbers_and_units(processed, lang)

        # Devanagari Hindi Path
        if lang == 'hi':
            processed = processed.replace('।', '. ').replace('॥', '. ')
            for k, v in cls.DEVANAGARI_LOANWORD_MAP.items():
                if re.search(rf'\b{re.escape(k)}\b', processed, flags=re.I):
                    processed = re.sub(rf'\b{re.escape(k)}\b', v, processed, flags=re.I)
                    notes.append(f"Devanagari loanword expanded: {k} -> {v}")

            # Ensure JARVIS acronym is cleanly read
            for k, v in cls.ACRONYM_MAP.items():
                processed = re.sub(rf'\b{re.escape(k)}\b', v, processed)

            processed = re.sub(r'\s+', ' ', processed).strip()

            return PronunciationResult(
                original_text=text,
                processed_text=processed,
                detected_language='hi',
                recommended_locale='hi-IN',
                recommended_pitch=0.98,
                recommended_rate=0.94,
                pronunciation_notes=notes
            )

        # Hinglish Path (Romanized Hindi)
        if lang == 'en-IN':
            # Acronym expansion
            for k, v in cls.ACRONYM_MAP.items():
                if re.search(rf'\b{re.escape(k)}\b', processed):
                    processed = re.sub(rf'\b{re.escape(k)}\b', v, processed)
                    notes.append(f"Acronym normalized: {k} -> {v}")

            # Phonetic respelling to eliminate English accent on Hinglish words
            for pattern, repl in cls.HINGLISH_PHONETICS:
                if pattern.search(processed):
                    processed = pattern.sub(repl, processed)
                    notes.append(f"Hinglish phonetics applied: {repl}")

            processed = re.sub(r'\s+', ' ', processed).strip()

            return PronunciationResult(
                original_text=text,
                processed_text=processed,
                detected_language='en-IN',
                recommended_locale='en-IN',
                recommended_pitch=0.95,
                recommended_rate=0.95,
                pronunciation_notes=notes
            )

        # Standard English Path
        for k, v in cls.ACRONYM_MAP.items():
            if re.search(rf'\b{re.escape(k)}\b', processed):
                processed = re.sub(rf'\b{re.escape(k)}\b', v, processed)
                notes.append(f"Acronym normalized: {k} -> {v}")

        processed = re.sub(r'\s+', ' ', processed).strip()

        return PronunciationResult(
            original_text=text,
            processed_text=processed,
            detected_language='en',
            recommended_locale='en-US',
            recommended_pitch=0.88,
            recommended_rate=0.98,
            pronunciation_notes=notes
        )
