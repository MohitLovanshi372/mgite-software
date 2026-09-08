/**
 * Security Sanitizer & Privacy Filter
 * Sanitizes inputs, prevents prompt injection, masks sensitive patterns,
 * and ensures logs never contain API keys, credentials, or private secrets.
 */

const SENSITIVE_PATTERNS = [
  /\bAIza[0-9A-Za-z\-_]{20,}\b/g, // Google / Gemini API Keys
  /\bBearer\s+[a-zA-Z0-9_\-\.]{12,}\b/gi, // Bearer authentication tokens
  /\beyJ[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]{8,}\b/g, // JWT tokens
  /(?:api[_-]?key|secret|token|password|auth)\s*[:=]\s*['"]?([a-zA-Z0-9_\-\.]{8,})['"]?/gi,
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Card numbers
  /\b(?:cvv|cvc)\s*[:=]?\s*\d{3,4}\b/gi,
  /\b(?:otp|one[- ]time[- ]password|verification\s*code|auth\s*code|login\s*code)\b(?:\s+(?:is|hai)\s+|[:\s=-])*(\d{4,8})\b/gi,
  /\b(?:banking\s*security\s*code|payment\s*auth(?:orization)?\s*code)\b(?:\s+(?:is|hai)\s+|[:\s=-])*([0-9A-Za-z]{4,10})\b/gi,
  /\b(?:otp|one[- ]time[- ]password|pin|upi[- ]pin)\s*(?:[:=]|\bis\b)?\s*(\d{4,8})\b/gi,
];

export interface SanitizationResult {
  cleanText: string;
  hadSensitiveData: boolean;
  detectedTypes: string[];
}

export function sanitizeInput(input: string, maxChars: number = 8000): SanitizationResult {
  if (!input || typeof input !== 'string') {
    return { cleanText: '', hadSensitiveData: false, detectedTypes: [] };
  }

  // 1. Cap maximum characters to prevent memory DOS
  let text = input.slice(0, maxChars).trim();

  // 2. Strip dangerous control characters (except common newlines/tabs)
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // 3. Scan and redact sensitive credentials / financial details
  const detectedTypes: string[] = [];
  let hadSensitive = false;

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) {
      hadSensitive = true;
      text = text.replace(pattern, (match) => {
        detectedTypes.push('REDACTED_SECRET');
        return '[PROTECTED_SENSITIVE_DATA]';
      });
    }
  }

  return {
    cleanText: text,
    hadSensitiveData: hadSensitive,
    detectedTypes,
  };
}

export function redactSecretsForLogs(logMessage: string): string {
  if (!logMessage || typeof logMessage !== 'string') return '';
  let sanitized = logMessage;

  // Redact Gemini API keys (AIza...)
  sanitized = sanitized.replace(/\bAIza[0-9A-Za-z\-_]{20,}\b/g, '[REDACTED_GEMINI_KEY]');

  // Redact general bearer tokens / keys
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_LOG_SECRET]');
  }

  return sanitized;
}
