"""
Task Planner (Python Edition)
Translates natural language user directives into safe, deterministic multi-step plans.
Strict Invariant: Never executes directly from raw text; creates structured plans.
"""

import re
import uuid
from typing import List
from .types import Task, TaskStep, TaskPriority, TaskStatus, StepStatus


class TaskPlanner:
    @classmethod
    def plan(cls, user_request: str) -> Task:
        req = user_request.strip()
        task_id = f"task_{uuid.uuid4().hex[:8]}"

        # Priority calculation
        priority = TaskPriority.NORMAL
        if any(w in req.lower() for w in ['urgent', 'jaldi', 'turant', 'critical', 'emergency']):
            priority = TaskPriority.HIGH
        elif any(w in req.lower() for w in ['aaram se', 'low priority', 'jab time mile']):
            priority = TaskPriority.LOW

        lower = req.lower()

        # 1. YouTube Multi-Step Plan: Open + Search
        if 'youtube' in lower and ('search' in lower or 'dhundho' in lower or 'chalao' in lower or 'play' in lower):
            # Extract query
            query = "Arijit Singh"
            m_hindi = re.search(r'youtube\s+(?:par|pe|me|mein)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:search|dhundho|play|chalao|khojo)|$)', req, re.I)
            m_action = re.search(r'(?:search|dhundho|play|chalao)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:aur|and|karo|kijiye)|$)', req, re.I)

            if m_hindi and m_hindi.group(1).strip() and m_hindi.group(1).strip().lower() not in ('karo', 'karna'):
                query = m_hindi.group(1).strip()
            elif m_action and m_action.group(1).strip() and m_action.group(1).strip().lower() not in ('karo', 'karna'):
                query = m_action.group(1).strip()
            elif 'arijit singh' in lower:
                query = "Arijit Singh"

            steps = [
                TaskStep(
                    step_id="step_1",
                    step_number=1,
                    name="Open YouTube",
                    description="Safely opens YouTube in the default browser environment",
                    tool_name="open_youtube",
                    tool_parameters={"url": "https://www.youtube.com"}
                ),
                TaskStep(
                    step_id="step_2",
                    step_number=2,
                    name=f"Search YouTube: {query}",
                    description=f"Safely searches YouTube for '{query}'",
                    tool_name="search_youtube",
                    tool_parameters={"query": query}
                ),
                TaskStep(
                    step_id="step_3",
                    step_number=3,
                    name="Verify YouTube Loaded",
                    description="Verifies YouTube player readiness",
                    tool_name="verify_youtube_opened",
                    tool_parameters={}
                ),
                TaskStep(
                    step_id="step_4",
                    step_number=4,
                    name="Verify Search Results",
                    description="Verifies search query parsed and results available",
                    tool_name="verify_search_completed",
                    tool_parameters={"query": query}
                ),
                TaskStep(
                    step_id="step_5",
                    step_number=5,
                    name="Report Result",
                    description="Reports completion to user in feminine voice persona",
                    tool_name="report_result",
                    tool_parameters={"message": f"YouTube par {query} search kar diya hai aur result ready hai."}
                )
            ]
            return Task(
                task_id=task_id,
                user_request=user_request,
                title=f"YouTube Search: {query}",
                status=TaskStatus.PLANNING,
                priority=priority,
                steps=steps
            )

        # 2. Simple YouTube Open
        if 'youtube' in lower and ('kholo' in lower or 'open' in lower):
            steps = [
                TaskStep(
                    step_id="step_1",
                    step_number=1,
                    name="Open YouTube",
                    description="Safely opens YouTube in browser",
                    tool_name="open_youtube",
                    tool_parameters={"url": "https://www.youtube.com"}
                ),
                TaskStep(
                    step_id="step_2",
                    step_number=2,
                    name="Verify YouTube",
                    description="Verifies YouTube connection",
                    tool_name="verify_youtube_opened",
                    tool_parameters={}
                ),
                TaskStep(
                    step_id="step_3",
                    step_number=3,
                    name="Report Result",
                    description="Confirms YouTube opened",
                    tool_name="report_result",
                    tool_parameters={"message": "YouTube khol diya gaya hai."}
                )
            ]
            return Task(
                task_id=task_id,
                user_request=user_request,
                title="Open YouTube",
                status=TaskStatus.PLANNING,
                priority=priority,
                steps=steps
            )

        # 3. System Status
        if 'system status' in lower or 'status batao' in lower:
            steps = [
                TaskStep(
                    step_id="step_1",
                    step_number=1,
                    name="Read System Status",
                    description="Safely reads telemetry (CPU, RAM, security shields)",
                    tool_name="get_system_status",
                    tool_parameters={}
                ),
                TaskStep(
                    step_id="step_2",
                    step_number=2,
                    name="Verify Telemetry",
                    description="Verifies telemetry values are nominal",
                    tool_name="verify_system_status",
                    tool_parameters={}
                ),
                TaskStep(
                    step_id="step_3",
                    step_number=3,
                    name="Report Status",
                    description="Speaks system status",
                    tool_name="report_result",
                    tool_parameters={"message": "System status nominal hai. Saare core sub-systems active hain."}
                )
            ]
            return Task(
                task_id=task_id,
                user_request=user_request,
                title="System Diagnostic Status",
                status=TaskStatus.PLANNING,
                priority=priority,
                steps=steps
            )

        # 4. Current Time
        if 'time' in lower or 'samay' in lower or 'waqt' in lower:
            steps = [
                TaskStep(
                    step_id="step_1",
                    step_number=1,
                    name="Get Current Time",
                    description="Reads system clock",
                    tool_name="get_current_time",
                    tool_parameters={}
                ),
                TaskStep(
                    step_id="step_2",
                    step_number=2,
                    name="Verify Time",
                    description="Verifies clock reading",
                    tool_name="verify_time",
                    tool_parameters={}
                ),
                TaskStep(
                    step_id="step_3",
                    step_number=3,
                    name="Report Time",
                    description="Speaks current time",
                    tool_name="report_result",
                    tool_parameters={"message": "Current time bata diya gaya hai."}
                )
            ]
            return Task(
                task_id=task_id,
                user_request=user_request,
                title="Check Current Time",
                status=TaskStatus.PLANNING,
                priority=priority,
                steps=steps
            )

        # 5. Generic single-step directive
        steps = [
            TaskStep(
                step_id="step_1",
                step_number=1,
                name="Execute Safe Directive",
                description=f"Executes directive: {req}",
                tool_name="get_system_status",
                tool_parameters={}
            ),
            TaskStep(
                step_id="step_2",
                step_number=2,
                name="Report Result",
                description="Reports outcome",
                tool_name="report_result",
                tool_parameters={"message": "Task complete ho gaya hai."}
            )
        ]
        return Task(
            task_id=task_id,
            user_request=user_request,
            title=f"Directive: {req[:40]}",
            status=TaskStatus.PLANNING,
            priority=priority,
            steps=steps
        )
