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
    // In Phase 1, no arbitrary OS tools are allowed.
    // Tool list is strictly controlled.
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
