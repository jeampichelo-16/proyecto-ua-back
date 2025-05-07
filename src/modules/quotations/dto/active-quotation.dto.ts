import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivateQuotationDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    example: 150.0,
    description: 'Monto de entrega (delivery)',
  })
  deliveryAmount: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiPropertyOptional({
    example: 5,
    description: 'ID del operador asignado (requerido si se necesita operador)',
  })
  operatorId?: number;
}
