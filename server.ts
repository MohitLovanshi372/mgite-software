/**
 * Production Server Entry Point
 * Runs the Express application serving API routes and compiled static frontend on port 3000.
 */
import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/apiRouter.ts';
import { setupVoiceWebSocketServer } from './server/voiceWebSocketServer.ts';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const requestedPort = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API routes FIRST
  app.use(apiRouter);

  // Attach WebSocket server for real-time voice streaming
  setupVoiceWebSocketServer(server);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        hmr: {
          host: 'localhost',
          port: 24679,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const listen = (port: number) => {
    server.once('error', (err: any) => {
      if (err && err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        console.warn(`Port ${port} is busy. Retrying on ${nextPort}...`);
        listen(nextPort);
        return;
      }
      throw err;
    });

    server.listen(port, host, () => {
      console.log(`Personal AI Assistant server running on http://${host}:${port}`);
    });
  };

  listen(requestedPort);
}

startServer();
