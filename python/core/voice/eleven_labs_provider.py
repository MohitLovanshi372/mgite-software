"""
ElevenLabs TTS Provider (Python Edition)
Implements text-to-speech with ElevenLabs API:
Endpoint: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
Strict Guarantees:
- ELEVENLABS_API_KEY is backend-only and never exposed in logs or errors
- PrivacyFilter executes before dispatch
"""

import json
from typing import Any, Callable, Dict, Optional
import urllib.request
import urllib.error
from ..security.privacy_filter import PrivacyFilter
from .speech_text_normalizer import SpeechTextNormalizer


class ElevenLabsTTSProvider:
    DEFAULT_MODEL = "eleven_multilingual_v2"
    DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

    def __init__(
        self,
        api_key: str = "",
        voice_id: str = DEFAULT_VOICE_ID,
        model: str = DEFAULT_MODEL
    ):
        self.api_key = api_key
        self.voice_id = voice_id or self.DEFAULT_VOICE_ID
        self.model = model or self.DEFAULT_MODEL
        self._mock_handler: Optional[Callable[[Dict[str, Any]], Any]] = None
        self.last_dispatch_payload: Optional[Dict[str, Any]] = None

    @property
    def id(self) -> str:
        return "elevenlabs"

    @property
    def name(self) -> str:
        return "ElevenLabs AI Voice"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip()) or self._mock_handler is not None

    def set_mock_handler(self, handler: Optional[Callable[[Dict[str, Any]], Any]]) -> None:
        self._mock_handler = handler

    def speak(self, text: str, voice_id: Optional[str] = None) -> bytes:
        if not text or not text.strip():
            return b""

        privacy = PrivacyFilter.filter_text(text)
        if privacy.is_blocked:
            raise ValueError(f"TTS synthesis blocked by Privacy Shield: {privacy.block_reason}")

        norm = SpeechTextNormalizer.normalize(text)
        speech_text = norm.normalized_text
        target_voice = voice_id or self.voice_id

        payload = {
            "text": speech_text,
            "model_id": self.model,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            }
        }
        self.last_dispatch_payload = payload

        if self._mock_handler:
            result = self._mock_handler(payload)
            if isinstance(result, bytes):
                return result
            return b"MOCK_AUDIO_ELEVENLABS"

        if not self.api_key or not self.api_key.strip():
            raise ValueError("ElevenLabs API key is missing. Configure ELEVENLABS_API_KEY in environment.")

        endpoint = f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice}"
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={
                "xi-api-key": self.api_key,
                "Content-Type": "application/json",
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                return response.read()
        except urllib.error.HTTPError as e:
            err_msg = f"ElevenLabs HTTP {e.code}: {e.reason}"
            if self.api_key:
                err_msg = err_msg.replace(self.api_key, "[REDACTED_API_KEY]")
            raise RuntimeError(err_msg) from e
        except Exception as e:
            safe_err = str(e)
            if self.api_key:
                safe_err = safe_err.replace(self.api_key, "[REDACTED_API_KEY]")
            raise RuntimeError(f"ElevenLabs synthesis failed: {safe_err}") from e
