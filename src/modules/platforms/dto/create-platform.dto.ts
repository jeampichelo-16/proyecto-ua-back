import { IsString, IsEnum, IsOptional, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { PlatformType } from "src/common/enum/platform-type.enum";
import { PlatformStatus } from "src/common/enum/platform-status.enum";

export class CreateMachineDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsEnum(PlatformType)
  typePlatform: PlatformType;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @IsEnum(PlatformStatus)
  status?: PlatformStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
