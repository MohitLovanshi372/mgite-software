"""
Unit Tests for app/voice/text_to_speech.py and app/voice_manager.py
Validates all 10 user requirements for the Python Fish Audio TTS integration.
"""

import os
import sys
import unittest
import urllib.request
import urllib.error
import logging
from io import BytesIO
from unittest.mock import patch, MagicMock

# Ensure project root is in sys.path
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from app.voice.text_to_speech import TextToSpeech
from app.voice_manager import VoiceManager
from app.voice.speech_text_normalizer import SpeechTextNormalizer


class TestFishAudioTTSIntegration(unittest.TestCase):
    def setUp(self):
        self.test_api_key = "sk-fish-test-key-1234567890abcdef"
        self.test_voice_id = "817eba7f1aea469f9802326568d427b9"

    def test_default_voice_id_unchanged(self):
        """Requirement 7: Do NOT change the Fish Audio voice ID."""
        tts = TextToSpeech(api_key=self.test_api_key, voice_id="")
        self.assertEqual(tts.voice_id, "817eba7f1aea469f9802326568d427b9")

    def test_payload_format_and_reference_id_and_header(self):
        """
        Requirement 1: Sends 'reference_id': self.voice_id
        Requirement 2: Header contains model: s2.1-pro-free
        Requirement 3: Payload contains 'format': 'mp3'
        """
        tts = TextToSpeech(api_key=self.test_api_key, voice_id=self.test_voice_id, model="s2.1-pro-free")
        
        captured_requests = []

        def mock_urlopen(req, timeout=20):
            captured_requests.append(req)
            resp = MagicMock()
            resp.read.return_value = b"ID3_MOCK_MP3_AUDIO_BYTES_TEST"
            resp.__enter__.return_value = resp
            resp.__exit__.return_value = None
            return resp

        with patch("urllib.request.urlopen", side_effect=mock_urlopen):
            audio = tts.synthesize("Namaste Mohit, main JARVIS hoon. Main aapki help kar sakti hoon.")
            self.assertIsNotNone(audio)
            self.assertEqual(audio, b"ID3_MOCK_MP3_AUDIO_BYTES_TEST")

        self.assertEqual(len(captured_requests), 1)
        req = captured_requests[0]

        import json
        payload = json.loads(req.data.decode("utf-8"))

        # Requirement 1: Sends 'reference_id', NOT 'voice_id'
        self.assertIn("reference_id", payload)
        self.assertEqual(payload["reference_id"], self.test_voice_id)
        self.assertNotIn("voice_id", payload)

        # Requirement 2: Header contains model: s2.1-pro-free, payload does NOT contain model
        self.assertIn("Model", req.headers)  # urllib capitalizes header keys to title case
        self.assertEqual(req.headers["Model"], "s2.1-pro-free")
        self.assertNotIn("model", payload)

        # Requirement 3: Payload contains "format": "mp3"
        self.assertIn("format", payload)
        self.assertEqual(payload["format"], "mp3")

        # Authorization header
        self.assertIn("Authorization", req.headers)
        self.assertEqual(req.headers["Authorization"], f"Bearer {self.test_api_key}")

    def test_missing_api_key_logs_error(self):
        """Requirement 10: Error logging for missing Fish API key."""
        with patch.dict(os.environ, {"FISH_API_KEY": "", "FISH_AUDIO_API_KEY": ""}, clear=True):
            with self.assertLogs("TextToSpeech", level="ERROR") as cm:
                tts = TextToSpeech(api_key="", voice_id=self.test_voice_id)
                audio = tts.synthesize("Hello JARVIS")
                self.assertIsNone(audio)
                self.assertTrue(any("missing fish api key" in log.lower() for log in cm.output))

    def test_missing_voice_id_logs_error(self):
        """Requirement 10: Error logging for missing voice/reference ID."""
        with self.assertLogs("TextToSpeech", level="ERROR") as cm:
            tts = TextToSpeech(api_key=self.test_api_key, voice_id="   ")
            tts.voice_id = ""  # forcefully empty to test logging
            audio = tts.synthesize("Hello JARVIS")
            self.assertIsNone(audio)
            self.assertTrue(any("missing" in log.lower() and "voice" in log.lower() for log in cm.output))

    def test_empty_audio_response_logs_error(self):
        """Requirement 10: Error logging for empty audio response."""
        tts = TextToSpeech(api_key=self.test_api_key, voice_id=self.test_voice_id)

        def mock_urlopen_empty(req, timeout=20):
            resp = MagicMock()
            resp.read.return_value = b""  # 0 bytes empty response
            resp.__enter__.return_value = resp
            resp.__exit__.return_value = None
            return resp

        with patch("urllib.request.urlopen", side_effect=mock_urlopen_empty):
            with self.assertLogs("TextToSpeech", level="ERROR") as cm:
                audio = tts.synthesize("Testing empty audio")
                self.assertIsNone(audio)
                self.assertTrue(any("empty audio response" in log.lower() for log in cm.output))

    def test_http_error_logs_error_without_key_leak(self):
        """Requirement 10: Error logging for Fish API HTTP errors without key leakage."""
        tts = TextToSpeech(api_key=self.test_api_key, voice_id=self.test_voice_id)

        def mock_urlopen_err(req, timeout=20):
            fp = BytesIO(b'{"detail":"Payment Required"}')
            raise urllib.error.HTTPError(
                url="https://api.fish.audio/v1/tts",
                code=402,
                msg="Payment Required",
                hdrs={},
                fp=fp
            )

        with patch("urllib.request.urlopen", side_effect=mock_urlopen_err):
            with self.assertLogs("TextToSpeech", level="ERROR") as cm:
                audio = tts.synthesize("Testing HTTP error")
                self.assertIsNone(audio)
                self.assertTrue(any("402" in log for log in cm.output))
                # Ensure raw secret is not leaked in log output
                for log in cm.output:
                    self.assertNotIn(self.test_api_key, log)


class TestVoiceManager(unittest.TestCase):
    def setUp(self):
        self.vm = VoiceManager(api_key="sk-fish-test-key", voice_id="817eba7f1aea469f9802326568d427b9")

    def test_complete_sentence_received(self):
        """
        Flow: AI response -> SpeechTextNormalizer -> Fish Audio API -> Windows audio playback.
        Ensures TTS receives the COMPLETE cleaned sentence, not individual streaming tokens.
        """
        received_sentences = []

        def mock_synthesize(text):
            received_sentences.append(text)
            return b"MOCK_MP3_DATA"

        self.vm.tts.synthesize = mock_synthesize
        self.vm.play_audio = MagicMock(return_value=True)

        full_ai_response = "Namaste Mohit, main JARVIS hoon! Main aapki madad karne ke liye taiyaar hoon."
        self.vm.speak(full_ai_response)

        # TTS received complete sentences, not raw chars/tokens
        self.assertGreaterEqual(len(received_sentences), 1)
        for s in received_sentences:
            self.assertGreater(len(s.split()), 1)
            # Markdown or raw punctuation cleaned
            self.assertNotIn("**", s)

    def test_streaming_token_buffering(self):
        """
        Streaming tokens must be buffered until a complete sentence delimiter is reached.
        """
        received_sentences = []

        def mock_synthesize(text):
            received_sentences.append(text)
            return b"MOCK_MP3_DATA"

        self.vm.tts.synthesize = mock_synthesize
        self.vm.play_audio = MagicMock(return_value=True)

        tokens = ["Main ", "JARVIS ", "hoon", ". ", "Aap ", "kaise ", "hain", "?"]
        for t in tokens:
            self.vm.feed_stream_token(t)

        self.assertEqual(len(received_sentences), 2)
        self.assertTrue(any("jarvis" in s.lower() for s in received_sentences))

    def test_audio_playback_error_logging(self):
        """Requirement 10: Error logging for audio playback errors."""
        with self.assertLogs("VoiceManager", level="ERROR") as cm:
            # Passing empty audio bytes triggers empty audio playback error
            res = self.vm.play_audio(b"")
            self.assertFalse(res)
            self.assertTrue(any("empty audio response" in log.lower() for log in cm.output))


if __name__ == "__main__":
    unittest.main()
