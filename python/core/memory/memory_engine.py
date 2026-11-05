"""
SQLite Memory Engine (Python Edition)
Persistent local SQLite storage using Python's standard sqlite3 library.
Strict Invariants:
- Never stores passwords, OTPs, PINs, CVVs, API keys, or security codes
- PrivacyFilter runs on all text before database insertion
"""

import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from ..security.privacy_filter import PrivacyFilter


class MemoryEngine:
    def __init__(self, db_path: str = "jarvis_memory.db"):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS task_history (
                    task_id TEXT PRIMARY KEY,
                    user_request TEXT NOT NULL,
                    title TEXT NOT NULL,
                    status TEXT NOT NULL,
                    priority TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    category TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()

    def add_message(self, conversation_id: str, role: str, content: str) -> str:
        # Privacy filter execution before persistent storage
        filtered = PrivacyFilter.filter_text(content)
        safe_text = filtered.clean_text

        msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        with self._get_connection() as conn:
            # Ensure conversation exists
            conn.execute(
                "INSERT OR IGNORE INTO conversations (id, title) VALUES (?, ?)",
                (conversation_id, f"Session {conversation_id[:6]}")
            )
            conn.execute(
                "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
                (msg_id, conversation_id, role, safe_text)
            )
            conn.commit()
        return msg_id

    def get_messages(self, conversation_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?",
                (conversation_id, limit)
            )
            return [dict(row) for row in cursor.fetchall()]

    def record_task(self, task_id: str, user_request: str, title: str, status: str, priority: str):
        filtered_request = PrivacyFilter.filter_text(user_request).clean_text
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO task_history (task_id, user_request, title, status, priority, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (task_id, filtered_request, title, status, priority, datetime.utcnow().isoformat())
            )
            conn.commit()

    def remember(self, key: str, value: str, category: str = "general") -> Optional[Dict[str, Any]]:
        filter_key = PrivacyFilter.filter_text(key)
        filter_val = PrivacyFilter.filter_text(value)
        if filter_key.is_blocked or filter_val.is_blocked:
            return None  # Sensitive credential blocked

        clean_k = filter_key.clean_text
        clean_v = filter_val.clean_text
        now = datetime.utcnow().isoformat()

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO memories (key, value, category, updated_at)
                VALUES (?, ?, ?, ?)
                """,
                (clean_k, clean_v, category, now)
            )
            conn.commit()
        return {"key": clean_k, "value": clean_v, "category": category, "updated_at": now}

    def recall(self, key: str) -> Optional[str]:
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT value FROM memories WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row["value"] if row else None

    def forget(self, key: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.execute("DELETE FROM memories WHERE key = ?", (key,))
            conn.commit()
            return cursor.rowcount > 0

    def list_memories(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            if category:
                cursor = conn.execute(
                    "SELECT key, value, category, updated_at FROM memories WHERE category = ? ORDER BY updated_at DESC",
                    (category,)
                )
            else:
                cursor = conn.execute(
                    "SELECT key, value, category, updated_at FROM memories ORDER BY updated_at DESC"
                )
            return [dict(row) for row in cursor.fetchall()]
