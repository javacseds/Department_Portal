import { Server } from 'socket.io';
import { logger } from './logger';

export function setupSocketIO(io: Server) {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.debug(`User ${userId} joined their room`);
    });

    socket.on('join:department', (deptId: string) => {
      socket.join(`dept:${deptId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitToUser(io: Server, userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToDepartment(io: Server, deptId: string, event: string, data: unknown) {
  io.to(`dept:${deptId}`).emit(event, data);
}

export function emitToAll(io: Server, event: string, data: unknown) {
  io.emit(event, data);
}
