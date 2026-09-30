"""
Gender Normalization Utility (Python Edition)
Automatically scans AI-generated text and replaces standard masculine / neutral
Hinglish and Hindi verb endings with appropriate feminine endings for the JARVIS persona
before sending it to the TTS engine.

Key Conversions:
- "kar raha hoon" (from "kar raha hoon")
- "samajh gayi" (from "samajh gaya")
- "kar dungi" (from "kar dunga" / "karunga")
- "kar deti hoon" (from "kar deta hoon")
- "karti hoon" (from "karta hoon")
- "kar sakti hoon" (from "kar sakta hoon")
- "dekh leti hoon" / "dekh lungi" (from "dekh leta hoon" / "dekh lunga")
- "bata deti hoon" / "bata dungi" (from "bata deta hoon" / "bata dunga")
"""

import re
from typing import List, Tuple, Dict, Any


class GenderNormalizer:
    """
    Feminine grammatical calibration engine for JARVIS voice output.
    """

    # Comprehensive Hinglish masculine-to-feminine verb replacement patterns
    HINGLISH_RULES: List[Tuple[re.Pattern, str, str]] = [
        # 1. "samajh gaya" -> "samajh gayi"
        (
            re.compile(r'\b(main|mai)?\s*([a-zA-Z\s]{0,25}?\b)?samajh\s+gaya\s+(hoon|hu|hun)\b', re.I),
            r'\1 \2samajh gayi \3',
            'samajh gaya hoon -> samajh gayi hoon'
        ),
        (
            re.compile(r'\b(main|mai)?\s*([a-zA-Z\s]{0,25}?\b)?samajh\s+gaya\b', re.I),
            r'\1 \2samajh gayi',
            'samajh gaya -> samajh gayi'
        ),
        (
            re.compile(r'\bsamajh\s+gaya\b', re.I),
            'samajh gayi',
            'samajh gaya -> samajh gayi'
        ),

        # 2. "kar raha hoon" -> "kar rahi hoon"
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?kar\s+raha\s+(hoon|hu|hun)\b', re.I),
            r'\1 \2kar rahi \3',
            'main kar raha hoon -> main kar rahi hoon'
        ),
        (
            re.compile(r'\bkar\s+raha\s+(hoon|hu|hun)\b', re.I),
            r'kar rahi \1',
            'kar raha hoon -> kar rahi hoon'
        ),

        # 3. "kar dunga / karunga" -> "kar dungi / karungi"
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?kar\s+dunga\b', re.I),
            r'\1 \2kar dungi',
            'main kar dunga -> main kar dungi'
        ),
        (
            re.compile(r'\bkar\s+dunga\b', re.I),
            'kar dungi',
            'kar dunga -> kar dungi'
        ),
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?karunga\b', re.I),
            r'\1 \2karungi',
            'main karunga -> main karungi'
        ),
        (
            re.compile(r'\bkarunga\b', re.I),
            'karungi',
            'karunga -> karungi'
        ),

        # 4. "kar deta hoon" -> "kar deti hoon"
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?kar\s+deta\s+(hoon|hu|hun)\b', re.I),
            r'\1 \2kar deti \3',
            'main kar deta hoon -> main kar deti hoon'
        ),
        (
            re.compile(r'\bkar\s+deta\s+(hoon|hu|hun)\b', re.I),
            r'kar deti \1',
            'kar deta hoon -> kar deti hoon'
        ),

        # 5. "karta hoon" -> "karti hoon"
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?karta\s+(hoon|hu|hun)\b', re.I),
            r'\1 \2karti \3',
            'main karta hoon -> main karti hoon'
        ),
        (
            re.compile(r'\bkarta\s+(hoon|hu|hun)\b', re.I),
            r'karti \1',
            'karta hoon -> karti hoon'
        ),

        # 6. "kar sakta hoon" -> "kar sakti hoon"
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?kar\s+sakta\s+(hoon|hu|hun)\b', re.I),
            r'\1 \2kar sakti \3',
            'main kar sakta hoon -> main kar sakti hoon'
        ),
        (
            re.compile(r'\bmadad\s+kar\s+sakta\s+(hoon|hu|hun)\b', re.I),
            r'madad kar sakti \1',
            'madad kar sakta hoon -> madad kar sakti hoon'
        ),
        (
            re.compile(r'\bkar\s+sakta\s+(hoon|hu|hun)\b', re.I),
            r'kar sakti \1',
            'kar sakta hoon -> kar sakti hoon'
        ),

        # 7. "bata deta hoon / bata dunga / bata raha hoon"
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?bata\s+deta\s+(hoon|hu|hun)\b', re.I),
            r'\1 \2bata deti \3',
            'bata deta hoon -> bata deti hoon'
        ),
        (
            re.compile(r'\bbata\s+deta\s+(hoon|hu|hun)\b', re.I),
            r'bata deti \1',
            'bata deta hoon -> bata deti hoon'
        ),
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?bata\s+dunga\b', re.I),
            r'\1 \2bata dungi',
            'bata dunga -> bata dungi'
        ),
        (
            re.compile(r'\bbata\s+dunga\b', re.I),
            'bata dungi',
            'bata dunga -> bata dungi'
        ),
        (
            re.compile(r'\bbata\s+raha\s+(hoon|hu|hun)\b', re.I),
            r'bata rahi \1',
            'bata raha hoon -> bata rahi hoon'
        ),

        # 8. "dekh leta hoon / dekh lunga"
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?dekh\s+leta\s+(hoon|hu|hun)\b', re.I),
            r'\1 \2dekh leti \3',
            'dekh leta hoon -> dekh leti hoon'
        ),
        (
            re.compile(r'\bdekh\s+leta\s+(hoon|hu|hun)\b', re.I),
            r'dekh leti \1',
            'dekh leta hoon -> dekh leti hoon'
        ),
        (
            re.compile(r'\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?dekh\s+lunga\b', re.I),
            r'\1 \2dekh lungi',
            'dekh lunga -> dekh lungi'
        ),
        (
            re.compile(r'\bdekh\s+lunga\b', re.I),
            'dekh lungi',
            'dekh lunga -> dekh lungi'
        ),

        # 9. "check kar leta hoon"
        (
            re.compile(r'\bcheck\s+kar\s+leta\s+(hoon|hu|hun)\b', re.I),
            r'check kar leti \1',
            'check kar leta hoon -> check kar leti hoon'
        ),

        # 10. "samajhta hoon"
        (
            re.compile(r'\bsamajhta\s+(hoon|hu|hun)\b', re.I),
            r'samajhti \1',
            'samajhta hoon -> samajhti hoon'
        ),

        # 11. "sun raha hoon"
        (
            re.compile(r'\bsun\s+raha\s+(hoon|hu|hun)\b', re.I),
            r'sun rahi \1',
            'sun raha hoon -> sun rahi hoon'
        ),

        # 12. "soch raha hoon"
        (
            re.compile(r'\bsoch\s+raha\s+(hoon|hu|hun)\b', re.I),
            r'soch rahi \1',
            'soch raha hoon -> soch rahi hoon'
        ),

        # 13. "bhej deta hoon / bhej dunga"
        (
            re.compile(r'\bbhej\s+deta\s+(hoon|hu|hun)\b', re.I),
            r'bhej deti \1',
            'bhej deta hoon -> bhej deti hoon'
        ),
        (
            re.compile(r'\bbhej\s+dunga\b', re.I),
            'bhej dungi',
            'bhej dunga -> bhej dungi'
        ),

        # 14. "ja raha hoon / aa raha hoon"
        (
            re.compile(r'\bja\s+raha\s+(hoon|hu|hun)\b', re.I),
            r'ja rahi \1',
            'ja raha hoon -> ja rahi hoon'
        ),
        (
            re.compile(r'\b(aa|a)\s+raha\s+(hoon|hu|hun)\b', re.I),
            r'\1 rahi \2',
            'aa raha hoon -> aa rahi hoon'
        ),

        # 15. "kar paunga" -> "kar paungi"
        (
            re.compile(r'\bkar\s+(paunga|paaunga)\b', re.I),
            'kar paungi',
            'kar paunga -> kar paungi'
        ),
    ]

    # Devanagari Hindi feminine rules
    DEVANAGARI_RULES: List[Tuple[re.Pattern, str, str]] = [
        (re.compile(r'कर\s+रहा\s+हूँ'), 'कर रही हूँ', 'कर रहा हूँ -> कर रही हूँ'),
        (re.compile(r'समझ\s+गया'), 'समझ गई', 'समझ गया -> समझ गई'),
        (re.compile(r'कर\s+दूँगा'), 'कर दूँगी', 'कर दूँगा -> कर दूँगी'),
        (re.compile(r'करूँगा'), 'करूँगी', 'करूँगा -> करूँगी'),
        (re.compile(r'कर\s+देता\s+हूँ'), 'कर देती हूँ', 'कर देता हूँ -> कर देती हूँ'),
        (re.compile(r'करता\s+हूँ'), 'करती हूँ', 'करता हूँ -> करती हूँ'),
        (re.compile(r'कर\s+सकता\s+हूँ'), 'कर सकती हूँ', 'कर सकता हूँ -> कर सकती हूँ'),
        (re.compile(r'देख\s+लेता\s+हूँ'), 'देख लेती हूँ', 'देख लेता हूँ -> देख लेती हूँ'),
        (re.compile(r'देख\s+लूँगा'), 'देख लूँगी', 'देख लूँगा -> देख लूँगी'),
        (re.compile(r'बता\s+देता\s+हूँ'), 'बता देती हूँ', 'बता देता हूँ -> बता देती हूँ'),
        (re.compile(r'बता\s+दूँगा'), 'बता दूँगी', 'बता दूँगा -> बता दूँगा'),
        (re.compile(r'बता\s+रहा\s+हूँ'), 'बता रही हूँ', 'बता रहा हूँ -> बता रही हूँ'),
        (re.compile(r'सुन\s+रहा\s+हूँ'), 'सुन रही हूँ', 'सुन रहा हूँ -> सुन रही हूँ'),
    ]

    @classmethod
    def normalize_gender(cls, text: str) -> str:
        """
        Scans AI-generated text and converts masculine/neutral verb endings
        to appropriate feminine endings for female JARVIS voice persona.
        """
        if not text or not text.strip():
            return text or ""

        result = text

        # 1. Apply Hinglish rules
        for pattern, repl, _ in cls.HINGLISH_RULES:
            result = pattern.sub(repl, result)

        # 2. Apply Devanagari rules if Hindi characters present
        if re.search(r'[\u0900-\u097F]', result):
            for pattern, repl, _ in cls.DEVANAGARI_RULES:
                result = pattern.sub(repl, result)

        # Clean multiple spaces introduced by regex replacements
        result = re.sub(r'\s+', ' ', result).strip()
        return result

    @classmethod
    def normalize_with_report(cls, text: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Normalizes gender verb endings and returns the modified text
        along with an audit trail of all transformations applied.
        """
        if not text or not text.strip():
            return text or "", []

        result = text
        changes: List[Dict[str, str]] = []

        for pattern, repl, description in cls.HINGLISH_RULES:
            if pattern.search(result):
                result = pattern.sub(repl, result)
                changes.append({'rule': description, 'type': 'hinglish'})

        if re.search(r'[\u0900-\u097F]', result):
            for pattern, repl, description in cls.DEVANAGARI_RULES:
                if pattern.search(result):
                    result = pattern.sub(repl, result)
                    changes.append({'rule': description, 'type': 'devanagari'})

        result = re.sub(r'\s+', ' ', result).strip()
        return result, changes


def normalize_feminine_gender(text: str) -> str:
    """Convenience helper function for gender normalization."""
    return GenderNormalizer.normalize_gender(text)
