"""
JARVIS Fish Audio Text-To-Speech Integration (Python Edition)

Flow:
AI response -> SpeechTextNormalizer -> Fish Audio API -> reference_id -> MP3 audio -> Windows audio playback

Guarantees:
- Payload uses 'reference_id': self.voice_id (NOT 'voice_id')
- Payload includes 'format': 'mp3'
- Fish Audio model is sent via HTTP header: 'model': 's2.1-pro-free'
- API credentials: FISH_API_KEY and FISH_VOICE_ID loaded from .env
- Default voice ID: 817eba7f1aea469f9802326568d427b9 (unchanged)
- Complete sentence sent to TTS after SpeechTextNormalizer
- Comprehensive error logging for missing keys, missing voice ID, HTTP errors, empty audio
"""

import os
import sys
import json
import logging
import urllib.request
import urllib.error
from typing import Optional, Dict, Any

# Ensure project root is in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(os.path.dirname(_current_dir))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

# Setup Logger with proper formatting
logger = logging.getLogger("TextToSpeech")
if not logger.handlers:
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] [FishAudioTTS] %(message)s"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)

# Import SpeechTextNormalizer
try:
    from app.voice.speech_text_normalizer import SpeechTextNormalizer
except ImportError:
    try:
        from python.core.voice.speech_text_normalizer import SpeechTextNormalizer
    except ImportError:
        SpeechTextNormalizer = None


def _load_env_file() -> None:
    """Safely loads variables from .env into os.environ if not already defined."""
    env_paths = [
        os.path.join(os.getcwd(), ".env"),
        os.path.join(_project_root, ".env"),
        os.path.join(os.path.dirname(_project_root), ".env"),
    ]
    for env_path in env_paths:
        if os.path.isfile(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("'\"")
                        if key and key not in os.environ:
                            os.environ[key] = val
                break
            except Exception as e:
                logger.warning(f"Error reading .env file from {env_path}: {e}")


# Preload environment variables from .env
_load_env_file()


class TextToSpeech:
    """
    Fish Audio TTS Client.
    Sends POST https://api.fish.audio/v1/tts
    Payload: {"text": cleaned_sentence, "reference_id": voice_id, "format": "mp3"}
    Headers: Authorization: Bearer <FISH_API_KEY>, Content-Type: application/json, model: s2.1-pro-free
    """
    DEFAULT_ENDPOINT = "https://api.fish.audio/v1/tts"
    DEFAULT_MODEL = "s2.1-pro-free"
    # 7. Do NOT change the Fish Audio voice ID
    DEFAULT_VOICE_ID = "817eba7f1aea469f9802326568d427b9"

    def __init__(
        self,
        api_key: Optional[str] = None,
        voice_id: Optional[str] = None,
        model: Optional[str] = None,
        endpoint: Optional[str] = None,
    ):
        # 4. Keep FISH_API_KEY from .env (with fallback to FISH_AUDIO_API_KEY)
        raw_key = (
            api_key
            or os.getenv("FISH_API_KEY")
            or os.getenv("FISH_AUDIO_API_KEY")
            or ""
        ).strip()

        # Sanitize if pasted key contains space or reference ID
        if " " in raw_key:
            parts = raw_key.split()
            found_key = next((p for p in parts if p.startswith("sk-") or len(p) > 40), parts[0])
            found_voice = next((p for p in parts if len(p) == 32), None)
            raw_key = found_key
            if found_voice and not voice_id:
                voice_id = found_voice

        self.api_key: str = raw_key

        # 4. Keep FISH_VOICE_ID from .env (with fallback to FISH_AUDIO_REFERENCE_ID)
        # 7. Do NOT change the Fish Audio voice ID default
        raw_voice = (
            voice_id
            or os.getenv("FISH_VOICE_ID")
            or os.getenv("FISH_AUDIO_REFERENCE_ID")
            or ""
        ).strip()
        self.voice_id: str = raw_voice or self.DEFAULT_VOICE_ID

        # 2. Fish Audio model sent in HTTP header
        self.model: str = (model or os.getenv("FISH_AUDIO_MODEL") or os.getenv("FISH_MODEL") or self.DEFAULT_MODEL).strip()
        self.endpoint: str = endpoint or self.DEFAULT_ENDPOINT

        # Log missing configuration upfront
        self._validate_configuration()

    def _validate_configuration(self) -> None:
        """Validates API credentials and logs clear errors if missing."""
        if not self.api_key:
            logger.error("Missing Fish API key! Please set FISH_API_KEY in your .env file.")
        if not self.voice_id:
            logger.error("Missing Fish Audio voice/reference ID! Please set FISH_VOICE_ID in your .env file.")

    def synthesize(self, text: str) -> Optional[bytes]:
        """
        Synthesizes a complete cleaned sentence into MP3 audio via Fish Audio API.

        Flow:
        AI response -> SpeechTextNormalizer -> Fish Audio API -> reference_id -> MP3 audio

        Returns:
            bytes: MP3 audio bytes on success
            None: on error or empty response (error is logged)
        """
        # 10. Error logging for missing Fish API key
        if not self.api_key:
            logger.error("Synthesis failed: missing Fish API key. Set FISH_API_KEY in .env.")
            return None

        # 10. Error logging for missing voice/reference ID
        if not self.voice_id:
            logger.error("Synthesis failed: missing voice/reference ID. Set FISH_VOICE_ID in .env.")
            return None

        if not text or not str(text).strip():
            logger.warning("Synthesis skipped: text is empty.")
            return None

        # Pass through SpeechTextNormalizer to obtain complete cleaned sentence
        # Strips markdown, URLs, JSON formatting and aligns feminine JARVIS cadence
        cleaned_text = text.strip()
        if SpeechTextNormalizer is not None:
            norm_res = SpeechTextNormalizer.normalize(cleaned_text)
            if hasattr(norm_res, "is_stt_blocked") and norm_res.is_stt_blocked:
                logger.warning("Synthesis blocked: STT transcript cannot be directly synthesized.")
                return None
            cleaned_text = norm_res.normalized_text.strip()

        if not cleaned_text:
            logger.warning("Synthesis skipped: text was empty after normalization.")
            return None

        # 1. Change "voice_id": self.voice_id to "reference_id": self.voice_id
        # 3. Add: "format": "mp3"
        payload = {
            "text": cleaned_text,
            "reference_id": self.voice_id,
            "format": "mp3"
        }

        # 2. The Fish Audio model must be sent using the HTTP header: model: s2.1-pro-free
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "model": self.model,
            "User-Agent": "JARVIS-Python/1.0"
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.endpoint,
            data=data,
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                audio_bytes = response.read()

                # 10. Error logging for empty audio response
                if not audio_bytes or len(audio_bytes) == 0:
                    logger.error("Fish Audio API returned empty audio response (0 bytes).")
                    return None

                logger.info(
                    f"Fish Audio synthesis successful: {len(cleaned_text)} chars -> "
                    f"{len(audio_bytes)} bytes MP3 (reference_id={self.voice_id[:8]}..., model={self.model})"
                )
                return audio_bytes

        # 10. Error logging for Fish API HTTP errors
        except urllib.error.HTTPError as e:
            error_details = ""
            try:
                error_details = e.read().decode("utf-8", errors="ignore")
            except Exception:
                pass
            safe_details = error_details
            if self.api_key:
                safe_details = safe_details.replace(self.api_key, "[REDACTED_API_KEY]")
            logger.error(f"Fish API HTTP error {e.code} ({e.reason}): {safe_details}")
            return None

        except urllib.error.URLError as e:
            logger.error(f"Fish API connection error: {e.reason}")
            return None

        except Exception as e:
            safe_err = str(e)
            if self.api_key:
                safe_err = safe_err.replace(self.api_key, "[REDACTED_API_KEY]")
            logger.error(f"Unexpected error during Fish Audio synthesis: {safe_err}")
            return None
