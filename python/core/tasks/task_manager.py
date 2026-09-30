"""
Task Manager (Python Edition)
Executes, monitors, and manages sequential multi-step tasks.

Strict Architectural Pipeline:
User Request
→ Intent Detection
→ Task Planner
→ Task Manager
→ Permission Gate
→ Tool Registry
→ Tool Execution
→ Result Verification
→ Task State Update
→ Spoken Response
"""

from datetime import datetime
from typing import Dict, List, Optional
from .types import Task, TaskStep, TaskStatus, StepStatus
from .task_planner import TaskPlanner
from ..security.permission_gate import PermissionGate


class TaskManager:
    def __init__(self):
        self._tasks: Dict[str, Task] = {}
        self._active_task_id: Optional[str] = None

    def create_task(self, user_request: str) -> Task:
        task = TaskPlanner.plan(user_request)
        self._tasks[task.task_id] = task
        self._active_task_id = task.task_id
        return task

    def get_task(self, task_id: str) -> Optional[Task]:
        return self._tasks.get(task_id)

    def get_active_task(self) -> Optional[Task]:
        if self._active_task_id:
            return self._tasks.get(self._active_task_id)
        return None

    def list_tasks(self) -> List[Task]:
        return list(self._tasks.values())

    def start_task(self, task_id: str, tool_executor=None) -> Task:
        task = self._tasks.get(task_id)
        if not task:
            raise KeyError(f"Task '{task_id}' not found.")

        task.status = TaskStatus.RUNNING
        task.updated_at = datetime.utcnow().isoformat()

        # Execute steps sequentially
        for idx in range(task.current_step_index, len(task.steps)):
            step = task.steps[idx]
            task.current_step_index = idx

            # If task paused or cancelled externally
            if task.status in (TaskStatus.PAUSED, TaskStatus.CANCELLED):
                break

            step.status = StepStatus.RUNNING

            # 1. Permission Gate check
            perm = PermissionGate.check_permission(
                step.tool_name,
                step.tool_parameters,
                has_user_confirmed=(task.confirmation_status == "CONFIRMED")
            )

            if not perm.allowed:
                if perm.requires_user_confirmation:
                    task.status = TaskStatus.WAITING_FOR_CONFIRMATION
                    task.requires_confirmation = True
                    task.confirmation_status = "PENDING"
                    step.status = StepStatus.PENDING
                    return task
                else:
                    step.status = StepStatus.FAILED
                    step.error = perm.reason
                    task.status = TaskStatus.FAILED
                    task.error = perm.reason
                    self._skip_remaining_steps(task, idx + 1)
                    return task

            # 2. Tool Execution
            try:
                if tool_executor:
                    exec_result = tool_executor(step.tool_name, perm.sanitized_parameters)
                else:
                    from ..tools.tool_registry import ToolRegistry
                    exec_result = ToolRegistry.execute_tool(step.tool_name, perm.sanitized_parameters)

                # 3. Verification Invariant:
                # Never tell user action succeeded unless tool returns successful verified result.
                step.status = StepStatus.VERIFYING
                if exec_result.get("success", False):
                    step.status = StepStatus.COMPLETED
                    step.verified = True
                    step.result = exec_result.get("output")
                else:
                    step.status = StepStatus.FAILED
                    step.error = exec_result.get("error", "Verification returned failure")
                    task.status = TaskStatus.FAILED
                    task.error = step.error
                    self._skip_remaining_steps(task, idx + 1)
                    return task

            except Exception as e:
                step.status = StepStatus.FAILED
                step.error = str(e)
                task.status = TaskStatus.FAILED
                task.error = str(e)
                self._skip_remaining_steps(task, idx + 1)
                return task

        # If all steps completed
        if all(s.status == StepStatus.COMPLETED for s in task.steps):
            task.status = TaskStatus.COMPLETED
            last_step = task.steps[-1]
            task.result = last_step.result or "Ho gaya. Task poora ho gaya hai."

        task.updated_at = datetime.utcnow().isoformat()
        return task

    def pause_task(self, task_id: str) -> Task:
        task = self._tasks.get(task_id)
        if not task:
            raise KeyError(f"Task '{task_id}' not found.")
        task.status = TaskStatus.PAUSED
        task.updated_at = datetime.utcnow().isoformat()
        return task

    def resume_task(self, task_id: str, tool_executor=None) -> Task:
        task = self._tasks.get(task_id)
        if not task:
            raise KeyError(f"Task '{task_id}' not found.")
        task.status = TaskStatus.RUNNING
        return self.start_task(task_id, tool_executor=tool_executor)

    def cancel_task(self, task_id: str) -> Task:
        task = self._tasks.get(task_id)
        if not task:
            raise KeyError(f"Task '{task_id}' not found.")
        task.status = TaskStatus.CANCELLED
        self._skip_remaining_steps(task, task.current_step_index)
        task.updated_at = datetime.utcnow().isoformat()
        if self._active_task_id == task_id:
            self._active_task_id = None
        return task

    def retry_step(self, task_id: str, tool_executor=None) -> Task:
        task = self._tasks.get(task_id)
        if not task:
            raise KeyError(f"Task '{task_id}' not found.")
        step = task.steps[task.current_step_index]
        step.status = StepStatus.PENDING
        step.retry_count += 1
        step.error = None
        task.status = TaskStatus.RUNNING
        return self.start_task(task_id, tool_executor=tool_executor)

    def confirm_task(self, task_id: str, confirmed: bool, tool_executor=None) -> Task:
        task = self._tasks.get(task_id)
        if not task:
            raise KeyError(f"Task '{task_id}' not found.")
        if confirmed:
            task.confirmation_status = "CONFIRMED"
            task.status = TaskStatus.RUNNING
            return self.start_task(task_id, tool_executor=tool_executor)
        else:
            task.confirmation_status = "REJECTED"
            return self.cancel_task(task_id)

    def _skip_remaining_steps(self, task: Task, from_index: int):
        for i in range(from_index, len(task.steps)):
            task.steps[i].status = StepStatus.SKIPPED
