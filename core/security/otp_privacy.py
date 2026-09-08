"""
Sensitive Data & OTP Privacy Engine (Python)
Implements detection & strict pipeline termination rules for OTP, PIN, CVV,
passwords, and banking verification codes.
"""

import re
from typing import Dict, Any, Optional

OTP_PATTERNS = [
    re.compile(r"\b(?:otp|one[- ]time[- ]password|verification\s*code|auth\s*code|security\s*code)\b(?:\s+is\s+|[:\s-])*(\d{4,8})\b", re.IGNORECASE),
    re.compile(r"\b(\d{4,8})\s+(?:is\s+your\s+(?:otp|verification|security|login)\s+code)\b", re.IGNORECASE),
    re.compile(r"\b(?:pin|upi[- ]pin|mpin)\b(?:\s+is\s+|[:\s-])*(\d{4,6})\b", re.IGNORECASE),
    re.compile(r"\b(?:cvv|cvc)\b(?:\s+is\s+|[:\s-])*(\d{3,4})\b", re.IGNORECASE),
    re.compile(r"\b(?:password|passcode)\b(?:\s+is\s+|[:\s-])*([^\s,]{6,})\b", re.IGNORECASE),
]


class OtpPrivacyEngine:
    @staticmethod
    def evaluate_content(text: str) -> Dict[str, Any]:
        """Evaluates incoming text for sensitive authentication items."""
        if not text or not isinstance(text, str):
            return {
                "is_sensitive": False,
                "category": "NONE",
                "should_abort_pipeline": False,
                "suppress_audio": False,
                "suppress_storage": False,
            }

        for pattern in OTP_PATTERNS:
            match = pattern.search(text)
            if match:
                lower = text.lower()
                category = "OTP"
                if "otp" in lower or "one-time" in lower or "one time" in lower:
                    category = "OTP"
                elif "cvv" in lower or "cvc" in lower:
                    category = "CVV"
                elif "upi" in lower or "mpin" in lower:
                    category = "UPI_PIN"
                elif "pin" in lower:
                    category = "PIN"
                elif "password" in lower or "passcode" in lower:
                    category = "PASSWORD"
                elif "bank" in lower:
                    category = "BANKING_CODE"

                return {
                    "is_sensitive": True,
                    "category": category,
                    "classification": "OTP" if category == "OTP" else ("SECURITY_CODE" if category == "BANKING_CODE" else ("FINANCIAL" if category in ("PIN", "UPI_PIN", "CVV") else "CREDENTIAL")),
                    "action": "BLOCK",
                    "should_abort_pipeline": True,
                    "suppress_audio": True,
                    "suppress_storage": True,
                    "sanitized_snippet": "[OTP REDACTED]" if category == "OTP" else "[SENSITIVE_CODE_REDACTED]",
                    "safe_content": "[OTP REDACTED]" if category == "OTP" else "[REDACTED]",
                }

        return {
            "is_sensitive": False,
            "category": "NONE",
            "classification": "NORMAL",
            "action": "ALLOW",
            "should_abort_pipeline": False,
            "suppress_audio": False,
            "suppress_storage": False,
            "safe_content": text,
        }

    @staticmethod
    def purge_temporary_buffer(buffer_id: str) -> None:
        """Purges buffered notification data upon sensitive detection (Phase 2 hook)."""
        pass
