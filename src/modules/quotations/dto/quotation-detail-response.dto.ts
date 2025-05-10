import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { QuotationStatus } from "@prisma/client";

export class QuotationDetailResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ nullable: true })
  deliveryAmount?: number | null;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  igv: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  typeCurrency: string;

  @ApiProperty()
  isNeedOperator: boolean;

  @ApiProperty()
  paymentReceiptPath: string; 

  @ApiProperty({ enum: QuotationStatus })
  status: QuotationStatus;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  quotationPath: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  statusToPendingPagoAt?: Date | null;

  @ApiProperty({ nullable: true })
  statusToPagadoAt?: Date | null;

  @ApiProperty({ nullable: true })
  statusToRechazadoAt?: Date | null;

  @ApiProperty({
    example: {
      id: 1,
      name: "Cliente S.A.",
      email: "cliente@example.com",
    },
  })
  client: any;

  @ApiProperty({
    example: {
      id: 4,
      serial: "PLT-2023-01",
      brand: "JLG",
      model: "600AJ",
    },
  })
  platform: any;

  @ApiProperty({
    example: {
      id: 6,
      userId: 20,
    },
    nullable: true,
  })
  operator?: any;
}
