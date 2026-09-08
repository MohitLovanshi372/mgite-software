"""
Core Assistant Orchestrator (Python Backend - Phase 2 Step 2)
Implements the canonical pipeline:
Chat Request
→ Orchestrator
→ Context Manager
→ Privacy Filter
→ AI Router
→ AI Provider
→ Response Validator
→ Chat Response
"""

from typing import Dict, Any, Optional, List
from core.security.sanitizer import sanitize_input
from core.security.otp_privacy import OtpPrivacyEngine
from core.security.validator import ResponseValidator
from core.memory.memory_engine import memory_engine
from core.ai.router import ai_router
from core.ai.provider import AIRequest, AIMessage, AIContext
from core.logger import log_event
from config.settings import settings


class AssistantOrchestrator:
    def __init__(self):
        self.router = ai_router

    async def process_message(
        self, message: str, conversation_id: Optional[str] = None, is_offline: bool = False
    ) -> Dict[str, Any]:
        warnings: List[str] = []

        # Ensure conversation exists in memory
        conv_id = conversation_id or memory_engine.create_conversation(message[:25])

        # Step 1: Context Manager (Assemble history and memories)
        context_str = ""
        if settings.memory.enabled:
            memories = memory_engine.list_memory_items()
            safe = [m for m in memories if m.get("sensitivity") in ("PUBLIC", "NORMAL")]
            if safe:
                context_str = "; ".join([f"{m['key']}: {m['value']}" for m in safe])

        raw_history = memory_engine.get_messages(conv_id, limit=6)
        history = [
            AIMessage(role=m.get("role", "user"), content=m.get("content", ""))
            for m in raw_history
        ]
        ai_context = AIContext(
            conversation_id=conv_id,
            messages=history,
            memory_context=context_str,
            max_context_messages=6,
        )

        # Step 2: Privacy Filter (Sanitize & inspect OTP)
        clean_text, had_sensitive, _ = sanitize_input(message)
        if had_sensitive:
            warnings.append("Input contained sensitive data patterns which were redacted.")
            log_event("WARNING", "Orchestrator", "Sensitive data pattern detected and redacted.")

        otp_eval = OtpPrivacyEngine.evaluate_content(message)
        if otp_eval.get("is_sensitive"):
            log_event("WARNING", "Orchestrator", f"OTP/PIN detected ({otp_eval.get('category')}). Aborting AI call.")
            notice = (
                "[Privacy Shield Activated]\n"
                "Sensitive security code / OTP detected. "
                "In accordance with our privacy policy, this data will not be forwarded to any AI model."
            )
            memory_engine.add_message(conv_id, "user", clean_text)
            memory_engine.add_message(conv_id, "assistant", notice)
            return {
                "conversation_id": conv_id,
                "response": notice,
                "provider": "privacy-shield",
                "model": "local-security",
                "is_offline": True,
                "warnings": ["Authentication code suppressed."],
            }

        # Record sanitized user message in memory
        memory_engine.add_message(conv_id, "user", clean_text)

        # Step 3: AI Router (Select provider based on policy and network mode)
        offline_active = is_offline or settings.offline_mode
        task_type = "offline" if offline_active else "general"
        provider = self.router.route_request(task_type)

        # Step 4: AI Provider execution
        ai_request = AIRequest(
            prompt=clean_text,
            context=ai_context,
            model=settings.model,
            temperature=settings.temperature,
            history=history,
        )

        ai_response = await provider.generate_response(ai_request)
        raw_response = ai_response.text
        if ai_response.warnings:
            warnings.extend(ai_response.warnings)

        # Step 5: Response Validator
        valid_res = ResponseValidator.validate_ai_response(raw_response)
        final_text = valid_res["sanitized_response"]
        if valid_res.get("blocked_action"):
            warnings.append(f"Security Notice: {valid_res.get('reason')}")

        # Persist response
        memory_engine.add_message(conv_id, "assistant", final_text)

        # Step 6: Chat Response
        return {
            "conversation_id": conv_id,
            "response": final_text,
            "provider": ai_response.provider,
            "model": ai_response.model,
            "is_offline": ai_response.is_offline_fallback,
            "warnings": warnings if warnings else None,
        }


orchestrator = AssistantOrchestrator()
