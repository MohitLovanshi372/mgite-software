/**
 * Voice WebSocket Server
 * Attaches to the Node.js HTTP server on /ws/voice.
 * Streams real-time audio chunks and phonetic telemetry from the Python Voice Microservice
 * directly to the ultronVoice frontend client.
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { pythonVoiceBridge, VoiceStreamChunkEvent } from './pythonVoiceBridge.ts';

export function setupVoiceWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/voice' });

  wss.on('connection', (ws: WebSocket) => {
    // Send ready greeting
    ws.send(JSON.stringify({
      type: 'connection_ack',
      service: 'ultron_voice_stream',
      status: 'connected',
      sampleRate: 24000,
      microserviceReady: pythonVoiceBridge.isServiceReady(),
      timestamp: Date.now(),
    }));

    ws.on('message', async (data: Buffer | string) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, text, options, requestId } = message;

        if (type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }

        if (type === 'process_text') {
          if (!text) {
            ws.send(JSON.stringify({ type: 'error', requestId, error: 'Text is required' }));
            return;
          }
          try {
            const result = await pythonVoiceBridge.processText(text, options);
            ws.send(JSON.stringify({
              type: 'text_processed',
              requestId,
              data: result,
            }));
          } catch (err: any) {
            ws.send(JSON.stringify({
              type: 'error',
              requestId,
              error: err.message,
            }));
          }
          return;
        }

        if (type === 'synthesize') {
          if (!text || typeof text !== 'string') {
            ws.send(JSON.stringify({ type: 'error', requestId, error: 'Text is required for synthesis' }));
            return;
          }

          try {
            await pythonVoiceBridge.synthesizeStream(text, options, (event: VoiceStreamChunkEvent) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'stream_event',
                  requestId,
                  ...event,
                }));
              }
            });
          } catch (err: any) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'stream_event',
                requestId,
                event: 'error',
                error: err.message,
              }));
            }
          }
          return;
        }

        if (type === 'cancel') {
          // Client requested cancellation
          ws.send(JSON.stringify({
            type: 'stream_event',
            requestId,
            event: 'end',
            cancelled: true,
          }));
          return;
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON payload' }));
      }
    });

    ws.on('error', (err) => {
      console.warn('[VoiceWebSocketServer] Client error:', err.message);
    });
  });

  console.log('[VoiceWebSocketServer] WebSocket endpoint active on /ws/voice');
  return wss;
}
