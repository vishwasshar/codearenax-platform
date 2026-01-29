import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private pubClient;
  private subClient;

  async connectToRedis() {
    this.pubClient = createClient({ url: process.env.REDIS_URL });
    this.subClient = this.pubClient.duplicate();

    await Promise.all[(this.pubClient.connect(), this.subClient.connect())];
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);
    server.adapter(createAdapter(this.pubClient, this.subClient));

    return server;
  }
}
