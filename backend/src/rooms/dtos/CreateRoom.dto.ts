import { IsEnum, MinLength } from 'class-validator';
import { LangTypes } from 'src/common/enums';

export class CreateRoom {
  @MinLength(3, { message: 'Please enter a name with atleast 3 Characters.' })
  name: string;

  content: string;

  @IsEnum(LangTypes, {
    message:
      'Currently available languages are: ' +
      Object.values(LangTypes).join(', '),
  })
  lang: LangTypes;
}
