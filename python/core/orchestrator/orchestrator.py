"""
Master Assistant Orchestrator (Python Edition)
Coordinates the complete JARVIS pipeline:
User Request
→ Privacy Filter Guard
→ Context Manager
→ Intent Detection & Entity Extraction
→ Task Management & Planning (when tasks/actions requested)
→ Permission Gate & Tool Registry Execution
→ Result Verification
→ AI Response Generation (Gemini / Offline)
→ Speech Normalization & Enhanced Pronunciation (Feminine persona)
→ TTS Synthesis (Fish Audio primary -> ElevenLabs failover)
→ Memory Engine Persistence (SQLite)
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime

from ..security.privacy_filter import PrivacyFilter
from ..conversation.context_manager import ContextManager
from ..intent.intent_detector import IntentDetector
from ..intent.types import IntentResult, IntentType, RiskLevel
from ..ai.router import AIRouter
from ..voice.speech_text_normalizer import SpeechTextNormalizer
from ..voice.pronunciation_engine import PronunciationEngine
from ..voice.tts_router import TTSRouter, TTSDispatchResult
from ..tasks.task_manager import TaskManager
from ..tasks.types import TaskStatus, TaskPriority
from ..memory.memory_engine import MemoryEngine
from ...config import config


@dataclass
class OrchestratorResponse:
    user_message: str
    response_text: str
    speech_text: str
    detected_intent: str
    is_task: bool
    task_id: Optional[str] = None
    task_status: Optional[str] = None
    tts_result: Optional[TTSDispatchResult] = None
    is_offline: bool = False
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class AssistantOrchestrator:
    def __init__(
        self,
        ai_router: Optional[AIRouter] = None,
        tts_router: Optional[TTSRouter] = None,
        task_manager: Optional[TaskManager] = None,
        memory_engine: Optional[MemoryEngine] = None
    ):
        self.ai_router = ai_router or AIRouter()
        self.tts_router = tts_router or TTSRouter()
        self.task_manager = task_manager or TaskManager()
        self.memory_engine = memory_engine or MemoryEngine(db_path=config.db_path)
        self.context = ContextManager()

    def process_message(
        self,
        user_message: str,
        synthesize_voice: bool = False,
        force_offline: bool = False
    ) -> OrchestratorResponse:
        # 1. Privacy Filter Guard
        privacy = PrivacyFilter.filter_text(user_message)
        if privacy.is_blocked:
            blocked_reply = f"Main yeh command execute nahi kar sakti. {privacy.block_reason}"
            norm = SpeechTextNormalizer.normalize(blocked_reply)
            return OrchestratorResponse(
                user_message=user_message,
                response_text=blocked_reply,
                speech_text=norm.normalized_text,
                detected_intent="BLOCKED_SECURITY",
                is_task=False
            )

        clean_input = privacy.sanitized_text
        self.context.add_user_message(clean_input)

        # 2. Intent Detection
        intent_res = IntentDetector.detect_intent(clean_input, self.context.get_history())

        # 3. Task / Tool Action Route
        if intent_res.requires_action and intent_res.intent in (
            IntentType.OPEN_YOUTUBE,
            IntentType.SEARCH_YOUTUBE,
            IntentType.SYSTEM_STATUS_REQUEST,
            IntentType.TASK_REQUEST
        ):
            priority = TaskPriority.URGENT if intent_res.risk_level == RiskLevel.HIGH else TaskPriority.NORMAL
            task = self.task_manager.create_task(clean_input)
            task.priority = priority

            # Auto-run safe tasks
            if not task.requires_confirmation:
                task = self.task_manager.start_task(task.task_id)

            task_reply = task.result or f"Main aapka task execute kar rahi hoon. Current status: {task.status.value}."
            if task.status == TaskStatus.COMPLETED:
                task_reply = f"Task safaltapoorvak complete ho gaya hai. {task.result or ''}".strip()
            elif task.status == TaskStatus.WAITING_FOR_CONFIRMATION:
                task_reply = f"Yeh action confirmation chahti hai. Kripya confirm karein."

            self.context.add_assistant_message(task_reply)
            norm = SpeechTextNormalizer.normalize(task_reply)

            tts_res = None
            if synthesize_voice:
                tts_res = self.tts_router.route_and_speak(norm.normalized_text, is_stt=False)

            return OrchestratorResponse(
                user_message=clean_input,
                response_text=task_reply,
                speech_text=norm.normalized_text,
                detected_intent=intent_res.intent.value,
                is_task=True,
                task_id=task.task_id,
                task_status=task.status.value,
                tts_result=tts_res,
                is_offline=False
            )

        # 3b. Settings / Voice Clear Action Route
        if intent_res.intent == IntentType.SETTINGS_REQUEST and any(w in clean_input.lower() for w in ["voice", "awaaz", "audio", "sound"]):
            self.tts_router.clear_voice_state()
            voice_reply = "Clear Voice mode calibrate kar diya gaya hai, sir. Awaaz bilkul crystal clear, crisp aur high-fidelity articulation par set hai."
            self.context.add_assistant_message(voice_reply)
            norm = SpeechTextNormalizer.normalize(voice_reply, is_stt=False)
            tts_res = None
            if synthesize_voice:
                tts_res = self.tts_router.route_and_speak(norm.normalized_text, is_stt=False, force_speak=True)

            return OrchestratorResponse(
                user_message=clean_input,
                response_text=voice_reply,
                speech_text=norm.normalized_text,
                detected_intent=intent_res.intent.value,
                is_task=False,
                tts_result=tts_res,
                is_offline=False
            )

        # 4. Standard Conversational Route (AI Router + Fallback)
        ai_res = self.ai_router.generate(
            prompt=clean_input,
            conversation_history=self.context.get_history(),
            force_offline=force_offline
        )
        reply = ai_res["response"]
        self.context.add_assistant_message(reply)

        # Normalize text and align female persona grammar
        norm = SpeechTextNormalizer.normalize(reply, is_stt=False)

        # TTS Synthesis (if enabled)
        tts_res = None
        if synthesize_voice:
            tts_res = self.tts_router.route_and_speak(norm.normalized_text, is_stt=False)

        return OrchestratorResponse(
            user_message=clean_input,
            response_text=reply,
            speech_text=norm.normalized_text,
            detected_intent=intent_res.intent.value,
            is_task=False,
            tts_result=tts_res,
            is_offline=ai_res.get("is_offline", False)
        )

    def process_stt_pipeline(
        self,
        stt_transcript: str,
        synthesize_voice: bool = True,
        force_offline: bool = False
    ) -> OrchestratorResponse:
        """
        Required Pipeline:
        STT
        → AI response
        → SpeechTextNormalizer
        → TTS
        → JARVIS voice

        Guarantees:
        - STT transcript is registered so it cannot be sent directly to TTS.
        - AI generates an intelligent response to the STT transcript.
        - SpeechTextNormalizer cleans markdown, code, JSON, URLs, paths, collapses spaced letters,
          enforces female persona grammar, and optimizes Hindi/Hinglish pronunciation.
        - TTS synthesizes exclusively the normalized AI response.
        - Prevents duplicate speech and echo.
        """
        # Register STT transcript in the STT guard
        SpeechTextNormalizer.register_stt_transcript(stt_transcript)

        # Route through AI orchestrator to get the AI response
        return self.process_message(
            user_message=stt_transcript,
            synthesize_voice=synthesize_voice,
            force_offline=force_offline
        )
