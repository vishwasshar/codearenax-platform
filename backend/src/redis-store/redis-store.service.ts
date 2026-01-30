import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as Y from 'yjs';

@Injectable()
export class RedisStoreService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  set(key: string, value: any) {
    const data = JSON.stringify(value);

    this.redis.set(key, data, 'EX', process.env.REDIS_TTL || 84400);
  }

  async get(key: string) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setYDoc(key: string, ydoc: Y.Doc) {
    const state = Y.encodeStateAsUpdate(ydoc);
    await this.redis.set(
      key,
      Buffer.from(state),
      'EX',
      process.env.REDIS_TTL || 84400,
    );
  }

  async getYDoc(key: string) {
    const data = await this.redis.getBuffer(key);
    if (!data) return null;

    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, new Uint8Array(data));
    return ydoc;
  }

  delete(key: string) {
    return this.redis.del(key);
  }
}
