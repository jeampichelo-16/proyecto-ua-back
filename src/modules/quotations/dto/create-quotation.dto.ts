import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsPositive } from "class-validator";

export class CreateQuotationDto {
  @IsNumber()
  @ApiProperty({ description: "ID del cliente" })
  clientId: number;

  @IsNumber()
  @ApiProperty({ description: "ID del operador" })
  operatorId: number;

  @IsString()
  @ApiProperty({ description: "Descripción de la cotización" })
  description: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: "Días de cotización" })
  days: number;
}
