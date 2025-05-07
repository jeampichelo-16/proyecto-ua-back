// src/modules/admin/dto/dashboard-summary.dto.ts

import { ApiProperty } from "@nestjs/swagger";

export class QuotationRatePoint {
  @ApiProperty()
  date: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  processed: number;

  @ApiProperty()
  rate: number;
}

export class ResponseTimePoint {
  @ApiProperty()
  date: string;

  @ApiProperty()
  responseHours: number;
}

export class DashboardSummaryDto {
  @ApiProperty()
  totalClients: number;

  @ApiProperty()
  totalQuotations: number;

  @ApiProperty()
  activeOperators: number;

  @ApiProperty()
  quotationRateAvg: number;

  @ApiProperty()
  avgResponseTimeInHours: number;

  @ApiProperty()
  quotationConversionRate: number; // ✅ NUEVO

  @ApiProperty({ type: [QuotationRatePoint] })
  quotationRateSeries: QuotationRatePoint[];

  @ApiProperty({ type: [ResponseTimePoint] })
  responseTimeSeries: ResponseTimePoint[];
}
