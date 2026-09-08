/**
 * Task, Reminders & Schedule Engine (Phase 2 Architectural Placeholder)
 * STATUS: Intentionally NOT implemented in Phase 1.
 * Provides types and interfaces for future calendar, alarms, and task management.
 */

export interface ScheduledTask {
  id: string;
  title: string;
  dueAt: string;
  isCompleted: boolean;
  priority: 'low' | 'normal' | 'high';
}

export class TaskEngine {
  public static readonly STATUS = 'PHASE_2_PLACEHOLDER';

  public static async listTasks(): Promise<ScheduledTask[]> {
    return [];
  }

  public static async createTask(title: string, dueAt: string): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Task and reminder scheduling is scheduled for Phase 2 and is intentionally not implemented in Phase 1.',
    };
  }
}
