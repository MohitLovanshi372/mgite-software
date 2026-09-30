"""
Intent Detection & Proactive Intelligence Types (Python Edition)
Defines models for intent classification, entity extraction, risk classification,
response strategies, and proactive event policies.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum


class IntentType(str, Enum):
    CHAT = "CHAT"
    QUESTION = "QUESTION"
    INFORMATION_REQUEST = "INFORMATION_REQUEST"
    REMINDER_REQUEST = "REMINDER_REQUEST"
    TASK_REQUEST = "TASK_REQUEST"
    MEMORY_REQUEST = "MEMORY_REQUEST"
    COMPUTER_ACTION_REQUEST = "COMPUTER_ACTION_REQUEST"
    DOCUMENT_REQUEST = "DOCUMENT_REQUEST"
    NOTIFICATION_REQUEST = "NOTIFICATION_REQUEST"
    SETTINGS_REQUEST = "SETTINGS_REQUEST"
    SYSTEM_STATUS_REQUEST = "SYSTEM_STATUS_REQUEST"
    OPEN_YOUTUBE = "open_youtube"
    SEARCH_YOUTUBE = "search_youtube"
    PLAY_MUSIC = "play_music"
    STOP_MUSIC = "stop_music"
    CHANGE_VIDEO = "change_video"
    DOWNLOAD_MEDIA = "download_media"
    AVATAR_EMOTE = "avatar_emote"
    UNKNOWN = "UNKNOWN"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ResponseStrategy(str, Enum):
    DIRECT_ANSWER = "DIRECT_ANSWER"
    ASK_CLARIFICATION = "ASK_CLARIFICATION"
    REQUEST_CONFIRMATION = "REQUEST_CONFIRMATION"
    EXECUTE_TOOL_LATER = "EXECUTE_TOOL_LATER"
    REFUSE_UNSAFE_ACTION = "REFUSE_UNSAFE_ACTION"
    OFFLINE_RESPONSE = "OFFLINE_RESPONSE"


@dataclass
class IntentEntities:
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    person: Optional[str] = None
    app: Optional[str] = None
    device: Optional[str] = None
    action: Optional[str] = None
    target: Optional[str] = None
    location: Optional[str] = None
    query: Optional[str] = None
    document: Optional[str] = None
    priority: str = "NORMAL"
    custom: Dict[str, str] = field(default_factory=dict)


@dataclass
class IntentResult:
    intent: IntentType
    confidence: float  # 0.0 - 1.0
    entities: IntentEntities
    requires_action: bool
    risk_level: RiskLevel
    response_strategy: ResponseStrategy
    raw_input: str
    clarification_question: Optional[str] = None
    reasoning: Optional[str] = None
    query: Optional[str] = None
