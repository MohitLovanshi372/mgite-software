/**
 * Permission Gate (Phase 5 Security Layer)
 *
 * Enforces strict security boundaries before any tool is executed:
 * 1. Verifies tool is registered in ToolAllowlist
 * 2. Checks required permission level (READ_ONLY, SAFE_EXECUTE, CONFIRMATION_REQUIRED)
 * 3. Enforces Confirmation Gate for MEDIUM/HIGH/CRITICAL operations
 * 4. Scans tool parameters for prompt injection, arbitrary shell, or sensitive tokens
 * 5. Prohibits arbitrary shell, Python, unrestricted browser, auto-payment, auto-deletion
 */

import { toolAllowlist, ToolDefinition } from '../tools/allowlist.ts';
import { PrivacyFilter } from './privacyFilter.ts';
import { logger } from '../logger.ts';

export interface PermissionCheckResult {
  allowed: boolean;
  requiresUserConfirmation: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason?: string;
  sanitizedParameters: Record<string, any>;
  confirmationPrompt?: string;
}

export class PermissionGate {
  private static readonly PROHIBITED_TOOLS = new Set([
    'bash',
    'sh',
    'zsh',
    'powershell',
    'cmd',
    'python',
    'eval',
    'exec',
    'run_script',
    'delete_file',
    'format_disk',
    'send_payment',
    'transfer_money',
    'change_password',
  ]);

  private static readonly DANGEROUS_PARAM_REGEX =
    /(rm\s+-rf|format\s+[a-z]:|mkfs|dd\s+if=|;\s*rm|\|\s*bash|powershell\s+-enc|<script)/i;

  /**
   * Evaluates if a tool invocation is permitted to proceed.
   */
  public static checkPermission(
    toolName: string,
    rawParameters: Record<string, any>,
    hasUserConfirmed: boolean = false
  ): PermissionCheckResult {
    const lowerTool = (toolName || '').toLowerCase().trim();

    // 1. Strict Prohibited Tools Check (Defense-in-depth)
    if (this.PROHIBITED_TOOLS.has(lowerTool)) {
      logger.warn('PermissionGate', `Prohibited tool blocked: ${toolName}`);
      return {
        allowed: false,
        requiresUserConfirmation: false,
        riskLevel: 'CRITICAL',
        reason: `SECURITY POLICY: Unrestricted execution via "${toolName}" is prohibited.`,
        sanitizedParameters: {},
      };
    }

    // 2. Allowlist Check
    const toolDef = toolAllowlist.getTool(lowerTool);
    if (!toolDef) {
      logger.warn('PermissionGate', `Unregistered tool rejected: ${toolName}`);
      return {
        allowed: false,
        requiresUserConfirmation: false,
        riskLevel: 'HIGH',
        reason: `Tool "${toolName}" is not registered in the safe Tool Allowlist.`,
        sanitizedParameters: {},
      };
    }

    // 3. Parameter Sanitization & Injection Scanning
    const sanitizedParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawParameters || {})) {
      if (typeof value === 'string') {
        // Injection detection
        if (this.DANGEROUS_PARAM_REGEX.test(value)) {
          logger.error('PermissionGate', `Dangerous command injection payload in param [${key}]`);
          return {
            allowed: false,
            requiresUserConfirmation: false,
            riskLevel: 'CRITICAL',
            reason: `Malicious command injection detected in parameter "${key}".`,
            sanitizedParameters: {},
          };
        }

        // Privacy filtering
        const privacy = PrivacyFilter.filterInput(value);
        if (privacy.action === 'BLOCK') {
          logger.warn('PermissionGate', `Sensitive token blocked in parameter [${key}]`);
          return {
            allowed: false,
            requiresUserConfirmation: false,
            riskLevel: 'HIGH',
            reason: `Sensitive data (OTP, password, or financial code) detected in parameter "${key}".`,
            sanitizedParameters: {},
          };
        }

        sanitizedParams[key] = privacy.cleanText || privacy.safeContent || value;
      } else {
        sanitizedParams[key] = value;
      }
    }

    // 4. Determine Risk Level & Confirmation Requirements
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let requiresConfirmation = false;
    let confirmationPrompt: string | undefined;

    if (toolDef.permissionLevel === 'CONFIRMATION_REQUIRED') {
      riskLevel = 'MEDIUM';
      requiresConfirmation = true;
      confirmationPrompt = `Aapki pushti ki zaroorat hai: Kya aap "${toolDef.name}" execute karna chahte hain?`;
    } else if (toolDef.permissionLevel === 'SAFE_EXECUTE') {
      riskLevel = 'LOW';
      requiresConfirmation = false;
    } else if (toolDef.permissionLevel === 'READ_ONLY') {
      riskLevel = 'LOW';
      requiresConfirmation = false;
    }

    // 5. If Confirmation is Required but not yet given
    if (requiresConfirmation && !hasUserConfirmed) {
      return {
        allowed: false,
        requiresUserConfirmation: true,
        riskLevel,
        reason: 'User confirmation required prior to execution.',
        sanitizedParameters: sanitizedParams,
        confirmationPrompt,
      };
    }

    // Passed all checks
    return {
      allowed: true,
      requiresUserConfirmation: false,
      riskLevel,
      sanitizedParameters: sanitizedParams,
    };
  }
}
