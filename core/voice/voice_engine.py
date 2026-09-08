"""
Voice Engine Interface (Phase 2 Placeholder - Python)
STATUS: Intentionally not implemented in Phase 1.
"""

from typing import Dict, Any


class VoiceEngine:
    STATUS = "PHASE_2_PLACEHOLDER"

    @classmethod
    def is_listening(cls) -> bool:
        return False

    @classmethod
    async def start_listening(cls) -> Dict[str, Any]:
        return {
            "success": False,
            "message": "Voice Engine is scheduled for Phase 2 and is intentionally not implemented in Phase 1.",
        }

    @classmethod
    async def speak(cls, text: str) -> Dict[str, Any]:
        return {
            "success": False,
            "message": "TTS is scheduled for Phase 2 and is intentionally not implemented in Phase 1.",
        }
