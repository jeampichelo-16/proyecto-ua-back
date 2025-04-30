// src/modules/users/dto/update-user.dto.ts

import { IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiProperty({ example: "NuevoNombre", required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: "NuevoApellido", required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: "nuevo.username", required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: "87654321", required: false })
  @IsOptional()
  @IsString()
  dni?: string;

  @ApiProperty({ example: "+56998765432", required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
