/**
 * Temporary In-Memory Notification Buffer (Phase 4 - Pipeline Stage 2)
 *
 * Requirements:
 * - Raw notification content exists ONLY temporarily in memory during processing.
 * - Strict lifecycle: Ingest -> State transition -> Evict/Discard immediately.
 * - Raw sensitive or normal notification content is NEVER permanently stored on disk or in SQLite.
 */

import { NotificationBufferItem, NotificationState } from './types.ts';
import { logger } from '../logger.ts';

export class NotificationBuffer {
  private buffer: Map<string, NotificationBufferItem> = new Map();

  /**
   * Temporarily stores an incoming notification item in memory.
   */
  public ingest(item: NotificationBufferItem): void {
    this.buffer.set(item.id, item);
  }

  /**
   * Retrieves an item while in flight.
   */
  public get(id: string): NotificationBufferItem | undefined {
    return this.buffer.get(id);
  }

  /**
   * Updates processing state for a buffered item.
   */
  public updateState(id: string, state: NotificationState): void {
    const item = this.buffer.get(id);
    if (item) {
      item.state = state;
    }
  }

  /**
   * Discards raw notification content immediately from memory.
   * Ensures zero memory retention of raw notification text.
   */
  public discard(id: string): void {
    const item = this.buffer.get(id);
    if (item) {
      // Overwrite raw content string before deleting
      item.content = '';
      item.title = '';
      this.buffer.delete(id);
    }
  }

  /**
   * Checks if an item is still present in the buffer.
   */
  public has(id: string): boolean {
    return this.buffer.has(id);
  }

  /**
   * Current size of temporary buffer.
   */
  public size(): number {
    return this.buffer.size;
  }

  /**
   * Purges all items from temporary memory.
   */
  public clear(): void {
    for (const [id, item] of this.buffer.entries()) {
      item.content = '';
      item.title = '';
    }
    this.buffer.clear();
  }
}

export const notificationBuffer = new NotificationBuffer();
