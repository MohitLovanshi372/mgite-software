"""
Fish Audio TTS Provider (Python Edition)
Implements text-to-speech using official Fish Audio API:
Endpoint: POST https://api.fish.audio/v1/tts
Payload: {"text": text, "reference_id": voice_id, "format": "mp3", "model": "s2.1-pro-free"}
Headers: Authorization: Bearer <FISH_API_KEY>

Strict Guarantees:
- FISH_API_KEY is backend-only and never exposed in logs or errors
- PrivacyFilter executes before dispatch (blocks OTPs and passwords)
- SpeechTextNormalizer strips raw markdown, JSON, URLs
- Mock client support for offline testing
"""

import json
from typing import Any, Callable, Dict, Optional
import urllib.request
import urllib.error
from ..security.privacy_filter import PrivacyFilter
from .speech_text_normalizer import SpeechTextNormalizer


class FishAudioTTSProvider:
    DEFAULT_ENDPOINT = "https://api.fish.audio/v1/tts"
    DEFAULT_MODEL = "s2.1-pro-free"

    def __init__(
        self,
        api_key: str = "",
        voice_id: str = "",
        model: str = DEFAULT_MODEL,
        endpoint: str = DEFAULT_ENDPOINT
    ):
        self.api_key = api_key
        self.voice_id = voice_id
        self.model = model or self.DEFAULT_MODEL
        self.endpoint = endpoint
        self._mock_handler: Optional[Callable[[Dict[str, Any]], Any]] = None
        self.last_dispatch_payload: Optional[Dict[str, Any]] = None

    @property
    def id(self) -> str:
        return "fish_audio"

    @property
    def name(self) -> str:
        return "Fish Audio TTS"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip()) or self._mock_handler is not None

    def set_mock_handler(self, handler: Optional[Callable[[Dict[str, Any]], Any]]) -> None:
        self._mock_handler = handler

    def speak(self, text: str, voice_id: Optional[str] = None) -> bytes:
        if not text or not text.strip():
            return b""

        # 1. Privacy Filter Guard (Strict invariant: blocks OTPs and secrets)
        privacy = PrivacyFilter.filter_text(text)
        if privacy.is_blocked:
            raise ValueError(f"TTS synthesis blocked by Privacy Shield: {privacy.block_reason}")

        # 2. Speech Text Normalizer (Strips markdown, JSON, URLs, preserves feminine persona)
        norm = SpeechTextNormalizer.normalize(text)
        speech_text = norm.normalized_text

        # 3. Target voice ID
        target_voice = voice_id or self.voice_id

        # 4. Prepared sanitized payload (API key is NEVER stored inside the payload)
        payload = {
            "text": speech_text,
            "reference_id": target_voice,
            "format": "mp3",
            "model": self.model,
        }
        self.last_dispatch_payload = payload

        # 5. Mock execution for unit tests / offline verification
        if self._mock_handler:
            result = self._mock_handler(payload)
            if isinstance(result, bytes):
                return result
            return b"MOCK_AUDIO_BYTES_MP3"

        # 6. Live API execution via urllib
        if not self.api_key or not self.api_key.strip():
            raise ValueError("Fish Audio API key is missing. Configure FISH_API_KEY in environment.")

        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            self.endpoint,
            data=data,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "JARVIS-Python/1.0",
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                return response.read()
        except urllib.error.HTTPError as e:
            err_msg = f"Fish Audio HTTP {e.code}: {e.reason}"
            if self.api_key:
                err_msg = err_msg.replace(self.api_key, "[REDACTED_API_KEY]")
            raise RuntimeError(err_msg) from e
        except Exception as e:
            safe_err = str(e)
            if self.api_key:
                safe_err = safe_err.replace(self.api_key, "[REDACTED_API_KEY]")
            raise RuntimeError(f"Fish Audio synthesis failed: {safe_err}") from e
