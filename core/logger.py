"""
Structured Logging Module (Python)
Provides safe, structured logging without leaking credentials, passwords, or OTPs.
"""

import logging
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from core.security.sanitizer import redact_secrets_for_logs

LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOGS_DIR / "assistant.log"

# Circular buffer for UI endpoint viewing
_IN_MEMORY_LOGS: List[Dict[str, Any]] = []
MAX_IN_MEMORY_LOGS = 500


class SafeFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        orig = super().format(record)
        return redact_secrets_for_logs(orig)


def setup_logger(name: str = "assistant") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)

        handler = logging.FileHandler(str(LOG_FILE), encoding="utf-8")
        handler.setFormatter(
            SafeFormatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
        )
        logger.addHandler(handler)

        stream = logging.StreamHandler()
        stream.setFormatter(
            SafeFormatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
        )
        logger.addHandler(stream)
    return logger


assistant_logger = setup_logger()


def log_event(level: str, module: str, message: str, details: Optional[Dict[str, Any]] = None) -> None:
    clean_msg = redact_secrets_for_logs(message)
    entry = {
        "timestamp": logging.Formatter().formatTime(logging.LogRecord("", 0, "", 0, "", (), None)),
        "level": level.upper(),
        "module": module,
        "message": clean_msg,
        "details": details,
    }
    _IN_MEMORY_LOGS.insert(0, entry)
    if len(_IN_MEMORY_LOGS) > MAX_IN_MEMORY_LOGS:
        _IN_MEMORY_LOGS.pop()

    log_func = getattr(assistant_logger, level.lower(), assistant_logger.info)
    log_func(f"[{module}] {clean_msg}")


def get_logs(level: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    logs = _IN_MEMORY_LOGS
    if level:
        logs = [l for l in logs if l["level"] == level.upper()]
    return logs[:limit]
