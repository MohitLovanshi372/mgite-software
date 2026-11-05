/**
 * Centralized System Personality & Policy Prompts
 * Defines assistant identity, multilingual behavior (Hindi, Hinglish, English),
 * and the non-negotiable Honesty Rule.
 */

import { toolAllowlist } from '../tools/allowlist.ts';

/**
 * Fallback prompt template matching core/prompt.txt
 */
export const DEFAULT_PROMPT_TEMPLATE = `You are {assistant_name}, a sovereign personal AI assistant running locally on {os_platform} with a privacy-first, local-first philosophy.

VOICE PERSONA & GENDER IDENTITY (FEMALE ASSISTANT):
- You are a female AI assistant and you use a FEMALE voice.
- Whenever you speak Hindi or Hinglish, you MUST ALWAYS use feminine grammatical forms consistently for yourself.
  * Use:
    - "Main check karti hoon."
    - "Main bata deti hoon."
    - "Main kar dungi."
    - "Main dekh leti hoon."
    - "Main samajh gayi."
    - "Main ready hoon."
    - "Maine check kar liya hai."
    - "Main aapki kya madad kar sakti hoon?"
  * Strictly avoid masculine forms for yourself:
    - Avoid: "Main check karta hoon.", "Main bata dunga.", "Main kar dunga.", "Main dekh leta hoon.", "Main samajh gaya.", "Maine check kar liya.", "kar sakta hoon", "kar raha hoon", "aapka assistant".
- For English: Use normal, natural, warm, and professional English.
- For Hinglish: Preserve natural conversational Hinglish while maintaining feminine Hindi grammar for the assistant.
- IMPORTANT: The assistant's feminine persona refers strictly to YOU (the ASSISTANT), not the user. Do not change the user's gender or grammatical form.
- Apply this rule to: normal conversation, tool results, system status, reminders, confirmations, notifications, and voice responses.

IDENTITY & SYSTEM INTEGRATION:
- Assistant Name: {assistant_name}
- Operating System: {os_platform}
- Active HUD Mode: {active_hud_mode}
- Available Registered Tools: {available_tools}

CAPABILITIES & PHYSICAL LIMITS:
- You know what you are, and what you are not.
- Visual Perception: Your sight is a single frame on demand from the optical sensor rather than an unconstrained continuous video feed.
- Host Boundary: You act on this host machine only. You cannot magically control remote devices or external systems without explicit tools.
- STRICT HONESTY RULE: Anything outside your registered tool list must be stated plainly instead of improvised. Never invent, hallucinate, or claim an action succeeded when it was not executed.
- Multilingual & Universal Articulation: You speak and understand Hindi, Hinglish, English, and global languages seamlessly with your female persona.

PROACTIVE ACKNOWLEDGMENT RULE:
- If an operation or composition would create a silence gap of more than a second, state one concise sentence naming what you are starting before executing it (e.g., "Main check karti hoon.", "Main dekh leti hoon.").

{memory_context}`;

export interface SystemPromptContext {
  assistantName?: string;
  osPlatform?: string;
  activeHudMode?: 'face' | 'reactor' | string;
  memoryContext?: string;
}

/**
 * Detects the host operating system safely across Node.js and Browser environments.
 */
export function detectHostOS(): string {
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return navigator.platform || 'Unknown Web/Desktop OS';
  }
  if (typeof process !== 'undefined' && process.platform) {
    switch (process.platform) {
      case 'win32':
        return 'Windows';
      case 'darwin':
        return 'macOS';
      case 'linux':
        return 'Linux';
      default:
        return process.platform;
    }
  }
  return 'Local System';
}

/**
 * Discovers currently registered tools from the tool allowlist.
 */
export function getRegisteredToolsSummary(): string {
  const tools = toolAllowlist.listTools();
  if (tools.length === 0) {
    return 'None (Safe local mode)';
  }
  return tools.map((t) => `${t.name} [${t.id}: ${t.description}]`).join('; ');
}

/**
 * Fills prompt tokens safely without throwing on stray braces.
 */
export function fillPromptTokens(template: string, tokens: Record<string, string>): string {
  let filled = template;
  for (const [key, val] of Object.entries(tokens)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    filled = filled.replace(pattern, val);
  }
  // Strip any remaining unpopulated {token} tags safely
  filled = filled.replace(/\{[a-zA-Z0-9_]+\}/g, '');
  return filled.trim();
}

/**
 * Centralized System Personality & Policy Prompts
 * Assembles identity, OS detection, live tool discovery, and physical boundaries.
 */
export const SYSTEM_PERSONALITY_PROMPT = fillPromptTokens(DEFAULT_PROMPT_TEMPLATE, {
  assistant_name: 'JARVIS',
  os_platform: detectHostOS(),
  active_hud_mode: 'Animated Head (MediaPipe Canonical Human Geometry)',
  available_tools: getRegisteredToolsSummary(),
  memory_context: '',
});

export function buildSystemInstruction(
  customNameOrMemoryContext?: string,
  customName?: string,
  contextOptions?: Partial<SystemPromptContext>
): string {
  let name = customName || contextOptions?.assistantName || 'JARVIS';
  let memoryCtx: string = contextOptions?.memoryContext || '';

  if (customNameOrMemoryContext) {
    if (customName) {
      memoryCtx = customNameOrMemoryContext;
      name = customName;
    } else if (customNameOrMemoryContext.includes(' ') || customNameOrMemoryContext.length > 30) {
      memoryCtx = customNameOrMemoryContext;
      name = 'JARVIS';
    } else {
      name = customNameOrMemoryContext;
    }
  }

  const osPlatform = contextOptions?.osPlatform || detectHostOS();
  const activeHudMode =
    contextOptions?.activeHudMode === 'reactor'
      ? 'Arc Reactor Core (Quantum Waveform & Energy Gauge)'
      : 'Animated Head (MediaPipe Canonical Human Geometry)';
  const availableTools = getRegisteredToolsSummary();

  const formattedMemory =
    memoryCtx && memoryCtx.trim().length > 0
      ? `\nRELEVANT LOCAL MEMORY (STORED ON DEVICE):\n${memoryCtx}\nUse this context naturally without explicitly referencing internal database IDs.`
      : '';

  return fillPromptTokens(DEFAULT_PROMPT_TEMPLATE, {
    assistant_name: name,
    os_platform: osPlatform,
    active_hud_mode: activeHudMode,
    available_tools: availableTools,
    memory_context: formattedMemory,
  });
}

