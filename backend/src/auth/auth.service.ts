import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { AuthDto } from './dtos/auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}
  async validateUser(autoDto: AuthDto) {
    const user = await this.userModel.findOne({
      email: autoDto.email,
      password: autoDto.password,
    });

    if (!user) return null;
    const { password, ...payload } = user;

    if (autoDto.password == password) {
      return this.jwtService.sign(payload, { secret: process.env.JWT_SECRET });
    }
  }
}
