import { ApiProperty } from "@nestjs/swagger";
import { QuotationStatus } from "@prisma/client";

export class QuotationSummaryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientName: string;

  @ApiProperty()
  platformSerial: string;

  @ApiProperty()
  days: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  status: QuotationStatus;

  @ApiProperty()
  createdAt: Date;
}
