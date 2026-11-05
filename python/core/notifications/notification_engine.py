"""
Notification Engine (Python Edition)
Coordinates notification ingestion, privacy scrubbing, deduplication, and safe summary generation.
Guarantees:
- Zero credential leakage
- Strict deduplication within sliding window
"""

import time
import hashlib
from typing import List, Optional, Dict
from .types import NotificationItem, NotificationPriority, NotificationCategory
from ..security.privacy_filter import PrivacyFilter


class NotificationEngine:
    def __init__(self, deduplication_window_seconds: int = 60):
        self._notifications: List[NotificationItem] = []
        self._seen_hashes: Dict[str, float] = {}
        self._window_seconds = deduplication_window_seconds

    def ingest(
        self,
        app_name: str,
        title: str,
        content: str,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        category: NotificationCategory = NotificationCategory.GENERAL
    ) -> Optional[NotificationItem]:
        # 1. Deduplication check
        content_hash = hashlib.sha256(f"{app_name}:{title}:{content}".encode('utf-8')).hexdigest()
        now = time.time()

        # Clean expired hashes
        self._seen_hashes = {h: ts for h, ts in self._seen_hashes.items() if now - ts < self._window_seconds}

        if content_hash in self._seen_hashes:
            return None  # Duplicate suppressed

        self._seen_hashes[content_hash] = now

        # 2. Privacy filter guard
        sanitized_title = PrivacyFilter.filter_text(title).sanitized_text
        sanitized_content = PrivacyFilter.filter_text(content).sanitized_text

        # 3. Create Notification Item
        item_id = f"notif_{int(now * 1000)}_{len(self._notifications)}"
        item = NotificationItem(
            id=item_id,
            app_name=app_name,
            title=sanitized_title,
            content=sanitized_content,
            priority=priority,
            category=category
        )

        self._notifications.append(item)
        return item

    def get_unread(self) -> List[NotificationItem]:
        return [n for n in self._notifications if not n.is_read]

    def mark_all_read(self) -> None:
        for n in self._notifications:
            n.is_read = True

    def get_recent(self, limit: int = 10) -> List[NotificationItem]:
        return list(reversed(self._notifications[-limit:]))
