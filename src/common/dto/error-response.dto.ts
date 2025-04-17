// src/common/dto/error-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: "Token inválido o expirado" })
  message: string;

  @ApiProperty({ example: "Bad Request" })
  error: string;
}
