import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CodeSyncModule } from './codeSync/codeSync.module';

@Module({
  imports: [UsersModule, CodeSyncModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
