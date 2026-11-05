/**
 * Client-Side Voice Speech Sanitizer
 * Pure browser-safe utility (zero Node.js dependencies).
 * Enforces privacy guarantees: raw OTPs, passwords, and secret tokens are NEVER spoken aloud.
 */

export interface SpeechSanitizerResult {
  sanitizedText: string;
  hadSensitiveData: boolean;
  classification: 'OTP' | 'CREDENTIAL' | 'NORMAL';
}

const OTP_PATTERNS = [
  /\b(?:otp|one[- ]time[- ]password|verification[- ]code|security[- ]code|login[- ]code)\b/i,
  /\b(?:otp|code|pin)\s*(?:is|hai|:)?\s*([0-9]{4,8})\b/i,
  /\b(?:aapka|your)\s+(?:otp|code|pin)\s+(?:hai|is)\s+([0-9]{4,8})\b/i,
  /\b[0-9]{3}[- ][0-9]{3}\b/,
];

const CREDENTIAL_PATTERNS = [
  /\b(?:password|passwd|pwd)\s*(?:is|hai|:|=)\s*([^\s,.]+)/i,
  /\b(?:sk-[a-zA-Z0-9]{20,})\b/,
  /\b(?:AIza[0-9A-Za-z-_]{35})\b/,
  /\b(?:ghp_[a-zA-Z0-9]{36})\b/,
];

export function sanitizeSpeechText(rawText: string): SpeechSanitizerResult {
  if (!rawText || typeof rawText !== 'string') {
    return { sanitizedText: '', hadSensitiveData: false, classification: 'NORMAL' };
  }

  const text = rawText.trim();

  // Check OTP
  const hasOtpMatch = OTP_PATTERNS.some((p) => p.test(text));
  if (hasOtpMatch) {
    return {
      sanitizedText: 'Aapka OTP detect hua hai. Suraksha ke mutabiq ise bol kar nahi sunaya jayega.',
      hadSensitiveData: true,
      classification: 'OTP',
    };
  }

  // Check Credentials / Passwords
  const hasCredMatch = CREDENTIAL_PATTERNS.some((p) => p.test(text));
  if (hasCredMatch) {
    let cleaned = text;
    for (const pattern of CREDENTIAL_PATTERNS) {
      cleaned = cleaned.replace(pattern, '[redacted credential]');
    }
    return {
      sanitizedText: cleaned,
      hadSensitiveData: true,
      classification: 'CREDENTIAL',
    };
  }

  // Safe text
  return {
    sanitizedText: text,
    hadSensitiveData: false,
    classification: 'NORMAL',
  };
}
