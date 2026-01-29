import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  const redisIoAdapter = new RedisIoAdapter(app);

  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(process.env.PORT ?? 5500);
}
bootstrap();
