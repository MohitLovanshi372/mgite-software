"""
JARVIS Python REST API Server (Python Edition)
Serves the complete JARVIS backend API over HTTP:
- /api/system/status
- /api/voice/status
- /api/voice/config
- /api/voice/synthesize
- /api/voice/pronunciation/preview
- /api/chat
- /api/tasks
- /api/tasks/action
- /api/memory
- /api/notifications

Built on Python standard library http.server for instant startup without external dependencies.
"""

import sys
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any

from .config import config
from .core.orchestrator.orchestrator import AssistantOrchestrator
from .core.voice.speech_text_normalizer import SpeechTextNormalizer
from .core.voice.pronunciation_engine import PronunciationEngine
from .core.voice.acoustic_synthesizer import AcousticCyberneticSynthesizer
from .core.voice.tts_router import TTSRouter
from .core.tasks.task_manager import TaskManager
from .core.memory.memory_engine import MemoryEngine
from .core.notifications.notification_engine import NotificationEngine


# Singleton instances
orchestrator = AssistantOrchestrator()
task_manager = orchestrator.task_manager
tts_router = orchestrator.tts_router
memory_engine = orchestrator.memory_engine
notification_engine = NotificationEngine()


class JarvisAPIHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status: int = 200, content_type: str = "application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def _read_json_body(self) -> Dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length <= 0:
            return {}
        body = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {}

    def _send_json(self, data: Any, status: int = 200):
        self._set_headers(status, "application/json")
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. System Status
        if path == "/api/system/status":
            self._send_json({
                "status": "online",
                "assistant_name": config.assistant_name,
                "version": config.version,
                "language": "Hindi / Hinglish / English",
                "voice_persona": "Female JARVIS",
                "tts_provider": config.voice.tts_provider,
                "fish_audio_configured": config.is_fish_audio_configured(),
                "elevenlabs_configured": config.is_elevenlabs_configured(),
                "gemini_configured": config.is_gemini_configured(),
                "offline_mode": config.offline_mode,
            })
            return

        # 2. Voice Status
        if path == "/api/voice/status":
            self._send_json({
                "isConfigured": config.is_fish_audio_configured() or config.is_elevenlabs_configured(),
                "isFishAudioConfigured": config.is_fish_audio_configured(),
                "isElevenLabsConfigured": config.is_elevenlabs_configured(),
                "configuredProvider": config.voice.tts_provider,
                "clearVoiceReady": True,
                "activeProfile": "CLEAR_VOICE",
                "sampleRate": 24000,
                "fishAudioSettings": {
                    "model": config.voice.fish_model,
                    "voiceId": config.voice.fish_voice_id or "default",
                },
                "elevenLabsSettings": {
                    "model": config.voice.elevenlabs_model,
                    "voiceId": config.voice.elevenlabs_voice_id,
                },
                "status": "Connected" if (config.is_fish_audio_configured() or config.is_elevenlabs_configured()) else "Clear Voice Synthesizer Ready"
            })
            return

        # 3. Tasks List
        if path == "/api/tasks":
            tasks = task_manager.list_tasks()
            serialized = [
                {
                    "taskId": t.task_id,
                    "userRequest": t.user_request,
                    "status": t.status.value,
                    "priority": t.priority.value,
                    "createdAt": t.created_at,
                    "updatedAt": t.updated_at,
                    "steps": [
                        {
                            "stepId": s.step_id,
                            "description": s.description,
                            "toolName": s.tool_name,
                            "status": s.status.value,
                            "result": s.result,
                            "error": s.error
                        } for s in t.steps
                    ],
                    "currentStep": t.current_step,
                    "result": t.result,
                    "error": t.error,
                    "requiresConfirmation": t.requires_confirmation
                } for t in tasks
            ]
            self._send_json({"tasks": serialized, "count": len(serialized)})
            return

        # 4. Memory List
        if path == "/api/memory":
            memories = memory_engine.list_memories()
            self._send_json({"memories": memories, "count": len(memories)})
            return

        # 5. Notifications List
        if path == "/api/notifications":
            notifs = notification_engine.get_recent()
            self._send_json({
                "notifications": [
                    {
                        "id": n.id,
                        "appName": n.app_name,
                        "title": n.title,
                        "content": n.content,
                        "timestamp": n.timestamp,
                        "priority": n.priority.value,
                        "category": n.category.value,
                        "isRead": n.is_read
                    } for n in notifs
                ]
            })
            return

        self._send_json({"error": "Endpoint not found"}, status=404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_json_body()

        # 1. Chat
        if path == "/api/chat":
            message = body.get("message", "").strip()
            synthesize = body.get("synthesizeVoice", False)
            is_stt = body.get("isStt", False)
            if not message:
                self._send_json({"error": "Message parameter is required"}, status=400)
                return

            if is_stt:
                res = orchestrator.process_stt_pipeline(stt_transcript=message, synthesize_voice=synthesize)
            else:
                res = orchestrator.process_message(user_message=message, synthesize_voice=synthesize)

            self._send_json({
                "response": res.response_text,
                "speechText": res.speech_text,
                "intent": res.detected_intent,
                "isTask": res.is_task,
                "taskId": res.task_id,
                "taskStatus": res.task_status,
                "isOffline": res.is_offline,
                "hasAudio": bool(res.tts_result and res.tts_result.audio_bytes)
            })
            return

        # 1b. STT to Voice Pipeline: STT -> AI response -> SpeechTextNormalizer -> TTS -> JARVIS voice
        if path == "/api/voice/stt":
            transcript = body.get("transcript", "").strip()
            synthesize = body.get("synthesizeVoice", True)
            if not transcript:
                self._send_json({"error": "Transcript parameter is required"}, status=400)
                return

            res = orchestrator.process_stt_pipeline(stt_transcript=transcript, synthesize_voice=synthesize)
            self._send_json({
                "sttTranscript": transcript,
                "response": res.response_text,
                "speechText": res.speech_text,
                "intent": res.detected_intent,
                "isTask": res.is_task,
                "taskId": res.task_id,
                "taskStatus": res.task_status,
                "hasAudio": bool(res.tts_result and res.tts_result.audio_bytes)
            })
            return

        # 2. Pronunciation Preview (for debugging & perfecting voice speech)
        if path == "/api/voice/pronunciation/preview":
            text = body.get("text", "")
            norm = SpeechTextNormalizer.normalize(text)
            pron = norm.pronunciation_result
            self._send_json({
                "originalText": text,
                "normalizedText": norm.normalized_text,
                "detectedLanguage": norm.detected_language,
                "recommendedLocale": pron.recommended_locale if pron else "en-US",
                "recommendedPitch": pron.recommended_pitch if pron else 0.9,
                "recommendedRate": pron.recommended_rate if pron else 0.95,
                "pronunciationNotes": pron.pronunciation_notes if pron else []
            })
            return

        # 2b. Clear Voice (resets voice cache/debounce and calibrates to CLEAR_VOICE)
        if path == "/api/voice/clear":
            tts_router.clear_voice_state()
            self._send_json({
                "success": True,
                "message": "Voice state cleared. Audio synthesis calibrated to CLEAR_VOICE mode.",
                "profile": "CLEAR_VOICE",
                "sampleRate": 24000
            })
            return

        # 3. Voice Synthesize
        if path == "/api/voice/synthesize":
            text = body.get("text", "")
            is_stt = body.get("isStt", False)
            force_clear = body.get("clearVoice", False) or body.get("profile") in ("CLEAR_VOICE", "JARVIS_CLEAR")
            if not text:
                self._send_json({"error": "Text parameter is required"}, status=400)
                return
            if is_stt or SpeechTextNormalizer.is_stt_transcript(text):
                self._send_json({
                    "success": False,
                    "error": "STT transcript cannot be sent directly to TTS. Must follow pipeline: STT -> AI response -> SpeechTextNormalizer -> TTS"
                }, status=400)
                return

            if force_clear:
                norm = SpeechTextNormalizer.normalize(text)
                synth = AcousticCyberneticSynthesizer()
                audio = synth.synthesize_wav_bytes(norm.normalized_text, profile="CLEAR_VOICE")
                self._set_headers(200, "audio/wav")
                self.wfile.write(audio)
                return

            dispatch = tts_router.route_and_speak(text, is_stt=False)
            if dispatch.audio_bytes:
                content_type = "audio/wav" if dispatch.provider_used.startswith("acoustic") else "audio/mpeg"
                self._set_headers(200, content_type)
                self.wfile.write(dispatch.audio_bytes)
                return
            else:
                # High-fidelity Clear Voice fallback
                norm = SpeechTextNormalizer.normalize(text)
                synth = AcousticCyberneticSynthesizer()
                audio = synth.synthesize_wav_bytes(norm.normalized_text, profile="CLEAR_VOICE")
                self._set_headers(200, "audio/wav")
                self.wfile.write(audio)
                return

        # 4. Create Task
        if path == "/api/tasks":
            request_text = body.get("userRequest", "")
            if not request_text:
                self._send_json({"error": "userRequest is required"}, status=400)
                return
            task = task_manager.create_task(request_text)
            if not task.requires_confirmation:
                task = task_manager.start_task(task.task_id)
            self._send_json({
                "taskId": task.task_id,
                "status": task.status.value,
                "result": task.result,
                "requiresConfirmation": task.requires_confirmation
            })
            return

        # 5. Task Action (start, pause, resume, cancel, confirm)
        if path == "/api/tasks/action":
            task_id = body.get("taskId", "")
            action = body.get("action", "")
            if action == "start":
                t = task_manager.start_task(task_id)
            elif action == "pause":
                t = task_manager.pause_task(task_id)
            elif action == "resume":
                t = task_manager.resume_task(task_id)
            elif action == "cancel":
                t = task_manager.cancel_task(task_id)
            elif action == "confirm":
                t = task_manager.confirm_task(task_id, approved=True)
            else:
                self._send_json({"error": f"Unknown action: {action}"}, status=400)
                return
            self._send_json({"taskId": t.task_id, "status": t.status.value, "result": t.result})
            return

        # 6. Memory Remember
        if path == "/api/memory/remember":
            key = body.get("key", "")
            value = body.get("value", "")
            category = body.get("category", "general")
            if not key or not value:
                self._send_json({"error": "key and value are required"}, status=400)
                return
            rec = memory_engine.remember(key, value, category)
            self._send_json({"success": True, "record": rec})
            return

        self._send_json({"error": "Endpoint not found"}, status=404)


def run_server(port: int = 5000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, JarvisAPIHandler)
    print(f"JARVIS Python Backend API running on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down JARVIS Python server.")
        httpd.server_close()


if __name__ == "__main__":
    port = int(os.getenv("PYTHON_PORT", "5000"))
    run_server(port)
