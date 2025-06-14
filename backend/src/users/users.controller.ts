import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import mongoose from 'mongoose';
import { JWTGuard } from 'src/auth/guards/jwt.guard';
import { JwtPayload } from 'src/auth/dtos/jwt-payload.dto';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  // Dependency Injection of User Service Class
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new HttpException('Invalid Id', 400);

      const user = await this.usersService.getUserById(id);

      if (!user) throw new HttpException('User Not Found', 404);

      return user;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post()
  // Added Validation Pipe for Incoming Data and applied Transformation (Class-Validator and Class-Transformer Packages)
  async addNewUser(
    @Body(new ValidationPipe({ transform: true })) user: CreateUserDto,
  ) {
    try {
      return await this.usersService.addNewUser(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch()
  @UseGuards(JWTGuard)
  async updateUser(
    @Req() req: Request,
    @Body(new ValidationPipe({ transform: true })) updatedData: UpdateUserDto,
  ) {
    try {
      const user = req.user as JwtPayload;

      if (!mongoose.Types.ObjectId.isValid(user._id))
        throw new HttpException('Invalid Id', 400);

      const updatedUser = await this.usersService.updateUser(
        user._id,
        updatedData,
      );

      if (!updatedUser) throw new HttpException('User not found', 404);

      return updatedUser;
    } catch (err) {
      throw new HttpException('Failed to update user', 500);
    }
  }
}
