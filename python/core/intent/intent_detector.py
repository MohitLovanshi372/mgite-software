"""
Intent Detection Engine (Python Edition)
Multilingual (English, Hindi, Hinglish), context-aware, deterministic intent classifier.
Architectural Directives:
- Strictly for understanding, does NOT bypass Permission Gate or Tool Registry.
- Privacy filter always runs before intent classification.
"""

import re
from typing import Optional, List, Dict
from .types import IntentType, IntentResult, RiskLevel, ResponseStrategy
from .entity_extractor import EntityExtractor
from .risk_classifier import RiskClassifier
from ..security.privacy_filter import PrivacyFilter


class IntentDetector:
    @classmethod
    def detect_intent(
        cls,
        raw_text: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> IntentResult:
        text = (raw_text or "").strip()
        lower = text.lower()

        # 1. Privacy Check
        privacy = PrivacyFilter.filter_text(text)
        if privacy.is_blocked:
            return IntentResult(
                intent=IntentType.UNKNOWN,
                confidence=1.0,
                entities=EntityExtractor.extract(text, IntentType.UNKNOWN),
                requires_action=False,
                risk_level=RiskLevel.HIGH,
                response_strategy=ResponseStrategy.REFUSE_UNSAFE_ACTION,
                raw_input=text,
                reasoning="Sensitive credential detected by Privacy Filter"
            )

        # 2. Rule-based Intent Identification
        # YouTube & Media Commands
        if "youtube" in lower:
            if any(w in lower for w in ["search", "khojo", "dhundho", "chalao", "play", "dikhaye"]):
                intent = IntentType.SEARCH_YOUTUBE
            else:
                intent = IntentType.OPEN_YOUTUBE
        elif any(w in lower for w in ["gana", "song", "music", "play music", "chalao"]):
            intent = IntentType.PLAY_MUSIC
        elif any(w in lower for w in ["stop", "band karo", "pause"]) and any(w in lower for w in ["music", "gana", "video"]):
            intent = IntentType.STOP_MUSIC
        elif any(w in lower for w in ["clear voice", "voice clear", "awaaz saaf", "voice reset", "audio clear"]):
            intent = IntentType.SETTINGS_REQUEST
        elif any(w in lower for w in ["status", "system status", "health", "resources", "kaise chal rahi ho"]):
            intent = IntentType.SYSTEM_STATUS_REQUEST
        elif any(w in lower for w in ["remind", "yaad dilana", "yaad rakho", "reminder"]):
            intent = IntentType.REMINDER_REQUEST
        elif any(w in lower for w in ["task", "karo", "do this", "execute"]):
            intent = IntentType.TASK_REQUEST
        elif any(w in lower for w in ["yaad hai", "kya tha", "remember", "memory"]):
            intent = IntentType.MEMORY_REQUEST
        elif any(w in lower for w in ["kya", "kyun", "kaise", "what", "why", "how", "who", "when"]):
            intent = IntentType.QUESTION
        else:
            intent = IntentType.CHAT

        # 3. Entity Extraction
        entities = EntityExtractor.extract(text, intent)

        # 4. Risk Classification
        risk = RiskClassifier.classify(intent, text, entities)

        # 5. Response Strategy
        if risk == RiskLevel.HIGH:
            strategy = ResponseStrategy.REQUEST_CONFIRMATION
        elif intent in (IntentType.TASK_REQUEST, IntentType.OPEN_YOUTUBE, IntentType.SEARCH_YOUTUBE):
            strategy = ResponseStrategy.DIRECT_ANSWER
        else:
            strategy = ResponseStrategy.DIRECT_ANSWER

        requires_action = intent in (
            IntentType.OPEN_YOUTUBE,
            IntentType.SEARCH_YOUTUBE,
            IntentType.PLAY_MUSIC,
            IntentType.STOP_MUSIC,
            IntentType.TASK_REQUEST,
            IntentType.SYSTEM_STATUS_REQUEST,
        )

        return IntentResult(
            intent=intent,
            confidence=0.92,
            entities=entities,
            requires_action=requires_action,
            risk_level=risk,
            response_strategy=strategy,
            raw_input=text,
            query=entities.query
        )
