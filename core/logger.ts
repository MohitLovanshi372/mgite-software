/**
 * Structured System Logger
 * Enforces privacy boundaries: NEVER logs API keys, passwords, OTPs, or private tokens.
 * Supports levels: DEBUG, INFO, WARN, ERROR.
 * Writes to memory buffer for UI viewing and appends to logs/assistant.log.
 */

import fs from 'node:fs';
import path from 'node:path';
import { redactSecretsForLogs } from './security/sanitizer.ts';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: Record<string, any>;
}

class SystemLogger {
  private inMemoryLogs: LogEntry[] = [];
  private maxLogs: number = 500;
  private logFilePath: string | null = null;

  constructor() {
    try {
      if (
        typeof process !== 'undefined' &&
        process.cwd &&
        typeof path !== 'undefined' &&
        path?.resolve &&
        typeof fs !== 'undefined' &&
        fs?.existsSync
      ) {
        const logsDir = path.resolve(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        this.logFilePath = path.join(logsDir, 'assistant.log');
      }
    } catch {
      this.logFilePath = null;
    }
  }

  private write(level: LogLevel, module: string, rawMessage: string, details?: Record<string, any>): LogEntry {
    const cleanMsg = redactSecretsForLogs(rawMessage);
    const sanitizedDetails = details
      ? JSON.parse(redactSecretsForLogs(JSON.stringify(details)))
      : undefined;

    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      level,
      module,
      message: cleanMsg,
      details: sanitizedDetails,
    };

    // Store in circular memory buffer
    this.inMemoryLogs.unshift(entry);
    if (this.inMemoryLogs.length > this.maxLogs) {
      this.inMemoryLogs.pop();
    }

    // Append to file asynchronously (safely ignoring errors in read-only setups)
    if (this.logFilePath && typeof fs !== 'undefined' && fs?.appendFileSync) {
      try {
        const line = `[${entry.timestamp}] [${level}] [${module}] ${cleanMsg} ${
          sanitizedDetails ? JSON.stringify(sanitizedDetails) : ''
        }\n`;
        fs.appendFileSync(this.logFilePath, line, 'utf8');
      } catch {
        // Ignore disk logging error gracefully
      }
    }

    // Console output for developer visibility
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (!isTest) {
      const prefix = `[${entry.timestamp}] [${level}] [${module}]`;
      if (level === 'ERROR') console.error(prefix, cleanMsg);
      else if (level === 'WARN') console.warn(prefix, cleanMsg);
      else console.log(prefix, cleanMsg);
    }

    return entry;
  }

  public debug(module: string, message: string, details?: Record<string, any>): LogEntry {
    return this.write('DEBUG', module, message, details);
  }

  public info(module: string, message: string, details?: Record<string, any>): LogEntry {
    return this.write('INFO', module, message, details);
  }

  public warn(module: string, message: string, details?: Record<string, any>): LogEntry {
    return this.write('WARN', module, message, details);
  }

  public error(module: string, message: string, details?: Record<string, any>): LogEntry {
    return this.write('ERROR', module, message, details);
  }

  public getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let result = this.inMemoryLogs;
    if (level) {
      result = result.filter((l) => l.level === level);
    }
    return result.slice(0, limit);
  }

  public clear(): void {
    this.inMemoryLogs = [];
  }
}

export const logger = new SystemLogger();
