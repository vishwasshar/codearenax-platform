import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { AuthDto } from './dtos/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from 'src/utils/bcrypt';
import { google } from 'googleapis';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  private oauthClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  async validateUser(autoDto: AuthDto) {
    const user = await this.userModel
      .findOne({
        email: autoDto.email,
      })
      .select('-rooms')
      .lean();

    if (!user) return null;
    const { password, ...payload } = user;

    if (comparePassword(autoDto.password, password)) {
      return {
        token: this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
        }),
        name: payload.name,
        userId: payload._id,
      };
    }
    return null;
  }

  async loginWithGoogleCode(code: string) {
    const { tokens } = await this.oauthClient.getToken(code);
    this.oauthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: this.oauthClient, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      throw new HttpException(
        'Email not found in google account',
        HttpStatus.UNAUTHORIZED,
      );
    }

    let user = await this.userModel
      .findOne({
        email: data.email,
      })
      .select('-rooms')
      .lean();

    if (!user)
      user = await this.userModel.create({
        name: data.name,
        email: data.email,
      });
    const { password, ...payload } = user;

    return {
      token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
      name: payload.name,
      userId: payload._id,
    };
  }
}
