/**
 * AI-Related Error Hierarchy & Normalizers (Phase 2 Step 2)
 *
 * Provides typed, structured error classes and safe sanitizers.
 * Crucial security guarantees:
 * - NEVER logs or exposes API keys or raw bearer tokens in error messages.
 * - Categorizes errors into user-friendly, actionable Hindi/Hinglish/English diagnostics.
 * - Differentiates between transient (retryable) and permanent failures.
 */

import { redactSecretsForLogs } from '../security/sanitizer.ts';

export type AIErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_UNREACHABLE'
  | 'PROVIDER_UNAVAILABLE'
  | 'SAFETY_VIOLATION'
  | 'EMPTY_RESPONSE'
  | 'MALFORMED_RESPONSE'
  | 'UNKNOWN_AI_ERROR';

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly provider: string;
  readonly isRetryable: boolean;
  readonly userMessage: string;

  constructor(options: {
    code: AIErrorCode;
    message: string;
    provider: string;
    isRetryable?: boolean;
    userMessage: string;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = 'AIError';
    this.code = options.code;
    this.provider = options.provider;
    this.isRetryable = options.isRetryable ?? false;
    this.userMessage = options.userMessage;
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

export class MissingApiKeyError extends AIError {
  constructor(provider: string) {
    super({
      code: 'MISSING_API_KEY',
      message: `${provider} API key is not configured in server environment.`,
      provider,
      isRetryable: false,
      userMessage: 'AI service is currently unavailable. Gemini API key configure nahi hai. Aap offline mode use kar sakte hain.',
    });
    this.name = 'MissingApiKeyError';
  }
}

export class InvalidApiKeyError extends AIError {
  constructor(provider: string) {
    super({
      code: 'INVALID_API_KEY',
      message: `${provider} rejected the API credentials (invalid format or unauthorized).`,
      provider,
      isRetryable: false,
      userMessage: 'AI service is currently unavailable. Configured Gemini API key invalid hai ya reject ho gayi.',
    });
    this.name = 'InvalidApiKeyError';
  }
}

export class RateLimitError extends AIError {
  constructor(provider: string) {
    super({
      code: 'RATE_LIMIT_EXCEEDED',
      message: `${provider} rate limit exceeded (HTTP 429).`,
      provider,
      isRetryable: true,
      userMessage: 'AI service is currently unavailable. Gemini API rate limit ho chuki hai. Kripya thodi der baad dubara try karein.',
    });
    this.name = 'RateLimitError';
  }
}

export class NetworkTimeoutError extends AIError {
  constructor(provider: string, timeoutMs: number) {
    super({
      code: 'NETWORK_TIMEOUT',
      message: `${provider} request timed out after ${timeoutMs}ms.`,
      provider,
      isRetryable: true,
      userMessage: 'AI service is currently unavailable. Request to Gemini timed out. Kripya dubara prayas karein.',
    });
    this.name = 'NetworkTimeoutError';
  }
}

export class EmptyResponseError extends AIError {
  constructor(provider: string) {
    super({
      code: 'EMPTY_RESPONSE',
      message: `${provider} returned an empty or whitespace-only response.`,
      provider,
      isRetryable: true,
      userMessage: 'AI service is currently unavailable. Empty response received from provider.',
    });
    this.name = 'EmptyResponseError';
  }
}

export class ProviderUnavailableError extends AIError {
  constructor(provider: string, reason?: string) {
    super({
      code: 'PROVIDER_UNAVAILABLE',
      message: `${provider} is unavailable: ${reason || 'unknown reason'}`,
      provider,
      isRetryable: true,
      userMessage: 'AI service is currently unavailable. System offline rules engine par shift ho raha hai.',
    });
    this.name = 'ProviderUnavailableError';
  }
}

/**
 * Normalizes any caught runtime or SDK error into a strongly-typed AIError
 * while stripping away sensitive details.
 */
export function normalizeAIError(err: unknown, provider: string): AIError {
  if (err instanceof AIError) {
    return err;
  }

  const rawOriginal = String((err as any)?.message || err || '');

  // 1. Missing Key
  if (rawOriginal.includes('MISSING_API_KEY') || rawOriginal.includes('not configured')) {
    return new MissingApiKeyError(provider);
  }

  // 2. Invalid Key
  if (
    rawOriginal.includes('API_KEY_INVALID') ||
    rawOriginal.includes('API key not valid') ||
    rawOriginal.includes('INVALID_ARGUMENT') ||
    rawOriginal.includes('PERMISSION_DENIED')
  ) {
    return new InvalidApiKeyError(provider);
  }

  // 3. Rate limit / 429
  if (rawOriginal.includes('RESOURCE_EXHAUSTED') || rawOriginal.includes('429') || rawOriginal.includes('rate limit')) {
    return new RateLimitError(provider);
  }

  // 4. Timeout
  if (rawOriginal.includes('TIMEOUT') || rawOriginal.includes('ETIMEDOUT') || rawOriginal.includes('timed out')) {
    return new NetworkTimeoutError(provider, 25000);
  }

  // 5. Network connectivity
  if (
    rawOriginal.includes('ENOTFOUND') ||
    rawOriginal.includes('fetch failed') ||
    rawOriginal.includes('ECONNREFUSED') ||
    rawOriginal.includes('ECONNRESET') ||
    rawOriginal.includes('network')
  ) {
    return new AIError({
      code: 'NETWORK_UNREACHABLE',
      message: `${provider} network connection unreachable.`,
      provider,
      isRetryable: true,
      userMessage: 'Internet connection unavailable hai. Main abhi offline mode mein operate kar raha hoon.',
      cause: err,
    });
  }

  // 6. Empty response
  if (rawOriginal.includes('EMPTY_RESPONSE') || rawOriginal.includes('empty response')) {
    return new EmptyResponseError(provider);
  }

  // 7. Generic fallback (redact sensitive tokens from unknown message strings)
  const sanitizedRaw = redactSecretsForLogs(rawOriginal);
  return new AIError({
    code: 'UNKNOWN_AI_ERROR',
    message: `Unexpected error in ${provider}: ${sanitizedRaw.slice(0, 150)}`,
    provider,
    isRetryable: false,
    userMessage: 'AI service is currently unavailable. Kripya thodi der baad prayas karein.',
    cause: err,
  });
}
