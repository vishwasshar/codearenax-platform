import { IsString } from 'class-validator';

export class NewMessage {
  @IsString({ message: 'Please Enter a valid string' })
  message: string;

  @IsString({ message: 'Invalid Temp Id' })
  tempId: string;
}
