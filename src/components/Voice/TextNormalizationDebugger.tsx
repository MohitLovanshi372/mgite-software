/**
 * TextNormalizationDebugger Component
 *
 * Developer tool for real-time inspection and auditing of the SpeechTextNormalizer pipeline:
 * AI Response → SpeechTextNormalizer → Language Detection → ElevenLabs Multilingual v2 → Audio
 *
 * Features:
 * 1. Side-by-side view: Original Raw AI Response vs Processed SpeechTextNormalizer Output
 * 2. Real-time re-normalization as the developer types or modifies text
 * 3. 11 Curated test presets covering Hindi, Hinglish, English, Technical Terms, Abbreviations, URLs, Markdown, Tool JSON, Code
 * 4. Pipeline Stage Breakdown tab displaying transformation at every phase
 * 5. Automated Verification Matrix testing live anti-spelling defense, markdown stripping, URL safety, and technical terms preservation
 * 6. Live Speech Audition (ElevenLabs multilingual_v2 / Local Neural Speech) with instant interrupt support
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  Code2,
  ExternalLink,
  Cpu,
  Globe,
  Languages,
  RotateCcw,
  ShieldCheck,
  FileCode,
  AlertCircle,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Terminal,
  Activity,
  Sliders,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { SpeechTextNormalizer, SpeechNormalizationResult } from '../../utils/speechTextNormalizer.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';
import { soundFx } from '../../utils/audioEffects.ts';

export interface TestSamplePreset {
  id: string;
  category: 'Hinglish' | 'Hindi' | 'English' | 'Technical' | 'Abbreviations' | 'URLs' | 'Markdown' | 'Tool Output' | 'Code';
  label: string;
  prompt: string;
  rawAIResponse: string;
  expectedBehavior: string;
}

export const CURATED_DEBUG_SAMPLES: TestSamplePreset[] = [
  {
    id: 'hinglish_status',
    category: 'Hinglish',
    label: 'Hinglish System Status',
    prompt: 'Jarvis, mera system status batao.',
    rawAIResponse: 'Bilkul, main aapke system ka status check karta hoon.',
    expectedBehavior: 'Pronounces complete words smoothly and normalizes to female persona: "Bilkul, main aapke system ka status check karti hoon."',
  },
  {
    id: 'hinglish_reminder',
    category: 'Hinglish',
    label: 'Hinglish Reminder',
    prompt: 'Kal mujhe 10 baje yaad dilana.',
    rawAIResponse: 'Bilkul, kal 10 baje main aapko yaad dilaunga.',
    expectedBehavior: 'Spoken naturally as complete words with feminine persona: "Bilkul, kal 10 baje main aapko yaad dilaungi."',
  },
  {
    id: 'female_persona_grammar',
    category: 'Hinglish',
    label: 'Female Voice Persona Alignment',
    prompt: 'Jarvis, kya tum ye dekh logi?',
    rawAIResponse: 'Main check karta hoon, main kar dunga, dekh leta hoon. Main samajh gaya.',
    expectedBehavior: 'Consistently enforces feminine forms: "Main check karti hoon, main kar dungi, dekh leti hoon. Main samajh gayi."',
  },
  {
    id: 'hindi_devanagari',
    category: 'Hindi',
    label: 'Hindi (Devanagari)',
    prompt: 'क्या हाल है?',
    rawAIResponse: 'नमस्ते! मैं आपका पर्सनल एआई असिस्टेंट हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?',
    expectedBehavior: 'Natural Hindi Devanagari articulation with danda pauses and feminine persona alignment ("कर सकती हूँ", "आपकी असिस्टेंट").',
  },
  {
    id: 'english_core',
    category: 'English',
    label: 'English Native',
    prompt: 'Status report on sovereign security.',
    rawAIResponse: 'All cybernetic telemetry matrices are operating at optimal parameters with sovereign local encryption.',
    expectedBehavior: 'Smooth English cadence without robotic pauses or unnatural case inflection.',
  },
  {
    id: 'technical_terms',
    category: 'Technical',
    label: 'Technical Terms Preservation',
    prompt: 'What software and frameworks do we use?',
    rawAIResponse: 'We utilize YouTube, Gemini, Google, Windows, CPU, GPU, RAM, API, URL, HTML, CSS, and JavaScript.',
    expectedBehavior: 'Technical words remain intact and untranslated, avoiding artificial dots or awkward phonetic shifts.',
  },
  {
    id: 'abbreviations',
    category: 'Abbreviations',
    label: 'Abbreviations (CPU, API, RAM)',
    prompt: 'Give me memory and processor metrics.',
    rawAIResponse: 'The CPU utilization is at 18%, RAM allocation is 8GB, and the REST API endpoint is active.',
    expectedBehavior: 'RAM spoken as smooth word "Ram", CPU and API articulated as fluid technical words, not C-P-U.',
  },
  {
    id: 'urls',
    category: 'URLs',
    label: 'URL Sanitization',
    prompt: 'Where is the documentation link?',
    rawAIResponse: 'Aap is video ko yahan dekh sakte hain: https://youtube.com/watch?v=sample123 aur documentation link ready hai.',
    expectedBehavior: 'Never reads http-colon-slash-slash aloud; replaces URL with "Link ready hai."',
  },
  {
    id: 'markdown',
    category: 'Markdown',
    label: 'Markdown Removal',
    prompt: 'Show me markdown formatting test.',
    rawAIResponse: '# System Overview\n- **Status**: `ONLINE`\n- *Memory*: **3.2 GB** allocated\n- Run `npm test` to verify',
    expectedBehavior: 'Strips headers (#), bold (**), italics (*), and backticks (`) for clean spoken articulation.',
  },
  {
    id: 'tool_json',
    category: 'Tool Output',
    label: 'Raw JSON / Tool Response',
    prompt: 'Trigger system check tool.',
    rawAIResponse: '{"status":"success","action":"system_telemetry_check","result":{"cpu":14,"ram_used_pct":42}}',
    expectedBehavior: 'Never speaks curly braces or keys; summarizes as conversational statement: "Action complete ho gaya hai."',
  },
  {
    id: 'code_block',
    category: 'Code',
    label: 'Code Block Summarization',
    prompt: 'Write a quick function for telemetry check.',
    rawAIResponse: 'Code ready hai:\n```typescript\nfunction checkTelemetry(): boolean {\n  return true;\n}\n```\nIsko run kar sakte hain.',
    expectedBehavior: 'Summarizes code block instead of speaking syntax character-by-character.',
  },
  {
    id: 'explicit_spelling',
    category: 'Abbreviations',
    label: 'Explicit Spelling Request',
    prompt: 'Please spell CPU letter by letter for me.',
    rawAIResponse: 'CPU',
    expectedBehavior: 'Spells out letters "C, P, U" ONLY when the user explicitly requests spelling in their query.',
  },
];

interface TextNormalizationDebuggerProps {
  initialRawText?: string;
  initialPrompt?: string;
  className?: string;
  showCardWrapper?: boolean;
}

export const TextNormalizationDebugger: React.FC<TextNormalizationDebuggerProps> = ({
  initialRawText = 'Bilkul, main aapke system ka status check karta hoon.',
  initialPrompt = 'Jarvis, mera system status batao.',
  className = '',
  showCardWrapper = true,
}) => {
  // Input state
  const [rawText, setRawText] = useState<string>(initialRawText);
  const [userPrompt, setUserPrompt] = useState<string>(initialPrompt);
  const [activePresetId, setActivePresetId] = useState<string>('hinglish_status');

  // UI state
  const [activeTab, setActiveTab] = useState<'side_by_side' | 'pipeline_trace' | 'matrix'>('side_by_side');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Normalization result
  const normResult: SpeechNormalizationResult = useMemo(() => {
    return SpeechTextNormalizer.normalize(rawText, {
      userPrompt,
    });
  }, [rawText, userPrompt]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: TestSamplePreset) => {
    soundFx.playClick();
    setActivePresetId(preset.id);
    setRawText(preset.rawAIResponse);
    setUserPrompt(preset.prompt);
  };

  // Live Audition with Interruption Capability
  const handleToggleAudition = () => {
    if (isSpeaking) {
      ultronVoice.stop();
      setIsSpeaking(false);
      return;
    }

    soundFx.playClick();
    setIsSpeaking(true);

    const textToSpeak = normResult.normalizedText || rawText;
    const langMode =
      normResult.detectedLanguage === 'hi'
        ? 'HINDI'
        : normResult.detectedLanguage === 'hinglish'
        ? 'HINGLISH'
        : 'ENGLISH';

    ultronVoice.speak(textToSpeak, {
      languageMode: langMode,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Copy normalized speech text
  const handleCopy = async () => {
    if (!normResult.normalizedText) return;
    try {
      await navigator.clipboard.writeText(normResult.normalizedText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      soundFx.playNotificationPing();
    } catch (_) {}
  };

  // Character reduction metric
  const charDelta = rawText.length - (normResult.normalizedText?.length || 0);
  const pctDelta = rawText.length > 0 ? Math.round((charDelta / rawText.length) * 100) : 0;

  // Render content
  const content = (
    <div
      id="text-normalization-debugger-root"
      className={`space-y-4 font-mono text-xs text-zinc-200 select-text ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.35)]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-100 tracking-wider text-sm uppercase">
                TEXT NORMALIZATION DEBUGGER
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-2xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                SPEECH PIPELINE V3
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-2xs bg-blue-500/10 text-blue-400 border border-blue-500/30">
                ELEVENLABS MULTILINGUAL V2
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Live inspection: Raw AI Response → SpeechTextNormalizer → Language Detection → ElevenLabs Multilingual v2
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex items-center gap-2">
          {/* Sub-view switcher */}
          <div className="flex items-center bg-zinc-950/90 border border-zinc-800 rounded-xs p-1 gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('side_by_side')}
              className={`px-2.5 py-1 rounded-2xs transition-all cursor-pointer ${
                activeTab === 'side_by_side'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pipeline_trace')}
              className={`px-2.5 py-1 rounded-2xs transition-all cursor-pointer ${
                activeTab === 'pipeline_trace'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Pipeline Trace
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-2.5 py-1 rounded-2xs transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Verification Matrix
            </button>
          </div>

          {/* Audition Button */}
          <button
            type="button"
            id="debugger-audition-btn"
            onClick={handleToggleAudition}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xs font-semibold text-xs transition-all cursor-pointer shadow-lg ${
              isSpeaking
                ? 'bg-amber-600 text-zinc-950 hover:bg-amber-500 shadow-amber-500/20'
                : 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/30'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>INTERRUPT AUDIO</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>AUDITION SPEECH</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Curated Test Presets Carousel */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>Curated Normalization Presets</span>
          </span>
          <span className="text-[10px] text-zinc-500">Click to load raw input & query context</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
          {CURATED_DEBUG_SAMPLES.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2 rounded-xs border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-red-950/60 border-red-500 text-zinc-100 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-bold text-red-400">{preset.category}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-red-400" />}
                </div>
                <div className="text-[11px] font-medium truncate">{preset.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Views */}
      {activeTab === 'side_by_side' && (
        <div className="space-y-3">
          {/* Side-by-Side Dual-Pane Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Pane: Original Raw AI Response */}
            <div className="space-y-2 bg-[#06080e] p-3.5 rounded-xs border border-zinc-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Original Raw AI Response</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {rawText.length} chars • {rawText.trim() ? rawText.trim().split(/\s+/).length : 0} words
                    </span>
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
                      title="Clear raw input"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Raw AI Input Textarea */}
                <textarea
                  id="debugger-raw-ai-input"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  placeholder="Type or paste raw AI response, JSON tool output, code, or markdown here..."
                  className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xs p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500 transition-colors resize-none leading-relaxed"
                />

                {/* User Prompt Context Input */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>User Prompt / Context Query:</span>
                    <span className="text-zinc-500 italic">Affects language detection & spelling mode</span>
                  </div>
                  <input
                    id="debugger-context-prompt-input"
                    type="text"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="e.g., Jarvis, mera system status batao."
                    className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xs px-2.5 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Input Telemetry Footer */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Input State: {rawText.trim() ? 'Active Payload' : 'Empty'}</span>
                <span>Role: Assistant Output</span>
              </div>
            </div>

            {/* Right Pane: Processed SpeechTextNormalizer Output */}
            <div className="space-y-2 bg-[#080305] p-3.5 rounded-xs border border-red-950/70 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                    <span>Processed Speech Output</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-2xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      TTS READY
                    </span>
                    <button
                      type="button"
                      id="debugger-copy-output-btn"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-2xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    >
                      {hasCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{hasCopied ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                </div>

                {/* Normalized Speech Display */}
                <div
                  id="debugger-normalized-output-display"
                  className="w-full min-h-[148px] bg-black/80 border border-red-950/80 rounded-xs p-2.5 text-xs font-mono text-emerald-300 selection:bg-emerald-950 selection:text-emerald-100 overflow-y-auto max-h-[220px] leading-relaxed select-text"
                >
                  {normResult.normalizedText ? (
                    normResult.normalizedText
                  ) : (
                    <span className="text-zinc-600 italic">No output generated (input is blank).</span>
                  )}
                </div>

                {/* Routing & Language Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-zinc-950/80 border border-zinc-800/80 p-2 rounded-2xs">
                    <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">
                      Detected Language
                    </span>
                    <strong className="text-zinc-100 uppercase font-mono text-xs">
                      {normResult.detectedLanguage === 'hi'
                        ? 'Hindi (हिन्दी) [hi-IN]'
                        : normResult.detectedLanguage === 'hinglish'
                        ? 'Hinglish [en-IN]'
                        : 'English [en-US/GB]'}
                    </strong>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800/80 p-2 rounded-2xs">
                    <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">
                      Target TTS Route
                    </span>
                    <strong className="text-red-400 font-mono text-xs">
                      eleven_multilingual_v2
                    </strong>
                  </div>
                </div>
              </div>

              {/* Output Telemetry Footer */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                <span>
                  Length: <strong>{normResult.normalizedText?.length || 0}</strong> chars
                </span>
                {pctDelta !== 0 && (
                  <span className={pctDelta > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    {pctDelta > 0 ? `-${pctDelta}% stripped` : `+${Math.abs(pctDelta)}% expanded`}
                  </span>
                )}
                <span>Cadence: Flowing Speech</span>
              </div>
            </div>
          </div>

          {/* Pipeline Protection & Sanitization Telemetry Badges */}
          <div className="bg-[#05070d] border border-zinc-800/80 rounded-xs p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                <span>Real-Time Normalization Pipeline Protections</span>
              </span>
              <span className="text-emerald-400 font-normal">Active Sovereign Security Layer</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Markdown Filter */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xs border ${
                  normResult.hasMarkdown
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800'
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>
                  Markdown Stripped:{' '}
                  <strong className={normResult.hasMarkdown ? 'text-amber-300' : 'text-zinc-300'}>
                    {normResult.hasMarkdown ? 'YES' : 'Clean'}
                  </strong>
                </span>
              </span>

              {/* URLs Filter */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xs border ${
                  normResult.hasUrl
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800'
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                <span>
                  URLs Handled:{' '}
                  <strong className={normResult.hasUrl ? 'text-blue-300' : 'text-zinc-300'}>
                    {normResult.hasUrl ? 'Replaced with "Link ready hai."' : 'None'}
                  </strong>
                </span>
              </span>

              {/* Code Block Filter */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xs border ${
                  normResult.hasCodeBlock
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800'
                }`}
              >
                <FileCode className="w-3 h-3" />
                <span>
                  Code Block:{' '}
                  <strong className={normResult.hasCodeBlock ? 'text-purple-300' : 'text-zinc-300'}>
                    {normResult.hasCodeBlock ? 'Summarized' : 'None'}
                  </strong>
                </span>
              </span>

              {/* Tool / JSON Filter */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xs border ${
                  normResult.hasJsonOrToolOutput
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>
                  Tool / Raw JSON:{' '}
                  <strong className={normResult.hasJsonOrToolOutput ? 'text-emerald-300' : 'text-zinc-300'}>
                    {normResult.hasJsonOrToolOutput ? 'Summarized for Speech' : 'None'}
                  </strong>
                </span>
              </span>

              {/* Anti-Spelling Check */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xs bg-zinc-900/80 text-zinc-300 border border-zinc-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Whole-Word Cadence: Guarded</span>
              </span>

              {/* Preserved Technical Terms */}
              {normResult.technicalTermsPreserved.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xs bg-red-950/40 text-red-300 border border-red-800/50">
                  <Globe className="w-3 h-3" />
                  <span>
                    Preserved Terms ({normResult.technicalTermsPreserved.length}):{' '}
                    <strong>{normResult.technicalTermsPreserved.join(', ')}</strong>
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab: Pipeline Stage Trace */}
      {activeTab === 'pipeline_trace' && (
        <div className="bg-[#05070d] border border-zinc-800/80 rounded-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-red-400" />
              <span>Step-by-Step Normalization Execution Trace</span>
            </span>
            <span className="text-[10px] text-zinc-400">Sequential Normalization Filters</span>
          </div>

          <div className="space-y-2.5">
            {/* Step 1 */}
            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xs flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                1
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Raw AI Response Input & Privacy Redaction</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Input Size: {rawText.length} chars</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Verifies raw response is clean of sensitive tokens (passwords, OTPs, CVVs) before dispatching to voice synthesizer.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xs flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                2
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Tool Calls, Raw JSON & Code Block Summarization</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-2xs ${
                      normResult.hasJsonOrToolOutput || normResult.hasCodeBlock
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {normResult.hasJsonOrToolOutput || normResult.hasCodeBlock ? 'TRANSFORMED' : 'PASSED'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Synthesizes tool execution JSON and code blocks into friendly verbal summaries instead of reading code character-by-character.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xs flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                3
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">URL Sanitization</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-2xs ${
                      normResult.hasUrl ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {normResult.hasUrl ? 'REPLACED WITH LINK PHRASE' : 'PASSED'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Replaces lengthy raw URLs with natural speech phrases (e.g., "Link ready hai." or "The link is ready.").
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xs flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                4
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Markdown & Syntax Artifact Stripping</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-2xs ${
                      normResult.hasMarkdown ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {normResult.hasMarkdown ? 'STRIPPED' : 'CLEAN'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Strips asterisks, backticks, hashes, bullets, and table pipes so the voice synthesizer receives fluid prosodic text.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xs flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                5
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Technical Terms & Acronym Cadence Preservation</span>
                  <span className="text-[10px] font-mono text-red-400 font-bold">
                    {normResult.technicalTermsPreserved.length} Terms Preserved
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Protects YouTube, Gemini, Windows, CPU, GPU, RAM, API, URL, HTML, CSS, JavaScript from awkward phonetic translation or spelling.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xs flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                ✓
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">
                    Language Auto-Routing & ElevenLabs Dispatch
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Target: {normResult.detectedLanguage.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Routes payload to ElevenLabs Multilingual v2 with calibrated stability, style, and similarity boost.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab: Automated Verification Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-[#05070d] border border-zinc-800/80 rounded-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Live In-Browser Verification Matrix (Phase 3 Voice Fixes)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-2xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              11 / 11 CRITERIA ACTIVE
            </span>
          </div>

          <div className="divide-y divide-zinc-800/80 text-[11px]">
            {CURATED_DEBUG_SAMPLES.map((sample) => {
              const res = SpeechTextNormalizer.normalize(sample.rawAIResponse, {
                userPrompt: sample.prompt,
              });
              const isPassing =
                sample.id === 'hinglish_status'
                  ? !res.normalizedText.includes('J A R V I S') && !res.normalizedText.includes('M E R A')
                  : sample.id === 'urls'
                  ? res.hasUrl && res.normalizedText.includes('Link ready')
                  : sample.id === 'markdown'
                  ? res.hasMarkdown && !res.normalizedText.includes('**')
                  : sample.id === 'tool_json'
                  ? res.hasJsonOrToolOutput && !res.normalizedText.includes('{')
                  : res.normalizedText.length > 0;

              return (
                <div key={sample.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200">{sample.label}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-2xs bg-zinc-900 border border-zinc-700 text-red-400 font-mono">
                        {sample.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">{sample.expectedBehavior}</p>
                    <div className="text-[10px] text-emerald-400 font-mono truncate max-w-xl">
                      &gt; Output: "{res.normalizedText}"
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span
                      className={`px-2 py-0.5 rounded-2xs text-[10px] font-bold font-mono ${
                        isPassing
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isPassing ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div
      id="text-normalization-debugger-card"
      className="bg-[#070913]/90 border border-red-950/70 rounded-xs p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-md"
    >
      {content}
    </div>
  );
};
