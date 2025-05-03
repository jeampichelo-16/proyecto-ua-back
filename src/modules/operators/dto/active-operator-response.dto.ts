import { ApiProperty } from "@nestjs/swagger";

export class ActiveOperatorResponseDto {
  @ApiProperty({ example: 1, description: "ID del operador" })
  id: number;

  @ApiProperty({ example: 42, description: "ID del usuario relacionado" })
  userId: number;

  @ApiProperty({ example: "Juan", description: "Nombre del operador" })
  firstName: string;

  @ApiProperty({ example: "Pérez", description: "Apellido del operador" })
  lastName: string;

  @ApiProperty({ example: "12345678", description: "DNI del operador" })
  dni: string;
}
