// src/modules/operators/dto/update-operator.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
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
}
