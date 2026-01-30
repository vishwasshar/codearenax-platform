import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Injectable()
export class RoomsGuard implements CanActivate {
  constructor(private readonly roomService: RoomsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (!req.params.roomId) throw new BadRequestException('roomId Missing');

    const role = await this.roomService.authorizeUser(
      req.params.roomId,
      req.user._id,
    );

    req.roomRole = role;

    return !!role;
  }
}
