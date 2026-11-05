"""
Speech Text Normalizer (Python Edition - Enhanced)
Pre-TTS Normalization Pipeline between AI response and TTS:
1. Blocks STT transcripts from direct TTS leakage (enforces STT -> AI -> Normalizer -> TTS).
2. Prevents duplicate speech (sentence deduplication and phrase echo prevention).
3. Strips Markdown (*, _, `, #, tables, quotes, bullets, HTML tags).
4. Summarizes raw JSON and tool responses into natural conversational speech.
5. Sanitizes code blocks and programming syntax into spoken summaries.
6. Converts raw URLs and markdown links into conversational phrases.
7. Converts file paths (/path/to/file.ext, C:\\..., src/...) into natural spoken references.
8. Preserves technical terms (React, Python, JavaScript, GitHub, API, YouTube, TypeScript).
9. Prevents letter-by-letter spelling (collapses spaced-out letters).
10. Enforces female JARVIS grammar:
    "samajh gayi", "kar rahi hoon", "kar dungi", "kar deti hoon"
11. Preserves natural Hindi and Hinglish pronunciation.
"""

import os
import json
import re
import time
from dataclasses import dataclass, field
from typing import Optional, List, Dict
from .pronunciation_engine import PronunciationEngine, PronunciationResult
from .gender_normalization import GenderNormalizer


@dataclass
class NormalizationResult:
    original_text: str
    normalized_text: str
    detected_language: str  # 'hi', 'en-IN', 'en'
    pronunciation_result: Optional[PronunciationResult] = None
    is_stt_blocked: bool = False
    duplicate_filtered: bool = False
    pipeline_stage: str = "SpeechTextNormalizer"


class SpeechTextNormalizer:
    # Registered recent STT transcripts to prevent direct STT -> TTS leakage
    _recent_stt_transcripts: List[Dict[str, any]] = []

    # Cached phonetic mapping dictionary from phoneme_map.json
    _phoneme_map: Optional[Dict[str, str]] = None

    # Canonical Technical Terms (Natural pronunciation, never spelled out)
    TECH_TERMS: Dict[str, str] = {
        'react': 'React',
        'python': 'Python',
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'github': 'GitHub',
        'api': 'API',
        'youtube': 'YouTube',
        'gemini': 'Gemini',
        'google': 'Google',
        'windows': 'Windows',
        'linux': 'Linux',
        'docker': 'Docker',
        'kubernetes': 'Kubernetes',
        'vscode': 'VS Code',
        'vs code': 'VS Code',
        'nodejs': 'Node.js',
        'node.js': 'Node.js',
        'nextjs': 'Next.js',
        'next.js': 'Next.js',
        'express': 'Express',
        'postgres': 'PostgreSQL',
        'postgresql': 'PostgreSQL',
        'mongodb': 'MongoDB',
        'git': 'Git',
        'npm': 'NPM',
        'html': 'HTML',
        'css': 'CSS',
        'sql': 'SQL',
        'cpu': 'CPU',
        'gpu': 'GPU',
        'ram': 'RAM',
        'tts': 'TTS',
        'stt': 'STT',
        'hud': 'HUD',
        'cli': 'CLI',
        'sdk': 'SDK',
        'ui': 'UI',
        'ux': 'UX',
    }

    # Common file extensions for file path recognition
    FILE_EXTENSIONS = (
        r'py|js|ts|tsx|jsx|json|html|css|scss|md|txt|csv|pdf|png|jpg|jpeg|gif|svg|'
        r'zip|tar|gz|sh|bash|xml|yaml|yml|sql|db|sqlite|log|env|lock'
    )

    @classmethod
    def register_stt_transcript(cls, transcript: str) -> None:
        """
        Registers an incoming STT transcript in the STT guard registry.
        Ensures raw STT transcripts cannot bypass AI and go directly to TTS.
        """
        if not transcript or not transcript.strip():
            return
        cleaned = transcript.strip().lower()
        now = time.time()
        cls._recent_stt_transcripts.append({'text': cleaned, 'time': now})
        # Keep only the last 20 transcripts
        if len(cls._recent_stt_transcripts) > 20:
            cls._recent_stt_transcripts = cls._recent_stt_transcripts[-20:]

    @classmethod
    def is_stt_transcript(cls, text: str) -> bool:
        """
        Checks whether given text is an active STT transcript that hasn't been
        processed through AI response generation.
        """
        if not text:
            return False
        cleaned = text.strip().lower()
        now = time.time()
        for item in reversed(cls._recent_stt_transcripts):
            # Expire after 60 seconds
            if now - item['time'] > 60:
                continue
            if item['text'] == cleaned:
                return True
        return False

    @classmethod
    def normalize(cls, raw_text: str, is_stt: bool = False) -> NormalizationResult:
        """
        Full SpeechTextNormalizer pipeline for AI responses before TTS.
        """
        if not raw_text or not raw_text.strip():
            return NormalizationResult(
                original_text=raw_text or "",
                normalized_text="",
                detected_language="en"
            )

        # 1. STT Guard: Prevent STT transcript from being sent directly to TTS
        if is_stt or cls.is_stt_transcript(raw_text):
            return NormalizationResult(
                original_text=raw_text,
                normalized_text="",
                detected_language="en",
                is_stt_blocked=True
            )

        text = raw_text.strip()

        # 2. Collapse spaced-out letters (prevent letter-by-letter spelling)
        text = cls.collapse_spaced_letters(text)

        # 3. Sanitize raw JSON & tool payloads
        text = cls.sanitize_json_and_data(text)

        # 4. Sanitize code blocks, inline code, and programming syntax
        text = cls.sanitize_code(text)

        # 5. Sanitize URLs, domains, and web links
        text = cls.sanitize_urls(text)

        # 6. Sanitize file paths (Unix / Windows / relative paths)
        text = cls.sanitize_file_paths(text)

        # 7. Strip Markdown syntax and HTML tags
        text = cls.sanitize_markdown(text)

        # 8. Prevent duplicate speech within message (sentence and phrase deduplication)
        text, duplicate_filtered = cls.deduplicate_speech(text)

        # 9. Preserve technical terms casing & pronunciation format
        text = cls.preserve_technical_terms(text)

        # 10. Phonetic Mapping (convert common Hindi/Hinglish spellings via phoneme_map.json)
        text = cls.apply_phoneme_map(text)

        # 11. Female Voice Persona Grammar Alignment (Hindi / Hinglish)
        text = cls.align_female_voice_grammar(text)

        # 12. Pronunciation Engine processing (phonetics, accents, cadence)
        pron = PronunciationEngine.process(text)
        final_text = pron.processed_text

        # 13. Final female grammar invariant check (ensure exact required forms)
        final_text = cls.align_female_voice_grammar(final_text)
        final_text = re.sub(r'\bsamajh\s+gayee?\b', 'samajh gayi', final_text, flags=re.I)
        final_text = re.sub(r'\bkar\s+rahee?\s+hoon\b', 'kar rahi hoon', final_text, flags=re.I)
        final_text = re.sub(r'\bkar\s+doongee?\b', 'kar dungi', final_text, flags=re.I)
        final_text = re.sub(r'\bkar\s+detee?\s+hoon\b', 'kar deti hoon', final_text, flags=re.I)

        # 14. Ensure technical terms are spoken naturally (React, Python, JavaScript, GitHub, API, YouTube, TypeScript)
        final_text = cls.preserve_technical_terms(final_text)

        # 15. Clean extra whitespace and trailing punctuation
        final_text = re.sub(r'\s+', ' ', final_text).strip()

        return NormalizationResult(
            original_text=raw_text,
            normalized_text=final_text,
            detected_language=pron.detected_language,
            pronunciation_result=pron,
            duplicate_filtered=duplicate_filtered
        )

    @classmethod
    def collapse_spaced_letters(cls, text: str) -> str:
        """
        Collapses spaced-out letters to prevent letter-by-letter spelling:
        - "R e a c t" -> "React"
        - "P y t h o n" -> "Python"
        - "G i t h u b" -> "GitHub"
        - "J a v a s c r i p t" -> "JavaScript"
        - "T y p e s c r i p t" -> "TypeScript"
        - "Y o u t u b e" -> "YouTube"
        - "J A R V I S" / "J.A.R.V.I.S." -> "Jarvis"
        """
        res = text
        # Targeted tech word collapses
        res = re.sub(r'\b[Rr]\s+[Ee]\s+[Aa]\s+[Cc]\s+[Tt]\b', 'React', res)
        res = re.sub(r'\b[Pp]\s+[Yy]\s+[Tt]\s+[Hh]\s+[Oo]\s+[Nn]\b', 'Python', res)
        res = re.sub(r'\b[Gg]\s+[Ii]\s+[Tt]\s+[Hh]\s+[Uu]\s+[Bb]\b', 'GitHub', res)
        res = re.sub(r'\b[Jj]\s+[Aa]\s+[Vv]\s+[Aa]\s+[Ss]\s+[Cc]\s+[Rr]\s+[Ii]\s+[Pp]\s+[Tt]\b', 'JavaScript', res)
        res = re.sub(r'\b[Tt]\s+[Yy]\s+[Pp]\s+[Ee]\s+[Ss]\s+[Cc]\s+[Rr]\s+[Ii]\s+[Pp]\s+[Tt]\b', 'TypeScript', res)
        res = re.sub(r'\b[Yy]\s+[Oo]\s+[Uu]\s+[Tt]\s+[Uu]\s+[Bb]\s+[Ee]\b', 'YouTube', res)

        # J.A.R.V.I.S. and JARVIS
        res = re.sub(r'\bJ\.?A\.?R\.?V\.?I\.?S\.?\b', 'Jarvis', res, flags=re.I)
        res = re.sub(r'\bJ\s+A\s+R\s+V\s+I\s+S\b', 'Jarvis', res, flags=re.I)

        # General single letters spaced out (e.g. "H U D" -> "HUD")
        res = re.sub(r'\b([A-Za-z])\s+([A-Za-z])\s+([A-Za-z])\s+([A-Za-z])\b', r'\1\2\3\4', res)
        res = re.sub(r'\b([A-Za-z])\s+([A-Za-z])\s+([A-Za-z])\b', r'\1\2\3', res)

        return res

    @classmethod
    def sanitize_json_and_data(cls, text: str) -> str:
        """
        Summarizes raw JSON objects and arrays into natural speech.
        Never sends JSON structure to TTS.
        """
        trimmed = text.strip()
        # 1. Full JSON message
        if (trimmed.startswith('{') and trimmed.endswith('}')) or (trimmed.startswith('[') and trimmed.endswith(']')):
            if '"success": true' in trimmed or '"success":true' in trimmed or '"status": "success"' in trimmed:
                return "Task safaltapoorvak complete ho gaya hai. Result screen par ready hai."
            elif '"error"' in trimmed or '"status": "error"' in trimmed:
                return "Is task me ek error aayi hai. Kripya screen par check karein."
            else:
                return "Action complete ho gaya hai. Result screen par ready hai."

        # 2. Embedded JSON blocks in conversational text: {"key": "value"}
        res = re.sub(
            r'\{[^{}]*"(?:status|error|result|data|message|success)"[^{}]*\}',
            'data screen par display kar diya gaya hai.',
            text,
            flags=re.I
        )
        # Any remaining multi-line or block JSON
        res = re.sub(r'\{[\s\S]*?"[a-zA-Z0-9_\-]+"\s*:\s*[\s\S]*?\}', 'data screen par ready hai.', res)
        return res

    @classmethod
    def sanitize_code(cls, text: str) -> str:
        """
        Sanitizes code blocks, inline code snippets, and raw programming statements.
        Never sends raw code syntax directly to TTS.
        """
        res = text

        # 1. Multi-line fenced code blocks ```...```
        res = re.sub(
            r'```[\w]*\s*[\s\S]*?```',
            'Code snippet screen par display kar diya gaya hai.',
            res
        )

        # 2. Inline code `...`
        def clean_inline_code(match: re.Match) -> str:
            snippet = match.group(1).strip()
            # If it's a known single technical word or short command, speak naturally
            if re.match(r'^[a-zA-Z0-9_\-\.\s]{1,30}$', snippet):
                return snippet
            # If it contains code syntax symbols ({}, (), =>, ;, =, etc.)
            return "code snippet screen par available hai"

        res = re.sub(r'`([^`]+)`', clean_inline_code, res)

        # 3. Raw programming import/function statements on standalone lines
        res = re.sub(r'^\s*(?:import\s+|from\s+|def\s+|class\s+|function\s+|const\s+|let\s+|var\s+)[\s\S]{10,80}$',
                     'Code details screen par check kar sakte hain.', res, flags=re.M)

        return res

    @classmethod
    def sanitize_urls(cls, text: str) -> str:
        """
        Sanitizes URLs, domain links, and markdown links into conversational speech.
        Never sends http://, https://, or raw domain URLs to TTS.
        """
        res = text

        # 1. Markdown links: [Title](https://...)
        res = re.sub(
            r'\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)',
            r'\1 link screen par ready hai.',
            res
        )

        # 2. Specific tech domains: github.com/..., youtube.com/...
        res = re.sub(r'(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s]+', 'GitHub link screen par open kar di hai.', res, flags=re.I)
        res = re.sub(r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/[^\s]+', 'YouTube video screen par play kar di hai.', res, flags=re.I)

        # 3. Any remaining raw URLs
        res = re.sub(
            r'https?:\/\/[^\s]+|ftp:\/\/[^\s]+|www\.[^\s]+',
            'Maine link screen par open kar di hai.',
            res,
            flags=re.I
        )

        return res

    @classmethod
    def sanitize_file_paths(cls, text: str) -> str:
        """
        Converts file paths (Unix, Windows, relative) into natural spoken references.
        Never sends raw file paths or slashes to TTS.
        Example:
        - "python/core/voice/speech_text_normalizer.py" -> "speech text normalizer python file"
        - "src/components/App.tsx" -> "App file"
        - "C:\\Users\\Admin\\project\\main.py" -> "main python file"
        """
        res = text

        # Regex for Windows paths: C:\dir\file.ext
        def replace_windows_path(m: re.Match) -> str:
            full = m.group(0)
            filename = full.split('\\')[-1]
            name, _, ext = filename.rpartition('.')
            clean_name = re.sub(r'[_.-]', ' ', name).strip()
            return f"{clean_name} {ext} file screen par available hai"

        res = re.sub(
            rf'\b[a-zA-Z]:\\(?:[a-zA-Z0-9_\-\. ]+\\)*([a-zA-Z0-9_\- ]+)\.({cls.FILE_EXTENSIONS})\b',
            replace_windows_path,
            res,
            flags=re.I
        )

        # Regex for Unix / Relative paths: /path/to/file.ext, src/components/file.tsx, ./file.py
        def replace_unix_path(m: re.Match) -> str:
            full = m.group(0)
            filename = full.split('/')[-1]
            name, _, ext = filename.rpartition('.')
            clean_name = re.sub(r'[_.-]', ' ', name).strip()
            return f"{clean_name} {ext} file"

        res = re.sub(
            rf'(?:\/|\.\/|\.\.\/|[a-zA-Z0-9_\-]+\/)[a-zA-Z0-9_\-\.\/]*\/([a-zA-Z0-9_\-]+)\.({cls.FILE_EXTENSIONS})\b',
            replace_unix_path,
            res,
            flags=re.I
        )

        # Standalone path prefixes like /python/core/voice
        res = re.sub(r'(?:\/[a-zA-Z0-9_\-]+){2,}\/?', 'specified directory', res)

        return res

    @classmethod
    def sanitize_markdown(cls, text: str) -> str:
        """
        Strips Markdown syntax, markdown tables, blockquotes, bullets, and HTML tags.
        """
        res = text

        # 1. Markdown tables:
        # | col1 | col2 |
        # | --- | --- |
        # | val1 | val2 |
        table_pattern = r'\|[^\n\r]+\|[\r\n]+\|[\s\-:|]+\|[\r\n]+(?:\|[^\n\r]+\|[\r\n]*)+'
        res = re.sub(table_pattern, 'Table details screen par display kar di gayi hain.', res)

        # 2. Markdown headings: # Heading -> Heading.
        res = re.sub(r'^\s*#{1,6}\s*(.+)$', r'\1.', res, flags=re.M)

        # 3. HTML tags <p>, </div>, <span>, <br>
        res = re.sub(r'<[^>]+>', ' ', res)

        # 4. Bold, italics, strikethrough, blockquotes
        res = re.sub(r'[*_~`#>]', '', res)

        # 5. Bullet points (- item, * item, + item, 1. item)
        res = re.sub(r'^\s*[-+*]\s+', '', res, flags=re.M)
        res = re.sub(r'^\s*\d+\.\s+', '', res, flags=re.M)

        # 6. Horizontal rules
        res = re.sub(r'^\s*[-*_]{3,}\s*$', '', res, flags=re.M)

        return res

    @classmethod
    def deduplicate_speech(cls, text: str) -> (str, bool):
        """
        Prevents duplicate speech by removing repeating consecutive sentences
        and phrases (e.g. "Main samajh gayi. Main samajh gayi.").
        """
        if not text:
            return text, False

        # Split into sentences while preserving delimiters
        sentences = re.split(r'([.?!।]\s+)', text)
        if len(sentences) <= 1:
            return text, False

        deduped = []
        last_norm = ""
        modified = False

        i = 0
        while i < len(sentences):
            part = sentences[i]
            # If it's a delimiter, attach it to previous sentence
            if re.match(r'^[.?!।]\s*$', part):
                if deduped:
                    deduped[-1] += part
                i += 1
                continue

            cleaned = re.sub(r'[^\w\s]', '', part).strip().lower()
            if cleaned and cleaned == last_norm:
                modified = True
                # Skip duplicate sentence and its delimiter if following
                i += 1
                if i < len(sentences) and re.match(r'^[.?!।]\s*$', sentences[i]):
                    i += 1
                continue

            if cleaned:
                last_norm = cleaned
            deduped.append(part)
            i += 1

        result = "".join(deduped).strip()

        # Deduplicate immediate repeated clauses: "Main samajh gayi, main samajh gayi"
        clause_pattern = r'\b([a-zA-Z\s]{4,30}?),\s*\1\b'
        if re.search(clause_pattern, result, flags=re.I):
            result = re.sub(clause_pattern, r'\1', result, flags=re.I)
            modified = True

        return result, modified

    @classmethod
    def preserve_technical_terms(cls, text: str) -> str:
        """
        Ensures technical terms (React, Python, JavaScript, GitHub, API, YouTube, TypeScript)
        retain natural casing and are never butchered or spelled letter-by-letter.
        """
        res = text
        # Collapse spaced out acronyms
        res = re.sub(r'\bA\s+P\s+I\b', 'API', res)
        res = re.sub(r'\bA\.P\.I\.\b', 'API', res, flags=re.I)

        for low, proper in cls.TECH_TERMS.items():
            # Match whole word
            res = re.sub(rf'\b{re.escape(low)}\b', proper, res, flags=re.I)
        return res

    @classmethod
    def align_female_voice_grammar(cls, text: str) -> str:
        """
        Enforces female JARVIS persona grammar:
        - "samajh gayi" (from "samajh gaya")
        - "kar rahi hoon" (from "kar raha hoon")
        - "kar dungi" (from "kar dunga" / "karunga")
        - "kar deti hoon" (from "kar deta hoon")
        - "karti hoon" (from "karta hoon")
        - "kar sakti hoon" (from "kar sakta hoon")
        - "dekh leti hoon" (from "dekh leta hoon")
        - "bata deti hoon" (from "bata deta hoon")
        Delegated to GenderNormalizer utility for modular, robust processing.
        """
        return GenderNormalizer.normalize_gender(text)

    @classmethod
    def load_phoneme_map(cls, filepath: Optional[str] = None) -> Dict[str, str]:
        """
        Loads phonetic sequences from phoneme_map.json.
        Converts common Hindi/Hinglish spellings into sequences that the TTS engine handles better.
        """
        if cls._phoneme_map is not None and not filepath:
            return cls._phoneme_map

        possible_paths = []
        if filepath:
            possible_paths.append(filepath)
        else:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            possible_paths.extend([
                os.path.join(base_dir, "phoneme_map.json"),
                os.path.join(os.path.dirname(base_dir), "phoneme_map.json"),
                os.path.join(os.path.dirname(os.path.dirname(base_dir)), "python", "phoneme_map.json"),
                "python/core/voice/phoneme_map.json",
                "python/phoneme_map.json",
                "phoneme_map.json"
            ])

        data: Dict[str, str] = {}
        for p in possible_paths:
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        raw = json.load(f)

                        # Flatten if nested categories exist
                        def extract_pairs(obj):
                            items = {}
                            if isinstance(obj, dict):
                                for k, v in obj.items():
                                    if isinstance(v, str):
                                        items[k] = v
                                    elif isinstance(v, dict):
                                        items.update(extract_pairs(v))
                            return items

                        data = extract_pairs(raw)
                        if data:
                            break
                except Exception:
                    pass

        # Fallback built-in dictionary if file is unreadable
        if not data:
            data = {
                "kya": "kyaa", "kyun": "kyon", "kyu": "kyon",
                "shukriya": "shukriyaa", "dhanyawad": "dhanyawaad", "dhanyavaad": "dhanyawaad",
                "kripya": "kripayaa", "kripaya": "kripayaa", "swagat": "swaagat",
                "sahayata": "sahaayataa", "namaste": "namastay", "chahiye": "chaahiye",
                "batao": "bataao", "bataiye": "bataaiye", "achha": "acchaa", "accha": "acchaa",
                "badhiya": "badiyaa", "shuru": "shuroo", "thik": "theek", "bilkul": "bilkul",
                "kaise": "kaisey", "kahan": "kahaan", "yahan": "yahaan", "wahan": "wahaan",
                "aisa": "aisaa", "apka": "aapka", "thoda": "thodaa", "smjh": "samajh",
                "kr": "kar", "rha": "raha", "rhi": "rahi", "dost": "dost", "plz": "kripaya",
                "pls": "kripaya", "thx": "dhanyawaad", "hn": "haan"
            }

        cls._phoneme_map = data
        return cls._phoneme_map

    @classmethod
    def apply_phoneme_map(cls, text: str) -> str:
        """
        Applies phonetic mappings from phoneme_map.json to convert
        common Hindi/Hinglish spellings into sequences the TTS engine handles better.
        Preserves technical terms and respects word casing.
        """
        if not text:
            return text

        phonemes = cls.load_phoneme_map()
        res = text

        for original, phonetic in phonemes.items():
            # Never overwrite technical terms or existing female grammar invariants
            if original.lower() in cls.TECH_TERMS:
                continue

            # Word boundary pattern
            pattern = rf'\b{re.escape(original)}\b'
            if re.search(pattern, res, flags=re.I):
                def replace_match(m: re.Match, repl: str = phonetic) -> str:
                    matched = m.group(0)
                    if matched.isupper() and len(matched) > 1:
                        return repl.upper()
                    elif matched[0].isupper():
                        return repl[0].upper() + repl[1:]
                    return repl

                res = re.sub(pattern, replace_match, res, flags=re.I)

        return res
