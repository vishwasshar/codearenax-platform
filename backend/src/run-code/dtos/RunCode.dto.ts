import { IsEnum, IsString } from 'class-validator';
import { LangTypes } from 'src/common/enums';

export class CodeSubmission {
  @IsString({ message: 'Please enter a valid Room Id' })
  roomId: string;
}
