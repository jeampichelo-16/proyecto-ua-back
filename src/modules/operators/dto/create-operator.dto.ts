// src/modules/operators/dto/create-operator.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateOperatorDto {
  @ApiProperty({ example: "operario@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Juan" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Pérez" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: "12345678" })
  @IsString()
  @IsNotEmpty()
  dni: string;

  @ApiProperty({ example: "+56912345678" })
  @IsNotEmpty()
  @IsString()
  phone?: string;
}
