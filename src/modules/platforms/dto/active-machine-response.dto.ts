// src/modules/platforms/dto/responses/active-machine-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ActiveMachineResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  serial: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  typePlatform: string;

  @ApiProperty()
  price: number;
}
