"""
JARVIS Python Comprehensive Test Suite
Validates:
1. Voice & Pronunciation Engine (Hinglish phonetics, acronyms, cadence, numbers)
2. Speech Text Normalizer & Feminine Grammar Invariants
3. Security Layer (PrivacyFilter, Validator, PermissionGate)
4. Task Management Engine (Planner, Manager, Step verification)
5. Tool Registry & Allowlist
6. Memory Engine (SQLite persistence)
7. AI Router & Orchestrator
8. TTS Providers (Fish Audio & ElevenLabs dispatch & fallback)
"""

import sys
import unittest
import os

from python.config import config
from python.core.voice.pronunciation_engine import PronunciationEngine
from python.core.voice.speech_text_normalizer import SpeechTextNormalizer
from python.core.voice.fish_audio_provider import FishAudioTTSProvider
from python.core.voice.eleven_labs_provider import ElevenLabsTTSProvider
from python.core.voice.tts_router import TTSRouter
from python.core.security.privacy_filter import PrivacyFilter
from python.core.security.validator import ResponseValidator
from python.core.security.permission_gate import PermissionGate, PermissionCheckResult
from python.core.tasks.task_manager import TaskManager
from python.core.tasks.types import TaskStatus, TaskPriority
from python.core.tools.tool_registry import ToolRegistry
from python.core.memory.memory_engine import MemoryEngine
from python.core.orchestrator.orchestrator import AssistantOrchestrator
from python.core.intent.intent_detector import IntentDetector


class TestPronunciationAndVoice(unittest.TestCase):
    def test_acronym_smooth_pronunciation(self):
        result = PronunciationEngine.process("JARVIS will check the CPU and RAM via API")
        text = result.processed_text
        self.assertIn("Jarvis", text)
        self.assertIn("Ram", text)
        self.assertIn("C P U", text)
        self.assertIn("A P I", text)

    def test_hinglish_phonetic_respelling(self):
        # Hinglish "main" pronoun must not sound like English "main road"
        result = PronunciationEngine.process("Main aapki poori madad karti hoon")
        self.assertEqual(result.detected_language, "en-IN")
        self.assertIn("mai", result.processed_text.lower())
        self.assertIn("kartee hoon", result.processed_text)

    def test_currency_and_numbers(self):
        result = PronunciationEngine.process("Balance is ₹500 and discount is 10%")
        self.assertIn("500 rupaye", result.processed_text)
        self.assertIn("10 percent", result.processed_text)

    def test_devanagari_hindi_detection(self):
        result = PronunciationEngine.process("नमस्ते! आप कैसे हैं?")
        self.assertEqual(result.detected_language, "hi")
        self.assertEqual(result.recommended_locale, "hi-IN")


class TestFemaleGrammarAlignment(unittest.TestCase):
    def test_feminine_verb_forms(self):
        tests = [
            ("Main kaam karta hoon", "karti hoon"),
            ("Main task kar dunga", "kar dungi"),
            ("Main kal karunga", "karungi"),
            ("Main sab samajh gaya", "samajh gayi"),
            ("Main abhi bata deta hoon", "bata deti hoon"),
            ("Main check kar leta hoon", "check kar leti hoon"),
            ("Main madad kar sakta hoon", "madad kar sakti hoon"),
            ("Main kaam kar raha hoon", "kar rahi hoon"),
        ]
        for inp, expected in tests:
            aligned = SpeechTextNormalizer.align_female_voice_grammar(inp)
            self.assertIn(expected, aligned, f"Failed on input: {inp}")

    def test_markdown_and_url_sanitization(self):
        raw = "Check this **important** link: https://youtube.com and code ```print('hello')```"
        norm = SpeechTextNormalizer.normalize(raw)
        self.assertNotIn("**", norm.normalized_text)
        self.assertNotIn("https://", norm.normalized_text)
        self.assertNotIn("```", norm.normalized_text)
        self.assertIn("link screen par open kar di hai", norm.normalized_text.lower())


class TestSecurityAndPermissions(unittest.TestCase):
    def test_privacy_filter_blocks_secrets(self):
        filter_otp = PrivacyFilter.filter_text("My OTP is 849201")
        self.assertTrue(filter_otp.is_blocked)

        filter_pw = PrivacyFilter.filter_text("Password is supersecret123")
        self.assertTrue(filter_pw.is_blocked)

    def test_validator_blocks_dangerous_commands(self):
        res = ResponseValidator.validate_ai_response("Please run rm -rf / in terminal")
        self.assertFalse(res.is_safe)
        self.assertIn("security policy", res.sanitized_response)

    def test_permission_gate(self):
        # safe read-only tool
        eval_time = PermissionGate.check_permission("get_current_time", {})
        self.assertTrue(eval_time.allowed)
        self.assertFalse(eval_time.requires_user_confirmation)

        # dangerous or unregistered tool
        eval_danger = PermissionGate.check_permission("bash", {"cmd": "rm -rf /"})
        self.assertFalse(eval_danger.allowed)


class TestTaskManager(unittest.TestCase):
    def test_multi_step_youtube_task(self):
        mgr = TaskManager()
        task = mgr.create_task("YouTube par Arijit Singh search karo")
        self.assertIsNotNone(task.task_id)
        self.assertEqual(task.status, TaskStatus.PLANNING)
        self.assertEqual(len(task.steps), 5)

        # Start execution
        started = mgr.start_task(task.task_id)
        self.assertEqual(started.status, TaskStatus.COMPLETED)
        self.assertTrue(all(s.status == TaskStatus.COMPLETED for s in started.steps))
        self.assertIn("Arijit Singh", started.result or "")

    def test_task_control_lifecycle(self):
        mgr = TaskManager()
        task = mgr.create_task("System status check karo")
        self.assertEqual(task.status, TaskStatus.PLANNING)

        paused = mgr.pause_task(task.task_id)
        self.assertEqual(paused.status, TaskStatus.PAUSED)

        resumed = mgr.resume_task(task.task_id)
        self.assertIn(resumed.status, (TaskStatus.RUNNING, TaskStatus.COMPLETED))

        cancelled = mgr.cancel_task(task.task_id)
        self.assertEqual(cancelled.status, TaskStatus.CANCELLED)


class TestMemoryEngine(unittest.TestCase):
    def test_sqlite_memory_persistence(self):
        db_file = "test_jarvis_temp.db"
        if os.path.exists(db_file):
            os.remove(db_file)

        mem = MemoryEngine(db_path=db_file)
        rec = mem.remember("user_name", "Mohet", category="profile")
        self.assertIsNotNone(rec)

        val = mem.recall("user_name")
        self.assertEqual(val, "Mohet")

        all_mems = mem.list_memories()
        self.assertEqual(len(all_mems), 1)

        mem.forget("user_name")
        self.assertIsNone(mem.recall("user_name"))

        if os.path.exists(db_file):
            os.remove(db_file)


class TestTTSAndOrchestrator(unittest.TestCase):
    def test_tts_mock_dispatch_and_fallback(self):
        fish = FishAudioTTSProvider(api_key="mock_key")
        fish.set_mock_handler(lambda payload: b"FISH_AUDIO_BYTES")

        el = ElevenLabsTTSProvider(api_key="mock_key")
        el.set_mock_handler(lambda payload: b"ELEVENLABS_AUDIO_BYTES")

        router = TTSRouter(fish_provider=fish, elevenlabs_provider=el, configured_provider="fish_audio")
        res = router.route_and_speak("Haan ji, main aapki sahayata karti hoon.")
        self.assertTrue(res.success)
        self.assertEqual(res.provider_used, "fish_audio")
        self.assertEqual(res.audio_bytes, b"FISH_AUDIO_BYTES")

    def test_orchestrator_conversational_turn(self):
        orch = AssistantOrchestrator()
        res = orch.process_message("Kaun ho aap?", force_offline=True)
        self.assertIn("JARVIS", res.response_text)
        self.assertIn("karti hoon", res.response_text)
        self.assertFalse(res.is_task)


class TestVoiceMicroservice(unittest.TestCase):
    def test_acoustic_synthesizer_wav_generation(self):
        from .core.voice.acoustic_synthesizer import AcousticCyberneticSynthesizer
        synth = AcousticCyberneticSynthesizer()
        wav = synth.synthesize_wav_bytes("Namaste! Main aapki AI assistant hoon.")
        self.assertTrue(len(wav) > 1000)
        self.assertEqual(wav[:4], b"RIFF")
        self.assertEqual(wav[8:12], b"WAVE")

    def test_voice_microservice_text_processing(self):
        from .voice_microservice import VoiceMicroservice
        vm = VoiceMicroservice()
        data = vm.process_text("Main aapka kaam turant check kar leti hoon. ₹500 balance hai.")
        self.assertIn("500 rupaye", data["normalized_text"])
        self.assertTrue("kar leti hoon" in data["normalized_text"] or "karti hoon" in data["normalized_text"])
        self.assertGreater(data["phoneme_count"], 0)
        self.assertIn(data["detected_language"], ["hi", "en-IN", "en"])

    def test_voice_microservice_streaming_chunks(self):
        from .voice_microservice import VoiceMicroservice
        vm = VoiceMicroservice()
        events = list(vm.synthesize_stream("JARVIS online.", {"chunk_duration_ms": 100}))
        self.assertGreater(len(events), 2)
        self.assertEqual(events[0]["event"], "start")
        self.assertEqual(events[1]["event"], "chunk")
        self.assertTrue(events[1]["audio_base64"])
        self.assertEqual(events[-1]["event"], "end")
        self.assertTrue(events[-2]["is_last"])


class TestVoiceOutputPipeline(unittest.TestCase):
    def test_female_jarvis_grammar_invariants(self):
        # Must produce exact female forms: samajh gayi, kar rahi hoon, kar dungi, kar deti hoon
        tests = [
            ("Main samajh gaya", "samajh gayi"),
            ("Main kaam kar raha hoon", "kar rahi hoon"),
            ("Main abhi kar dunga", "kar dungi"),
            ("Main check kar deta hoon", "kar deti hoon"),
        ]
        for raw, expected in tests:
            norm = SpeechTextNormalizer.normalize(raw)
            self.assertIn(expected, norm.normalized_text, f"Failed on {raw} -> {norm.normalized_text}")

    def test_technical_words_spoken_naturally(self):
        # Technical words: React, Python, JavaScript, GitHub, API, YouTube, TypeScript
        # Must be spoken naturally without letter-by-letter spelling
        raw = "Main React, Python, JavaScript, GitHub, API, YouTube aur TypeScript check kar rahi hoon."
        norm = SpeechTextNormalizer.normalize(raw)
        res = norm.normalized_text
        self.assertIn("React", res)
        self.assertIn("Python", res)
        self.assertIn("JavaScript", res)
        self.assertIn("GitHub", res)
        self.assertIn("API", res)
        self.assertIn("YouTube", res)
        self.assertIn("TypeScript", res)

        # Spaced out letters must be collapsed
        spaced = "R e a c t and P y t h o n with G i t h u b and T y p e s c r i p t"
        norm_spaced = SpeechTextNormalizer.normalize(spaced)
        self.assertIn("React", norm_spaced.normalized_text)
        self.assertIn("Python", norm_spaced.normalized_text)
        self.assertIn("GitHub", norm_spaced.normalized_text)
        self.assertIn("TypeScript", norm_spaced.normalized_text)
        self.assertNotIn("R e a c t", norm_spaced.normalized_text)

    def test_never_send_markdown_json_code_urls_filepaths(self):
        # Markdown
        norm_md = SpeechTextNormalizer.normalize("### Heading\n**Bold text** with *italics* and - list item")
        self.assertNotIn("###", norm_md.normalized_text)
        self.assertNotIn("**", norm_md.normalized_text)
        self.assertIn("Bold text", norm_md.normalized_text)

        # JSON
        raw_json = '{"status": "success", "result": "done"}'
        norm_json = SpeechTextNormalizer.normalize(raw_json)
        self.assertNotIn('{"status"', norm_json.normalized_text)
        self.assertIn("complete ho gaya hai", norm_json.normalized_text)

        # Code
        raw_code = "Check this code:\n```python\nimport sys\nprint('hello')\n```\nAll done."
        norm_code = SpeechTextNormalizer.normalize(raw_code)
        self.assertNotIn("```", norm_code.normalized_text)
        self.assertNotIn("import sys", norm_code.normalized_text)
        self.assertIn("Code snippet screen par display kar diya gaya hai", norm_code.normalized_text)

        # URLs
        raw_url = "Open https://github.com/project/repo and check."
        norm_url = SpeechTextNormalizer.normalize(raw_url)
        self.assertNotIn("https://", norm_url.normalized_text)
        self.assertIn("GitHub link screen par open kar di hai", norm_url.normalized_text)

        # File paths
        raw_path = "Maine /python/core/voice/speech_text_normalizer.py aur src/components/App.tsx update kar di hai."
        norm_path = SpeechTextNormalizer.normalize(raw_path)
        self.assertNotIn("/python/core/voice/", norm_path.normalized_text)
        self.assertNotIn("src/components/", norm_path.normalized_text)
        self.assertIn("file", norm_path.normalized_text.lower())

    def test_prevent_stt_transcript_direct_to_tts(self):
        stt_transcript = "What is the status of the server?"
        SpeechTextNormalizer.register_stt_transcript(stt_transcript)

        # 1. SpeechTextNormalizer directly on STT blocks it
        norm = SpeechTextNormalizer.normalize(stt_transcript, is_stt=True)
        self.assertTrue(norm.is_stt_blocked)
        self.assertEqual(norm.normalized_text, "")

        # 2. TTSRouter directly on STT blocks it
        router = TTSRouter()
        dispatch = router.route_and_speak(stt_transcript, is_stt=True)
        self.assertFalse(dispatch.success)
        self.assertIn("STT transcript cannot be sent directly to TTS", dispatch.error)

    def test_prevent_duplicate_speech(self):
        # 1. Sentence deduplication within normalizer
        dup_text = "Main samajh gayi. Main samajh gayi. Main abhi kar dungi."
        norm = SpeechTextNormalizer.normalize(dup_text)
        self.assertTrue(norm.duplicate_filtered)
        # Should only have one instance of samajh gayi
        self.assertEqual(norm.normalized_text.count("samajh gayi"), 1)

        # 2. Debounce deduplication in TTSRouter
        router = TTSRouter()
        res1 = router.route_and_speak("Haan ji main madad kar sakti hoon.", force_speak=True)
        res2 = router.route_and_speak("Haan ji main madad kar sakti hoon.", force_speak=False)
        self.assertTrue(res2.duplicate_prevented)
        self.assertIn("Duplicate speech prevented", res2.fallback_reason)

    def test_complete_stt_to_voice_pipeline(self):
        orch = AssistantOrchestrator()
        # STT -> AI response -> SpeechTextNormalizer -> TTS -> Voice
        stt_input = "System ka status kya hai?"
        res = orch.process_stt_pipeline(stt_input, synthesize_voice=False, force_offline=True)

        self.assertIsNotNone(res.response_text)
        self.assertIsNotNone(res.speech_text)
        # Verify speech text was normalized
        self.assertTrue(len(res.speech_text) > 0)
        # STT input is NOT identical to assistant speech text
        self.assertNotEqual(stt_input, res.speech_text)


class TestGenderNormalizationUtility(unittest.TestCase):
    def test_gender_normalizer_hinglish_endings(self):
        from python.gender_normalization import GenderNormalizer, normalize_feminine_gender

        cases = [
            ("Main kaam kar raha hoon", "kar rahi hoon"),
            ("Main abhi kar deta hoon", "kar deti hoon"),
            ("Main turant kar dunga", "kar dungi"),
            ("Main kal karunga", "karungi"),
            ("Main samajh gaya", "samajh gayi"),
            ("Main check kar leta hoon", "check kar leti hoon"),
            ("Main dekh lunga", "dekh lungi"),
            ("Main bata deta hoon", "bata deti hoon"),
            ("Main bata raha hoon", "bata rahi hoon"),
            ("Main madad kar sakta hoon", "madad kar sakti hoon"),
            ("Main koshish karta hoon", "koshish karti hoon"),
            ("Main samajhta hoon", "samajhti hoon"),
            ("Main sun raha hoon", "sun rahi hoon"),
            ("Main soch raha hoon", "soch rahi hoon"),
            ("Main bhej dunga", "bhej dungi"),
            ("Main kar paunga", "kar paungi"),
        ]

        for inp, expected in cases:
            out = GenderNormalizer.normalize_gender(inp)
            self.assertIn(expected, out, f"Failed on: {inp} -> {out}")
            # Also test the convenience function
            out_helper = normalize_feminine_gender(inp)
            self.assertIn(expected, out_helper)

    def test_gender_normalizer_devanagari(self):
        from python.gender_normalization import GenderNormalizer

        hindi_cases = [
            ("मैं काम कर रहा हूँ", "कर रही हूँ"),
            ("मैं समझ गया", "समझ गई"),
            ("मैं काम कर दूँगा", "कर दूँगी"),
            ("मैं बता देता हूँ", "बता देती हूँ"),
        ]
        for inp, expected in hindi_cases:
            out = GenderNormalizer.normalize_gender(inp)
            self.assertIn(expected, out, f"Failed on Devanagari: {inp} -> {out}")

    def test_gender_normalizer_audit_report(self):
        from python.gender_normalization import GenderNormalizer

        text = "Main samajh gaya aur abhi check kar raha hoon."
        norm, report = GenderNormalizer.normalize_with_report(text)
        self.assertIn("samajh gayi", norm)
        self.assertIn("kar rahi hoon", norm)
        self.assertGreater(len(report), 0)


class TestPhonemeMapAndSpeechNormalization(unittest.TestCase):
    def test_phoneme_map_loading(self):
        pmap = SpeechTextNormalizer.load_phoneme_map()
        self.assertIsInstance(pmap, dict)
        self.assertGreater(len(pmap), 20)
        self.assertIn("kya", pmap)
        self.assertEqual(pmap["kya"], "kyaa")
        self.assertIn("dhanyawad", pmap)
        self.assertEqual(pmap["dhanyawad"], "dhanyawaad")

    def test_phoneme_map_conversions(self):
        SpeechTextNormalizer._phoneme_map = None
        cases = [
            ("Aapka kya haal hai?", "kyaa"),
            ("Aapka swagat hai.", "swaagat"),
            ("Bahut bahut shukriya.", "shukriyaa"),
            ("Aapka dhanyawad.", "dhanyawaad"),
            ("Kripya thoda rukiye.", "kripayaa"),
            ("Sab thik hai.", "theek"),
            ("Abhi batao.", "bataao"),
            ("Mujhe alvida kehna hai.", "alvidaa"),
        ]
        for inp, expected_phoneme in cases:
            norm = SpeechTextNormalizer.normalize(inp).normalized_text
            self.assertIn(expected_phoneme.lower(), norm.lower(), f"Failed on: {inp} -> {norm}")

    def test_phoneme_preserves_technical_words(self):
        SpeechTextNormalizer._phoneme_map = None
        tech_input = "React, Python, JavaScript, GitHub, API, YouTube aur TypeScript check kar rahi hoon."
        norm = SpeechTextNormalizer.normalize(tech_input).normalized_text
        self.assertIn("React", norm)
        self.assertIn("Python", norm)
        self.assertIn("JavaScript", norm)
        self.assertIn("GitHub", norm)
        self.assertIn("API", norm)
        self.assertIn("YouTube", norm)
        self.assertIn("TypeScript", norm)

    def test_phoneme_with_female_grammar(self):
        SpeechTextNormalizer._phoneme_map = None
        # Even with colloquial spelling abbreviations (smjh gya, kr dunga),
        # normalizer translates phonemes and enforces female persona grammar
        inp = "Main smjh gya, main turant kr dunga aur check kr rha hu."
        norm = SpeechTextNormalizer.normalize(inp).normalized_text
        self.assertIn("samajh gayi", norm)
        self.assertIn("kar dungi", norm)
        self.assertIn("kar rahi hoon", norm)


class TestClearVoicePipeline(unittest.TestCase):
    def test_clear_voice_acoustic_synthesis(self):
        from .core.voice.acoustic_synthesizer import AcousticCyberneticSynthesizer
        synth = AcousticCyberneticSynthesizer()
        wav = synth.synthesize_wav_bytes(
            "Namaste! Awaaz bilkul clear aur crisp hai.",
            profile="CLEAR_VOICE"
        )
        self.assertTrue(len(wav) > 1000)
        self.assertEqual(wav[:4], b"RIFF")
        self.assertEqual(wav[8:12], b"WAVE")

    def test_tts_router_clear_voice_state(self):
        router = TTSRouter()
        router._last_raw_text = "test raw text"
        router._last_spoken_text = "test spoken text"
        router._last_spoken_time = 1234567.89
        router.clear_voice_state()
        self.assertEqual(router._last_raw_text, "")
        self.assertEqual(router._last_spoken_text, "")
        self.assertEqual(router._last_spoken_time, 0.0)
        self.assertIsNone(router.last_dispatch_result)

    def test_orchestrator_clear_voice_command(self):
        orch = AssistantOrchestrator()
        res = orch.process_message("clear voice")
        self.assertEqual(res.detected_intent, "SETTINGS_REQUEST")
        self.assertIn("Clear Voice", res.response_text)
        self.assertIn("clear", res.response_text.lower())
        self.assertFalse(res.is_task)

    def test_voice_microservice_clear_voice_option(self):
        from .voice_microservice import VoiceMicroservice
        vm = VoiceMicroservice()
        chunks = list(vm.synthesize_stream("Voice check.", {"clear_voice": True, "chunk_duration_ms": 100}))
        self.assertGreater(len(chunks), 1)
        self.assertEqual(chunks[0]["event"], "start")


def run_tests():
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
