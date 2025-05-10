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
import { Client, Operator, Platform, Quotation } from "@prisma/client";
import { OperatorStatus } from "src/common/enum/operator-status.enum";
import { ActivateQuotationDto } from "./dto/active-quotation.dto";

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

  //CREAR COTIZACION
  /*
  async createQuotation(dto: CreateQuotationDto): Promise<void> {
    const {
      clientId,
      platformId,
      description,
      startDate,
      endDate,
      isNeedOperator,
    } = dto;

    await this.prisma.$transaction(async (tx) => {
      // 1. Validar cliente
      const client = await tx.client.findUnique({ where: { id: clientId } });
      if (!client || !client.isActive) {
        throwBadRequest("El cliente no existe o está inactivo");
      }

      // 2. Validar plataforma
      const platform = await tx.platform.findUnique({
        where: { id: platformId },
      });
      if (!platform || platform.status !== PlatformStatus.ACTIVO) {
        throwBadRequest("La plataforma no está activa o no existe");
      }

      // 3. Validar cotización pendiente
      const existing = await tx.quotation.findFirst({
        where: {
          platformId,
          status: {
            in: [
              QuotationStatus.PENDIENTE_DATOS,
              QuotationStatus.PENDIENTE_PAGO,
            ],
          },
        },
      });

      if (existing) {
        throwBadRequest("Esta plataforma ya tiene una cotización pendiente.");
      }
      
      // 4. Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        throwBadRequest("La fecha de inicio debe ser anterior a la de fin.");
      }

      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // total días
      const requiredHours = diffDays * 8;

      if (requiredHours > platform.horometerMaintenance) {
        throwBadRequest(
          `El horómetro requerido (${requiredHours}h) excede el límite (${platform.horometerMaintenance}h)`
        );
      }

      // 5. Calcular montos
      const amount = platform.price;
      const subtotal = amount * diffDays;
      const igv = subtotal * 0.18;
      const total = subtotal + igv;

      // 6. Crear cotización
      await tx.quotation.create({
        data: {
          clientId,
          platformId,
          description,
          isNeedOperator,
          typeCurrency: "S/",
          amount,
          subtotal,
          igv,
          total,
          quotationPath: "",
          status: QuotationStatus.PENDIENTE_DATOS,
          startDate: start,
          endDate: end,
        },
      });

      // 7. Actualizar estado plataforma
      await tx.platform.update({
        where: { id: platformId },
        data: {
          status: PlatformStatus.EN_COTIZACION,
        },
      });
      
    });
  }

  */

  async createQuotation(dto: CreateQuotationDto): Promise<void> {
    const {
      clientId,
      platformId,
      description,
      startDate,
      endDate,
      isNeedOperator,
    } = dto;

    await this.prisma.$transaction(async (tx) => {
      // 1. Validar cliente
      const client = await tx.client.findUnique({ where: { id: clientId } });
      if (!client || !client.isActive) {
        throwBadRequest("El cliente no existe o está inactivo");
      }

      // 2. Validar plataforma
      const platform = await tx.platform.findUnique({
        where: { id: platformId },
      });

      if (!platform || platform.status !== PlatformStatus.ACTIVO) {
        throwBadRequest("La plataforma no está activa o no existe");
      }

      // 3. Validar cotización pendiente
      const existing = await tx.quotation.findFirst({
        where: {
          platformId,
          status: {
            in: [
              QuotationStatus.PENDIENTE_DATOS,
              QuotationStatus.PENDIENTE_PAGO,
            ],
          },
        },
      });

      if (existing) {
        throwBadRequest("Esta plataforma ya tiene una cotización pendiente.");
      }

      // 4. Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        throwBadRequest("La fecha de inicio debe ser anterior a la de fin.");
      }

      //VERIFICAR HOROMETRO

      const diffMs = end.getTime() - start.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // corregido
      const requiredHours = days * 8; // total horas requeridas

      if (requiredHours > platform.horometerMaintenance) {
        throwBadRequest(
          `El horómetro requerido (${requiredHours}h) excede el límite (${platform.horometerMaintenance}h)`
        );
      }

      const amountPlatform = platform.price * days; // +1 para incluir el día de inicio

      // 5. Crear cotización
      await tx.quotation.create({
        data: {
          clientId,
          platformId,
          description,
          isNeedOperator,
          typeCurrency: "S/",
          quotationPath: "",
          startDate: start,
          endDate: end,
          amount: amountPlatform,
          subtotal: 0,
          igv: 0,
          total: 0,
          status: QuotationStatus.PENDIENTE_DATOS,
        },
      });

      // 6. Actualizar estado plataforma
      await tx.platform.update({
        where: { id: platformId },
        data: {
          status: PlatformStatus.EN_COTIZACION,
        },
      });
    });
  }

  async updateQuotationActive(
    quotationId: number,
    dto: ActivateQuotationDto,
    days: number
  ): Promise<void> {
    try {
      const { deliveryAmount, operatorId } = dto;

      const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
        select: {
          subtotal: true,
          isNeedOperator: true,
          amount: true,
        },
      });

      if (!quotation) throwNotFound("Cotización no encontrada");

      const operator = await this.prisma.operator.findUnique({
        where: { id: operatorId },
      });

      if (quotation.isNeedOperator && !operator) {
        throwBadRequest("El operario no existe o no está activo");
      }

      const dailyOperatorCost = operator?.costService ?? 0;
      const operatorCost = quotation.isNeedOperator
        ? dailyOperatorCost * days
        : 0;

      const updatedSubtotal =
        quotation.subtotal +
        (deliveryAmount ?? 0) +
        operatorCost +
        quotation.amount;
      const igv = updatedSubtotal * 0.18;
      const total = updatedSubtotal + igv;

      // ✅ Actualizar la cotización
      await this.prisma.quotation.update({
        where: { id: quotationId },
        data: {
          deliveryAmount,
          operatorId: quotation.isNeedOperator ? operatorId : null,
          status: QuotationStatus.PENDIENTE_PAGO,
          statusToPendingPagoAt: new Date(),
          subtotal: updatedSubtotal,
          igv,
          total,
        },
      });

      if (quotation.isNeedOperator && operatorId) {
        await this.prisma.operator.update({
          where: { id: operatorId },
          data: {
            operatorStatus: OperatorStatus.EN_COTIZACION,
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
        quotation.isNeedOperator,
        days
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

  async markQuotationAsPaid(
    quotationId: number,
    paymentReceiptPath: string
  ): Promise<void> {
    try {
      const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
      });

      if (!quotation) {
        throwNotFound("Cotización no encontrada");
      }

      if (quotation.status !== QuotationStatus.PENDIENTE_PAGO) {
        throwBadRequest("La cotización no está en estado PENDIENTE_PAGO");
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            status: QuotationStatus.PAGADO,
            paymentReceiptPath,
            statusToPagadoAt: new Date(),
          },
        });

        await tx.platform.update({
          where: { id: quotation.platformId },
          data: { status: PlatformStatus.EN_TRABAJO },
        });

        await tx.operator.updateMany({
          where: quotation.operatorId
            ? { id: quotation.operatorId }
            : undefined,
          data: { operatorStatus: OperatorStatus.EN_TRABAJO },
        });
      });
    } catch (error) {
      handleServiceError(error, "Error al marcar la cotización como pagada");
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

      if (
        quotation.status !== QuotationStatus.PENDIENTE_DATOS &&
        quotation.status !== QuotationStatus.PENDIENTE_PAGO
      ) {
        throwBadRequest(
          "Solo se puede cancelar cotizaciones en estado PENDIENTE"
        );
      }

      //ELIMINAR ARCHIVO FIREBASE

      await this.prisma.$transaction(async (tx) => {
        await this.firebaseService.deleteFileFromUrl(quotation.quotationPath);

        await this.firebaseService.deleteFileFromUrl(
          quotation.paymentReceiptPath ?? ""
        );

        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            status: QuotationStatus.RECHAZADO,
            statusToRechazadoAt: new Date(),
          },
        });

        await tx.platform.update({
          where: { id: quotation.platformId },
          data: { status: PlatformStatus.ACTIVO },
        });

        await tx.operator.updateMany({
          where: quotation.operatorId
            ? { id: quotation.operatorId }
            : undefined,
          data: { operatorStatus: OperatorStatus.ACTIVO },
        });
      });
    } catch (error) {
      handleServiceError(error, "Error al cancelar la cotización");
    }
  }

  // quotations.service.ts
  async getAllQuotationsPaginated(
    page: number,
    pageSize: number
  ): Promise<{
    data: (Quotation & {
      client: Client;
      platform: Platform;
      operator: Operator | null;
    })[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.quotation.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          client: true,
          platform: true,
          operator: true,
        },
      }),
      this.prisma.quotation.count(),
    ]);

    return { data, total };
  }

  async getQuotationById(id: number): Promise<
    Quotation & {
      client: Client;
      platform: Platform;
      operator: Operator | null;
    }
  > {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        client: true,
        platform: true,
        operator: true,
      },
    });

    if (!quotation) {
      throwNotFound("Cotización no encontrada");
    }

    return quotation;
  }
}
