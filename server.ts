import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { loadMovies } from './server/data/movieService';
import { RoomManager } from './server/game/roomManager';
import { setupGameSocket } from './server/socket/gameSocket';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  const roomManager = new RoomManager(io);
  setupGameSocket(io, roomManager);

  // Parse JSON bodies
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CineScribbl Server',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/movies/stats', (req, res) => {
    const movies = loadMovies();
    res.json({
      count: movies.length,
      sample: movies.slice(0, 10),
    });
  });

  // Vite middleware for development vs Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineScribbl Server running on http://localhost:${PORT}`);
    loadMovies();
  });
}

startServer().catch((err) => {
  console.error('Failed to start CineScribbl server:', err);
  process.exit(1);
});
