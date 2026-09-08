"""
Gemini AI Provider Adapter (Python Backend - Phase 2 Step 3)
Connects to Google Gemini API using configured backend credentials.
Adheres strictly to privacy, safe error reporting, and never leaks API keys.
"""

import os
import httpx
from typing import Dict, Any, List
from core.ai.provider import AIProvider, AIRequest, AIResponse
from core.logger import log_event

DEFAULT_SYSTEM_PROMPT = (
    "You are JARVIS, a privacy-first, local-first Personal AI Assistant. "
    "You speak fluently in English, Hindi, and Hinglish. "
    "Be concise, polite, and respectful of user privacy."
)


class GeminiProvider(AIProvider):
    @property
    def id(self) -> str:
        return "gemini"

    @property
    def name(self) -> str:
        return "Google Gemini AI"

    def resolve_model(self, model_name: str = None) -> str:
        configured = model_name or os.getenv("AI_MODEL") or "gemini-3.8-flash"
        clean = configured.strip()
        lower = clean.lower()
        if lower == "gemini-3.8":
            return "gemini-3.8-flash"
        if lower == "gemini-3.6":
            return "gemini-3.6-flash"
        if lower in ("gemini-2.5", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"):
            return "gemini-3.6-flash"
        return clean

    async def check_availability(self) -> Dict[str, Any]:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"available": False, "reason": "GEMINI_API_KEY not configured"}
        return {"available": True}

    async def generate_response(self, request: AIRequest) -> AIResponse:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return AIResponse(
                text="AI service is currently unavailable. Gemini API key configure nahi hai.",
                provider=self.id,
                model=request.model or "gemini-3.8-flash",
                is_offline_fallback=True,
                warnings=["GEMINI_API_KEY is not configured on the server."],
            )

        model = self.resolve_model(request.model)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
            "User-Agent": "personal-ai-assistant/0.2.0",
        }

        contents = []
        if request.history:
            for msg in request.history:
                role = "model" if msg.role == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": msg.content}]})
        contents.append({"role": "user", "parts": [{"text": request.prompt}]})

        system_instruction = request.system_instruction or DEFAULT_SYSTEM_PROMPT
        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {
                "temperature": request.temperature,
            },
        }

        log_event("DEBUG", "GeminiProvider", f"Executing request for model {model}")

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 429:
                    return AIResponse(
                        text="AI service is currently unavailable. Rate limit exceeded.",
                        provider=self.id,
                        model=model,
                        is_offline_fallback=True,
                        warnings=["Rate limit (HTTP 429) exceeded."],
                    )
                elif resp.status_code in (400, 403):
                    return AIResponse(
                        text="AI service is currently unavailable. Invalid credentials or unauthorized.",
                        provider=self.id,
                        model=model,
                        is_offline_fallback=True,
                        warnings=["Invalid credentials or unauthorized request."],
                    )
                resp.raise_for_status()
                data = resp.json()

            candidates = data.get("candidates") or []
            if not candidates:
                return AIResponse(
                    text="AI service is currently unavailable. Empty response received.",
                    provider=self.id,
                    model=model,
                    is_offline_fallback=True,
                    warnings=["Empty candidate list returned."],
                )

            parts = candidates[0].get("content", {}).get("parts", [])
            text = (parts[0].get("text") if parts else "").strip()
            if not text:
                return AIResponse(
                    text="AI service is currently unavailable. Empty response received.",
                    provider=self.id,
                    model=model,
                    is_offline_fallback=True,
                    warnings=["Empty text received."],
                )

            return AIResponse(
                text=text,
                provider=self.id,
                model=model,
                is_offline_fallback=False,
            )
        except httpx.TimeoutException:
            log_event("WARN", "GeminiProvider", f"Request to Gemini timed out for model {model}")
            return AIResponse(
                text="AI service is currently unavailable. Request timed out.",
                provider=self.id,
                model=model,
                is_offline_fallback=True,
                warnings=["Request timed out."],
            )
        except Exception as exc:
            log_event("ERROR", "GeminiProvider", f"Request execution failed safely without leaking credentials.")
            return AIResponse(
                text="AI service is currently unavailable.",
                provider=self.id,
                model=model,
                is_offline_fallback=True,
                warnings=["AI service error occurred."],
            )
