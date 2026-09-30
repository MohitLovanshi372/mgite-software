/**
 * Task Management Engine Types (Phase 5)
 *
 * Defines models for multi-step task planning, tracking, verification,
 * priority management, and confirmation lifecycle.
 */

export type TaskStatus =
  | 'PLANNING'
  | 'WAITING_FOR_CONFIRMATION'
  | 'RUNNING'
  | 'PAUSED'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type StepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export interface TaskStep {
  stepId: string;
  stepNumber: number;
  name: string;
  description: string;
  toolName: string;
  toolParameters: Record<string, any>;
  status: StepStatus;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  requiresVerification: boolean;
  verificationDetails?: {
    criteria: string;
    verified: boolean;
    timestamp?: string;
    message?: string;
  };
  startedAt?: string;
  completedAt?: string;
}

export interface ConfirmationDetails {
  actionDescription: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedResources: string[];
  timeoutMs: number;
  requestedAt: string;
  expiresAt: string;
}

export interface Task {
  taskId: string;
  userRequest: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  steps: TaskStep[];
  currentStepIndex: number;
  result?: any;
  error?: string;
  requiresConfirmation: boolean;
  confirmationStatus: 'NONE' | 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
  confirmationDetails?: ConfirmationDetails;
  isScheduled?: boolean;
  scheduledTime?: string;
}

export interface TaskPlanOutput {
  title: string;
  priority: TaskPriority;
  requiresConfirmation: boolean;
  confirmationDetails?: ConfirmationDetails;
  steps: Array<{
    name: string;
    description: string;
    toolName: string;
    toolParameters: Record<string, any>;
    requiresVerification?: boolean;
    verificationCriteria?: string;
  }>;
}

export interface ToolExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  verified?: boolean;
  executionTimeMs?: number;
  message?: string;
}
