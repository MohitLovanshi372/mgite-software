"""
Notification Types (Python Edition)
Models for notification processing, classification, privacy, and deduplication.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum


class NotificationPriority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class NotificationCategory(str, Enum):
    MESSAGING = "MESSAGING"
    SYSTEM = "SYSTEM"
    TASK = "TASK"
    CALENDAR = "CALENDAR"
    SOCIAL = "SOCIAL"
    SECURITY = "SECURITY"
    GENERAL = "GENERAL"


@dataclass
class NotificationItem:
    id: str
    app_name: str
    title: str
    content: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    priority: NotificationPriority = NotificationPriority.NORMAL
    category: NotificationCategory = NotificationCategory.GENERAL
    is_read: bool = False
    is_delivered: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)
