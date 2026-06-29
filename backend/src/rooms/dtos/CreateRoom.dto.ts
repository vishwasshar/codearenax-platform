import { IsArray, IsEnum, IsOptional, MinLength, ValidateNested } from 'class-validator';
import { LangTypes } from 'src/common/enums';
import { Type } from 'class-transformer';

class FileDto {
  @MinLength(1)
  path: string;

  @IsOptional()
  content?: string;

  @IsOptional()
  @IsEnum(LangTypes)
  lang?: LangTypes;
}

export class CreateRoom {
  @MinLength(3, { message: 'Please enter a name with atleast 3 Characters.' })
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];
}
