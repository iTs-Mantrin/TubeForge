import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * WebSocket gateway for real-time download progress.
 *
 * Clients connect and join a room named after their taskId.
 * The processor emits progress updates which are forwarded to the room.
 *
 * Client example (browser):
 *   const socket = io('ws://localhost:3000');
 *   socket.emit('subscribe', { taskId: '...' });
 *   socket.on('progress', (data) => console.log(data));
 */
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/progress',
})
export class ProgressGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ProgressGateway.name);

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /**
   * Client subscribes to progress updates for a specific task.
   * Call from client: socket.emit('subscribe', { taskId: 'xxx' })
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { taskId: string }): void {
    if (payload?.taskId) {
      client.join(`task:${payload.taskId}`);
    }
  }

  /**
   * Client unsubscribes from progress updates.
   * Call from client: socket.emit('unsubscribe', { taskId: 'xxx' })
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { taskId: string }): void {
    if (payload?.taskId) {
      client.leave(`task:${payload.taskId}`);
    }
  }

  /**
   * Emit progress to all clients watching a task.
   */
  emitProgress(taskId: string, progress: any): void {
    this.server?.to(`task:${taskId}`).emit('progress', progress);
  }
}
