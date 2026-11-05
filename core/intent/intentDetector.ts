/**
 * Intent Detection Engine (Phase 2 - Step 6)
 *
 * Multilingual (English, Hindi, Hinglish), context-aware, deterministic intent classifier.
 *
 * Architectural Directives:
 * - Intent detection is strictly for understanding.
 * - It MUST NOT automatically execute actions or tools.
 * - Deterministic, local-first classification for zero latency and privacy safety.
 * - Privacy rules always precede intent handling.
 */

import {
  IntentType,
  IntentResult,
  ResponseStrategy,
  RiskLevel,
} from './types.ts';
import { EntityExtractor } from './entityExtractor.ts';
import { RiskClassifier } from './riskClassifier.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';
import { logger } from '../logger.ts';

export interface IntentDetectionOptions {
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  isOfflineMode?: boolean;
}

export class IntentDetector {
  /**
   * Main intent detection entry point.
   */
  public static detectIntent(
    rawText: string,
    options?: IntentDetectionOptions
  ): IntentResult {
    const text = (rawText || '').trim();
    const lower = text.toLowerCase();

    // 1. First: Privacy Check (Local, deterministic)
    const privacy = PrivacyFilter.filterInput(text);
    const textContainsSecret = /(password|passcode|secret\s*key|cvv|pin|otp|token)\b/i.test(lower);
    const hasSensitiveData = privacy.hadSensitiveData || privacy.action === 'BLOCK' || textContainsSecret;
    const isOtpOrSecret =
      privacy.classification === 'OTP' ||
      privacy.classification === 'CREDENTIAL' ||
      privacy.classification === 'FINANCIAL' ||
      privacy.classification === 'SECURITY_CODE' ||
      textContainsSecret;

    // Extract recent user context snippet if available
    let contextSnippet: string | undefined;
    if (options?.history && options.history.length > 0) {
      const recentTurns = options.history.slice(-3);
      contextSnippet = recentTurns.map((t) => t.content).join(' | ');
    }

    // 2. Classify raw intent type deterministically
    const classification = this.classifyPattern(text, lower, contextSnippet);

    // 3. Extract lightweight entities tailored to the intent & context
    const entities = EntityExtractor.extract(text, classification.intent, contextSnippet);

    // 4. Classify Risk Level
    const risk = RiskClassifier.classify(classification.intent, text, entities);

    // 5. Determine Response Strategy & Clarification
    let strategy: ResponseStrategy = 'DIRECT_ANSWER';
    let clarificationQuestion: string | undefined;

    if (isOtpOrSecret || (classification.intent === 'MEMORY_REQUEST' && hasSensitiveData)) {
      strategy = 'REFUSE_UNSAFE_ACTION';
      logger.info('IntentDetector', 'Strategy: REFUSE_UNSAFE_ACTION due to sensitive credentials');
    } else if (classification.intent === 'UNKNOWN' || classification.isAmbiguous) {
      strategy = 'ASK_CLARIFICATION';
      clarificationQuestion = classification.clarificationPrompt || 'Kal kya karna hai? Kripya thoda detail batayein.';
    } else if (risk.riskLevel === 'HIGH') {
      strategy = 'REQUEST_CONFIRMATION';
    } else if (
      classification.intent === 'REMINDER_REQUEST' ||
      classification.intent === 'COMPUTER_ACTION_REQUEST' ||
      classification.intent === 'TASK_REQUEST' ||
      classification.intent === 'DOCUMENT_REQUEST'
    ) {
      // Intent requires tool in future phases, but tools are NOT executed in Phase 2
      strategy = 'EXECUTE_TOOL_LATER';
    } else {
      strategy = 'DIRECT_ANSWER';
    }

    const isYouTubeOrMusic =
      classification.intent === 'open_youtube' ||
      classification.intent === 'search_youtube' ||
      classification.intent === 'play_music' ||
      classification.intent === 'stop_music';

    return {
      intent: classification.intent,
      confidence: classification.confidence,
      entities,
      requiresAction:
        isYouTubeOrMusic ||
        classification.intent === 'REMINDER_REQUEST' ||
        classification.intent === 'COMPUTER_ACTION_REQUEST' ||
        classification.intent === 'TASK_REQUEST' ||
        classification.intent === 'SETTINGS_REQUEST',
      riskLevel: risk.riskLevel,
      responseStrategy: strategy,
      clarificationQuestion,
      reasoning: classification.reasoning || risk.reason,
      rawInput: text,
      query: entities.query,
    };
  }

  /**
   * Deterministic pattern matcher supporting English, Hindi, and Hinglish.
   */
  private static classifyPattern(
    text: string,
    lower: string,
    contextSnippet?: string
  ): {
    intent: IntentType;
    confidence: number;
    isAmbiguous?: boolean;
    clarificationPrompt?: string;
    reasoning?: string;
  } {
    // Strip leading wake words ("jarvis, ", "hey jarvis, ", "जार्विस, ") for clean command recognition
    const strippedLower = lower.replace(/^(hey\s+)?(jarvis|ultron|जार्विस)[\s,:;—-]+/i, '').trim();
    const target = strippedLower || lower;

    // A. Ambiguous expressions needing clarification (e.g., "kal wala kar dena", "vo kaam kar do")
    if (
      /^(kal\s+wala\s+kar\s+dena|vo\s+kar\s+dena|uska\s+kuch\s+karo|do\s+that\s+thing|kal\s+wala|kal\s+ka\s+kar\s+do)$/i.test(
        target
      )
    ) {
      return {
        intent: 'UNKNOWN',
        confidence: 0.4,
        isAmbiguous: true,
        clarificationPrompt: 'Kal kya karna hai? Kripya thoda detail batayein.',
        reasoning: 'Incomplete reference without specific task or parameters',
      };
    }

    // B. MEMORY REQUEST ("meri ye baat yaad rakhna", "remember that...", "yaad rakhna ki...", "bhool jao")
    if (
      /(yaad\s+rakhna|yaad\s+rakho|remember\s+that|remember\s+this|store\s+this|save\s+to\s+memory|bhool\s+jao|delete\s+memory|forget\s+that)/i.test(
        target
      )
    ) {
      return {
        intent: 'MEMORY_REQUEST',
        confidence: 0.95,
        reasoning: 'Explicit memory persistence/deletion command detected',
      };
    }

    // C. REMINDER REQUEST ("kal mujhe 10 baje yaad dila dena", "subah 8 baje yaad dila dena", "remind me to...", "alarm lagao", "reminder laga dena")
    if (
      /(yaad\s+dila\s+dena|yaad\s+dilana|yaad\s+dila|remind\s+me|reminder\s*(laga|set|kar|banao|add|create|dena)|\breminder\b|alarm\s*(lagao|set))/i.test(
        target
      )
    ) {
      return {
        intent: 'REMINDER_REQUEST',
        confidence: 0.94,
        reasoning: 'Explicit reminder or alarm trigger pattern matched',
      };
    }

    // Contextual reminder: User said "Kal college hai" then "Subah 8 baje yaad dila dena"
    if (
      /(yaad\s+dila|remind)/i.test(target) &&
      contextSnippet &&
      /(college|office|meeting|class|flight)/i.test(contextSnippet)
    ) {
      return {
        intent: 'REMINDER_REQUEST',
        confidence: 0.96,
        reasoning: 'Context-linked reminder request resolved with previous turn context',
      };
    }

    // H1. SYSTEM STATUS REQUEST (Placed before generic action commands so "system status dikhao" is precisely classified)
    // Matches "Jarvis, system status dikhao", "status dikhao", "system status", "battery kitni hai", "सिस्टम स्टेटस दिखाओ"
    if (
      /(system\s+status|status\s*(dikhao|batao|bataiye|check|karo|bata|kya\s+hai)|system\s*(check|status|vitals|health)|battery|cpu\s+usage|ram\s+usage|disk\s+space|battery\s+kitni\s+hai|सिस्टम\s*स्टेटस|स्टेटस\s*(दिखाओ|बताओ))/i.test(
        target
      )
    ) {
      return {
        intent: 'SYSTEM_STATUS_REQUEST',
        confidence: 0.95,
        reasoning: 'System status, telemetry, or device vitals inspection command',
      };
    }

    // H1. CHANGE VIDEO / NEXT SONG ("change video", "next video", "dusra video chalao", "next song", "agla gana")
    if (
      /(change\s*video|next\s*video|video\s*change|dusra\s*video|agla\s*video|video\s*badlo|next\s*song|agla\s*gana|dusra\s*gana|previous\s*video|pichla\s*video|अगला\s*वीडियो|दूसरा\s*वीडियो)/i.test(
        target
      )
    ) {
      return {
        intent: 'change_video',
        confidence: 0.98,
        reasoning: 'Video or song track change request',
      };
    }

    // H1.1 DOWNLOAD MEDIA ("download video", "download song", "video download karo", "gana download karo", "download audio")
    if (
      /(download\s*(video|audio|music|song|mp4|mp3|gana)|video\s*download|gana\s*download|song\s*download|डाउनलोड)/i.test(
        target
      )
    ) {
      return {
        intent: 'download_media',
        confidence: 0.98,
        reasoning: 'Media video or audio download request',
      };
    }

    // H1.2 AVATAR EMOTE CONTROL ("avatar smile", "smile karo", "happy emote", "avatar think", "avatar socho", "avatar nod")
    if (
      /(avatar\s*(smile|think|socho|nod|wave|serious|excited|confused|normal|hanso|hans)|smile\s*karo|happy\s*emote|thinking\s*emote|avatar\s*socho|nod\s*karo|wave\s*karo)/i.test(
        target
      )
    ) {
      return {
        intent: 'avatar_emote',
        confidence: 0.98,
        reasoning: 'Avatar emotion/emote control directive',
      };
    }

    // H2. STOP MUSIC ("Jarvis, stop music", "Jarvis, music band karo", "music roko", "gana band karo")
    if (
      /(stop\s+music|pause\s+music|stop\s+song|pause\s+song|stop\s+playing|music\s*(band|roko|pause|stop)|gana\s*(band|roko)|gaana\s*(band|roko)|song\s*(band|roko)|म्यूजिक\s*बंद|गाना\s*बंद)/i.test(
        target
      )
    ) {
      return {
        intent: 'stop_music',
        confidence: 0.98,
        reasoning: 'Music playback cessation directive',
      };
    }

    // H3. OPEN YOUTUBE ("Jarvis, open YouTube", "Jarvis, YouTube kholo", "open yt")
    if (
      /(open\s+youtube|youtube\s*(kholo|open|launch)|launch\s+youtube|open\s+yt|yt\s*kholo|यूट्यूब\s*(खोलो|ओपन))/i.test(
        target
      ) &&
      !/(search|play|dhundho|dhundo|songs?|gana|gaana|music|track|ke\s+songs?|video)/i.test(target)
    ) {
      return {
        intent: 'open_youtube',
        confidence: 0.98,
        reasoning: 'Direct YouTube browser launch directive',
      };
    }

    // H4. SEARCH YOUTUBE & PLAY MUSIC
    // ("Jarvis, play Arijit Singh music", "Arijit Singh ke songs chalao", "search relaxing music on YouTube", "play Believer", "play music", "music chalao")
    const isMusicOrYtCommand =
      (/(youtube|music|song|songs|gana|gaana|track|audio|believer|arijit|spotify|संगीत|गाना)/i.test(target) &&
        /(play|search|chalao|chala|bajao|baja|shuru|kholo|dhundho)/i.test(target)) ||
      /(ke\s+songs?\s+(chalao|bajao|play))/i.test(target) ||
      /^play\s+[a-z0-9]/i.test(target) ||
      /^(music|gana|gaana)\s+(chalao|bajao|shuru)/i.test(target);

    if (isMusicOrYtCommand) {
      const isGenericMusic =
        /^(play\s+music|music\s+chalao|gana\s+chalao|gaana\s+chalao|play\s+songs?|songs?\s+chalao|music\s+play\s+karo|music\s+shuru\s+karo|गाना\s*चलाओ|संगीत\s*चलाओ)$/i.test(
          target.trim()
        );

      if (isGenericMusic) {
        return {
          intent: 'play_music',
          confidence: 0.96,
          reasoning: 'Generic music playback request without specific artist or song query',
        };
      } else {
        return {
          intent: 'search_youtube',
          confidence: 0.96,
          reasoning: 'Specific music or video search query on YouTube',
        };
      }
    }

    // D. COMPUTER ACTION REQUEST ("Jarvis, light chalao", "light on karo", "youtube kholo", "open chrome", "paise transfer kar do", "turn on wifi")
    if (
      /(kholo|open\s+|chalao|play\s+|turn\s+on|turn\s+off|band\s+karo|volume\s+|screenshot|transfer\s+money|paise\s+transfer|send\s+money|powershell|terminal|bash|shell|command|rm\s+-rf|shutdown|reboot|run\s+|light\s*(chalao|jalao|on|off|band|chala|dim)|lights?\s*(on|off)|लाइट\s*(चलाओ|जलाओ|ऑन|बंद|ऑफ))/i.test(
        target
      ) &&
      !/(weather|mausam|news|settings)/i.test(target)
    ) {
      return {
        intent: 'COMPUTER_ACTION_REQUEST',
        confidence: 0.92,
        reasoning: 'Device control, lighting trigger, playback, or system action directive',
      };
    }

    // E. DOCUMENT REQUEST ("pdf summary banao", "read this doc", "is document ko explain karo")
    if (
      /(pdf|document|docx?|report|resume|file)\s*(padho|summarize|read|explain|kholo|review)/i.test(
        lower
      ) ||
      /(summarize\s+this|document\s+padho)/i.test(lower)
    ) {
      return {
        intent: 'DOCUMENT_REQUEST',
        confidence: 0.92,
        reasoning: 'Document reading, parsing, or summarization request',
      };
    }

    // F. NOTIFICATION REQUEST ("kiske messages aaye hain", "notifications check karo", "koi naya notification hai")
    if (
      /(notifications?\s+check|read\s+notifications?|kiske\s+message|koi\s+notification|check\s+messages|unread\s+messages)/i.test(
        lower
      )
    ) {
      return {
        intent: 'NOTIFICATION_REQUEST',
        confidence: 0.91,
        reasoning: 'Notification inbox query or status inspection',
      };
    }

    // G. SETTINGS REQUEST ("theme change karo", "settings kholo", "open settings", "dark mode enable karo")
    if (
      /(settings?\s+kholo|open\s+settings?|change\s+theme|dark\s+mode|light\s+mode|change\s+language|bhasha\s+badlo|offline\s+mode\s+on)/i.test(
        target
      )
    ) {
      return {
        intent: 'SETTINGS_REQUEST',
        confidence: 0.93,
        reasoning: 'Client or system configuration modification request',
      };
    }

    // I. TASK REQUEST ("todo list mein add karo", "create a task", "ye task banao", "add to my tasks")
    if (
      /(todo\s+list|add\s+task|task\s+banao|task\s+add|task\s+mein\s+daal)/i.test(
        target
      )
    ) {
      return {
        intent: 'TASK_REQUEST',
        confidence: 0.91,
        reasoning: 'Explicit task creation or todo list management',
      };
    }

    // J. INFORMATION REQUEST ("bhai weather kya hai?", "mausam kaisa hai", "aaj ka temperature", "news kya hai")
    if (
      /(weather|mausam|temperature|baarish|rain|forecast|latest\s+news|samachar|stock\s+price|crypto\s+price)/i.test(
        target
      )
    ) {
      return {
        intent: 'INFORMATION_REQUEST',
        confidence: 0.95,
        reasoning: 'Environmental, news, or external knowledge data request',
      };
    }

    // K. CHAT ("hello", "hi", "hello, how are you today?", "bas baat karo", "kya chal raha hai", "how are you", "aur batao", "good morning")
    const cleanPunctuation = lower.replace(/[?!.,]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (
      /^(hello|hi|hey|namaste|pranam|good\s+morning|good\s+evening|good\s+night|how\s+are\s+you(\s+today)?|kya\s+haal\s+hai|kya\s+chal\s+raha\s+hai|aur\s+batao|bas\s+baat\s+karo|baat\s+karo|kaise\s+ho|wassup|yo)(\s+bhai|\s+dost|\s+jarvis|\s+there|\s+buddy)?$/i.test(
        cleanPunctuation
      ) ||
      /(^|\b)(hello\s+how\s+are\s+you|how\s+are\s+you\s+today|bas\s+baat\s+karo|sirf\s+baatein\s+karo|let's\s+chat|just\s+chat)(\b|$)/i.test(
        cleanPunctuation
      )
    ) {
      return {
        intent: 'CHAT',
        confidence: 0.95,
        reasoning: 'Conversational greeting or social exchange',
      };
    }

    // L. QUESTION ("mera naam kya hai?", "what is quantum computing?", "who is the prime minister?", "kaise hota hai")
    if (
      /(\?|kya\s+hai|who\s+is|what\s+is|where\s+is|how\s+to|why\s+does|kaise\s+karein|kyun|kab|kisko|mera\s+naam)/i.test(
        lower
      )
    ) {
      return {
        intent: 'QUESTION',
        confidence: 0.88,
        reasoning: 'Informational or reasoning inquiry',
      };
    }

    // Default fallback
    if (text.length > 0) {
      return {
        intent: 'CHAT',
        confidence: 0.6,
        reasoning: 'Default conversational fallback',
      };
    }

    return {
      intent: 'UNKNOWN',
      confidence: 0.1,
      reasoning: 'Empty or unparseable input',
    };
  }
}
