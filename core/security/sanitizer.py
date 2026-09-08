"""
Security Sanitizer & Privacy Filter (Python)
Sanitizes inputs, strips control chars, redacts secrets, and safeguards logs.
"""

import re
from typing import Tuple, List

SENSITIVE_PATTERNS = [
    re.compile(r"(?:api[_-]?key|secret|token|password|auth|bearer)\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{8,})['\"]?", re.IGNORECASE),
    re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"),
    re.compile(r"\b(?:cvv|cvc)\s*[:=]?\s*\d{3,4}\b", re.IGNORECASE),
    re.compile(r"\b(?:otp|one[- ]time[- ]password|pin|upi[- ]pin)\s*[:=]?\s*(\d{4,8})\b", re.IGNORECASE),
]

GEMINI_KEY_PATTERN = re.compile(r"AIza[0-9A-Za-z-_]{35}")


def sanitize_input(text: str, max_chars: int = 8000) -> Tuple[str, bool, List[str]]:
    """Sanitizes user input and flags sensitive content."""
    if not isinstance(text, str):
        return "", False, []

    # 1. Truncate
    cleaned = text[:max_chars].strip()

    # 2. Remove control characters
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", cleaned)

    # 3. Detect and mask secrets
    had_sensitive = False
    detected = []

    for pattern in SENSITIVE_PATTERNS:
        if pattern.search(cleaned):
            had_sensitive = True
            detected.append("REDACTED_SECRET")
            cleaned = pattern.sub("[PROTECTED_SENSITIVE_DATA]", cleaned)

    return cleaned, had_sensitive, detected


def redact_secrets_for_logs(message: str) -> str:
    """Ensures logs never contain API keys, passwords, or tokens."""
    if not isinstance(message, str):
        return ""

    sanitized = GEMINI_KEY_PATTERN.sub("[REDACTED_GEMINI_KEY]", message)
    for pattern in SENSITIVE_PATTERNS:
        sanitized = pattern.sub("[REDACTED_LOG_SECRET]", sanitized)

    return sanitized
