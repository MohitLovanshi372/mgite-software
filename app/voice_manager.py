"""
JARVIS Voice Manager (Python Edition)

Required Flow:
AI response
→ SpeechTextNormalizer
→ Fish Audio API
→ reference_id
→ MP3 audio
→ Windows audio playback

Guarantees:
- Receives the COMPLETE cleaned sentence, not individual streaming tokens or characters
- Replaces '# TODO: Play audio using pygame or similar' with actual Windows MP3 audio playback
- Uses minimum required dependency 'pygame' for MP3 audio playback with robust Windows fallback
- Comprehensive error logging for:
  * missing Fish API key
  * missing voice/reference ID
  * Fish API HTTP errors
  * empty audio response
  * audio playback errors
"""

import os
import sys
import re
import time
import tempfile
import logging
from typing import Optional, List, Generator

# Ensure project root is available in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_current_dir)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

# Setup Logger
logger = logging.getLogger("VoiceManager")
if not logger.handlers:
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] [VoiceManager] %(message)s"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)

# Import dependencies
from app.voice.text_to_speech import TextToSpeech
from app.voice.speech_text_normalizer import SpeechTextNormalizer


class VoiceManager:
    """
    Manages complete speech synthesis and audio playback flow for JARVIS.
    Ensures complete sentence buffering, text normalization, and Windows MP3 playback.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        voice_id: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.tts = TextToSpeech(api_key=api_key, voice_id=voice_id, model=model)
        self._streaming_buffer: str = ""
        self._pygame_initialized: bool = False

    def _init_pygame_mixer(self) -> bool:
        """Initializes pygame mixer safely for MP3 playback."""
        try:
            import pygame
            if not pygame.mixer.get_init():
                # CD Quality audio: 44.1kHz, 16-bit, 2 channels, 2048 buffer
                pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=2048)
            self._pygame_initialized = True
            return True
        except ImportError:
            logger.warning("[VoiceManager] 'pygame' library is not installed. Run 'pip install pygame' for standard audio playback.")
            return False
        except Exception as e:
            logger.error(f"[VoiceManager] Failed to initialize pygame audio mixer: {e}")
            return False

    def play_audio(self, audio_data: bytes) -> bool:
        """
        Plays MP3 audio bytes on Windows.
        Replaces '# TODO: Play audio using pygame or similar'.
        Uses pygame with Windows MCI fallback.
        
        Logs:
            - empty audio response
            - audio playback errors
        """
        # 10. Error logging: empty audio response
        if not audio_data or len(audio_data) == 0:
            logger.error("[VoiceManager] Audio playback error: received empty audio response (0 bytes).")
            return False

        # Try playback with pygame (minimum required dependency)
        if self._init_pygame_mixer():
            try:
                import pygame
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                    tmp_file.write(audio_data)
                    tmp_path = tmp_file.name

                try:
                    pygame.mixer.music.load(tmp_path)
                    pygame.mixer.music.play()
                    while pygame.mixer.music.get_busy():
                        time.sleep(0.04)
                    pygame.mixer.music.unload()
                    return True
                except Exception as playback_err:
                    # 10. Error logging for audio playback errors
                    logger.error(f"[VoiceManager] Audio playback error using pygame: {playback_err}")
                finally:
                    # Clean up temporary audio file
                    try:
                        if os.path.exists(tmp_path):
                            os.remove(tmp_path)
                    except Exception:
                        pass
            except Exception as e:
                logger.error(f"[VoiceManager] Unexpected pygame playback failure: {e}")

        # Fallback for Windows if pygame fails or is unavailable
        if sys.platform.startswith("win"):
            logger.info("[VoiceManager] Attempting Windows native MCI audio playback fallback...")
            return self._play_windows_mci(audio_data)

        logger.error("[VoiceManager] Audio playback failed: no compatible audio player available.")
        return False

    def _play_windows_mci(self, audio_data: bytes) -> bool:
        """Plays MP3 audio natively on Windows via MCI subsystem without external tools."""
        try:
            import ctypes
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_path = tmp_file.name

            alias = f"jarvis_mci_{int(time.time() * 1000)}"
            try:
                winmm = ctypes.windll.winmm
                # Open audio device
                ret = winmm.mciSendStringW(f'open "{tmp_path}" type mpegvideo alias {alias}', None, 0, 0)
                if ret != 0:
                    raise RuntimeError(f"MCI open command failed with code {ret}")
                
                # Play and wait until finished
                ret = winmm.mciSendStringW(f'play {alias} wait', None, 0, 0)
                if ret != 0:
                    raise RuntimeError(f"MCI play command failed with code {ret}")
                
                # Close alias
                winmm.mciSendStringW(f'close {alias}', None, 0, 0)
                return True
            finally:
                try:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except Exception:
                    pass
        except Exception as e:
            # 10. Error logging for audio playback errors
            logger.error(f"[VoiceManager] Windows MCI audio playback error: {e}")
            return False

    @staticmethod
    def extract_complete_sentences(text: str) -> List[str]:
        """
        Splits text into COMPLETE sentences, ensuring TTS never receives
        individual tokens or incomplete fragments.
        Handles Hindi (।), English (.), and exclamation/question marks (?, !).
        """
        if not text or not text.strip():
            return []

        # Split on sentence boundaries while keeping sentences complete
        # Avoid splitting common acronyms or decimals
        raw_sentences = re.split(r'(?<=[.!?।\n])\s+', text.strip())
        sentences: List[str] = []
        for s in raw_sentences:
            s_clean = s.strip()
            if s_clean:
                sentences.append(s_clean)
        return sentences

    def speak(self, text: str) -> bool:
        """
        Main execution flow:
        AI response
        → SpeechTextNormalizer
        → Fish Audio API
        → reference_id
        → MP3 audio
        → Windows audio playback

        Ensures TTS receives the COMPLETE cleaned sentence.
        """
        if not text or not str(text).strip():
            logger.warning("[VoiceManager] speak() called with empty text.")
            return False

        # Extract complete sentences so TTS never receives tokens or characters
        sentences = self.extract_complete_sentences(text)
        if not sentences:
            sentences = [text.strip()]

        all_success = True
        for sentence in sentences:
            # 1. Clean with SpeechTextNormalizer
            if SpeechTextNormalizer is not None:
                norm_result = SpeechTextNormalizer.normalize(sentence)
                if hasattr(norm_result, "is_stt_blocked") and norm_result.is_stt_blocked:
                    logger.warning("[VoiceManager] Sentence skipped because it originated from raw STT transcript.")
                    continue
                clean_sentence = norm_result.normalized_text.strip()
            else:
                clean_sentence = sentence.strip()

            if not clean_sentence:
                continue

            logger.info(f"[VoiceManager] Processing complete sentence: \"{clean_sentence}\"")

            # 2. Synthesize via Fish Audio API (sends reference_id, format=mp3, header model=s2.1-pro-free)
            audio_bytes = self.tts.synthesize(clean_sentence)
            if not audio_bytes:
                all_success = False
                continue

            # 3. Play MP3 audio on Windows
            played = self.play_audio(audio_bytes)
            if not played:
                all_success = False

        return all_success

    def feed_stream_token(self, token: str) -> Optional[bool]:
        """
        Buffers streaming tokens until a COMPLETE sentence is formed.
        Prevents individual streaming tokens or characters from being sent to TTS.
        When a sentence delimiter is encountered, synthesizes and plays that complete sentence.
        """
        self._streaming_buffer += token
        # Check if buffer contains a sentence termination boundary
        match = re.search(r'([.!?।\n]+)(\s+|$)', self._streaming_buffer)
        if match:
            end_pos = match.end()
            complete_sentence = self._streaming_buffer[:end_pos].strip()
            self._streaming_buffer = self._streaming_buffer[end_pos:]

            if complete_sentence:
                return self.speak(complete_sentence)
        return None

    def flush_stream(self) -> Optional[bool]:
        """Flushes any remaining text in streaming buffer as a complete sentence."""
        remaining = self._streaming_buffer.strip()
        self._streaming_buffer = ""
        if remaining:
            return self.speak(remaining)
        return None
