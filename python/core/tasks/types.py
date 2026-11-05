"""
Task Engine Models & Dataclasses (Python Edition)
Defines structured multi-step tasks, planning, verification, and status lifecycles.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class TaskStatus(str, Enum):
    PLANNING = "PLANNING"
    WAITING_FOR_CONFIRMATION = "WAITING_FOR_CONFIRMATION"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class TaskPriority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class StepStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


@dataclass
class TaskStep:
    step_id: str
    step_number: int
    name: str
    description: str
    tool_name: str
    tool_parameters: Dict[str, Any] = field(default_factory=dict)
    status: StepStatus = StepStatus.PENDING
    result: Optional[Any] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 2
    requires_verification: bool = True
    verified: bool = False


@dataclass
class Task:
    task_id: str
    user_request: str
    title: str
    status: TaskStatus = TaskStatus.PLANNING
    priority: TaskPriority = TaskPriority.NORMAL
    steps: List[TaskStep] = field(default_factory=list)
    current_step_index: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    result: Optional[Any] = None
    error: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_status: str = "NONE"  # 'NONE' | 'PENDING' | 'CONFIRMED' | 'REJECTED'
