"""
Privacy Filter & Sensitive Data Guard (Python Edition)
Deterministic, local-first sensitive data protection.
Strict Invariants:
- High-priority OTPs trigger BLOCK
- Passwords, PINs, CVVs, API keys, tokens are redacted/blocked
- External AI and TTS are protected from reading credentials aloud
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class PrivacyFilterResult:
    clean_text: str
    safe_content: str
    is_blocked: bool
    had_sensitive_data: bool
    detected_types: List[str] = field(default_factory=list)
    block_reason: Optional[str] = None

    @property
    def sanitized_text(self) -> str:
        return self.clean_text


class PrivacyFilter:
    # High-risk OTP detection regex (e.g. "otp is 482910", "code: 8492")
    OTP_PATTERN = re.compile(
        r'\b(?:otp|one[- ]time[- ]password|verification\s*code|security\s*code|pin)\b[^\w\n]{0,10}(\d{4,8})\b',
        re.IGNORECASE
    )

    # General credential patterns
    PASSWORD_PATTERN = re.compile(
        r'\b(?:password|passwd|pwd|secret_key)\b(?:\s+is|\s*[:=])?\s*([^\s,]{4,32})?',
        re.IGNORECASE
    )

    # API Key patterns
    API_KEY_PATTERN = re.compile(
        r'\b(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{20,}|fish_[a-zA-Z0-9_-]{20,})\b'
    )

    # Credit Card & CVV patterns
    CARD_PATTERN = re.compile(r'\b(?:\d{4}[ -]?){3}\d{4}\b')
    CVV_PATTERN = re.compile(r'\b(?:cvv|cvc|security\s*code)\b[^\w\n]{0,5}(\d{3,4})\b', re.IGNORECASE)

    @classmethod
    def filter_text(cls, raw_text: str) -> PrivacyFilterResult:
        if not raw_text or not raw_text.strip():
            return PrivacyFilterResult(
                clean_text="",
                safe_content="",
                is_blocked=False,
                had_sensitive_data=False,
                detected_types=[]
            )

        text = raw_text.strip()
        detected_types: List[str] = []

        # 1. OTP detection (High Priority Block)
        otp_match = cls.OTP_PATTERN.search(text)
        if otp_match or (re.search(r'\b(otp|pin|verification\s*code)\b', text, re.I) and re.search(r'\b\d{4,8}\b', text)):
            detected_types.append("OTP")
            return PrivacyFilterResult(
                clean_text="[SENSITIVE_DATA_BLOCKED: OTP]",
                safe_content="[SENSITIVE_DATA_BLOCKED: OTP]",
                is_blocked=True,
                had_sensitive_data=True,
                detected_types=detected_types,
                block_reason="Content contains sensitive OTP/Verification Code. Action blocked."
            )

        # 2. Passwords / Secrets
        if cls.PASSWORD_PATTERN.search(text):
            detected_types.append("PASSWORD")
            return PrivacyFilterResult(
                clean_text="[SENSITIVE_DATA_BLOCKED: PASSWORD]",
                safe_content="[SENSITIVE_DATA_BLOCKED: PASSWORD]",
                is_blocked=True,
                had_sensitive_data=True,
                detected_types=detected_types,
                block_reason="Content contains sensitive Password or secret credential. Action blocked."
            )

        # 3. API Keys
        if cls.API_KEY_PATTERN.search(text):
            detected_types.append("API_KEY")
            text = cls.API_KEY_PATTERN.sub('[REDACTED_API_KEY]', text)

        # 4. Financial card / CVV
        if cls.CARD_PATTERN.search(text):
            detected_types.append("CREDIT_CARD")
            text = cls.CARD_PATTERN.sub('[REDACTED_CARD_NUMBER]', text)

        if cls.CVV_PATTERN.search(text):
            detected_types.append("CVV")
            text = cls.CVV_PATTERN.sub(r'cvv: [REDACTED_CVV]', text)

        had_sensitive = len(detected_types) > 0
        return PrivacyFilterResult(
            clean_text=text,
            safe_content=text,
            is_blocked=False,
            had_sensitive_data=had_sensitive,
            detected_types=detected_types
        )
