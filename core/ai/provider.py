"""
Abstract AI Provider Interface (Python Backend - Phase 2 Step 2)
Defines protocol for interchangeable AI backends (Gemini, Local LLMs, etc.)
Strictly provider-independent.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class AIMessage(BaseModel):
    role: str  # 'user' | 'assistant' | 'system'
    content: str
    timestamp: Optional[str] = None


class AIContext(BaseModel):
    conversation_id: str
    messages: List[AIMessage] = Field(default_factory=list)
    system_instruction: str = ""
    memory_context: Optional[str] = None
    max_context_messages: int = 10


class AIRequest(BaseModel):
    prompt: str
    context: Optional[AIContext] = None
    model: str = "gemini-3.8-flash"
    temperature: float = 0.7
    system_instruction: Optional[str] = None
    history: List[AIMessage] = Field(default_factory=list)


class AIResponse(BaseModel):
    text: str
    provider: str
    model: str
    is_offline_fallback: bool = False
    tokens_used: int = 0
    warnings: List[str] = Field(default_factory=list)


class AIProvider(ABC):
    @property
    @abstractmethod
    def id(self) -> str:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def generate_response(self, request: AIRequest) -> AIResponse:
        pass

    @abstractmethod
    async def check_availability(self) -> Dict[str, Any]:
        pass
