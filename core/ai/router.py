"""
AI Model Router (Python Backend - Phase 2 Step 2)
Routes tasks across local offline models and cloud providers based on privacy policy.
Provider-independent.
"""

from typing import Dict, Optional
from core.ai.provider import AIProvider
from core.ai.gemini_provider import GeminiProvider


class MultiAiRouter:
    def __init__(self):
        self._providers: Dict[str, AIProvider] = {}
        self.register(GeminiProvider())

    def register(self, provider: AIProvider) -> None:
        self._providers[provider.id] = provider

    def get_provider(self, provider_id: str) -> Optional[AIProvider]:
        return self._providers.get(provider_id)

    def route_request(self, task_type: str = "general") -> AIProvider:
        """Determines best provider for a given task."""
        if task_type in ("offline", "sensitive"):
            # Fallback or offline
            return self._providers.get("offline") or self._providers.get("gemini")
        return self._providers.get("gemini")


ai_router = MultiAiRouter()
