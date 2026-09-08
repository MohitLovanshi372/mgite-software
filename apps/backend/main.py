"""
Personal AI Assistant - FastAPI Local Backend Server (Phase 1 Foundation)
Provides local HTTP API for Desktop (Electron/React), future Android companion, and local tools.
"""

import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from config.settings import settings, update_config if "update_config" in globals() else None
from core.orchestrator.orchestrator import orchestrator
from core.memory.memory_engine import memory_engine, SensitivityLevel
from core.logger import log_event, get_logs
from core.ai.gemini_provider import GeminiProvider

app = FastAPI(
    title="Personal AI Assistant Backend",
    version="0.1.0",
    description="Privacy-first, local-first Personal AI Assistant backend",
)

# Allow local frontend / Electron requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    conversation_id: Optional[str] = None
    is_offline_mode: Optional[bool] = None


class MemoryCreateRequest(BaseModel):
    key: str
    value: str
    category: str = "general"
    sensitivity: str = "NORMAL"


class ConfigUpdateRequest(BaseModel):
    assistant_name: Optional[str] = None
    theme: Optional[str] = None
    preferred_language: Optional[str] = None
    model: Optional[str] = None
    offline_mode: Optional[bool] = None


# 1. Health Endpoint (Mandatory Phase 1 requirement)
@app.get("/health")
async def health_check():
    """
    GET /health
    Returns health status without leaking secrets.
    """
    return {
        "status": "ok",
        "service": "personal-ai-assistant",
        "version": "0.1.0",
    }


# 2. System Status
@app.get("/api/status")
async def get_system_status():
    gemini = GeminiProvider()
    avail = await gemini.check_availability()
    stats = {
        "conversations": len(memory_engine.list_conversations()),
        "memory_items": len(memory_engine.list_memory_items()),
    }
    return {
        "status": "online" if avail.get("available") and not settings.offline_mode else "offline",
        "assistant_name": settings.assistant_name,
        "version": settings.version,
        "active_provider": settings.default_provider,
        "model": settings.model,
        "offline_mode_enforced": settings.offline_mode,
        "cloud_ai_available": avail.get("available", False),
        "database": {"type": "SQLite", "status": "active", **stats},
        "modules": settings.modules,
    }


# 3. Chat Endpoint
@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        result = await orchestrator.process_message(
            message=request.message,
            conversation_id=request.conversation_id,
            is_offline=request.is_offline_mode if request.is_offline_mode is not None else settings.offline_mode,
        )
        return result
    except Exception as e:
        log_event("ERROR", "API", f"Chat processing failure: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal assistant error occurred.")


# 4. Conversations & Messages
@app.get("/api/conversations")
async def list_conversations():
    return memory_engine.list_conversations()


@app.get("/api/conversations/{conv_id}/messages")
async def get_messages(conv_id: str):
    return memory_engine.get_messages(conv_id)


@app.delete("/api/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    success = memory_engine.delete_conversation(conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"deleted": True, "id": conv_id}


# 5. Memory Management
@app.get("/api/memory")
async def list_memory(category: Optional[str] = None):
    return memory_engine.list_memory_items(category=category)


@app.post("/api/memory")
async def create_memory(request: MemoryCreateRequest):
    try:
        sens = SensitivityLevel(request.sensitivity.upper())
    except ValueError:
        sens = SensitivityLevel.NORMAL

    item_id = memory_engine.store_memory_item(
        key=request.key,
        value=request.value,
        category=request.category,
        sensitivity=sens,
    )
    return {"id": item_id, "key": request.key, "sensitivity": sens.value}


@app.delete("/api/memory/{item_id}")
async def delete_memory(item_id: str):
    success = memory_engine.delete_memory_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory item not found")
    return {"deleted": True, "id": item_id}


# 6. Structured Logs Viewer
@app.get("/api/logs")
async def read_logs(level: Optional[str] = None, limit: int = Query(50, le=200)):
    return get_logs(level=level, limit=limit)


# 7. Configuration Settings
@app.get("/api/config")
async def get_config():
    return settings.model_dump()


@app.post("/api/config")
async def update_settings(req: ConfigUpdateRequest):
    if req.assistant_name is not None:
        settings.assistant_name = req.assistant_name
    if req.theme is not None:
        settings.theme = req.theme
    if req.preferred_language is not None:
        settings.preferred_language = req.preferred_language
    if req.model is not None:
        settings.model = req.model
    if req.offline_mode is not None:
        settings.offline_mode = req.offline_mode
    return settings.model_dump()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.backend_host, port=settings.backend_port, reload=True)
