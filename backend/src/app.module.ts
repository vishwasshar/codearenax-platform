import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CRDTModule } from './crdt/crdt.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomsModule } from './rooms/rooms.module';
import { AuthModule } from './auth/auth.module';
import { RunCodeModule } from './run-code/run-code.module';
import { MemoryStoreModule } from './memory-store/memory-store.module';
import { ChatModule } from './chat/chat.module';
import { RedisStoreModule } from './redis-store/redis-store.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGOOSE_URI', { infer: true }),
      }),
    }),

    UsersModule,
    CRDTModule,
    RoomsModule,
    AuthModule,
    RunCodeModule,
    MemoryStoreModule,
    ChatModule,
    RedisStoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
