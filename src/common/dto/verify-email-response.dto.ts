// src/common/dto/verify-email-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class VerifyEmailResponseDto {
  @ApiProperty({ example: "Correo verificado correctamente ✅" })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: true })
  success: boolean;
}
