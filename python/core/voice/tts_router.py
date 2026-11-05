"""
TTS Router (Python Edition)
Coordinates the TTS routing and fallback architecture:
Assistant Response
→ Privacy Filter (blocks secrets)
→ Speech Text Normalizer (strips markdown, URLs, JSON, enforces feminine persona)
→ Pronunciation Engine (optimizes Hindi / Hinglish phonetics)
→ Fish Audio Provider (Primary)
→ ElevenLabs Provider (Failover)
→ Text-Only Fallback (Zero crash guarantee)
"""

import time
from dataclasses import dataclass
from typing import Optional
from .fish_audio_provider import FishAudioTTSProvider
from .eleven_labs_provider import ElevenLabsTTSProvider
from .speech_text_normalizer import SpeechTextNormalizer
from ..security.privacy_filter import PrivacyFilter


@dataclass
class TTSDispatchResult:
    success: bool
    provider_used: str  # 'fish_audio' | 'elevenlabs' | 'none'
    fallback_triggered: bool
    text: str
    audio_bytes: Optional[bytes] = None
    text_only: bool = False
    fallback_reason: Optional[str] = None
    error: Optional[str] = None
    duplicate_prevented: bool = False


class TTSRouter:
    def __init__(
        self,
        fish_provider: Optional[FishAudioTTSProvider] = None,
        elevenlabs_provider: Optional[ElevenLabsTTSProvider] = None,
        configured_provider: str = "fish_audio"
    ):
        self.fish_provider = fish_provider or FishAudioTTSProvider()
        self.elevenlabs_provider = elevenlabs_provider or ElevenLabsTTSProvider()
        self.configured_provider = configured_provider
        self.last_dispatch_result: Optional[TTSDispatchResult] = None
        self._last_raw_text: str = ""
        self._last_spoken_text: str = ""
        self._last_spoken_time: float = 0.0
        self._debounce_window_seconds: float = 3.0

    def clear_voice_state(self) -> None:
        """
        Clears voice debounce cache, history, and resets speech dispatch state.
        Ensures immediate clear voice synthesis on subsequent speech triggers.
        """
        self._last_raw_text = ""
        self._last_spoken_text = ""
        self._last_spoken_time = 0.0
        self.last_dispatch_result = None

    def route_and_speak(
        self,
        text: str,
        voice_id: Optional[str] = None,
        is_stt: bool = False,
        force_speak: bool = False
    ) -> TTSDispatchResult:
        if not text or not text.strip():
            res = TTSDispatchResult(
                success=True,
                provider_used="none",
                fallback_triggered=False,
                text="",
                text_only=True
            )
            self.last_dispatch_result = res
            return res

        # 1. STT Guard: Prevent STT transcript from being sent directly to TTS
        if is_stt or SpeechTextNormalizer.is_stt_transcript(text):
            res = TTSDispatchResult(
                success=False,
                provider_used="none",
                fallback_triggered=True,
                text=text,
                text_only=True,
                error="STT transcript cannot be sent directly to TTS. Required pipeline: STT -> AI response -> SpeechTextNormalizer -> TTS -> JARVIS voice"
            )
            self.last_dispatch_result = res
            return res

        # 2. Duplicate Speech Prevention (debounce rapid duplicate synthesis requests)
        now = time.time()
        normalized_check = text.strip().lower()
        is_duplicate = (
            not force_speak and
            self._last_spoken_time > 0 and
            (now - self._last_spoken_time) < self._debounce_window_seconds and
            (normalized_check == self._last_raw_text or normalized_check == self._last_spoken_text.lower())
        )
        if is_duplicate:
            res = TTSDispatchResult(
                success=True,
                provider_used="none",
                fallback_triggered=False,
                text=text,
                audio_bytes=None,
                text_only=True,
                duplicate_prevented=True,
                fallback_reason="Duplicate speech prevented within debounce window"
            )
            self.last_dispatch_result = res
            return res

        # 3. Privacy Filter Check
        privacy = PrivacyFilter.filter_text(text)
        if privacy.is_blocked:
            res = TTSDispatchResult(
                success=False,
                provider_used="none",
                fallback_triggered=False,
                text=text,
                text_only=True,
                error=privacy.block_reason
            )
            self.last_dispatch_result = res
            return res

        # 4. Speech Text Normalization layer (enforce natural Hindi/Hinglish, tech terms, female persona)
        norm = SpeechTextNormalizer.normalize(text)
        if norm.is_stt_blocked:
            res = TTSDispatchResult(
                success=False,
                provider_used="none",
                fallback_triggered=True,
                text=text,
                text_only=True,
                error="STT transcript blocked by SpeechTextNormalizer from entering TTS."
            )
            self.last_dispatch_result = res
            return res

        speech_text = norm.normalized_text
        if not speech_text:
            res = TTSDispatchResult(
                success=True,
                provider_used="none",
                fallback_triggered=False,
                text="",
                text_only=True
            )
            self.last_dispatch_result = res
            return res

        # Update speech cache for duplicate prevention
        self._last_raw_text = text.strip().lower()
        self._last_spoken_text = speech_text
        self._last_spoken_time = now

        # 3. Route: Fish Audio Primary
        if self.configured_provider == "fish_audio":
            if self.fish_provider.is_available():
                try:
                    audio = self.fish_provider.speak(speech_text, voice_id=voice_id)
                    res = TTSDispatchResult(
                        success=True,
                        provider_used="fish_audio",
                        fallback_triggered=False,
                        text=speech_text,
                        audio_bytes=audio,
                        text_only=False
                    )
                    self.last_dispatch_result = res
                    return res
                except Exception as fish_err:
                    # Fallback to ElevenLabs
                    return self._fallback_from_fish_audio(speech_text, str(fish_err), voice_id)
            else:
                return self._fallback_from_fish_audio(speech_text, "Fish Audio key unconfigured", voice_id)

        # 4. Route: ElevenLabs Primary
        if self.configured_provider == "elevenlabs":
            if self.elevenlabs_provider.is_available():
                try:
                    audio = self.elevenlabs_provider.speak(speech_text, voice_id=voice_id)
                    res = TTSDispatchResult(
                        success=True,
                        provider_used="elevenlabs",
                        fallback_triggered=False,
                        text=speech_text,
                        audio_bytes=audio,
                        text_only=False
                    )
                    self.last_dispatch_result = res
                    return res
                except Exception as el_err:
                    res = TTSDispatchResult(
                        success=True,
                        provider_used="none",
                        fallback_triggered=True,
                        fallback_reason=f"ElevenLabs failed: {el_err}",
                        text=speech_text,
                        text_only=True
                    )
                    self.last_dispatch_result = res
                    return res

        # Default fallback: text-only
        res = TTSDispatchResult(
            success=True,
            provider_used="none",
            fallback_triggered=True,
            fallback_reason="No TTS provider configured",
            text=speech_text,
            text_only=True
        )
        self.last_dispatch_result = res
        return res

    def _fallback_from_fish_audio(self, text: str, reason: str, voice_id: Optional[str]) -> TTSDispatchResult:
        """
        Fish Audio fails -> try existing ElevenLabs provider -> if both fail, display text without audio.
        """
        if self.elevenlabs_provider.is_available():
            try:
                audio = self.elevenlabs_provider.speak(text, voice_id=voice_id)
                res = TTSDispatchResult(
                    success=True,
                    provider_used="elevenlabs",
                    fallback_triggered=True,
                    fallback_reason=f"Fish Audio failed ({reason}), fell back to ElevenLabs",
                    text=text,
                    audio_bytes=audio,
                    text_only=False
                )
                self.last_dispatch_result = res
                return res
            except Exception:
                pass

        # If both fail -> display text without audio
        res = TTSDispatchResult(
            success=True,
            provider_used="none",
            fallback_triggered=True,
            fallback_reason=f"Both Fish Audio and ElevenLabs failed: {reason}",
            text=text,
            text_only=True
        )
        self.last_dispatch_result = res
        return res
