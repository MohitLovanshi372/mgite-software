/**
 * Automated Tests: Security Sanitizer, OTP Privacy & Response Validator
 */

import { sanitizeInput } from '../core/security/sanitizer.ts';
import { OtpPrivacyEngine } from '../core/security/otpPrivacy.ts';
import { ResponseValidator } from '../core/security/validator.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

export async function runSecurityTests() {
  console.log('--- Testing Security Sanitizer ---');

  // Test 1: API Key redaction
  const inputWithKey = 'My gemini key is AIzaSyD3x456_fakeApiKey1234567890';
  const sanitized1 = sanitizeInput(inputWithKey);
  assert(sanitized1.hadSensitiveData, 'Should detect API key');
  assert(sanitized1.cleanText.includes('[PROTECTED_SENSITIVE_DATA]'), 'Should redact API key');

  // Test 2: Password redaction
  const inputWithPass = 'The password is password=MySecretP@ssw0rd123';
  const sanitized2 = sanitizeInput(inputWithPass);
  assert(sanitized2.hadSensitiveData, 'Should detect password keyword');
  assert(sanitized2.cleanText.includes('[PROTECTED_SENSITIVE_DATA]'), 'Should redact password');

  // Test 3: OTP Privacy Engine
  console.log('--- Testing OTP Privacy Engine ---');
  const otpMsg = 'Your one time password is 482910 for your account login.';
  const otpResult = OtpPrivacyEngine.evaluateContent(otpMsg);
  assert(otpResult.isSensitive, 'Should detect OTP pattern');
  assert(otpResult.category === 'OTP', 'Category should be OTP');

  const normalMsg = 'Aaj kal mausam bohot accha hai.';
  const normalResult = OtpPrivacyEngine.evaluateContent(normalMsg);
  assert(!normalResult.isSensitive, 'Normal message should not be flagged as OTP');

  // Test 4: Response Validator - Dangerous shell commands
  console.log('--- Testing Response Validator ---');
  const safeAiResponse = 'You can organize your files by creating folders.';
  const valid1 = ResponseValidator.validateAiResponse(safeAiResponse);
  assert(!valid1.blockedAction, 'Safe text should not be blocked');

  const harmfulAiResponse = 'To fix this run rm -rf / in your terminal';
  const valid2 = ResponseValidator.validateAiResponse(harmfulAiResponse);
  assert(valid2.blockedAction !== undefined, 'rm -rf should be blocked');
  assert(valid2.sanitizedResponse.includes('BLOCKED POTENTIALLY HARMFUL COMMAND DIRECTIVE'), 'Should replace with safety warning');

  console.log('✓ All Security & Sanitizer tests passed.');
}

if (import.meta.url.endsWith(process.argv[1] || '')) {
  runSecurityTests().catch((err) => {
    console.error('Security test failed:', err);
    process.exit(1);
  });
}
