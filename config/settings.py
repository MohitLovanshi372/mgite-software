"""
Configuration module for Personal AI Assistant (Python Backend)
Loads settings from environment variables and default configuration files.
Never hard-codes API keys or secrets.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

CONFIG_DIR = Path(__file__).resolve().parent
DEFAULT_CONFIG_PATH = CONFIG_DIR / "default_config.json"


class MemoryConfig(BaseModel):
    enabled: bool = True
    default_sensitivity: str = "NORMAL"
    retention_days: int = 90


class SecurityConfig(BaseModel):
    redact_sensitive_inputs: bool = True
    strict_tool_allowlist: bool = True
    max_prompt_chars: int = 8000


class AppSettings(BaseModel):
    assistant_name: str = "JARVIS"
    version: str = "0.1.0"
    theme: str = "dark"
    preferred_language: str = "multilingual"
    default_provider: str = Field(default_factory=lambda: os.getenv("AI_PROVIDER", "gemini"))
    model: str = "gemini-3.8-flash"
    temperature: float = 0.7
    offline_mode: bool = False
    backend_host: str = Field(default_factory=lambda: os.getenv("BACKEND_HOST", "127.0.0.1"))
    backend_port: int = Field(default_factory=lambda: int(os.getenv("BACKEND_PORT", "8000")))
    memory: MemoryConfig = Field(default_factory=MemoryConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    modules: Dict[str, Any] = Field(default_factory=dict)


def load_settings() -> AppSettings:
    """Load settings combining default_config.json and environment overrides."""
    data = {}
    if DEFAULT_CONFIG_PATH.exists():
        try:
            with open(DEFAULT_CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            pass

    # Apply environment overrides safely
    if os.getenv("AI_PROVIDER"):
        data["default_provider"] = os.getenv("AI_PROVIDER")

    return AppSettings(**data)


# Global singleton settings instance
settings = load_settings()
