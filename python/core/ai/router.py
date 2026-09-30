"""
AI Router (Python Edition)
Routes between online Gemini API and secure deterministic local offline fallback.
Ensures zero crashes when network or API key is unavailable.
"""

from typing import Dict, List, Optional
from .gemini_provider import GeminiProvider
from ...config import config


class AIRouter:
    def __init__(self, gemini_provider: Optional[GeminiProvider] = None):
        self.gemini_provider = gemini_provider or GeminiProvider()

    def generate(
        self,
        prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        force_offline: bool = False
    ) -> Dict[str, str]:
        if force_offline or config.offline_mode or not self.gemini_provider.is_available():
            text = self.gemini_provider._local_fallback(prompt)
            return {
                "response": text,
                "provider": "offline_local",
                "model": "rule_based_fallback",
                "is_offline": True,
            }

        try:
            text = self.gemini_provider.generate_response(prompt, conversation_history)
            return {
                "response": text,
                "provider": "gemini",
                "model": self.gemini_provider.model,
                "is_offline": False,
            }
        except Exception:
            text = self.gemini_provider._local_fallback(prompt)
            return {
                "response": text,
                "provider": "offline_local",
                "model": "rule_based_fallback",
                "is_offline": True,
            }
