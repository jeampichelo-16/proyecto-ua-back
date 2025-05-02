import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateQuotationDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty({ example: 150.0, description: "Monto de entrega (delivery)" })
  deliveryAmount: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 5, description: "ID del operador asignado" })
  operatorId?: number;

  
}
