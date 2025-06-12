import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CodeSyncModule } from './codeSync/codeSync.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomsModule } from './rooms/rooms.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true}),
    UsersModule, 
    CodeSyncModule, 

    MongooseModule.forRootAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory:(configService:ConfigService)=>({
        uri: configService.get<string>('MONGOOSE_URI',{infer:true})
      })
    }), RoomsModule, AuthModule
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
