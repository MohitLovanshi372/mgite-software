"""
Speech Text Normalizer for JARVIS Voice
Exports the SpeechTextNormalizer pipeline for AI response cleanup before TTS.
"""
import sys
import os

# Ensure project root is available in path
_project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

try:
    from python.core.voice.speech_text_normalizer import SpeechTextNormalizer, NormalizationResult
except ImportError:
    import re
    from dataclasses import dataclass
    from typing import Optional

    @dataclass
    class NormalizationResult:
        original_text: str
        normalized_text: str
        detected_language: str = "en"
        pronunciation_result: Optional[object] = None
        is_stt_blocked: bool = False
        duplicate_filtered: bool = False
        pipeline_stage: str = "SpeechTextNormalizer"

    class SpeechTextNormalizer:
        """Fallback lightweight text normalizer if core modules not found."""
        @classmethod
        def normalize(cls, text: str, is_stt: bool = False) -> NormalizationResult:
            if not text:
                return NormalizationResult(original_text="", normalized_text="")
            # Strip markdown formatting
            cleaned = re.sub(r'[*_`#~]', '', text)
            cleaned = re.sub(r'https?://\S+', 'link', cleaned)
            cleaned = re.sub(r'\s+', ' ', cleaned).strip()
            return NormalizationResult(original_text=text, normalized_text=cleaned)

__all__ = ["SpeechTextNormalizer", "NormalizationResult"]
