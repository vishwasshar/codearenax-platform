import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail({}, { message: 'Please enter a valid Email Address' })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsString({ message: 'Please enter a valid string' })
  @MinLength(8, { message: 'Password length must be atleast 8 Characters' })
  password: string;
}
