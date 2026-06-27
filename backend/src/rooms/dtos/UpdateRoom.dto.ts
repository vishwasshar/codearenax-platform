import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { LangTypes } from 'src/common/enums';
import { Type } from 'class-transformer';

class FileDto {
  path: string;

  @IsOptional()
  content?: string;

  @IsOptional()
  @IsEnum(LangTypes)
  lang?: LangTypes;
}

export class UpdateRoom {
  @IsOptional()
  content?: string;

  @IsOptional()
  @IsEnum(LangTypes, {
    message: 'Currently available languages are: ' + Object.values(LangTypes).join(', '),
  })
  lang?: LangTypes;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];
}
