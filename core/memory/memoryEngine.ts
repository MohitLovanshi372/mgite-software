/**
 * SQLite Memory Engine (TypeScript / Node.js)
 * Implements persistent local SQLite storage using Node 22 native DatabaseSync.
 * Stores conversations, messages, and selective memory items with sensitivity levels.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

export type SensitivityLevel = 'PUBLIC' | 'NORMAL' | 'PRIVATE' | 'SENSITIVE';

export type MemoryType =
  | 'PREFERENCE'
  | 'FACT'
  | 'PROJECT'
  | 'TASK_CONTEXT'
  | 'CONVERSATION_CONTEXT';

export type MemorySource =
  | 'USER_EXPLICIT'
  | 'USER_CONVERSATION'
  | 'SYSTEM'
  | 'IMPORTED_DOCUMENT';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  language: string;
  tokens_used: number;
  status?: string;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  sensitivity: SensitivityLevel;
  confidence: number;
  source: MemorySource;
  category: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface StoreMemoryInput {
  content?: string;
  key?: string;
  value?: string;
  category?: string;
  type?: MemoryType;
  sensitivity?: SensitivityLevel;
  confidence?: number;
  source?: MemorySource;
}

export class MemoryEngine {
  private db: DatabaseSync;
  private dbPath: string;
  private simulateFailure = false;

  constructor(customPath?: string) {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = customPath || path.join(dataDir, 'assistant.db');
    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
  }

  /**
   * For testing failure modes (e.g., Section 22: Memory Failure handling).
   */
  public setSimulateFailure(fail: boolean): void {
    this.simulateFailure = fail;
  }

  private initSchema(): void {
    const schemaSql = `
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS user_preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

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
    `;
    this.db.exec(schemaSql);
    this.migrateSchema();

    const indexesSql = `
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_memory_items_category ON memory_items(category);
      CREATE INDEX IF NOT EXISTS idx_memory_items_type ON memory_items(type);
      CREATE INDEX IF NOT EXISTS idx_memory_items_source ON memory_items(source);
      CREATE INDEX IF NOT EXISTS idx_memory_items_sensitivity ON memory_items(sensitivity);
    `;
    this.db.exec(indexesSql);
  }

  private migrateSchema(): void {
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(memory_items)").all() as any[];
      const colNames = new Set(tableInfo.map((c: any) => c.name));

      if (!colNames.has('type')) {
        this.db.exec("ALTER TABLE memory_items ADD COLUMN type TEXT NOT NULL DEFAULT 'PREFERENCE'");
      }
      if (!colNames.has('content')) {
        this.db.exec("ALTER TABLE memory_items ADD COLUMN content TEXT NOT NULL DEFAULT ''");
        this.db.exec("UPDATE memory_items SET content = value WHERE content = '' OR content IS NULL");
      }
      if (!colNames.has('confidence')) {
        this.db.exec("ALTER TABLE memory_items ADD COLUMN confidence REAL NOT NULL DEFAULT 1.0");
      }
      if (!colNames.has('source')) {
        this.db.exec("ALTER TABLE memory_items ADD COLUMN source TEXT NOT NULL DEFAULT 'USER_EXPLICIT'");
      }
    } catch {
      // Best-effort migration
    }

    try {
      const msgTableInfo = this.db.prepare("PRAGMA table_info(messages)").all() as any[];
      const msgCols = new Set(msgTableInfo.map((c: any) => c.name));
      if (!msgCols.has('status')) {
        this.db.exec("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'delivered'");
      }
    } catch {
      // Best-effort migration
    }
  }

  public createConversation(title: string = 'New Conversation'): string {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(
      'INSERT INTO conversations (id, title) VALUES (?, ?)'
    );
    stmt.run(id, title);
    return id;
  }

  public listConversations(): Conversation[] {
    const stmt = this.db.prepare(
      'SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC'
    );
    return stmt.all() as unknown as Conversation[];
  }

  public addMessage(
    conversationId: string,
    sender: 'user' | 'assistant' | 'system',
    content: string,
    language: string = 'en',
    tokensUsed: number = 0
  ): string {
    const msgId = crypto.randomUUID();

    // Verify or auto-create conversation
    const checkStmt = this.db.prepare('SELECT id FROM conversations WHERE id = ?');
    const existing = checkStmt.get(conversationId);
    if (!existing) {
      const title = content.length > 30 ? content.slice(0, 30) + '...' : content;
      this.db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, title || 'Conversation');
    } else {
      this.db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
    }

    const insertStmt = this.db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, content, language, tokens_used)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(msgId, conversationId, sender, content, language, tokensUsed);
    return msgId;
  }

  public getMessages(conversationId: string, limit: number = 50): ChatMessage[] {
    const stmt = this.db.prepare(`
      SELECT id, conversation_id, sender, content, language, tokens_used, created_at
      FROM (
        SELECT rowid, id, conversation_id, sender, content, language, tokens_used, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY rowid DESC
        LIMIT ?
      )
      ORDER BY rowid ASC
    `);
    return stmt.all(conversationId, limit) as unknown as ChatMessage[];
  }

  public deleteConversation(conversationId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM conversations WHERE id = ?');
    const result = stmt.run(conversationId);
    return (result.changes ?? 0) > 0;
  }

  // --- Selective Long-Term Memory ---
  public storeMemoryItem(
    keyOrInput: string | StoreMemoryInput,
    value?: string,
    category: string = 'general',
    sensitivity: SensitivityLevel = 'NORMAL',
    type: MemoryType = 'PREFERENCE',
    confidence: number = 1.0,
    source: MemorySource = 'USER_EXPLICIT'
  ): string {
    if (this.simulateFailure) {
      throw new Error('DATABASE_WRITE_ERROR: Simulated SQLite storage failure.');
    }

    let finalKey = '';
    let finalVal = '';
    let finalContent = '';
    let finalCategory = category;
    let finalSensitivity = sensitivity;
    let finalType = type;
    let finalConfidence = confidence;
    let finalSource = source;

    if (typeof keyOrInput === 'object' && keyOrInput !== null) {
      finalContent = (keyOrInput.content || keyOrInput.value || keyOrInput.key || '').trim();
      finalVal = (keyOrInput.value || finalContent).trim();
      finalKey = (keyOrInput.key || (finalContent.length > 40 ? finalContent.slice(0, 40) + '...' : finalContent)).trim();
      finalCategory = keyOrInput.category || 'general';
      finalSensitivity = keyOrInput.sensitivity || 'NORMAL';
      finalType = keyOrInput.type || 'PREFERENCE';
      finalConfidence = typeof keyOrInput.confidence === 'number' ? keyOrInput.confidence : 1.0;
      finalSource = keyOrInput.source || 'USER_EXPLICIT';
    } else {
      const keyStr = typeof keyOrInput === 'string' ? keyOrInput : '';
      finalKey = keyStr.trim();
      finalVal = (value !== undefined ? value : finalKey).trim();
      finalContent = (value !== undefined && value.trim() ? value : finalKey).trim();
      finalCategory = category;
      finalSensitivity = sensitivity;
      finalType = type;
      finalConfidence = confidence;
      finalSource = source;
    }

    if (!finalContent && !finalVal && !finalKey) {
      throw new Error('INVALID_PAYLOAD: Memory content cannot be empty.');
    }

    // Duplicate Detection & Safe Update (Section 19 Test 19: duplicate memory handling)
    const checkStmt = this.db.prepare(`
      SELECT id FROM memory_items
      WHERE (LOWER(TRIM(content)) = LOWER(TRIM(?)) AND type = ?)
         OR (LOWER(TRIM(key)) = LOWER(TRIM(?)) AND LOWER(TRIM(value)) = LOWER(TRIM(?)))
      LIMIT 1
    `);
    const existing = checkStmt.get(finalContent, finalType, finalKey, finalVal) as any;

    if (existing?.id) {
      const updateStmt = this.db.prepare(`
        UPDATE memory_items
        SET updated_at = CURRENT_TIMESTAMP,
            confidence = ?,
            sensitivity = ?,
            source = ?,
            content = ?,
            value = ?
        WHERE id = ?
      `);
      updateStmt.run(finalConfidence, finalSensitivity, finalSource, finalContent, finalVal, existing.id);
      return existing.id;
    }

    const id = crypto.randomUUID();
    const insertStmt = this.db.prepare(`
      INSERT INTO memory_items (id, type, content, sensitivity, confidence, source, category, key, value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      id,
      finalType,
      finalContent,
      finalSensitivity,
      finalConfidence,
      finalSource,
      finalCategory,
      finalKey,
      finalVal
    );
    return id;
  }

  public getMemoryItem(id: string): MemoryItem | null {
    const stmt = this.db.prepare(`
      SELECT id, type, content, sensitivity, confidence, source, category, key, value, created_at, updated_at
      FROM memory_items
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return (row as unknown as MemoryItem) || null;
  }

  public listMemoryItems(
    categoryOrFilter?: string | { category?: string; type?: MemoryType; maxSensitivity?: SensitivityLevel }
  ): MemoryItem[] {
    let category: string | undefined;
    let type: MemoryType | undefined;
    let maxSensitivity: SensitivityLevel | undefined;

    if (typeof categoryOrFilter === 'string') {
      category = categoryOrFilter;
    } else if (categoryOrFilter && typeof categoryOrFilter === 'object') {
      category = categoryOrFilter.category;
      type = categoryOrFilter.type;
      maxSensitivity = categoryOrFilter.maxSensitivity;
    }

    let query = `
      SELECT id, type, content, sensitivity, confidence, source, category, key, value, created_at, updated_at
      FROM memory_items
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (maxSensitivity === 'PUBLIC') {
      query += " AND sensitivity = 'PUBLIC'";
    } else if (maxSensitivity === 'NORMAL') {
      query += " AND sensitivity IN ('PUBLIC', 'NORMAL')";
    }

    query += ' ORDER BY updated_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as unknown as MemoryItem[];
  }

  public findMemoryByContent(query: string): MemoryItem | null {
    const q = `%${query.trim()}%`;
    const stmt = this.db.prepare(`
      SELECT id, type, content, sensitivity, confidence, source, category, key, value, created_at, updated_at
      FROM memory_items
      WHERE LOWER(content) LIKE LOWER(?)
         OR LOWER(value) LIKE LOWER(?)
         OR LOWER(key) LIKE LOWER(?)
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    const row = stmt.get(q, q, q);
    return (row as unknown as MemoryItem) || null;
  }

  public deleteMemoryItem(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM memory_items WHERE id = ?');
    const result = stmt.run(id);
    return (result.changes ?? 0) > 0;
  }

  public deleteMemoryByContent(query: string): boolean {
    const q = `%${query.trim()}%`;
    const stmt = this.db.prepare(`
      DELETE FROM memory_items
      WHERE LOWER(content) LIKE LOWER(?)
         OR LOWER(value) LIKE LOWER(?)
         OR LOWER(key) LIKE LOWER(?)
    `);
    const result = stmt.run(q, q, q);
    return (result.changes ?? 0) > 0;
  }

  /**
   * Clears ALL long-term memory items.
   * CRITICAL: Leaves conversation messages and conversation history completely separate and intact!
   */
  public clearMemories(): number {
    const stmt = this.db.prepare('DELETE FROM memory_items');
    const result = stmt.run();
    return Number(result.changes ?? 0);
  }

  /**
   * Clears conversation history without touching long-term memory items.
   */
  public clearConversationHistory(conversationId?: string): number {
    if (conversationId) {
      const stmt = this.db.prepare('DELETE FROM messages WHERE conversation_id = ?');
      const res = stmt.run(conversationId);
      return Number(res.changes ?? 0);
    }
    const stmt1 = this.db.prepare('DELETE FROM messages');
    const r1 = stmt1.run();
    const stmt2 = this.db.prepare('DELETE FROM conversations');
    stmt2.run();
    return Number(r1.changes ?? 0);
  }

  public getStats(): { conversations: number; messages: number; memoryItems: number } {
    const cCount = (this.db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any)?.count ?? 0;
    const mCount = (this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as any)?.count ?? 0;
    const memCount = (this.db.prepare('SELECT COUNT(*) as count FROM memory_items').get() as any)?.count ?? 0;
    return {
      conversations: Number(cCount),
      messages: Number(mCount),
      memoryItems: Number(memCount),
    };
  }

  public clearAll(): void {
    this.db.exec(`
      DELETE FROM messages;
      DELETE FROM conversations;
      DELETE FROM memory_items;
      DELETE FROM user_preferences;
    `);
  }
}

export const memoryEngine = new MemoryEngine();
