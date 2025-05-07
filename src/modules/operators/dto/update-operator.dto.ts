// src/modules/operators/dto/update-operator.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { OperatorStatus } from "src/common/enum/operator-status.enum";

export class UpdateOperatorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: OperatorStatus })
  @IsOptional()
  @IsEnum(OperatorStatus)
  operatorStatus?: OperatorStatus;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number) // 👈 NECESARIO PARA form-data
  costService?: number;
}
