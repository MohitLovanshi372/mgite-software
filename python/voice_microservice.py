"""
Python-Based Voice Microservice (Advanced Synthesis & Text Processing)

Features:
1. Advanced Text Processing:
   - Multilingual text normalization (Hindi, Hinglish, English)
   - Deep feminine grammatical calibration for JARVIS persona
   - Acronym enunciation and technical term preservation
   - Currency, number, percentage, and unit expansion
   - Prosodic cadence analysis, pause insertion, and phoneme decomposition
   - Syllable stress calculation and language detection

2. Advanced Voice Synthesis:
   - Pure-Python Acoustic & Formant Cybernetic Synthesizer (24kHz 16-bit WAV)
   - Real-time chunked audio streaming with sub-bass resonance and metallic overtones
   - Cloud TTS router integration (Fish Audio & ElevenLabs) with instant fallback
   - Per-chunk phoneme telemetry for frontend mouth & HUD visualizer sync

3. Interfaces:
   - IPC streaming mode (stdin/stdout JSON lines for fast Node.js integration)
   - HTTP microservice mode (standalone REST & chunked streaming server)
   - Python module interface
"""

import base64
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any, Dict, Generator, List, Optional
from urllib.parse import urlparse

# Module imports
try:
    from .config import config
    from .core.voice.speech_text_normalizer import SpeechTextNormalizer
    from .core.voice.pronunciation_engine import PronunciationEngine
    from .core.voice.acoustic_synthesizer import AcousticCyberneticSynthesizer, AudioChunk
    from .core.voice.tts_router import TTSRouter
except ImportError:
    # Allow running directly as a script
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from python.config import config
    from python.core.voice.speech_text_normalizer import SpeechTextNormalizer
    from python.core.voice.pronunciation_engine import PronunciationEngine
    from python.core.voice.acoustic_synthesizer import AcousticCyberneticSynthesizer, AudioChunk
    from python.core.voice.tts_router import TTSRouter


class AdvancedTextProcessor:
    """
    Advanced Multilingual Text Normalization & Phonetic Cadence Processor.
    """

    @classmethod
    def process(cls, text: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        options = options or {}
        lang_mode = options.get("language_mode", "AUTO")
        enhance = options.get("enhance_pronunciation", True)

        # 1. Base Normalization (Grammar, Tech Acronyms, Feminine persona)
        norm_result = SpeechTextNormalizer.normalize(text)
        speech_text = norm_result.normalized_text

        # 2. Pronunciation Optimization
        if enhance:
            pron = PronunciationEngine.process(speech_text)
            final_text = pron.processed_text
            detected_lang = pron.detected_language
            recommended_locale = pron.recommended_locale
            recommended_pitch = pron.recommended_pitch
            recommended_rate = pron.recommended_rate
            notes = pron.pronunciation_notes
        else:
            final_text = speech_text
            detected_lang = norm_result.detected_language
            recommended_locale = "hi-IN" if detected_lang == "hi" else "en-US"
            recommended_pitch = 1.0
            recommended_rate = 0.96
            notes = []

        # 3. Phoneme breakdown for cadence and visualizer telemetry
        synth = AcousticCyberneticSynthesizer()
        phonemes = synth.text_to_phonemes(final_text)
        total_duration_ms = sum(p.duration_ms for p in phonemes)

        return {
            "original_text": text,
            "normalized_text": final_text,
            "detected_language": detected_lang,
            "recommended_locale": recommended_locale,
            "recommended_pitch": recommended_pitch,
            "recommended_rate": recommended_rate,
            "pronunciation_notes": notes,
            "phoneme_count": len(phonemes),
            "estimated_duration_ms": round(total_duration_ms, 1),
            "phonemes": [
                {
                    "symbol": p.symbol,
                    "is_vowel": p.is_vowel,
                    "duration_ms": round(p.duration_ms, 1),
                    "voiced": p.voiced
                } for p in phonemes[:50]  # Cap summary size
            ]
        }


class VoiceMicroservice:
    """
    Main Voice Microservice managing synthesis and streaming pipelines.
    """

    def __init__(self):
        self.text_processor = AdvancedTextProcessor()
        self.acoustic_synth = AcousticCyberneticSynthesizer()
        self.tts_router = TTSRouter()

    def process_text(self, text: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self.text_processor.process(text, options)

    def synthesize_stream(
        self,
        text: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Processes text and yields real-time streaming events (start, chunks, end).
        """
        options = options or {}
        processed = self.process_text(text, options)
        speech_text = processed["normalized_text"]
        detected_lang = processed["detected_language"]

        pitch_scale = float(options.get("pitch", processed.get("recommended_pitch", 1.0)))
        rate_scale = float(options.get("rate", processed.get("recommended_rate", 0.96)))
        profile = options.get("profile", "JARVIS_FEMALE")
        if options.get("clear_voice", False) or profile in ("CLEAR_VOICE", "JARVIS_CLEAR"):
            profile = "CLEAR_VOICE"
        elif detected_lang == "hi":
            profile = "HINDI_NEURAL"
        elif detected_lang == "en-IN":
            profile = "HINGLISH_HYBRID"

        sub_bass = options.get("sub_bass_enabled", False)
        chunk_ms = float(options.get("chunk_duration_ms", 150.0))

        # Check if remote cloud TTS (Fish Audio / ElevenLabs) should be used
        use_cloud = options.get("use_cloud_tts", False)
        if use_cloud and (config.is_fish_audio_configured() or config.is_elevenlabs_configured()):
            dispatch = self.tts_router.route_and_speak(speech_text)
            if dispatch.audio_bytes:
                b64 = base64.b64encode(dispatch.audio_bytes).decode('ascii')
                yield {
                    "event": "start",
                    "text": text,
                    "normalized_text": speech_text,
                    "detected_language": detected_lang,
                    "provider": dispatch.provider_used,
                    "sample_rate": 24000,
                    "total_duration_ms": processed["estimated_duration_ms"]
                }
                yield {
                    "event": "chunk",
                    "chunk_index": 0,
                    "is_last": True,
                    "audio_base64": b64,
                    "duration_ms": processed["estimated_duration_ms"],
                    "phonemes": [p["symbol"] for p in processed["phonemes"]]
                }
                yield {
                    "event": "end",
                    "total_chunks": 1,
                    "total_duration_ms": processed["estimated_duration_ms"]
                }
                return

        # Default high-fidelity acoustic cybernetic streaming
        yield {
            "event": "start",
            "text": text,
            "normalized_text": speech_text,
            "detected_language": detected_lang,
            "provider": "acoustic_cybernetic",
            "sample_rate": AcousticCyberneticSynthesizer.SAMPLE_RATE,
            "estimated_duration_ms": processed["estimated_duration_ms"]
        }

        total_chunks = 0
        total_duration = 0.0

        for chunk in self.acoustic_synth.stream_audio_chunks(
            text=speech_text,
            pitch_scale=pitch_scale,
            rate_scale=rate_scale,
            profile=profile,
            sub_bass_enabled=sub_bass,
            chunk_duration_ms=chunk_ms
        ):
            total_chunks += 1
            total_duration += chunk.duration_ms
            yield {
                "event": "chunk",
                "chunk_index": chunk.chunk_index,
                "is_last": chunk.is_last,
                "audio_base64": chunk.audio_base64,
                "duration_ms": round(chunk.duration_ms, 1),
                "sample_rate": chunk.sample_rate,
                "phonemes": chunk.phonemes
            }

        yield {
            "event": "end",
            "total_chunks": total_chunks,
            "total_duration_ms": round(total_duration, 1)
        }


# =====================================================================
# IPC Mode (stdin / stdout JSON lines for Node.js process pipe)
# =====================================================================

def run_ipc_loop():
    service = VoiceMicroservice()
    # Ensure unbuffered stdout
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)

    # Handshake ready signal
    handshake = {"status": "ready", "service": "python_voice_microservice", "version": "1.0.0"}
    sys.stdout.write(json.dumps(handshake) + "\n")
    sys.stdout.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            req_id = req.get("id", "req-0")
            cmd = req.get("command", "")

            if cmd == "ping":
                resp = {"id": req_id, "event": "pong", "status": "ok"}
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()

            elif cmd in ("clear", "clear_voice"):
                service.tts_router.clear_voice_state()
                resp = {"id": req_id, "event": "cleared", "status": "ok", "profile": "CLEAR_VOICE"}
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()

            elif cmd == "process_text":
                text = req.get("text", "")
                opts = req.get("options", {})
                data = service.process_text(text, opts)
                resp = {"id": req_id, "event": "processed", "data": data}
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()

            elif cmd == "synthesize_stream":
                text = req.get("text", "")
                opts = req.get("options", {})
                for event in service.synthesize_stream(text, opts):
                    event["id"] = req_id
                    sys.stdout.write(json.dumps(event) + "\n")
                    sys.stdout.flush()

            else:
                resp = {"id": req_id, "event": "error", "error": f"Unknown command: {cmd}"}
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()

        except Exception as e:
            err_resp = {"event": "error", "error": str(e)}
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()


# =====================================================================
# HTTP Server Mode (Standalone REST / Streaming Microservice)
# =====================================================================

class MicroserviceHTTPHandler(BaseHTTPRequestHandler):
    service = VoiceMicroservice()

    def _set_headers(self, status: int = 200, content_type: str = "application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def _read_json(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return {}

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/health", "/api/health"):
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "service": "python_voice_microservice"}).encode("utf-8"))
            return
        self._set_headers(404)
        self.wfile.write(b'{"error": "Not found"}')

    def do_POST(self):
        path = urlparse(self.path).path
        body = self._read_json()

        if path in ("/process", "/api/voice/process"):
            text = body.get("text", "")
            opts = body.get("options", {})
            res = self.service.process_text(text, opts)
            self._set_headers(200)
            self.wfile.write(json.dumps(res, indent=2).encode("utf-8"))
            return

        elif path in ("/synthesize/stream", "/api/voice/synthesize/stream"):
            text = body.get("text", "")
            opts = body.get("options", {})
            self._set_headers(200, content_type="application/x-ndjson")
            for evt in self.service.synthesize_stream(text, opts):
                line = json.dumps(evt) + "\n"
                self.wfile.write(line.encode("utf-8"))
                self.wfile.flush()
            return

        elif path in ("/synthesize", "/api/voice/synthesize"):
            text = body.get("text", "")
            opts = body.get("options", {})
            norm = self.service.process_text(text, opts)
            speech_text = norm["normalized_text"]
            wav_bytes = self.service.acoustic_synth.synthesize_wav_bytes(speech_text)
            self._set_headers(200, content_type="audio/wav")
            self.wfile.write(wav_bytes)
            return

        self._set_headers(404)
        self.wfile.write(b'{"error": "Endpoint not found"}')


def run_http_server(port: int = 5050):
    addr = ("", port)
    server = HTTPServer(addr, MicroserviceHTTPHandler)
    print(f"Python Voice Microservice running on HTTP port {port}...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Python Voice Microservice.")
        server.server_close()


if __name__ == "__main__":
    if "--ipc" in sys.argv:
        run_ipc_loop()
    else:
        port = int(os.getenv("VOICE_MICROSERVICE_PORT", "5050"))
        run_http_server(port)
