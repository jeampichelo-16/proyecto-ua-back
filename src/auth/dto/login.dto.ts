// ✅ src/auth/dto/login.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, MinLength } from "class-validator";
import { Role } from "src/common/enum/role.enum";

export class LoginDto {
  @ApiProperty({ example: "usuario@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "12345678" })
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: Role,
    description: "Tipo de usuario que inicia sesión (obligatorio)",
    example: Role.ADMIN,
  })
  @IsEnum(Role, {
    message: `El rol debe ser uno de: ${Object.values(Role).join(", ")}`,
  })
  role: Role;
}