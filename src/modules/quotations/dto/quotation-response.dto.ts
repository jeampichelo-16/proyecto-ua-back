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
  total: number;

  @ApiProperty()
  status: QuotationStatus;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  codeQuotation: string;
}
