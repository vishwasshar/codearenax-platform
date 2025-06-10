import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CodeSyncModule } from './codeSync/codeSync.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    })
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
