import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocalGuard } from './guards/local.guard';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalGuard)
  login(@Req() req: Request) {
    return req.user;
  }

  @Post('google/code')
  loginWithGoogleCode(@Body('code') code: string) {
    if (!code) {
      throw new HttpException('Auth Code is required', HttpStatus.BAD_REQUEST);
    }
    return this.authService.loginWithGoogleCode(code);
  }
}
