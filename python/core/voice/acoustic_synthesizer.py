"""
Acoustic Cybernetic Synthesizer (Python Edition)
High-fidelity vocal & cybernetic formant audio synthesis engine in pure Python.
Produces 24,000Hz 16-bit PCM WAV audio streams with:
- Formant filtering for vowels (F1, F2, F3) with natural harmonic spectrum
- Fricative and plosive consonant articulation (s, sh, t, k, p, d, b, g, m, n, l, r)
- Micro-pitch intonation contours and punctuation-based prosodic pacing
- Persona support: JARVIS_FEMALE, ULTRON_PRIME, HINDI_NEURAL, HINGLISH_HYBRID
- Cybernetic effects layer: 55Hz sub-bass carrier, subtle robotic ring modulation, acoustic clicks
- Chunked real-time audio streaming (yielding chunks with phoneme & duration telemetry)
"""

import io
import math
import random
import struct
import wave
from dataclasses import dataclass, field
from typing import Dict, Generator, List, Optional, Tuple


@dataclass
class AudioChunk:
    chunk_index: int
    is_last: bool
    audio_bytes: bytes
    audio_base64: str
    duration_ms: float
    sample_rate: int = 24000
    phonemes: List[str] = field(default_factory=list)


@dataclass
class PhonemeSpec:
    symbol: str
    is_vowel: bool
    duration_ms: float
    f1: float = 500.0  # Formant 1 (Hz)
    f2: float = 1500.0  # Formant 2 (Hz)
    f3: float = 2500.0  # Formant 3 (Hz)
    noise_mix: float = 0.0  # 0.0 (pure tone) to 1.0 (pure noise)
    noise_freq: float = 3000.0
    voiced: bool = True
    closure_ms: float = 0.0  # Plosive silence


class AcousticCyberneticSynthesizer:
    SAMPLE_RATE = 24000

    # Vowel Formant Presets (F1, F2, F3 in Hz)
    VOWEL_FORMANTS: Dict[str, Tuple[float, float, float]] = {
        'a': (750.0, 1200.0, 2500.0),   # Open central
        'aa': (820.0, 1250.0, 2550.0),  # Hindi/English long a (aam, baap, car)
        'e': (530.0, 1840.0, 2480.0),   # Close-mid front (pet, desk)
        'ee': (270.0, 2300.0, 3050.0),  # Long ee / i (beet, heera)
        'i': (390.0, 2100.0, 2800.0),   # Near-close front (bit, kripya)
        'o': (570.0, 840.0, 2410.0),    # Close-mid back (boat, bolo)
        'oo': (320.0, 820.0, 2240.0),   # Long oo / u (boot, dhoop)
        'u': (440.0, 1020.0, 2240.0),   # Near-close back (put, shuru)
        'ai': (650.0, 1950.0, 2600.0),  # Diphthong (hai, main, bite)
        'au': (600.0, 950.0, 2400.0),   # Diphthong (aur, kaun, loud)
        'ae': (660.0, 1720.0, 2410.0),  # Near-open front (cat, bag)
        'uh': (500.0, 1500.0, 2500.0),  # Schwa (the, banana, karo)
    }

    # Consonant Articulation Table
    CONSONANTS: Dict[str, PhonemeSpec] = {
        # Fricatives
        's': PhonemeSpec('s', False, 75.0, noise_mix=0.92, noise_freq=5500.0, voiced=False),
        'sh': PhonemeSpec('sh', False, 85.0, noise_mix=0.88, noise_freq=3800.0, voiced=False),
        'z': PhonemeSpec('z', False, 70.0, f1=300.0, f2=1600.0, f3=2500.0, noise_mix=0.65, noise_freq=4800.0, voiced=True),
        'f': PhonemeSpec('f', False, 65.0, noise_mix=0.85, noise_freq=3200.0, voiced=False),
        'v': PhonemeSpec('v', False, 60.0, f1=280.0, f2=1200.0, f3=2400.0, noise_mix=0.45, noise_freq=2800.0, voiced=True),
        'th': PhonemeSpec('th', False, 65.0, noise_mix=0.75, noise_freq=4200.0, voiced=False),
        'h': PhonemeSpec('h', False, 55.0, noise_mix=0.60, noise_freq=2200.0, voiced=False),
        # Plosives / Stops
        't': PhonemeSpec('t', False, 45.0, noise_mix=0.90, noise_freq=4500.0, voiced=False, closure_ms=25.0),
        'd': PhonemeSpec('d', False, 45.0, f1=250.0, f2=1700.0, f3=2600.0, noise_mix=0.45, noise_freq=3500.0, voiced=True, closure_ms=20.0),
        'k': PhonemeSpec('k', False, 50.0, noise_mix=0.90, noise_freq=2800.0, voiced=False, closure_ms=30.0),
        'g': PhonemeSpec('g', False, 45.0, f1=280.0, f2=1800.0, f3=2500.0, noise_mix=0.40, noise_freq=2200.0, voiced=True, closure_ms=20.0),
        'p': PhonemeSpec('p', False, 40.0, noise_mix=0.85, noise_freq=1800.0, voiced=False, closure_ms=25.0),
        'b': PhonemeSpec('b', False, 40.0, f1=220.0, f2=1100.0, f3=2300.0, noise_mix=0.35, noise_freq=1500.0, voiced=True, closure_ms=18.0),
        'ch': PhonemeSpec('ch', False, 75.0, noise_mix=0.88, noise_freq=4000.0, voiced=False, closure_ms=25.0),
        'j': PhonemeSpec('j', False, 70.0, f1=280.0, f2=1900.0, f3=2700.0, noise_mix=0.50, noise_freq=3600.0, voiced=True, closure_ms=20.0),
        # Nasals
        'm': PhonemeSpec('m', False, 70.0, f1=250.0, f2=1000.0, f3=2200.0, noise_mix=0.08, voiced=True),
        'n': PhonemeSpec('n', False, 65.0, f1=280.0, f2=1500.0, f3=2500.0, noise_mix=0.08, voiced=True),
        'ng': PhonemeSpec('ng', False, 75.0, f1=300.0, f2=1900.0, f3=2600.0, noise_mix=0.08, voiced=True),
        # Liquids / Semivowels
        'l': PhonemeSpec('l', False, 60.0, f1=380.0, f2=1200.0, f3=2700.0, noise_mix=0.05, voiced=True),
        'r': PhonemeSpec('r', False, 60.0, f1=350.0, f2=1300.0, f3=1800.0, noise_mix=0.10, voiced=True),
        'w': PhonemeSpec('w', False, 65.0, f1=320.0, f2=850.0, f3=2200.0, noise_mix=0.05, voiced=True),
        'y': PhonemeSpec('y', False, 65.0, f1=280.0, f2=2200.0, f3=2900.0, noise_mix=0.05, voiced=True),
    }

    def __init__(self):
        self.rng = random.Random(42)

    def text_to_phonemes(self, text: str) -> List[PhonemeSpec]:
        """
        Converts text into an ordered sequence of phonetic units with duration & formant specs.
        """
        import re
        tokens = re.findall(r"[\w']+|[.,!?;:-]", text.lower())
        phonemes: List[PhonemeSpec] = []

        for token in tokens:
            if token in ('.', '!', '?'):
                # Sentence boundary pause
                phonemes.append(PhonemeSpec(symbol='PAUSE_LONG', is_vowel=False, duration_ms=220.0, voiced=False))
                continue
            elif token in (',', ';', ':', '-'):
                # Clause boundary pause
                phonemes.append(PhonemeSpec(symbol='PAUSE_SHORT', is_vowel=False, duration_ms=120.0, voiced=False))
                continue

            # Word decomposition into syllables / phonemes
            i = 0
            n = len(token)
            while i < n:
                # Try two-character phonemes first
                two = token[i:i+2]
                if two in ('sh', 'ch', 'th', 'ng', 'aa', 'ee', 'oo', 'ai', 'au', 'ae'):
                    if two in self.VOWEL_FORMANTS:
                        f1, f2, f3 = self.VOWEL_FORMANTS[two]
                        phonemes.append(PhonemeSpec(symbol=two, is_vowel=True, duration_ms=105.0, f1=f1, f2=f2, f3=f3, noise_mix=0.02, voiced=True))
                    elif two in self.CONSONANTS:
                        phonemes.append(self.CONSONANTS[two])
                    i += 2
                    continue

                one = token[i]
                if one in ('a', 'e', 'i', 'o', 'u'):
                    f1, f2, f3 = self.VOWEL_FORMANTS.get(one, (500.0, 1500.0, 2500.0))
                    phonemes.append(PhonemeSpec(symbol=one, is_vowel=True, duration_ms=90.0, f1=f1, f2=f2, f3=f3, noise_mix=0.02, voiced=True))
                elif one in self.CONSONANTS:
                    phonemes.append(self.CONSONANTS[one])
                elif one == 'y':
                    phonemes.append(self.CONSONANTS['y'])
                elif one == 'w':
                    phonemes.append(self.CONSONANTS['w'])
                else:
                    # Generic consonant fallback
                    phonemes.append(PhonemeSpec(symbol=one, is_vowel=False, duration_ms=50.0, noise_mix=0.4, noise_freq=3000.0, voiced=False))
                i += 1

            # Inter-word micro pause
            phonemes.append(PhonemeSpec(symbol='WORD_GAP', is_vowel=False, duration_ms=45.0, voiced=False))

        return phonemes

    def synthesize_samples(
        self,
        phonemes: List[PhonemeSpec],
        pitch_scale: float = 1.0,
        rate_scale: float = 1.0,
        profile: str = "JARVIS_FEMALE",
        sub_bass_enabled: bool = True
    ) -> List[int]:
        """
        Synthesizes 16-bit signed PCM samples from the phoneme sequence.
        """
        # Base pitch (F0) configuration
        if profile == "ULTRON_PRIME":
            base_f0 = 92.0 * pitch_scale
            sub_bass_gain = 0.28
            ring_mod_depth = 0.18
            ring_mod_freq = 42.0
            volume_scale = 0.90
        elif profile in ("CLEAR_VOICE", "JARVIS_CLEAR"):
            base_f0 = 218.0 * pitch_scale
            sub_bass_gain = 0.0  # Zero sub-bass drone for absolute voice clarity
            ring_mod_depth = 0.0  # Zero metallic buzz
            ring_mod_freq = 0.0
            volume_scale = 0.96
        elif profile == "HINDI_NEURAL":
            base_f0 = 210.0 * pitch_scale
            sub_bass_gain = 0.0  # Clear voice: zero sub-bass drone
            ring_mod_depth = 0.0  # Clear voice: zero metallic ring modulation
            ring_mod_freq = 0.0
            volume_scale = 0.95
        elif profile == "HINGLISH_HYBRID":
            base_f0 = 212.0 * pitch_scale
            sub_bass_gain = 0.0  # Clear voice: zero sub-bass drone
            ring_mod_depth = 0.0  # Clear voice: zero metallic ring modulation
            ring_mod_freq = 0.0
            volume_scale = 0.95
        else:  # JARVIS_FEMALE (Default Clear Voice)
            base_f0 = 216.0 * pitch_scale
            sub_bass_gain = 0.0  # Clear voice: zero sub-bass drone
            ring_mod_depth = 0.0  # Clear voice: zero metallic ring modulation
            ring_mod_freq = 0.0
            volume_scale = 0.95

        if not sub_bass_enabled:
            sub_bass_gain = 0.0

        samples: List[int] = []
        phase_glottal = 0.0
        phase_sub = 0.0
        phase_ring = 0.0
        noise_filter_state = 0.0

        total_phonemes = len(phonemes)

        for p_idx, p in enumerate(phonemes):
            # Durations adjusted for rate_scale
            duration_ms = max(20.0, p.duration_ms / max(0.5, rate_scale))
            num_samples = int((duration_ms / 1000.0) * self.SAMPLE_RATE)

            if p.symbol.startswith('PAUSE') or p.symbol == 'WORD_GAP':
                # Pure silence / room ambient
                samples.extend([0] * num_samples)
                continue

            # Plosive closure
            if p.closure_ms > 0:
                closure_samples = int((p.closure_ms / 1000.0 / max(0.5, rate_scale)) * self.SAMPLE_RATE)
                samples.extend([0] * closure_samples)

            # Micro-prosodic pitch contour (subtle drift across utterance)
            rel_pos = p_idx / max(1, total_phonemes)
            intonation = 1.0 + (0.05 * math.sin(rel_pos * math.pi)) - (0.08 * (rel_pos ** 1.8))
            f0 = base_f0 * intonation

            # Smooth coarticulation: check if boundary is pause/word-gap
            prev_is_gap = (p_idx == 0) or phonemes[p_idx - 1].symbol.startswith('PAUSE') or (phonemes[p_idx - 1].symbol == 'WORD_GAP')
            next_is_gap = (p_idx == total_phonemes - 1) or phonemes[p_idx + 1].symbol.startswith('PAUSE') or (phonemes[p_idx + 1].symbol == 'WORD_GAP')

            # Synthesis for this phoneme
            f1, f2, f3 = p.f1, p.f2, p.f3
            noise_mix = p.noise_mix
            voiced = p.voiced

            for i in range(num_samples):
                t = i / self.SAMPLE_RATE
                tot_time = num_samples / self.SAMPLE_RATE
                attack_len = min(0.012, tot_time * 0.20)
                decay_len = min(0.015, tot_time * 0.25)

                # Smooth envelope with connected coarticulation between continuous phonemes
                if prev_is_gap and t < attack_len:
                    env = t / attack_len
                elif next_is_gap and t > (tot_time - decay_len):
                    env = max(0.0, (tot_time - t) / decay_len)
                else:
                    env = 1.0

                # 1. Harmonic Glottal Source with calibrated formant resonance
                glottal_val = 0.0
                if voiced:
                    phase_glottal += 2.0 * math.pi * f0 / self.SAMPLE_RATE
                    if phase_glottal > 2.0 * math.pi:
                        phase_glottal -= 2.0 * math.pi

                    # Sum first 14 harmonics with resonant formant bandpass weighting
                    for h in range(1, 15):
                        hf = f0 * h
                        if hf > 10000.0:
                            break
                        bw = 110.0
                        boost1 = 1.0 / (1.0 + ((hf - f1) / bw) ** 2)
                        boost2 = 0.78 / (1.0 + ((hf - f2) / (bw * 1.25)) ** 2)
                        boost3 = 0.48 / (1.0 + ((hf - f3) / (bw * 1.5)) ** 2)
                        res = 0.20 + (boost1 * 2.4) + (boost2 * 1.8) + (boost3 * 1.2)

                        # Harmonic roll-off
                        h_amp = (1.0 / (h ** 0.85)) * res
                        glottal_val += h_amp * math.sin(h * phase_glottal)

                    glottal_val = math.tanh(glottal_val * 0.22) * 1.05

                # 2. Clean Noise Source (fricatives without metallic ring modulation)
                noise_val = 0.0
                if noise_mix > 0:
                    white = self.rng.uniform(-1.0, 1.0)
                    # Continuous leaky integrator for natural colored sibilance
                    noise_filter_state = (0.70 * noise_filter_state) + (0.30 * white)
                    if p.noise_freq > 3200.0:
                        noise_val = (white - noise_filter_state) * 1.10
                    else:
                        noise_val = noise_filter_state * 1.20

                # Combined acoustic signal
                sig = ((1.0 - noise_mix) * glottal_val) + (noise_mix * noise_val * 0.90)

                # 3. Sub-Bass Cybernetic Carrier (55Hz)
                if sub_bass_gain > 0:
                    phase_sub += 2.0 * math.pi * 55.0 / self.SAMPLE_RATE
                    if phase_sub > 2.0 * math.pi:
                        phase_sub -= 2.0 * math.pi
                    sub_sig = math.sin(phase_sub) * sub_bass_gain * env
                    sig = (sig * (1.0 - sub_bass_gain * 0.5)) + sub_sig

                # 4. Subtle Ring Modulation Overtones (Ultron metallic edge)
                if ring_mod_depth > 0:
                    phase_ring += 2.0 * math.pi * ring_mod_freq / self.SAMPLE_RATE
                    if phase_ring > 2.0 * math.pi:
                        phase_ring -= 2.0 * math.pi
                    ring_mult = 1.0 + (ring_mod_depth * math.sin(phase_ring))
                    sig *= ring_mult

                # Apply envelope and volume scale
                final_val = sig * env * volume_scale

                # Soft clipping to prevent harsh distortion
                final_val = math.tanh(final_val)

                int_sample = int(final_val * 31000.0)
                int_sample = max(-32768, min(32767, int_sample))
                samples.append(int_sample)

        # 5. Clear Voice Mastering Filter: 80Hz High-Pass (removes DC offset & sub-rumble)
        mastered_samples: List[int] = []
        hp_x1 = 0.0
        hp_y1 = 0.0
        rc = 1.0 / (2.0 * math.pi * 80.0)
        dt = 1.0 / self.SAMPLE_RATE
        alpha_hp = rc / (rc + dt)

        for s in samples:
            hp_y = alpha_hp * (hp_y1 + s - hp_x1)
            hp_x1 = s
            hp_y1 = hp_y
            mastered_samples.append(max(-32768, min(32767, int(hp_y))))

        return mastered_samples

    def synthesize_wav_bytes(
        self,
        text: str,
        pitch_scale: float = 1.0,
        rate_scale: float = 1.0,
        profile: str = "JARVIS_FEMALE",
        sub_bass_enabled: bool = True
    ) -> bytes:
        """
        Synthesizes text into complete 16-bit 24kHz PCM WAV bytes.
        """
        phonemes = self.text_to_phonemes(text)
        samples = self.synthesize_samples(
            phonemes=phonemes,
            pitch_scale=pitch_scale,
            rate_scale=rate_scale,
            profile=profile,
            sub_bass_enabled=sub_bass_enabled
        )

        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(self.SAMPLE_RATE)
            wav.writeframes(struct.pack(f'<{len(samples)}h', *samples))

        return buf.getvalue()

    def stream_audio_chunks(
        self,
        text: str,
        pitch_scale: float = 1.0,
        rate_scale: float = 1.0,
        profile: str = "JARVIS_FEMALE",
        sub_bass_enabled: bool = True,
        chunk_duration_ms: float = 150.0
    ) -> Generator[AudioChunk, None, None]:
        """
        Yields chunked audio packets with base64 encoded WAV frames and metadata.
        """
        import base64

        phonemes = self.text_to_phonemes(text)
        samples = self.synthesize_samples(
            phonemes=phonemes,
            pitch_scale=pitch_scale,
            rate_scale=rate_scale,
            profile=profile,
            sub_bass_enabled=sub_bass_enabled
        )

        chunk_sample_size = int((chunk_duration_ms / 1000.0) * self.SAMPLE_RATE)
        total_samples = len(samples)

        if total_samples == 0:
            return

        chunk_idx = 0
        offset = 0

        while offset < total_samples:
            end = min(offset + chunk_sample_size, total_samples)
            slice_samples = samples[offset:end]
            is_last = (end >= total_samples)

            # Build standalone WAV slice for this chunk
            buf = io.BytesIO()
            with wave.open(buf, 'wb') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(self.SAMPLE_RATE)
                wav.writeframes(struct.pack(f'<{len(slice_samples)}h', *slice_samples))

            wav_data = buf.getvalue()
            b64_data = base64.b64encode(wav_data).decode('ascii')
            dur = (len(slice_samples) / self.SAMPLE_RATE) * 1000.0

            yield AudioChunk(
                chunk_index=chunk_idx,
                is_last=is_last,
                audio_bytes=wav_data,
                audio_base64=b64_data,
                duration_ms=dur,
                sample_rate=self.SAMPLE_RATE,
                phonemes=[p.symbol for p in phonemes[max(0, chunk_idx*2):min(len(phonemes), (chunk_idx+1)*2)]]
            )

            chunk_idx += 1
            offset = end
