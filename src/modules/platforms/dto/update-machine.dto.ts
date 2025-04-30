import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { PlatformType } from 'src/common/enum/platform-type.enum';
import { PlatformStatus } from 'src/common/enum/platform-status.enum';
import { Type } from 'class-transformer';

export class UpdateMachineDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsEnum(PlatformType)
  typePlatform?: PlatformType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(PlatformStatus)
  status?: PlatformStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
