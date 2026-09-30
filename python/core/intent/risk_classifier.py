"""
Risk Classifier & Proactive Policy (Python Edition)
Evaluates action safety levels and proactive alerting policies.
"""

from typing import Tuple
from .types import IntentType, IntentEntities, RiskLevel, ResponseStrategy


class RiskClassifier:
    HIGH_RISK_KEYWORDS = {
        'delete', 'remove', 'format', 'shutdown', 'reboot', 'kill', 'destroy',
        'erase', 'wipe', 'transfer', 'pay', 'send money', 'khali karo', 'hata do',
        'band karo system', 'restart'
    }

    @classmethod
    def classify(
        cls,
        intent: IntentType,
        text: str,
        entities: IntentEntities
    ) -> RiskLevel:
        lower = text.lower()

        # Check for dangerous high-risk keywords
        for kw in cls.HIGH_RISK_KEYWORDS:
            if kw in lower:
                return RiskLevel.HIGH

        if intent in (IntentType.COMPUTER_ACTION_REQUEST, IntentType.SETTINGS_REQUEST):
            return RiskLevel.MEDIUM

        if intent in (IntentType.OPEN_YOUTUBE, IntentType.SEARCH_YOUTUBE, IntentType.PLAY_MUSIC):
            return RiskLevel.LOW

        if intent in (IntentType.CHAT, IntentType.QUESTION, IntentType.SYSTEM_STATUS_REQUEST):
            return RiskLevel.LOW

        return RiskLevel.LOW
