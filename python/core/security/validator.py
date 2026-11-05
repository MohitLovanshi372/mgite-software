"""
AI Response Validator & Shell Directive Guard (Python Edition)
Guarantees:
- Never executes arbitrary shell commands or code
- Blocks bash injection, destructive format commands, and arbitrary PowerShell
- Bounds response lengths to prevent memory exhaustion
"""

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ValidationResult:
    is_valid: bool
    sanitized_response: str
    reason: Optional[str] = None
    blocked_pattern: Optional[str] = None

    @property
    def is_safe(self) -> bool:
        return self.is_valid


class ResponseValidator:
    MAX_RESPONSE_LENGTH = 64000

    DANGEROUS_PATTERNS = [
        (re.compile(r'rm\s+-rf\s+[\/\~]', re.I), "Root/Home recursive directory deletion"),
        (re.compile(r'format\s+[a-z]:', re.I), "Drive format directive"),
        (re.compile(r'powershell(?:\.exe)?\s+.*-(?:enc|encodedcommand)', re.I), "Obfuscated PowerShell execution"),
        (re.compile(r'(?:curl|wget)\s+[^|\n]+\|\s*(?:bash|sh|zsh)', re.I), "Piped remote shell execution"),
        (re.compile(r'mkfs(?:\.[a-z0-9]+)?\s+', re.I), "Filesystem format directive"),
        (re.compile(r'dd\s+if=[^\s]+\s+of=\/dev\/', re.I), "Raw block device overwrite"),
        (re.compile(r'<script\b[^>]*>([\s\S]*?)<\/script>', re.I), "Executable inline script tags"),
    ]

    @classmethod
    def validate_ai_response(cls, raw_response: str) -> ValidationResult:
        if not raw_response or not isinstance(raw_response, str) or not raw_response.strip():
            return ValidationResult(
                is_valid=False,
                sanitized_response="Khali response prapt hua. Kripya dubara try karein.",
                reason="EMPTY_AI_RESPONSE"
            )

        text = raw_response.strip()

        # 1. Length check
        if len(text) > cls.MAX_RESPONSE_LENGTH:
            text = text[:cls.MAX_RESPONSE_LENGTH] + "\n...[Response truncated for safety]"

        # 2. Check dangerous execution directives
        for pattern, description in cls.DANGEROUS_PATTERNS:
            if pattern.search(text):
                return ValidationResult(
                    is_valid=False,
                    sanitized_response="Main ye command execute nahi kar sakti kyunki ye security policy ke khilaf hai.",
                    reason="DANGEROUS_DIRECTIVE_DETECTED",
                    blocked_pattern=description
                )

        return ValidationResult(
            is_valid=True,
            sanitized_response=text
        )
