import { Injectable } from '@nestjs/common';
import { redis } from '../../config/redis';

@Injectable()
export class WsService {
  private readonly CHANNEL = 'activity_channel';

  async emitActivity(payload: {
    type: 'enrollment' | 'completion';
    message: string;
    timestamp: string;
  }) {
    // publish to Redis channel
    await redis.publish(this.CHANNEL, JSON.stringify(payload));
  }
}
