/**
 * Python Voice Microservice Bridge
 * Manages the persistent IPC communication pipe with the Python Voice Microservice.
 * Handles advanced multilingual text normalization, phonetic calibration,
 * and chunked audio waveform streaming.
 */

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';

export interface ProcessedVoiceText {
  original_text: string;
  normalized_text: string;
  detected_language: string;
  recommended_locale: string;
  recommended_pitch: number;
  recommended_rate: number;
  pronunciation_notes: string[];
  phoneme_count: number;
  estimated_duration_ms: number;
  phonemes: Array<{
    symbol: string;
    is_vowel: boolean;
    duration_ms: number;
    voiced: boolean;
  }>;
}

export interface VoiceStreamChunkEvent {
  id?: string;
  event: 'start' | 'chunk' | 'end' | 'error';
  text?: string;
  normalized_text?: string;
  detected_language?: string;
  sample_rate?: number;
  provider?: string;
  chunk_index?: number;
  is_last?: boolean;
  audio_base64?: string;
  duration_ms?: number;
  phonemes?: string[];
  total_chunks?: number;
  total_duration_ms?: number;
  error?: string;
}

class PythonVoiceBridge extends EventEmitter {
  private child: ChildProcessWithoutNullStreams | null = null;
  private isReady: boolean = false;
  private reqCounter: number = 0;
  private pendingRequests = new Map<string, {
    resolve: (val: any) => void;
    reject: (err: any) => void;
    onEvent?: (event: VoiceStreamChunkEvent) => void;
  }>();
  private buffer: string = '';

  constructor() {
    super();
    this.startMicroservice();
  }

  private startMicroservice() {
    try {
      const scriptPath = path.join(process.cwd(), 'python', 'voice_microservice.py');
      this.child = spawn('python3', ['-u', scriptPath, '--ipc'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.child.stdout.on('data', (chunk: Buffer) => {
        this.buffer += chunk.toString('utf-8');
        let newlineIndex: number;
        while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
          const line = this.buffer.slice(0, newlineIndex).trim();
          this.buffer = this.buffer.slice(newlineIndex + 1);
          if (line) {
            this.handleLine(line);
          }
        }
      });

      this.child.stderr.on('data', (data: Buffer) => {
        const msg = data.toString('utf-8').trim();
        if (msg) {
          console.warn('[PythonVoiceMicroservice STDERR]', msg);
        }
      });

      this.child.on('exit', (code, signal) => {
        console.warn(`[PythonVoiceMicroservice] Exited with code ${code} / signal ${signal}. Restarting in 1s...`);
        this.isReady = false;
        this.child = null;
        setTimeout(() => this.startMicroservice(), 1000);
      });

      this.child.on('error', (err) => {
        console.error('[PythonVoiceMicroservice] Spawn error:', err.message);
      });
    } catch (err: any) {
      console.error('[PythonVoiceMicroservice] Failed to start:', err.message);
    }
  }

  private handleLine(line: string) {
    try {
      const msg = JSON.parse(line);

      // Handshake
      if (msg.status === 'ready' && msg.service === 'python_voice_microservice') {
        this.isReady = true;
        this.emit('ready');
        return;
      }

      const reqId = msg.id;
      if (!reqId || !this.pendingRequests.has(reqId)) {
        return;
      }

      const handler = this.pendingRequests.get(reqId)!;

      // Handle stream chunk callback if present
      if (handler.onEvent) {
        handler.onEvent(msg);
      }

      if (msg.event === 'processed' || msg.event === 'pong') {
        handler.resolve(msg.data || msg);
        this.pendingRequests.delete(reqId);
      } else if (msg.event === 'end') {
        handler.resolve(msg);
        this.pendingRequests.delete(reqId);
      } else if (msg.event === 'error') {
        handler.reject(new Error(msg.error || 'Python Voice Microservice error'));
        this.pendingRequests.delete(reqId);
      }
    } catch (err) {
      console.error('[PythonVoiceMicroservice] Malformed IPC line:', err, line);
    }
  }

  private sendCommand(cmd: any): boolean {
    if (!this.child || !this.child.stdin.writable) {
      return false;
    }
    this.child.stdin.write(JSON.stringify(cmd) + '\n');
    return true;
  }

  public isServiceReady(): boolean {
    return this.isReady;
  }

  public async processText(text: string, options: any = {}): Promise<ProcessedVoiceText> {
    const id = `req-${++this.reqCounter}`;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      const ok = this.sendCommand({
        id,
        command: 'process_text',
        text,
        options,
      });
      if (!ok) {
        this.pendingRequests.delete(id);
        reject(new Error('Python Voice Microservice is not running'));
      }
    });
  }

  public async synthesizeStream(
    text: string,
    options: any = {},
    onEvent: (event: VoiceStreamChunkEvent) => void
  ): Promise<void> {
    const id = `stream-${++this.reqCounter}`;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject, onEvent });
      const ok = this.sendCommand({
        id,
        command: 'synthesize_stream',
        text,
        options,
      });
      if (!ok) {
        this.pendingRequests.delete(id);
        reject(new Error('Python Voice Microservice is not running'));
      }
    });
  }
}

export const pythonVoiceBridge = new PythonVoiceBridge();
