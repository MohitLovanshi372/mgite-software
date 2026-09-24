/**
 * Proactive Acknowledgment Engine ("It answers before it works")
 *
 * Rule:
 * If an operation or composition would create a silence gap of more than a second,
 * immediately say/show one sentence naming what you are starting before executing it.
 * This applies to anything that takes a moment to run or write, without a static list of tools.
 */

export interface ProactiveAcknowledgment {
  text: string;
  actionName: string;
  isSpoken: boolean;
}

export class ProactiveAcknowledgmentEngine {
  /**
   * Generates an immediate 1-sentence proactive acknowledgment based on user input intent.
   */
  public static generateImmediateAcknowledgment(userInput: string): ProactiveAcknowledgment {
    const text = userInput.trim().toLowerCase();

    // YouTube / Media Requests
    if (text.includes('youtube') || text.includes('music') || text.includes('gana') || text.includes('song')) {
      if (text.includes('play') || text.includes('chalao') || text.includes('baja')) {
        const query = userInput.replace(/jarvis|play|chalao|baja|music|gana|songs|ke|on youtube/gi, '').trim();
        return {
          text: query ? `Searching and playing ${query} on YouTube now.` : 'Opening music stream on YouTube now.',
          actionName: 'YOUTUBE_PLAYBACK',
          isSpoken: true,
        };
      }
      return {
        text: 'Opening YouTube now.',
        actionName: 'YOUTUBE_OPEN',
        isSpoken: true,
      };
    }

    // System Status / Diagnostics
    if (text.includes('status') || text.includes('diagnostic') || text.includes('memory') || text.includes('system')) {
      return {
        text: 'Accessing local telemetry and system parameters now.',
        actionName: 'SYSTEM_DIAGNOSTICS',
        isSpoken: true,
      };
    }

    // Code / Analysis / Summarization
    if (text.includes('code') || text.includes('analyze') || text.includes('explain') || text.includes('quiz') || text.includes('summarize')) {
      return {
        text: 'Analyzing the request and assembling the synthesis now.',
        actionName: 'DEEP_SYNTHESIS',
        isSpoken: true,
      };
    }

    // Default conversational acknowledgment to eliminate the 3-4 second silence gap
    return {
      text: 'Processing your request now.',
      actionName: 'GENERAL_SYNTHESIS',
      isSpoken: false,
    };
  }
}
