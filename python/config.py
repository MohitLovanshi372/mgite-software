"""
JARVIS Configuration Module (Python Edition)
Centralized configuration manager supporting environment variables and safe defaults.
Strict Invariant: API keys are backend-only and never exposed in public strings or logs.
"""

import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class VoiceConfig:
    enabled: bool = True
    auto_speak: bool = False
    preferred_language: str = "auto"
    tts_provider: str = os.getenv("TTS_PROVIDER", "fish_audio")
    
    # Fish Audio Settings
    fish_api_key: str = field(default_factory=lambda: os.getenv("FISH_API_KEY", ""))
    fish_model: str = os.getenv("FISH_MODEL", "s2.1-pro-free")
    fish_voice_id: str = os.getenv("FISH_VOICE_ID", "")
    
    # ElevenLabs Settings
    elevenlabs_api_key: str = field(default_factory=lambda: os.getenv("ELEVENLABS_API_KEY", ""))
    elevenlabs_model: str = os.getenv("ELEVENLABS_MODEL", "eleven_multilingual_v2")
    elevenlabs_voice_id: str = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    
    speech_rate: float = 1.0
    speech_volume: float = 1.0


@dataclass
class AppConfig:
    assistant_name: str = "JARVIS"
    version: str = "1.0.0"
    gemini_api_key: str = field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    ai_model: str = os.getenv("AI_MODEL", "gemini-2.5-flash")
    offline_mode: bool = os.getenv("OFFLINE_MODE", "false").lower() == "true"
    db_path: str = os.getenv("DATABASE_PATH", "jarvis_memory.db")
    voice: VoiceConfig = field(default_factory=VoiceConfig)

    def is_fish_audio_configured(self) -> bool:
        return bool(self.voice.fish_api_key and self.voice.fish_api_key.strip())

    def is_elevenlabs_configured(self) -> bool:
        return bool(self.voice.elevenlabs_api_key and self.voice.elevenlabs_api_key.strip())

    def is_gemini_configured(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key.strip())


config = AppConfig()
