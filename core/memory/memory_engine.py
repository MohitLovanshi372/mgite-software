"""
Memory Engine Foundation (Python / SQLite)
Manages local SQLite database, tables for preferences, conversations,
messages, and selective long-term memory items with sensitivity levels.
"""

import sqlite3
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from enum import Enum

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "assistant.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


class SensitivityLevel(str, Enum):
    PUBLIC = "PUBLIC"
    NORMAL = "NORMAL"
    PRIVATE = "PRIVATE"
    SENSITIVE = "SENSITIVE"


class MemoryEngine:
    """Local SQLite Memory Engine interface and storage foundation."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DEFAULT_DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _init_db(self) -> None:
        """Run schema migration to ensure all tables and indexes exist."""
        with self._get_connection() as conn:
            if SCHEMA_PATH.exists():
                with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                    conn.executescript(f.read())

    # --- Conversation & Messages ---
    def create_conversation(self, title: str = "New Conversation") -> str:
        conv_id = str(uuid.uuid4())
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO conversations (id, title) VALUES (?, ?)",
                (conv_id, title),
            )
        return conv_id

    def list_conversations(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC"
            )
            return [dict(row) for row in cursor.fetchall()]

    def add_message(
        self,
        conversation_id: str,
        sender: str,
        content: str,
        language: str = "en",
        tokens_used: int = 0,
    ) -> str:
        msg_id = str(uuid.uuid4())
        with self._get_connection() as conn:
            # Ensure conversation exists
            conv = conn.execute("SELECT id FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
            if not conv:
                conn.execute(
                    "INSERT INTO conversations (id, title) VALUES (?, ?)",
                    (conversation_id, content[:30] + "..." if len(content) > 30 else content),
                )
            else:
                conn.execute(
                    "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (conversation_id,),
                )

            conn.execute(
                """
                INSERT INTO messages (id, conversation_id, sender, content, language, tokens_used)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (msg_id, conversation_id, sender, content, language, tokens_used),
            )
        return msg_id

    def get_messages(self, conversation_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT id, conversation_id, sender, content, language, tokens_used, created_at
                FROM messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
                LIMIT ?
                """,
                (conversation_id, limit),
            )
            return [dict(row) for row in cursor.fetchall()]

    def delete_conversation(self, conversation_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
            return cursor.rowcount > 0

    # --- Selective Long-Term Memory ---
    def store_memory_item(
        self,
        key: str,
        value: str,
        category: str = "general",
        sensitivity: SensitivityLevel = SensitivityLevel.NORMAL,
    ) -> str:
        """Stores a selective memory item. Does NOT store raw conversations unconditionally."""
        item_id = str(uuid.uuid4())
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO memory_items (id, category, key, value, sensitivity)
                VALUES (?, ?, ?, ?, ?)
                """,
                (item_id, category, key, value, sensitivity.value),
            )
        return item_id

    def list_memory_items(
        self, category: Optional[str] = None, max_sensitivity: Optional[SensitivityLevel] = None
    ) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            query = "SELECT id, category, key, value, sensitivity, created_at, updated_at FROM memory_items"
            params = []
            conditions = []

            if category:
                conditions.append("category = ?")
                params.append(category)

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " ORDER BY updated_at DESC"
            cursor = conn.execute(query, params)
            rows = [dict(r) for r in cursor.fetchall()]

            # Filter out sensitive memories if policy restricts
            if max_sensitivity == SensitivityLevel.PUBLIC:
                rows = [r for r in rows if r["sensitivity"] == "PUBLIC"]
            elif max_sensitivity == SensitivityLevel.NORMAL:
                rows = [r for r in rows if r["sensitivity"] in ("PUBLIC", "NORMAL")]

            return rows

    def delete_memory_item(self, item_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.execute("DELETE FROM memory_items WHERE id = ?", (item_id,))
            return cursor.rowcount > 0

    def clear_all_data(self) -> None:
        """For privacy or user reset requests."""
        with self._get_connection() as conn:
            conn.execute("DELETE FROM messages")
            conn.execute("DELETE FROM conversations")
            conn.execute("DELETE FROM memory_items")
            conn.execute("DELETE FROM user_preferences")


# Singleton instance
memory_engine = MemoryEngine()
