import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { throwBadRequest, throwNotFound } from "src/common/utils/errors";
import { QuotationStatus } from "src/common/enum/quotation-status.enum";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { PdfService } from "../pdf/pdf.service";
import { MailService } from "../mail/mail.service";
import { FirebaseService } from "../firebase/firebase.service";
import { PlatformStatus } from "src/common/enum/platform-status.enum";
import { Operator, Quotation } from "@prisma/client";
import { UpdateQuotationDto } from "./dto/update-quotation-delivery.dto";
import { OperatorStatus } from "src/common/enum/operator-status.enum";

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService
  ) {}

  async findActiveClients() {
    try {
      const clients = await this.prisma.client.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          ruc: true,
          email: true,
        },
      });
      return clients;
    } catch (error) {
      handleServiceError(error, "Error al obtener los clientes activos");
    }
  }

  async findActiveOperators() {
    try {
      const operators = await this.prisma.operator.findMany({
        where: { operatorStatus: "ACTIVO" },
        select: {
          id: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });
      return operators;
    } catch (error) {
      handleServiceError(error, "Error al obtener los operarios activos");
    }
  }

  async findByIdQuotation(id: number): Promise<Quotation | null> {
    try {
      const quotation = await this.prisma.quotation.findUnique({
        where: { id },
      });

      if (!quotation) {
        throwNotFound("Cotización no encontrada");
      }

      return quotation;
    } catch (error) {
      handleServiceError(error, "Error al buscar la cotización por ID");
    }
  }

  private async generateUniqueFirebaseFilename({
    prefix,
    entityId,
    extension = "pdf",
  }: {
    prefix: string; // ej. 'quotations'
    entityId: number | string;
    extension?: string;
  }): Promise<string> {
    const timestamp = Date.now();
    return `${prefix}/${entityId}/cotizacion-${timestamp}.${extension}`;
  }

  async createQuotation(dto: CreateQuotationDto): Promise<void> {
    const { clientId, platformId, days, description, isNeedOperator } = dto;

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Validar cliente
        const client = await tx.client.findUnique({ where: { id: clientId } });
        if (!client || !client.isActive) {
          throwBadRequest("El cliente no existe o está inactivo");
        }

        // 2. Obtener plataforma libre y bloquear la ejecución
        const platform = await tx.platform.findUnique({
          where: { id: platformId },
        });

        if (!platform || platform.status !== PlatformStatus.ACTIVO) {
          throwBadRequest("La plataforma no está activa o no existe");
        }

        // 🔒 3. Validar si ya tiene cotización activa
        const existing = await tx.quotation.findFirst({
          where: {
            platformId,
            status: {
              in: [QuotationStatus.PENDIENTE],
            },
          },
        });
        if (existing) {
          throwBadRequest("Esta plataforma ya tiene una cotización pendiente.");
        }

        const requiredHours = days * 8;
        if (requiredHours > platform.horometerMaintenance) {
          throwBadRequest(
            `El horómetro requerido (${requiredHours}h) excede el límite de mantenimiento (${platform.horometerMaintenance}h)`
          );
        }

        // 6. Calcular montos
        const amount = platform.price;
        const subtotal = amount * days;
        const igv = subtotal * 0.18;
        const total = subtotal + igv;

        // 7. Crear cotización
        await tx.quotation.create({
          data: {
            clientId,
            platformId,
            description,
            days,
            isNeedOperator,
            typeCurrency: "S/",
            amount,
            subtotal,
            igv,
            total,
            quotationPath: "",
            status: QuotationStatus.PENDIENTE,
          },
        });

        await tx.platform.update({
          where: { id: platformId },
          data: {
            status: PlatformStatus.EN_COTIZACION,
          },
        });
      });
    } catch (error) {
      handleServiceError(
        error,
        "Error al registrar la cotización (transacción)"
      );
    }
  }

  async updateQuotation(
    quotationId: number,
    dto: UpdateQuotationDto,
    days: number,
    platformId: number
  ): Promise<void> {
    try {
      const { deliveryAmount, operatorId } = dto;
      const hours = days * 8;

      const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
        select: {
          subtotal: true,
          isNeedOperator: true,
        },
      });

      if (!quotation) throwNotFound("Cotización no encontrada");

      const dailyOperatorCost = 200;
      const operatorCost = quotation.isNeedOperator
        ? dailyOperatorCost * days
        : 0;

      const updatedSubtotal =
        quotation.subtotal + (deliveryAmount ?? 0) + operatorCost;
      const igv = updatedSubtotal * 0.18;
      const total = updatedSubtotal + igv;

      // ✅ Actualizar la cotización
      await this.prisma.quotation.update({
        where: { id: quotationId },
        data: {
          deliveryAmount,
          operatorId: quotation.isNeedOperator ? operatorId : null,
          status: QuotationStatus.APROBADO,
          subtotal: updatedSubtotal,
          igv,
          total,
        },
      });

      await this.prisma.platform.update({
        where: { id: platformId },
        data: {
          horometerMaintenance: {
            decrement: hours,
          },
          status: PlatformStatus.EN_TRABAJO,
        },
      });

      if (quotation.isNeedOperator && operatorId) {
        await this.prisma.operator.update({
          where: { id: operatorId },
          data: {
            operatorStatus: OperatorStatus.EN_TRABAJO,
          },
        });
      }

      // 📌 Cargar los datos completos para el PDF
      const fullQuotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
        include: {
          client: true,
          platform: true,
          operator: true,
        },
      });

      if (!fullQuotation) throwNotFound("Cotización no encontrada");

      const pdfBuffer = await this.pdfService.generateQuotationPdf(
        fullQuotation,
        fullQuotation.client,
        dailyOperatorCost,
        fullQuotation.platform,
        updatedSubtotal,
        deliveryAmount ?? 0,
        quotation.isNeedOperator
      );

      const generateNameFolder = await this.generateUniqueFirebaseFilename({
        prefix: "quotations",
        entityId: quotationId,
      });

      const folderPath = await this.firebaseService.uploadBuffer(
        pdfBuffer,
        generateNameFolder,
        "application/pdf"
      );

      await this.prisma.quotation.update({
        where: { id: quotationId },
        data: {
          quotationPath: folderPath,
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al guardar cambios en la cotización");
    }
  }

  async cancelQuotation(quotationId: number): Promise<void> {
    try {
      const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
      });

      if (!quotation) {
        throwNotFound("Cotización no encontrada");
      }

      if (quotation.status !== QuotationStatus.PENDIENTE) {
        throwBadRequest(
          "No se puede cancelar una cotización que no está pendiente"
        );
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.quotation.update({
          where: { id: quotationId },
          data: { status: QuotationStatus.RECHAZADO },
        });

        await tx.platform.update({
          where: { id: quotation.platformId },
          data: { status: PlatformStatus.ACTIVO },
        });
      });
    } catch (error) {
      handleServiceError(error, "Error al cancelar la cotización");
    }
  }
}
