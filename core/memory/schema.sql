-- Personal AI Assistant - Core SQLite Database Schema (Phase 1 Foundation)

-- 1. Users and Local Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Messages (Chat History)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    tokens_used INTEGER DEFAULT 0,
    status TEXT DEFAULT 'delivered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 4. Selective Long-Term Memory Items with Sensitivity Levels & Extensible Types
-- TYPE: PREFERENCE, FACT, PROJECT, TASK_CONTEXT, CONVERSATION_CONTEXT
-- SENSITIVITY: PUBLIC, NORMAL, PRIVATE, SENSITIVE
-- SOURCE: USER_EXPLICIT, USER_CONVERSATION, SYSTEM, IMPORTED_DOCUMENT
CREATE TABLE IF NOT EXISTS memory_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'PREFERENCE',
    content TEXT NOT NULL DEFAULT '',
    sensitivity TEXT NOT NULL DEFAULT 'NORMAL' CHECK(sensitivity IN ('PUBLIC', 'NORMAL', 'PRIVATE', 'SENSITIVE')),
    confidence REAL NOT NULL DEFAULT 1.0,
    source TEXT NOT NULL DEFAULT 'USER_EXPLICIT',
    category TEXT NOT NULL DEFAULT 'general',
    key TEXT NOT NULL DEFAULT '',
    value TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_items_category ON memory_items(category);
CREATE INDEX IF NOT EXISTS idx_memory_items_type ON memory_items(type);
CREATE INDEX IF NOT EXISTS idx_memory_items_source ON memory_items(source);
CREATE INDEX IF NOT EXISTS idx_memory_items_sensitivity ON memory_items(sensitivity);
