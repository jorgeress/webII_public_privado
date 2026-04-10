import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import roomsRoutes from './routes/rooms.routes.js';
import { initSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Socket.IO
initSocket(httpServer);

// Start
const PORT = process.env.PORT || 3000;

await connectDB();
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});