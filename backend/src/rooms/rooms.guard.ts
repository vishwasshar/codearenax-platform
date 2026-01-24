import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoomsService } from './rooms.service';

@Injectable()
export class RoomsGuard implements CanActivate {
  constructor(private readonly roomService: RoomsService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    if (!req.param.roomId) throw new BadRequestException('roomId Missing');

    const isAuthorized = this.roomService.authorizeUser(
      req.param.roomId,
      req.user._id,
    );

    return isAuthorized;
  }
}
