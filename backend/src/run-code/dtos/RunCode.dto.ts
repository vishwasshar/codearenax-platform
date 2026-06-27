import { IsOptional, IsString } from 'class-validator';

export class CodeSubmission {
  @IsString({ message: 'Please enter a valid Room Id' })
  roomId: string;

  @IsOptional()
  @IsString()
  filePath?: string;
}
