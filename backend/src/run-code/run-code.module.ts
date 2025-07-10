import { Module } from '@nestjs/common';
import { RunCodeService } from './run-code.service';
import { RunCodeController } from './run-code.controller';

@Module({
  providers: [RunCodeService],
  controllers: [RunCodeController]
})
export class RunCodeModule {}
