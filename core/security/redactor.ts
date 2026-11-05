/**
 * Sensitive Data Redactor (Phase 2 - Step 4)
 * Replaces sensitive values, credentials, OTPs, and authentication tokens
 * with safe redaction tokens. Guarantees that raw secret values are NEVER
 * present in the returned text.
 */

import { DetectionMatch, SecurityClassification } from './types.ts';

export class Redactor {
  /**
   * Redacts sensitive matches from text using specific placeholders.
   */
  public static redact(text: string, matches: DetectionMatch[], classification?: SecurityClassification): string {
    if (!text || matches.length === 0) {
      return text;
    }

    // If classification is purely OTP, replace whole content with standard safe token
    if (classification === 'OTP') {
      return '[OTP REDACTED]';
    }

    let sanitized = text;

    // Sort matches in reverse order of index to replace without offsetting indices
    const sorted = [...matches].sort((a, b) => b.index - a.index);

    for (const match of sorted) {
      let replacement = '[REDACTED]';

      switch (match.category) {
        case 'OTP':
          replacement = '[OTP REDACTED]';
          break;
        case 'SECURITY_CODE':
          replacement = '[SECURITY_CODE_REDACTED]';
          break;
        case 'FINANCIAL':
          if (match.type === 'UPI_PIN' || match.type === 'PIN') {
            replacement = '[PIN REDACTED]';
          } else if (match.type === 'CVV') {
            replacement = '[CVV REDACTED]';
          } else if (match.type === 'CARD_NUMBER') {
            replacement = '[REDACTED_CARD_NUMBER]';
          } else {
            replacement = '[FINANCIAL_DATA_REDACTED]';
          }
          break;
        case 'CREDENTIAL':
          if (match.type === 'PASSWORD') {
            replacement = '[REDACTED]';
          } else if (match.type === 'API_KEY') {
            replacement = '[REDACTED]';
          } else if (match.type === 'ACCESS_TOKEN' || match.type === 'BEARER_TOKEN' || match.type === 'JWT_TOKEN') {
            replacement = '[REDACTED]';
          }
          break;
        default:
          replacement = '[REDACTED]';
      }

      // If the match has a specific value to replace
      if (match.value && sanitized.includes(match.value)) {
        sanitized = sanitized.split(match.value).join(replacement);
      } else {
        // Replace by slice
        const start = match.index;
        const end = match.index + match.length;
        if (start >= 0 && end <= sanitized.length) {
          sanitized = sanitized.slice(0, start) + replacement + sanitized.slice(end);
        }
      }
    }

    // Sanity verify: Ensure NONE of the matched raw secret values remain in the sanitized text
    for (const match of matches) {
      if (match.value && match.value.length >= 3 && sanitized.includes(match.value)) {
        sanitized = sanitized.split(match.value).join('[REDACTED]');
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes any string (including error messages, log strings, and exceptions).
   */
  public static sanitizeString(str: string): string {
    if (!str || typeof str !== 'string') return '';
    let sanitized = str;

    // Redact OTP patterns
    sanitized = sanitized.replace(
      /\b(?:otp|one[- ]time[- ]password|verification\s*code|auth\s*code|login\s*code)\b(?:\s+(?:is|hai)\s+|[:\s=-])*([0-9]{4,8})\b/gi,
      '[OTP REDACTED]'
    );

    // Redact API Keys
    sanitized = sanitized.replace(/\bAIza[0-9A-Za-z-_]{20,}\b/g, '[REDACTED_KEY]');
    sanitized = sanitized.replace(/\bsk-[a-zA-Z0-9]{20,}\b/g, '[REDACTED_KEY]');
    sanitized = sanitized.replace(
      /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*(?:[:=]|\bis\b|\bhai\b)\s*['"]?([a-zA-Z0-9_\-\.]{8,})['"]?/gi,
      'api_key: [REDACTED]'
    );

    // Redact Passwords
    sanitized = sanitized.replace(
      /(?:password|passcode)\s*(?:[:=]|\bis\b|\bhai\b)\s*['"]?([^\s,;]{4,})['"]?/gi,
      'password: [REDACTED]'
    );

    // Redact PINs & CVVs
    sanitized = sanitized.replace(/\b(?:upi[- ]pin|mpin)\b(?:\s+(?:is|hai)\s+|[:\s=-])*([0-9]{4,6})\b/gi, 'UPI PIN: [PIN REDACTED]');
    sanitized = sanitized.replace(/\b(?:cvv|cvc)\b(?:\s+(?:is|hai)\s+|[:\s=-])*([0-9]{3,4})\b/gi, 'CVV: [CVV REDACTED]');

    // Redact Cards
    sanitized = sanitized.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED_CARD]');

    return sanitized;
  }
}
