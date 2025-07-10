import { IsEnum, IsString } from 'class-validator';
import { LangTypes } from 'src/common/enums';

export class CodeSubmission {
  @IsString({ message: 'Please enter a valid code' })
  code: string;

  @IsEnum(LangTypes, {
    message:
      'Currently available languages are: ' +
      Object.values(LangTypes).join(', '),
  })
  language: LangTypes;
}
