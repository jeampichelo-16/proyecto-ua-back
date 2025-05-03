import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class ActiveClientResponseDto {
  @IsNumber()
  @ApiProperty({ example: 1, description: "ID del cliente" })
  id: number;

  @IsString()
  @ApiProperty({ example: "20500011234", nullable: true })
  ruc: string | null;

  @IsString()
  @ApiProperty({ example: "Empresa XYZ SAC", nullable: true })
  companyName: string | null;
}
