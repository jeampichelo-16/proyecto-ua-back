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

  @ApiProperty({ example: "12345678", required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    enum: Role,
    example: Role.OPERARIO,
    description: "Solo ADMIN puede crear usuarios con rol OPERARIO.",
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, {
    message: `El rol debe ser uno de: ${Object.values(Role).join(", ")}`,
  })
  role?: Role;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiProperty({ example: "defaultUsername", required: false })
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty({ example: "John", required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: "Doe", required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: "+56912345678", required: false })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({ example: "00000000", required: false })
  @IsOptional()
  @IsString()
  dni: string;
}

// ✅ DTO de respuesta al obtener perfil
export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "usuario@example.com" })
  email: string;

  @ApiProperty({ example: "usuario123" })
  username: string;

  @ApiProperty({ example: "Sebastián" })
  firstName: string;

  @ApiProperty({ example: "Chaquila" })
  lastName: string;

  @ApiProperty({ enum: Role, example: Role.EMPLEADO })
  role: Role;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "+56912345678" })
  phone?: string | null;

  @ApiProperty({ example: "00000000" })
  dni?: string | null;

  @ApiProperty({ example: true })
  isEmailVerified?: boolean;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt?: Date;

  @ApiProperty({ example: new Date().toISOString(), required: false })
  lastLoginAt?: Date | null;
}
