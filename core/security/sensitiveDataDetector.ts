/**
 * Sensitive Data Detector (Phase 2 - Step 4)
 * Deterministic, offline, local-first detector for sensitive data, authentication
 * tokens, credentials, financial details, and One-Time Passwords (OTPs).
 *
 * Designed to execute completely locally with ZERO external AI or network calls.
 * Uses contextual cues and pattern combinations to avoid false positives (e.g. "Tomorrow is 2026").
 */

import { SecurityClassification, SensitiveDetectionResult, DetectionMatch } from './types.ts';

// Contextual trigger words for OTP / 2FA verification
const OTP_CONTEXT_KEYWORDS = [
  'otp',
  'one-time password',
  'one time password',
  'onetime password',
  'verification code',
  'verify your account',
  'verify account',
  'auth code',
  'authentication code',
  'login code',
  'security code',
  'confirm your code',
  'confirmation code',
  '2fa code',
  'two-factor code',
  'satyapan code', // Hindi/Hinglish
  'aapka otp',
  'apna otp',
  'otp darj',
];

export class SensitiveDataDetector {
  /**
   * Scans text deterministically for sensitive data patterns.
   */
  public static detect(input: string): SensitiveDetectionResult {
    if (!input || typeof input !== 'string') {
      return {
        isSensitive: false,
        classification: 'NORMAL',
        detectedTypes: [],
        matches: [],
        shouldAbortPipeline: false,
        suppressAudio: false,
        suppressStorage: false,
      };
    }

    const text = input.trim();
    if (!text) {
      return {
        isSensitive: false,
        classification: 'NORMAL',
        detectedTypes: [],
        matches: [],
        shouldAbortPipeline: false,
        suppressAudio: false,
        suppressStorage: false,
      };
    }

    const matches: DetectionMatch[] = [];

    // 1. Detect Banking Security Codes & Payment Auth Codes first
    this.detectBankingAndSecurityCodes(text, matches);

    // 2. Detect OTP / Verification Codes with context-aware patterns
    this.detectOTP(text, matches);

    // 3. Detect Financial Data (UPI PIN, ATM PIN, CVV, Card Numbers)
    this.detectFinancialData(text, matches);

    // 4. Detect Credentials (Passwords, API Keys, Tokens, Secret Keys)
    this.detectCredentials(text, matches);

    // If no matches found, return NORMAL
    if (matches.length === 0) {
      return {
        isSensitive: false,
        classification: 'NORMAL',
        detectedTypes: [],
        matches: [],
        shouldAbortPipeline: false,
        suppressAudio: false,
        suppressStorage: false,
      };
    }

    // Determine highest priority classification
    // Priority order: OTP > SECURITY_CODE > FINANCIAL > CREDENTIAL > SENSITIVE > PRIVATE
    const detectedTypes = Array.from(new Set(matches.map((m) => m.type)));
    let classification: SecurityClassification = 'SENSITIVE';
    let shouldAbort = false;
    let suppressAudio = false;
    let suppressStorage = false;

    if (matches.some((m) => m.category === 'OTP')) {
      classification = 'OTP';
      shouldAbort = true;
      suppressAudio = true;
      suppressStorage = true;
    } else if (matches.some((m) => m.category === 'SECURITY_CODE')) {
      classification = 'SECURITY_CODE';
      shouldAbort = true;
      suppressAudio = true;
      suppressStorage = true;
    } else if (matches.some((m) => m.category === 'FINANCIAL')) {
      classification = 'FINANCIAL';
      // If financial match is a PIN or CVV, also suppress storage and abort external call
      if (detectedTypes.includes('UPI_PIN') || detectedTypes.includes('PIN') || detectedTypes.includes('CVV')) {
        shouldAbort = true;
        suppressAudio = true;
        suppressStorage = true;
      }
    } else if (matches.some((m) => m.category === 'CREDENTIAL')) {
      classification = 'CREDENTIAL';
      // Raw passwords abort external AI transmission
      if (detectedTypes.includes('PASSWORD')) {
        shouldAbort = true;
        suppressAudio = true;
        suppressStorage = true;
      }
    }

    return {
      isSensitive: true,
      classification,
      detectedTypes,
      matches,
      shouldAbortPipeline: shouldAbort,
      suppressAudio,
      suppressStorage,
      reason: `Detected sensitive patterns: ${detectedTypes.join(', ')}`,
    };
  }

  /**
   * Detects OTPs and verification codes with context words to eliminate false positives.
   */
  private static detectOTP(text: string, matches: DetectionMatch[]): void {
    // Check if the text contains any OTP contextual keywords
    const lower = text.toLowerCase();
    const hasOtpContext = OTP_CONTEXT_KEYWORDS.some((kw) => lower.includes(kw));

    // Standard pattern: "Your OTP is 483921", "OTP: 829104", "verification code is 123456", "Aapka OTP 849201 hai"
    const standardOtpRegex =
      /\b(?:otp|one[- ]time[- ]password|verification\s*code|auth\s*code|login\s*code|satyapan\s*code)\b(?:\s+(?:is|hai)\s+|[:\s=-])*([0-9]{4,8})\b/gi;
    let match: RegExpExecArray | null;
    while ((match = standardOtpRegex.exec(text)) !== null) {
      if (matches.some((m) => Math.max(m.index, match!.index) < Math.min(m.index + m.length, match!.index + match![0].length))) {
        continue;
      }
      matches.push({
        type: 'OTP',
        category: 'OTP',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.98,
      });
    }

    // Reverse pattern: "483921 is your OTP", "829104 aapka verification code hai"
    const reverseOtpRegex =
      /\b([0-9]{4,8})\s+(?:is\s+(?:your\s+)?(?:otp|verification|login|auth)\s+code|(?:aapka\s+)?(?:otp|satyapan\s+code)\s+hai)\b/gi;
    while ((match = reverseOtpRegex.exec(text)) !== null) {
      if (matches.some((m) => Math.max(m.index, match!.index) < Math.min(m.index + m.length, match!.index + match![0].length))) {
        continue;
      }
      matches.push({
        type: 'OTP',
        category: 'OTP',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.98,
      });
    }

    // Explicit labeled OTP: "OTP 483921" or "OTP: 483921" (case insensitive, e.g. OtP, otp, OTP)
    const labeledOtpRegex = /\b(?:otp|code)\s*[:=]\s*([0-9]{4,8})\b/gi;
    while ((match = labeledOtpRegex.exec(text)) !== null) {
      // Ensure it wasn't already matched
      if (!matches.some((m) => m.index === match!.index)) {
        matches.push({
          type: 'OTP',
          category: 'OTP',
          value: match[1],
          index: match.index,
          length: match[0].length,
          confidence: 0.95,
        });
      }
    }

    // Contextual proximity check: If text has OTP context and an isolated 4-8 digit number, match it
    if (hasOtpContext && matches.length === 0) {
      const numberMatches = text.match(/\b([0-9]{4,8})\b/g);
      if (numberMatches) {
        for (const num of numberMatches) {
          // Avoid matching years like 2024-2030 unless clearly within OTP phrase
          const numVal = parseInt(num, 10);
          const isCommonYear = numVal >= 1990 && numVal <= 2040 && num.length === 4;
          if (isCommonYear && !lower.includes('code') && !lower.includes('otp')) {
            continue;
          }
          const idx = text.indexOf(num);
          matches.push({
            type: 'OTP',
            category: 'OTP',
            value: num,
            index: idx,
            length: num.length,
            confidence: 0.9,
          });
        }
      }
    }
  }

  /**
   * Detects banking security codes and payment authorization codes.
   */
  private static detectBankingAndSecurityCodes(text: string, matches: DetectionMatch[]): void {
    // Banking security code: "banking security code is 994821", "bank security code: 123456"
    const bankingCodeRegex =
      /\b(?:banking\s*security\s*code|bank\s*security\s*code)\b(?:\s+(?:is|hai)\s+|[:\s=-])*([0-9A-Za-z]{4,10})\b/gi;
    let match: RegExpExecArray | null;
    while ((match = bankingCodeRegex.exec(text)) !== null) {
      matches.push({
        type: 'BANKING_SECURITY_CODE',
        category: 'SECURITY_CODE',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.98,
      });
    }

    // Payment authorization code: "payment authorization code: 883920", "payment auth code is 773912"
    const paymentAuthRegex =
      /\b(?:payment\s*(?:authorization|auth)\s*code)\b(?:\s+(?:is|hai)\s+|[:\s=-])*([0-9A-Za-z]{4,10})\b/gi;
    while ((match = paymentAuthRegex.exec(text)) !== null) {
      matches.push({
        type: 'PAYMENT_AUTH_CODE',
        category: 'SECURITY_CODE',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.98,
      });
    }
  }

  /**
   * Detects financial data: UPI PIN, ATM PIN, CVV, and credit card numbers.
   */
  private static detectFinancialData(text: string, matches: DetectionMatch[]): void {
    // UPI PIN / MPIN: "UPI PIN is 1234", "mpin: 5678", "Apna UPI PIN kisi ke sath share na karein 9876"
    const upiPinRegex =
      /\b(?:upi[- ]pin|mpin)\b(?:\s*(?:is|hai|kisi ke sath share na karein|share na karein)?\s*[:\s=-]*)*([0-9]{4,6})\b/gi;
    let match: RegExpExecArray | null;
    while ((match = upiPinRegex.exec(text)) !== null) {
      matches.push({
        type: 'UPI_PIN',
        category: 'FINANCIAL',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.98,
      });
    }

    // General PIN: "ATM PIN is 1234", "PIN: 5678", "my pin is 9876"
    const pinRegex = /\b(?:atm[- ]pin|debit[- ]pin|card[- ]pin|\bpin)\b(?:\s+(?:is|hai)\s+|[:\s=-])+([0-9]{4,6})\b/gi;
    while ((match = pinRegex.exec(text)) !== null) {
      // Don't duplicate UPI_PIN
      if (!matches.some((m) => m.index === match!.index)) {
        matches.push({
          type: 'PIN',
          category: 'FINANCIAL',
          value: match[1],
          index: match.index,
          length: match[0].length,
          confidence: 0.95,
        });
      }
    }

    // CVV / CVC: "CVV is 123", "CVV: 456", "CVC 789"
    const cvvRegex = /\b(?:cvv|cvc)\b(?:\s+(?:is|hai)\s+|[:\s=-])*([0-9]{3,4})\b/gi;
    while ((match = cvvRegex.exec(text)) !== null) {
      matches.push({
        type: 'CVV',
        category: 'FINANCIAL',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.98,
      });
    }

    // Credit Card Numbers: 16 digits (with or without dashes/spaces)
    const cardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
    while ((match = cardRegex.exec(text)) !== null) {
      matches.push({
        type: 'CARD_NUMBER',
        category: 'FINANCIAL',
        value: match[0],
        index: match.index,
        length: match[0].length,
        confidence: 0.95,
      });
    }
  }

  /**
   * Detects credentials: Passwords, API keys, Access Tokens, Secret Keys.
   */
  private static detectCredentials(text: string, matches: DetectionMatch[]): void {
    let match: RegExpExecArray | null;

    // Passwords: "password is secret123", "password: mypass", "passcode is 8849", "mera password hai ..."
    const passwordRegex =
      /(?:password|passcode|master_key|mera\s+password)\s*(?:[:=]|\bis\b|\bhai\b)\s*['"]?([^\s,;]{4,})['"]?/gi;
    while ((match = passwordRegex.exec(text)) !== null) {
      matches.push({
        type: 'PASSWORD',
        category: 'CREDENTIAL',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.95,
      });
    }

    // Google API Keys: AIza...
    const googleKeyRegex = /\bAIza[0-9A-Za-z-_]{20,}\b/g;
    while ((match = googleKeyRegex.exec(text)) !== null) {
      matches.push({
        type: 'API_KEY',
        category: 'CREDENTIAL',
        value: match[0],
        index: match.index,
        length: match[0].length,
        confidence: 1.0,
      });
    }

    // OpenAI API Keys: sk-...
    const openaiKeyRegex = /\bsk-[a-zA-Z0-9]{20,}\b/g;
    while ((match = openaiKeyRegex.exec(text)) !== null) {
      matches.push({
        type: 'API_KEY',
        category: 'CREDENTIAL',
        value: match[0],
        index: match.index,
        length: match[0].length,
        confidence: 1.0,
      });
    }

    // Explicit API Key: "My API key is ABC123XYZ", "API key: ...", "api_key = ..."
    const genericApiKeyRegex = /(?:api[_\-\s]?key)\s*(?:[:=]|\bis\b|\bhai\b)\s*['"]?([a-zA-Z0-9_\-\.]{6,})['"]?/gi;
    while ((match = genericApiKeyRegex.exec(text)) !== null) {
      if (!matches.some((m) => m.index === match!.index)) {
        matches.push({
          type: 'API_KEY',
          category: 'CREDENTIAL',
          value: match[1],
          index: match.index,
          length: match[0].length,
          confidence: 0.95,
        });
      }
    }

    // Access Tokens / Secret Keys: "access token is ...", "secret key: ...", "authentication token: ..."
    const tokenRegex =
      /(?:access[_\-\s]?token|secret[_\-\s]?key|auth[_\-\s]?token|authentication[_\-\s]?token)\s*(?:[:=]|\bis\b|\bhai\b)\s*['"]?([a-zA-Z0-9_\-\.]{6,})['"]?/gi;
    while ((match = tokenRegex.exec(text)) !== null) {
      matches.push({
        type: 'ACCESS_TOKEN',
        category: 'CREDENTIAL',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.95,
      });
    }

    // Bearer token headers: "Bearer <token>"
    const bearerRegex = /\bBearer\s+([a-zA-Z0-9_\-\.]{12,})\b/gi;
    while ((match = bearerRegex.exec(text)) !== null) {
      matches.push({
        type: 'BEARER_TOKEN',
        category: 'CREDENTIAL',
        value: match[1],
        index: match.index,
        length: match[0].length,
        confidence: 0.98,
      });
    }

    // JWT Tokens: eyJ...
    const jwtRegex = /\beyJ[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]{8,}\b/g;
    while ((match = jwtRegex.exec(text)) !== null) {
      matches.push({
        type: 'JWT_TOKEN',
        category: 'CREDENTIAL',
        value: match[0],
        index: match.index,
        length: match[0].length,
        confidence: 1.0,
      });
    }
  }
}
