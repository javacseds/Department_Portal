import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { setupSocketIO } from './utils/socket';
import { logger } from './utils/logger';
import prisma from './config/database';
import { startCronJobs } from './jobs';

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// ── Socket.IO Setup ────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocketIO(io);

// ── Graceful Shutdown ──────────────────────────────────────
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed. Database disconnected.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// ── Start Server ───────────────────────────────────────────
server.listen(PORT, async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
    startCronJobs();
    logger.info(`🚀 CDDAS API Server running on http://localhost:${PORT}`);
    logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
});

export { io };
