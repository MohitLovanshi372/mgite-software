/**
 * Lightweight Entity Extractor (Phase 2 - Step 6)
 *
 * Extracts lightweight, intent-relevant entities across English, Hindi, and Hinglish.
 * Supports:
 * - Date & Time expressions ("kal", "subah 8 baje", "tomorrow at 5pm", "10 baje")
 * - Titles / Task names ("college", "doctor appointment", "grocery shopping")
 * - Applications ("youtube", "chrome", "spotify", "whatsapp", "browser")
 * - Persons ("rahul", "priya", "boss", "papa", "mummy")
 * - Locations ("delhi", "mumbai", "office", "college", "home")
 * - Search & Query subjects ("weather", "mausam", "news")
 * - Document references ("report.pdf", "notes.txt")
 * - Priority markers ("urgent", "zaruri", "critical")
 */

import { IntentEntities, IntentType } from './types.ts';

export class EntityExtractor {
  /**
   * Extracts entities tailored to the specified intent and context.
   */
  public static extract(
    text: string,
    intent: IntentType,
    contextSnippet?: string
  ): IntentEntities {
    const entities: IntentEntities = {};
    if (!text) return entities;

    const lower = text.toLowerCase();

    // 1. Priority extraction (relevant to tasks, reminders, notifications)
    if (/(urgent|emergency|critical|bohot zaruri|bahut zaroori|asap)/i.test(lower)) {
      entities.priority = 'CRITICAL';
    } else if (/(important|zaruri|zaroori|khas)/i.test(lower)) {
      entities.priority = 'IMPORTANT';
    }

    // 2. Date extraction (Hindi, Hinglish, English)
    if (/(kal raat|kal subah|kal shaam|kal dopahar|kal|tomorrow)/i.test(lower)) {
      entities.date = 'tomorrow';
    } else if (/(parso|day after tomorrow)/i.test(lower)) {
      entities.date = 'day_after_tomorrow';
    } else if (/(aaj raat|aaj shaam|aaj dopahar|aaj|today|tonight)/i.test(lower)) {
      entities.date = 'today';
    } else if (contextSnippet && /(kal|tomorrow)/i.test(contextSnippet)) {
      // Contextual inheritance if mentioned in prior turn
      entities.date = 'tomorrow';
    }

    // 3. Time extraction
    const timeMatch = lower.match(
      /(subah|shaam|dopahar|raat)?\s*(\d{1,2}(?::\d{2})?)\s*(baje|am|pm|o'clock)?/i
    );
    if (timeMatch && (timeMatch[1] || timeMatch[3] || lower.includes('baje'))) {
      const period = timeMatch[1] || '';
      const num = timeMatch[2];
      const ampm = timeMatch[3] || '';
      entities.time = `${period ? period + ' ' : ''}${num}${ampm ? ' ' + ampm : ' baje'}`.trim();
    } else {
      const standardTime = lower.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
      if (standardTime) {
        entities.time = standardTime[1].toUpperCase();
      }
    }

    // 4. App extraction (for COMPUTER_ACTION_REQUEST, NOTIFICATION_REQUEST)
    const appMatch = lower.match(/\b(youtube|chrome|google|spotify|whatsapp|browser|terminal|vscode|camera|calculator|maps|netflix|gmail)\b/i);
    if (appMatch) {
      entities.app = appMatch[1].toLowerCase();
    }

    // 5. Query / Information subject (for INFORMATION_REQUEST, QUESTION)
    if (intent === 'INFORMATION_REQUEST' || intent === 'QUESTION') {
      if (/(weather|mausam|temperature|baarish|rain)/i.test(lower)) {
        entities.query = 'weather';
      } else if (/(news|khabar|samachar)/i.test(lower)) {
        entities.query = 'news';
      } else if (/(stock|crypto|bitcoin|sensex|nifty)/i.test(lower)) {
        entities.query = 'finance';
      } else {
        const queryClean = text
          .replace(/^(bhai|kya|what is|tell me|who is|kahan hai|kaise)\s+/i, '')
          .replace(/[?.,!]+$/, '')
          .trim();
        if (queryClean.length > 2) {
          entities.query = queryClean;
        }
      }
    }

    // 5.1 YouTube & Music Search Query Extraction
    if (intent === 'search_youtube' || intent === 'play_music') {
      let q = text
        .replace(/^(hey\s+)?(jarvis|ultron|जार्विस)[,\s]*/i, '')
        .trim();

      // Remove YouTube search phrasing
      q = q.replace(/\b(search\s+on\s+youtube|search\s+youtube\s+for|on\s+youtube|in\s+youtube|youtube\s+par|youtube\s+pe)\b/gi, '').trim();

      // If generic "play music" or "music chalao"
      if (/^(play\s+music|music\s+chalao|gana\s+chalao|gaana\s+chalao|play\s+songs?|songs?\s+chalao|संगीत\s*चलाओ|गाना\s*चलाओ)$/i.test(q)) {
        entities.query = '';
      } else {
        // Strip leading play / search
        if (/^(play|search)\s+/i.test(q)) {
          q = q.replace(/^(play|search)\s+/i, '');
        }
        // Strip trailing verb forms
        q = q.replace(/\s+(chalao|chala\s+do|chala\s+dena|bajao|baja\s+do|shuru\s+karo|play\s+karo|laga\s+do|lagao)\b/gi, '');

        // Normalize Hindi/Hinglish "ke songs" / "ke gaane" to "songs" while preserving artist names
        q = q.replace(/\bke\s+(songs?|gaane|gana)\b/gi, 'songs');

        // Strip punctuation
        q = q.replace(/[?!.,;:"]+/g, '').trim();

        if (q.length > 0 && !/^(music|gana|gaana|song|songs)$/i.test(q)) {
          entities.query = q;
        }
      }
    }

    // 6. Location extraction
    const locationMatch = lower.match(/\b(delhi|mumbai|bangalore|pune|kolkata|chennai|hyderabad|college|office|ghar|home)\b/i);
    if (locationMatch) {
      entities.location = locationMatch[1];
    }

    // 7. Person extraction
    const personMatch = lower.match(/\b(rahul|priya|amit|rohit|boss|papa|mummy|mom|dad|sir|doctor)\b/i);
    if (personMatch) {
      entities.person = personMatch[1];
    }

    // 8. Document extraction
    const docMatch = lower.match(/([a-zA-Z0-9_\-.]+\.(?:pdf|docx?|txt|csv|xlsx?|json|md))/i);
    if (docMatch) {
      entities.document = docMatch[1];
    } else if (/(pdf|document|file|doc|report|resume)/i.test(lower)) {
      entities.document = 'unspecified_document';
    }

    // 9. Hardware & Device control extraction (light, sound, system)
    if (intent === 'COMPUTER_ACTION_REQUEST') {
      if (/(light|lights|roshni|batti|लाइट)/i.test(lower)) {
        entities.device = 'light';
        entities.action = /(band|off|bujhao|bujha|बंद|ऑफ)/i.test(lower) ? 'turn_off' : 'turn_on';
      }
    }

    // 10. System status target
    if (intent === 'SYSTEM_STATUS_REQUEST') {
      entities.target = 'system_status';
    }

    // 11. Title / Subject extraction (for REMINDER_REQUEST, TASK_REQUEST, COMPUTER_ACTION_REQUEST)
    if (intent === 'REMINDER_REQUEST' || intent === 'TASK_REQUEST') {
      // Clean typical command boilerplate: "kal mujhe 10 baje yaad dila dena", "subah 8 baje yaad dila dena"
      let cleanSubject = text
        .replace(/(kal|parso|aaj|today|tomorrow|subah|shaam|dopahar|raat|\d{1,2}(?::\d{2})?\s*(?:baje|am|pm)?)/gi, '')
        .replace(/(mujhe|mujhko|ko|ka|ke liye|yaad dila dena|yaad dilana|remind me to|remind me|alarm lagao|set reminder|todo list mein add karo|add task|task banao)/gi, '')
        .replace(/[?.,!]+/g, '')
        .trim();

      if (cleanSubject.length > 2) {
        entities.title = cleanSubject;
      } else if (contextSnippet) {
        // Look in preceding context turn (e.g. "Kal college hai" -> title "college")
        const ctxSubject = contextSnippet
          .replace(/(kal|aaj|today|tomorrow|hai|tha|hoga|assistant|user|achha|theek hai)/gi, '')
          .replace(/[?.,!]+/g, '')
          .trim();
        if (ctxSubject.length > 2) {
          entities.title = ctxSubject;
        }
      }
    }

    return entities;
  }
}
