import { ApiProperty } from "@nestjs/swagger";

export class ClientResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Sebastián Chaquila" })
  name: string;

  @ApiProperty({
    example: "example@example.com",
    required: false,
    nullable: true,
  })
  email?: string | null;

  @ApiProperty({ example: "+56912345678", required: false, nullable: true })
  phone?: string | null;

  @ApiProperty({ example: "10203040500", required: false, nullable: true })
  ruc?: string | null;

  @ApiProperty({ example: "Chaquila Corp", required: false, nullable: true })
  companyName?: string | null;

  @ApiProperty({
    example: "Av. Siempre Viva 123",
    required: false,
    nullable: true,
  })
  address?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2023-10-01T00:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2023-10-01T00:00:00.000Z" })
  updatedAt: Date;
}
