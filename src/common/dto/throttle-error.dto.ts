// src/common/dto/throttle-error.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ThrottleErrorDto {
  @ApiProperty({ example: 429 })
  statusCode: number;

  @ApiProperty({ example: 'Demasiadas peticiones. Intenta nuevamente más tarde.' })
  message: string;

  @ApiProperty({ example: 'Too Many Requests' })
  error: string;
}
