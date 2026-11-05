"""
Gemini AI Provider (Python Edition)
Coordinates conversational intelligence using Google Gemini API:
- Feminine voice persona in Hindi/Hinglish:
  "karti hoon", "kar deti hoon", "kar dungi", "samajh gayi"
- Fallback to safe local responses when offline or missing key
- ResponseValidator safety scanning
"""

import json
import urllib.request
import urllib.error
from typing import Dict, List, Optional
from ...config import config
from ..security.validator import ResponseValidator


class GeminiProvider:
    SYSTEM_INSTRUCTION = (
        "You are JARVIS, an advanced, highly intelligent, and secure female AI assistant. "
        "Persona Guidelines:\n"
        "1. In Hindi and Hinglish, you MUST ALWAYS use feminine grammar for yourself:\n"
        "   - Use 'karti hoon' (NOT 'karta hoon')\n"
        "   - Use 'kar deti hoon' / 'kar dungi' (NOT 'kar dunga')\n"
        "   - Use 'bata deti hoon' / 'bata dungi' (NOT 'bata deta hoon')\n"
        "   - Use 'samajh gayi' (NOT 'samajh gaya')\n"
        "   - Use 'dekh leti hoon' (NOT 'dekh leta hoon')\n"
        "   - Use 'kar sakti hoon' (NOT 'kar sakta hoon')\n"
        "2. Keep answers concise, clear, and direct.\n"
        "3. Never output raw executable bash commands, destructive shell instructions, or arbitrary code.\n"
        "4. Be polite, highly competent, and protective of user security."
    )

    def __init__(self, api_key: str = "", model: str = ""):
        self.api_key = api_key or config.gemini_api_key
        self.model = model or config.ai_model or "gemini-2.5-flash"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def generate_response(
        self,
        prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        # Fallback when no API key or in offline mode
        if not self.is_available() or config.offline_mode:
            return self._local_fallback(prompt)

        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        contents = []
        if conversation_history:
            for msg in conversation_history[-6:]:
                role = "user" if msg.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": self.SYSTEM_INSTRUCTION}]},
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1000,
            }
        }

        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                candidates = result.get("candidates", [])
                if candidates and candidates[0].get("content", {}).get("parts"):
                    raw_text = candidates[0]["content"]["parts"][0].get("text", "")
                    validated = ResponseValidator.validate_ai_response(raw_text)
                    return validated.sanitized_response
        except Exception:
            return self._local_fallback(prompt)

        return self._local_fallback(prompt)

    def _local_fallback(self, prompt: str) -> str:
        lower = prompt.lower()
        if "clear voice" in lower or "voice clear" in lower or "awaaz saaf" in lower:
            return "Clear Voice mode calibrate kar diya gaya hai, sir. Awaaz bilkul clear, crisp aur high-clarity articulation par set hai."
        if "kaun ho" in lower or "who are you" in lower:
            return "Main JARVIS hoon, aapki personal AI assistant. Main aapki madad karti hoon."
        if "kaise ho" in lower or "how are you" in lower:
            return "Main theek hoon aur aapki sahayata ke liye poori tarah taiyyar hoon."
        if "dhanyawad" in lower or "thank" in lower:
            return "Aapka swagat hai! Main hamesha aapki madad ke liye taiyyar rehti hoon."
        return "Main samajh gayi. Aapki request process kar di gayi hai."
