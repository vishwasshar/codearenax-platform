import { IsEnum } from 'class-validator';
import { LangTypes } from 'src/common/enums';

export class UpdateRoom {
  content?: string;

  @IsEnum(LangTypes, {
    message:
      'Currently available languages are: ' +
      Object.values(LangTypes).join(', '),
  })
  lang?: LangTypes;
}
