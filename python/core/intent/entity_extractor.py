"""
Entity Extractor (Python Edition)
Extracts key structured parameters (time, dates, targets, apps, queries)
from natural language in English, Hindi, and Hinglish.
"""

import re
from typing import Optional
from .types import IntentEntities, IntentType


class EntityExtractor:
    @classmethod
    def extract(
        cls,
        text: str,
        intent: IntentType,
        context: Optional[str] = None
    ) -> IntentEntities:
        entities = IntentEntities()
        lower = text.lower()

        # 1. Query extraction for YouTube / Search / Research
        if intent in (IntentType.SEARCH_YOUTUBE, IntentType.OPEN_YOUTUBE):
            match = re.search(r'(?:search|play|dhundho|chalao|khojo)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:par|pe|in|on)\s+youtube|$)', lower)
            if match:
                entities.query = match.group(1).strip()
            else:
                yt_match = re.search(r'youtube\s+(?:par|pe|me)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:search|play|dhundho|chalao)|$)', lower)
                if yt_match:
                    entities.query = yt_match.group(1).strip()
                else:
                    entities.query = text.strip()

        # 2. Time extraction (e.g., "10 baje", "10:30 am", "tomorrow at 5pm")
        time_match = re.search(r'(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje|o\'clock)?)', lower)
        if time_match:
            entities.time = time_match.group(1).strip()

        # 3. Date / Relative day extraction ("kal", "aaj", "tomorrow", "today")
        if re.search(r'\b(kal|tomorrow)\b', lower):
            entities.date = "tomorrow"
        elif re.search(r'\b(aaj|today)\b', lower):
            entities.date = "today"

        # 4. App extraction (e.g. YouTube, Browser, Calculator)
        if "youtube" in lower:
            entities.app = "YouTube"
        elif "chrome" in lower or "browser" in lower:
            entities.app = "Browser"
        elif "calculator" in lower:
            entities.app = "Calculator"

        # 5. General query
        if not entities.query:
            entities.query = text.strip()

        return entities
