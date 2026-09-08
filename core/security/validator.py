"""
AI Response Validator & Tool Execution Guard (Python)
Ensures AI responses do not execute or emit destructive system commands.
"""

import re
from typing import Dict, Any

DANGEROUS_PATTERNS = [
    re.compile(r"rm\s+-rf\s+[\/\~]", re.IGNORECASE),
    re.compile(r"format\s+[c-z]:", re.IGNORECASE),
    re.compile(r"powershell(?:\.exe)?\s+-enc", re.IGNORECASE),
    re.compile(r"curl\s+.*\|\s*(?:bash|sh)", re.IGNORECASE),
    re.compile(r"wget\s+.*\|\s*(?:bash|sh)", re.IGNORECASE),
]


class ResponseValidator:
    @staticmethod
    def validate_ai_response(response: str) -> Dict[str, Any]:
        if not response or not isinstance(response, str):
            return {
                "is_valid": False,
                "sanitized_response": "No response received from provider.",
                "reason": "EMPTY_RESPONSE",
            }

        sanitized = response
        blocked = None
        reason = None

        for pattern in DANGEROUS_PATTERNS:
            if pattern.search(sanitized):
                sanitized = pattern.sub(
                    "[SECURITY POLICY: BLOCKED POTENTIALLY HARMFUL COMMAND DIRECTIVE]", sanitized
                )
                blocked = "DANGEROUS_SYSTEM_COMMAND"
                reason = "Harmful command pattern detected and sanitized."

        return {
            "is_valid": True,
            "sanitized_response": sanitized,
            "blocked_action": blocked,
            "reason": reason,
        }
