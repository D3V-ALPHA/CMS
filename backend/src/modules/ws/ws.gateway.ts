/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { redis } from '../../config/redis';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' }, // allow all origins for demo
})
export class WsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WsGateway');
  private readonly CHANNEL = 'activity_channel';
  private subscriber: any; // store subscriber to close later (optional)

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');

    // Create a duplicate Redis connection for subscribing
    const sub = redis.duplicate();
    this.subscriber = sub;

    // Listen for messages on the channel
    sub.on('message', (channel: string, message: string) => {
      try {
        const payload = JSON.parse(message);
        // Broadcast to all connected WebSocket clients
        this.server.emit('activity', payload);
        this.logger.log(`Broadcasted activity: ${payload.type}`);
      } catch (err) {
        this.logger.error('Failed to parse Redis message', err);
      }
    });

    // Subscribe to the channel
    sub.subscribe(this.CHANNEL, (err) => {
      if (err) {
        this.logger.error('Failed to subscribe to Redis channel', err);
      } else {
        this.logger.log(`Subscribed to Redis channel: ${this.CHANNEL}`);
      }
    });

    // Handle Redis errors
    sub.on('error', (err) => {
      this.logger.error('Redis subscriber error', err);
    });
  }

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Optional: clean up on application shutdown
  async beforeApplicationShutdown() {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.logger.log('Redis subscriber closed');
    }
  }
}
