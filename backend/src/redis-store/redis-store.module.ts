import { Global, Module } from '@nestjs/common';
import { RedisStoreService } from './redis-store.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('REDIS_URL is not defined');
        }
        return new Redis(redisUrl);
      },
    },
    RedisStoreService,
  ],
  exports: ['REDIS_CLIENT', RedisStoreService],
})
export class RedisStoreModule {}
