import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsInt,
  IsPositive,
  IsDateString,
} from "class-validator";

export class CreateQuotationDto {
  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: "ID del cliente",
    example: 1,
  })
  clientId: number;

  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: "ID de la plataforma",
    example: 5,
  })
  platformId: number;

  @IsString()
  @ApiProperty({
    description: "Descripción de la cotización",
    example: "Servicio de alquiler en zona minera",
  })
  description: string;

  @IsDateString()
  @ApiProperty({
    description: "Fecha de inicio de la cotización (ISO 8601)",
    example: "2025-05-10T00:00:00.000Z",
  })
  startDate: Date;

  @IsDateString()
  @ApiProperty({
    description: "Fecha de fin de la cotización (ISO 8601)",
    example: "2025-05-13T00:00:00.000Z",
  })
  endDate: Date;

  @IsBoolean()
  @ApiProperty({
    description: "¿Se requiere un operario?",
    example: true,
  })
  isNeedOperator: boolean;
}
