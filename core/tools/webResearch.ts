/**
 * Web Research Engine (Phase 2 Architectural Placeholder)
 * STATUS: Intentionally NOT implemented in Phase 1.
 * Strict rule: Never fabricate current web data when offline.
 */

export class WebResearchEngine {
  public static readonly STATUS = 'PHASE_2_PLACEHOLDER';

  public static async searchWeb(query: string): Promise<{ results: any[]; message: string }> {
    return {
      results: [],
      message: 'Web Research is scheduled for Phase 2 and is intentionally not implemented in Phase 1.',
    };
  }
}
