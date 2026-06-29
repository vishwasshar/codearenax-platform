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
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];
}
