"""
JARVIS Interactive Terminal CLI (Python Edition)
Complete command-line interface for JARVIS:
- Real-time conversation with feminine Hindi/Hinglish persona
- Voice speech synthesis preview & audio playback
- Multi-step Task Planner & Executor
- Memory Management (SQLite)
- Permission Gate and Security audit
"""

import sys
import os
from .config import config
from .core.orchestrator.orchestrator import AssistantOrchestrator
from .core.voice.speech_text_normalizer import SpeechTextNormalizer
from .core.voice.pronunciation_engine import PronunciationEngine
from .core.tasks.task_manager import TaskManager


def print_banner():
    banner = """
===================================================================
      _   _    ______     _____  _____ 
     | | / \\  |  _ \\ \\   / /_ _|/ ____|
  _  | |/ _ \\ | |_) \\ \\ / / | | \\___ \\ 
 | |_| / ___ \\|  _ < \\ V /  | |  ___) |
  \\___/_/   \\_\\_| \\_\\ \\_/  |___||_____/ 
                                       
  PYTHON EDITION - ENHANCED VOICE & PRONUNCIATION ENGINE
  Persona: Female JARVIS (Hindi / Hinglish / English)
===================================================================
Type 'exit' or 'quit' to close.
Commands:
  /tasks      - List all tasks
  /pronounce  - Preview phonetic pronunciation for a phrase
  /memory     - List stored memories
  /status     - System & TTS status
===================================================================
"""
    print(banner)


def main():
    print_banner()
    orchestrator = AssistantOrchestrator()
    task_mgr = orchestrator.task_manager

    while True:
        try:
            user_input = input("\n[USER] > ").strip()
            if not user_input:
                continue

            if user_input.lower() in ("exit", "quit"):
                print("\n[JARVIS]: Alvida! Apna khayal rakhiyega.")
                break

            # CLI Commands
            if user_input.startswith("/pronounce "):
                phrase = user_input[11:].strip()
                norm = SpeechTextNormalizer.normalize(phrase)
                pron = norm.pronunciation_result
                print("\n--- PRONUNCIATION ANALYSIS ---")
                print(f"Original:    {phrase}")
                print(f"Normalized:  {norm.normalized_text}")
                print(f"Language:    {norm.detected_language}")
                if pron:
                    print(f"Locale:      {pron.recommended_locale}")
                    print(f"Pitch:       {pron.recommended_pitch}")
                    print(f"Rate:        {pron.recommended_rate}")
                    print(f"Notes:       {', '.join(pron.pronunciation_notes) or 'None'}")
                print("------------------------------")
                continue

            if user_input == "/tasks":
                tasks = task_mgr.list_tasks()
                print(f"\n--- ACTIVE TASKS ({len(tasks)}) ---")
                for t in tasks:
                    print(f"[{t.status.value}] {t.task_id}: {t.user_request}")
                    for s in t.steps:
                        print(f"   -> [{s.status.value}] {s.description}")
                print("-------------------------")
                continue

            if user_input == "/memory":
                mems = orchestrator.memory_engine.list_memories()
                print(f"\n--- MEMORY RECORDS ({len(mems)}) ---")
                for m in mems:
                    print(f"- {m['key']} ({m['category']}): {m['value']}")
                print("-------------------------")
                continue

            if user_input == "/status":
                print("\n--- SYSTEM STATUS ---")
                print(f"Assistant:         {config.assistant_name}")
                print(f"Voice Provider:    {config.voice.tts_provider}")
                print(f"Fish Audio:        {'Connected' if config.is_fish_audio_configured() else 'Not configured'}")
                print(f"ElevenLabs:        {'Connected' if config.is_elevenlabs_configured() else 'Not configured'}")
                print(f"Gemini AI:         {'Connected' if config.is_gemini_configured() else 'Offline Local Mode'}")
                print("---------------------")
                continue

            # Process Message through Orchestrator
            res = orchestrator.process_message(user_input, synthesize_voice=False)

            print(f"\n[JARVIS]: {res.response_text}")
            if res.is_task:
                print(f"[TASK ENGINE]: Task {res.task_id} -> {res.task_status}")
            print(f"[TTS PHONETICS]: \"{res.speech_text}\"")

        except KeyboardInterrupt:
            print("\n[JARVIS]: Session interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n[ERROR]: {str(e)}")


if __name__ == "__main__":
    main()
