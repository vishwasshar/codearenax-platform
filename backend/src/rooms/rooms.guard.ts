import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { RoomsService } from './rooms.service';

@Injectable()
export class RoomsGuard implements CanActivate {
  constructor(private readonly roomService: RoomsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const roomId = req.params.roomId;
    if (!roomId) throw new BadRequestException('roomId Missing');
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new BadRequestException('Invalid roomId');

    const role = await this.roomService.authorizeUser(
      roomId,
      req.user._id,
    );

    req.roomRole = role;

    return !!role;
  }
}
