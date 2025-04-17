// src/users/dto/index.ts

import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Role } from "src/common/enum/role.enum";

// ✅ DTO para creación de usuario
export class CreateUserDto {
  @ApiProperty({ example: "usuario@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "12345678" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, required: false, example: Role.CLIENTE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

// ✅ DTO de respuesta al obtener perfil
export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "usuario@example.com" })
  email: string;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;

  @ApiProperty({ enum: Role, example: Role.CLIENTE })
  role: Role;
}
