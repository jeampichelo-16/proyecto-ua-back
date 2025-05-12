import { ApiProperty } from "@nestjs/swagger";

export class LabeledValue {
  @ApiProperty({ example: 72.5 })
  value: number;

  @ApiProperty({
    example:
      "Promedio global del porcentaje de cotizaciones procesadas (pagadas o rechazadas)",
  })
  description: string;
}

export class StatusCountItem {
  @ApiProperty({ example: "EN_TRABAJO" })
  status: string;

  @ApiProperty({ example: 5 })
  count: number;
}

export class StatusDistribution {
  @ApiProperty({ example: "Cantidad de plataformas por estado actual" })
  description: string;

  @ApiProperty({ type: [StatusCountItem] })
  data: StatusCountItem[];
}

export class TimeSeriesPoint {
  @ApiProperty({ example: "2025-05-01" })
  label: string;

  @ApiProperty({ example: 75 })
  value: number;
}

export class QuotationMetricsDto {
  @ApiProperty({ type: LabeledValue })
  averageProcessedRate: LabeledValue;

  @ApiProperty({ type: LabeledValue })
  averageResponseTime: LabeledValue;

  @ApiProperty({
    example:
      "Porcentaje diario de cotizaciones procesadas (pagadas o rechazadas)",
  })
  processedRateSeriesDescription: string;

  @ApiProperty({ type: [TimeSeriesPoint] })
  processedRateSeries: TimeSeriesPoint[];

  @ApiProperty({
    example:
      "Tiempo promedio diario en horas para procesar una cotización desde su creación",
  })
  responseTimeSeriesDescription: string;

  @ApiProperty({ type: [TimeSeriesPoint] })
  responseTimeSeries: TimeSeriesPoint[];

  @ApiProperty({ type: LabeledValue })
  totalPaidAmount: LabeledValue;

  @ApiProperty({ type: StatusDistribution })
  platformStatusDistribution: StatusDistribution;

  @ApiProperty({ type: StatusDistribution })
  operatorStatusDistribution: StatusDistribution;

  @ApiProperty({ type: StatusDistribution })
  quotationStatusDistribution: StatusDistribution;
}
