import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsPositive, IsBoolean } from "class-validator";

export class CreateQuotationDto {
  @IsNumber()
  @ApiProperty({ description: "ID del cliente" })
  clientId: number;

  @IsNumber()
  @ApiProperty({ description: "ID de la plataforma" })
  platformId: number;

  @IsString()
  @ApiProperty({ description: "Descripción de la cotización" })
  description: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: "Días de cotización" })
  days: number;

  @IsBoolean()
  @ApiProperty({ description: "¿Se requiere un operario?" })
  isNeedOperator: boolean;
}
