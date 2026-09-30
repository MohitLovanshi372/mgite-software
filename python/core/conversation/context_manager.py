"""
Context Manager (Python Edition)
Manages multi-turn conversation history, rolling window buffers,
and privacy sanitization of conversation turns.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from ..security.privacy_filter import PrivacyFilter


@dataclass
class ConversationMessage:
    role: str  # 'user' | 'assistant' | 'system'
    content: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class ContextManager:
    def __init__(self, max_history_turns: int = 10):
        self.max_history_turns = max_history_turns
        self.history: List[ConversationMessage] = []

    def add_user_message(self, content: str) -> None:
        sanitized = PrivacyFilter.filter_text(content).sanitized_text
        self.history.append(ConversationMessage(role="user", content=sanitized))
        self._trim_history()

    def add_assistant_message(self, content: str) -> None:
        sanitized = PrivacyFilter.filter_text(content).sanitized_text
        self.history.append(ConversationMessage(role="assistant", content=sanitized))
        self._trim_history()

    def get_history(self) -> List[Dict[str, str]]:
        return [{"role": m.role, "content": m.content} for m in self.history]

    def clear(self) -> None:
        self.history.clear()

    def _trim_history(self) -> None:
        if len(self.history) > self.max_history_turns * 2:
            self.history = self.history[-(self.max_history_turns * 2):]
