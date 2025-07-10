import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { CodeSubmission } from './dtos/RunCode.dto';
import { RunCodeService } from './run-code.service';

@Controller('run-code')
export class RunCodeController {
  constructor(private readonly runCodeService: RunCodeService) {}
  @Post()
  async runCode(@Body(new ValidationPipe()) data: CodeSubmission) {
    try {
      const res = await this.runCodeService.runCode;

      return res;
    } catch (err) {}
  }
}
