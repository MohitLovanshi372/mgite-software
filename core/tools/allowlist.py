"""
Tool Allowlist & Permission Engine (Python)
Ensures AI cannot execute arbitrary OS commands.
All tools must be explicitly allowlisted and validated.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class ToolDefinition(BaseModel):
    id: str
    name: str
    description: str
    requires_internet: bool = False
    permission_level: str = "READ_ONLY"  # READ_ONLY, SAFE_EXECUTE, CONFIRMATION_REQUIRED


class ToolAllowlist:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}

    def register(self, tool: ToolDefinition) -> None:
        self._tools[tool.id] = tool

    def is_allowed(self, tool_id: str) -> bool:
        return tool_id in self._tools

    def get_tool(self, tool_id: str) -> Optional[ToolDefinition]:
        return self._tools.get(tool_id)

    def list_tools(self) -> List[ToolDefinition]:
        return list(self._tools.values())


tool_allowlist = ToolAllowlist()
