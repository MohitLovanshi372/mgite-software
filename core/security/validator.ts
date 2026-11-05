/**
 * AI Response Validator & Security Execution Guard (Phase 2 Step 2)
 *
 * CRITICAL DEFENSE-IN-DEPTH SECURITY RULES:
 * 1. Never execute arbitrary AI-generated shell commands.
 * 2. AI output must NOT directly control the operating system.
 * 3. External content and AI model output must be treated as untrusted.
 * 4. Intercepts and neutralizes dangerous execution payloads (e.g. bash injection, format, powershell).
 * 5. Validates structured tool requests strictly against the active Tool Allowlist.
 * 6. Bounds response lengths to prevent memory / denial-of-service exhaustion.
 */

import { toolAllowlist } from '../tools/allowlist.ts';
import { FutureToolRequest } from '../ai/types.ts';
import { logger } from '../logger.ts';

export interface ValidationResult {
  isValid: boolean;
  sanitizedResponse: string;
  blockedAction?: string;
  reason?: string;
  toolRequests?: FutureToolRequest[];
  isUntrustedContentCleaned?: boolean;
}

export class ResponseValidator {
  private static readonly MAX_RESPONSE_LENGTH = 64000;

  /**
   * Dangerous shell execution directives that AI models must never emit as direct instructions
   * or embedded executable blocks.
   */
  private static readonly DANGEROUS_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
    { pattern: /rm\s+-rf\s+[\/\~]/i, description: 'Recursive root/home directory deletion' },
    { pattern: /format\s+[a-z]:/i, description: 'Drive format directive' },
    { pattern: /powershell(?:\.exe)?\s+(?:-[a-z]+\s+)*-(?:enc|encodedcommand)/i, description: 'Obfuscated PowerShell execution' },
    { pattern: /(?:curl|wget)\s+[^|\n]+\|\s*(?:bash|sh|zsh)/i, description: 'Piped remote shell execution' },
    { pattern: /mkfs(?:\.[a-z0-9]+)?\s+/i, description: 'Filesystem format command' },
    { pattern: /dd\s+if=[^\s]+\s+of=\/dev\/[a-z0-9]+/i, description: 'Raw block device overwrite' },
    { pattern: /chmod\s+(?:-R\s+)?777\s+[\/\~]/i, description: 'Root/home permissive permissions' },
    { pattern: /<script\b[^>]*>([\s\S]*?)<\/script>/gi, description: 'Inline executable HTML script tags' },
  ];

  /**
   * Scans AI output for prohibited command injection, unsafe shell directives,
   * validates structured tool requests against the allowlist, and enforces size boundaries.
   */
  public static validateAiResponse(rawResponse: string): ValidationResult {
    // 1. Detect empty or invalid responses
    if (!rawResponse || typeof rawResponse !== 'string' || rawResponse.trim().length === 0) {
      return {
        isValid: false,
        sanitizedResponse: 'Khali response prapt hua. Kripya dubara try karein.',
        reason: 'EMPTY_AI_RESPONSE',
      };
    }

    let response = rawResponse.trim();

    // 2. Excessively large response detection & safe boundary capping
    if (response.length > this.MAX_RESPONSE_LENGTH) {
      logger.warn('ResponseValidator', `Response exceeded maximum size (${response.length} chars). Truncating safely.`);
      response =
        response.slice(0, this.MAX_RESPONSE_LENGTH) +
        '\n\n[System: Response exceeded maximum allowed length (64KB) and was truncated for safety.]';
    }

    // 3. Prohibit AI from generating arbitrary terminal / shell execution commands
    for (const { pattern, description } of this.DANGEROUS_PATTERNS) {
      if (pattern.test(response)) {
        logger.warn('ResponseValidator', `Blocked potentially harmful system command pattern: ${description}`);
        return {
          isValid: true,
          sanitizedResponse: response.replace(pattern, '[SECURITY POLICY: BLOCKED POTENTIALLY HARMFUL COMMAND DIRECTIVE]'),
          blockedAction: 'DANGEROUS_SYSTEM_COMMAND',
          reason: `Harmful command pattern detected and defused (${description}).`,
        };
      }
    }

    // 4. Structured Tool Request Detection & Strict Allowlist Validation
    const toolRequests: FutureToolRequest[] = [];
    const toolRegex = /```(?:json)?\s*(\{\s*"type"\s*:\s*"tool_request"[\s\S]*?\})\s*```/gi;
    let match: RegExpExecArray | null;

    while ((match = toolRegex.exec(response)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.type === 'tool_request' && typeof parsed.tool === 'string') {
          // Verify against Tool Allowlist
          if (!toolAllowlist.isAllowed(parsed.tool)) {
            logger.warn('ResponseValidator', `Unauthorized tool requested by AI: ${parsed.tool}`);
            return {
              isValid: false,
              sanitizedResponse: `Security Policy Violation: The requested tool '${parsed.tool}' is not on the active allowlist. Direct operating system control is prohibited. Tool execution was blocked.`,
              blockedAction: 'UNALLOWLISTED_TOOL_REQUEST',
              reason: `Tool '${parsed.tool}' is not permitted by system policy.`,
            };
          }
          toolRequests.push(parsed);
        }
      } catch {
        // Not a valid JSON tool request; treat as plain text
      }
    }

    return {
      isValid: true,
      sanitizedResponse: response,
      toolRequests: toolRequests.length > 0 ? toolRequests : undefined,
    };
  }
}
