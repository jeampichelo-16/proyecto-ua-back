// ✅ src/auth/dto/resend-verification.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ResendVerificationDto {
  @ApiProperty({ example: "usuario@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
