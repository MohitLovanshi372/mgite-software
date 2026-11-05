/**
 * Safe Tool Allowlist & Policy Engine
 * Enforces the rule: AI must NOT receive unrestricted operating-system access.
 * Any future tool execution MUST be explicitly registered in this allowlist with permission boundaries.
 */

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  requiresInternet: boolean;
  permissionLevel: 'READ_ONLY' | 'SAFE_EXECUTE' | 'CONFIRMATION_REQUIRED';
  handler?: (params: Record<string, any>) => Promise<any>;
}

export class ToolAllowlist {
  private allowedTools: Map<string, ToolDefinition> = new Map();

  constructor() {
    // Register safe YouTube and music browser tools strictly on allowlisted domain
    this.registerTool({
      id: 'open_youtube',
      name: 'Open YouTube',
      description: 'Safely opens YouTube in the default browser using allowlisted domain https://www.youtube.com',
      requiresInternet: true,
      permissionLevel: 'SAFE_EXECUTE',
    });
    this.registerTool({
      id: 'search_youtube',
      name: 'Search YouTube',
      description: 'Safely searches for songs or videos on YouTube using allowlisted domain https://www.youtube.com',
      requiresInternet: true,
      permissionLevel: 'SAFE_EXECUTE',
    });
    this.registerTool({
      id: 'play_music',
      name: 'Play Music',
      description: 'Safely plays music or opens YouTube music search using allowlisted domain https://www.youtube.com',
      requiresInternet: true,
      permissionLevel: 'SAFE_EXECUTE',
    });
    this.registerTool({
      id: 'stop_music',
      name: 'Stop Music',
      description: 'Safely pauses or stops music playback and media streams without closing unrelated tabs',
      requiresInternet: false,
      permissionLevel: 'SAFE_EXECUTE',
    });
  }

  public registerTool(tool: ToolDefinition): void {
    this.allowedTools.set(tool.id, tool);
  }

  public isAllowed(toolId: string): boolean {
    return this.allowedTools.has(toolId);
  }

  public getTool(toolId: string): ToolDefinition | undefined {
    return this.allowedTools.get(toolId);
  }

  public listTools(): ToolDefinition[] {
    return Array.from(this.allowedTools.values());
  }
}

export const toolAllowlist = new ToolAllowlist();
