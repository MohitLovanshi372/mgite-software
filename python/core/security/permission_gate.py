"""
Permission Gate (Python Edition)
Enforces strict security boundaries before any tool is executed:
1. Verifies tool is registered in Tool Allowlist
2. Validates risk level and checks required user confirmation
3. Scans parameters for prompt injection or sensitive tokens
4. Absolutely blocks arbitrary shell, python, unrestricted fs, auto payment, auto deletion
"""

import re
from dataclasses import dataclass, field
from typing import Any, Dict, Optional
from .privacy_filter import PrivacyFilter


@dataclass
class PermissionCheckResult:
    allowed: bool
    requires_user_confirmation: bool
    risk_level: str  # 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    sanitized_parameters: Dict[str, Any] = field(default_factory=dict)
    reason: Optional[str] = None
    confirmation_prompt: Optional[str] = None


class PermissionGate:
    PROHIBITED_TOOLS = {
        'bash', 'sh', 'zsh', 'powershell', 'cmd', 'python', 'eval', 'exec',
        'run_script', 'delete_file', 'format_disk', 'send_payment', 'transfer_money',
        'change_password'
    }

    DANGEROUS_PARAM_REGEX = re.compile(
        r'(rm\s+-rf|format\s+[a-z]:|mkfs|dd\s+if=|;\s*rm|\|\s*bash|powershell\s+-enc|<script)',
        re.IGNORECASE
    )

    # Allowed safe tools registry
    SAFE_TOOLS = {
        'get_system_status': {'risk': 'LOW', 'confirm': False, 'desc': 'Check system telemetry'},
        'get_current_time': {'risk': 'LOW', 'confirm': False, 'desc': 'Get current local time'},
        'open_youtube': {'risk': 'LOW', 'confirm': False, 'desc': 'Safely open YouTube URL'},
        'search_youtube': {'risk': 'LOW', 'confirm': False, 'desc': 'Search YouTube media'},
        'play_music': {'risk': 'LOW', 'confirm': False, 'desc': 'Play music'},
        'stop_music': {'risk': 'LOW', 'confirm': False, 'desc': 'Stop music playback'},
        'schedule_reminder': {'risk': 'LOW', 'confirm': False, 'desc': 'Schedule reminder'},
        'verify_system_status': {'risk': 'LOW', 'confirm': False, 'desc': 'Verify system status'},
        'verify_time': {'risk': 'LOW', 'confirm': False, 'desc': 'Verify current time'},
        'verify_youtube_opened': {'risk': 'LOW', 'confirm': False, 'desc': 'Verify YouTube opened'},
        'verify_search_completed': {'risk': 'LOW', 'confirm': False, 'desc': 'Verify YouTube search'},
        'verify_reminder_scheduled': {'risk': 'LOW', 'confirm': False, 'desc': 'Verify reminder created'},
        'report_result': {'risk': 'LOW', 'confirm': False, 'desc': 'Report final result'},
    }

    @classmethod
    def check_permission(
        cls,
        tool_name: str,
        raw_parameters: Optional[Dict[str, Any]] = None,
        has_user_confirmed: bool = False
    ) -> PermissionCheckResult:
        tool = (tool_name or "").lower().strip()
        params = raw_parameters or {}

        # 1. Prohibited execution tools check
        if tool in cls.PROHIBITED_TOOLS:
            return PermissionCheckResult(
                allowed=False,
                requires_user_confirmation=False,
                risk_level="CRITICAL",
                reason=f"SECURITY POLICY: Unrestricted execution via '{tool_name}' is strictly prohibited.",
                sanitized_parameters={}
            )

        # 2. Allowlist verification
        tool_meta = cls.SAFE_TOOLS.get(tool)
        if not tool_meta:
            return PermissionCheckResult(
                allowed=False,
                requires_user_confirmation=False,
                risk_level="HIGH",
                reason=f"Tool '{tool_name}' is not in the safe allowlist.",
                sanitized_parameters={}
            )

        # 3. Parameter scanning & privacy filtering
        sanitized_params: Dict[str, Any] = {}
        for key, value in params.items():
            if isinstance(value, str):
                if cls.DANGEROUS_PARAM_REGEX.search(value):
                    return PermissionCheckResult(
                        allowed=False,
                        requires_user_confirmation=False,
                        risk_level="CRITICAL",
                        reason=f"Dangerous command injection payload in parameter '{key}'.",
                        sanitized_parameters={}
                    )
                privacy = PrivacyFilter.filter_text(value)
                if privacy.is_blocked:
                    return PermissionCheckResult(
                        allowed=False,
                        requires_user_confirmation=False,
                        risk_level="HIGH",
                        reason=f"Sensitive token (OTP or password) detected in parameter '{key}'.",
                        sanitized_parameters={}
                    )
                sanitized_params[key] = privacy.clean_text
            else:
                sanitized_params[key] = value

        # 4. Confirmation requirement check
        requires_confirm = tool_meta.get('confirm', False)
        risk = tool_meta.get('risk', 'LOW')

        if requires_confirm and not has_user_confirmed:
            return PermissionCheckResult(
                allowed=False,
                requires_user_confirmation=True,
                risk_level=risk,
                reason="User confirmation required prior to execution.",
                sanitized_parameters=sanitized_params,
                confirmation_prompt=f"Aapki pushti ki zaroorat hai: Kya aap '{tool_name}' execute karna chahte hain?"
            )

        return PermissionCheckResult(
            allowed=True,
            requires_user_confirmation=False,
            risk_level=risk,
            sanitized_parameters=sanitized_params
        )
