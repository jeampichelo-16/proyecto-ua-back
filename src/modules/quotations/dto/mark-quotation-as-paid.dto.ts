// dto/mark-quotation-as-paid.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";

export class MarkQuotationAsPaidDto {
  @ApiPropertyOptional({ description: "Observaciones del pago (opcional)" })
  observation?: string;
}
