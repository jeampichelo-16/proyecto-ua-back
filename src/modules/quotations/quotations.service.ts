import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { throwBadRequest, throwNotFound } from "src/common/utils/errors";
import { QuotationStatus } from "src/common/enum/quotation-status.enum";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { PdfService } from "../pdf/pdf.service";
import { FirebaseService } from "../firebase/firebase.service";
import { PlatformStatus } from "src/common/enum/platform-status.enum";
import { Client, Platform, Quotation } from "@prisma/client";
import { OperatorStatus } from "src/common/enum/operator-status.enum";
import { ActivateQuotationDto } from "./dto/active-quotation.dto";
import type { Operator, Prisma } from "@prisma/client"; // asegúrate de tener esto si no está
import { PlatformsService } from "../platforms/platforms.service";
import { ClientsService } from "../clients/clients.service";

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly firebaseService: FirebaseService,
    private readonly clientsService: ClientsService,
    private readonly platformsService: PlatformsService
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

  async findByIdQuotation(id: number): Promise<Prisma.QuotationGetPayload<{
    include: {
      client: true;
      platform: true;
      operator: {
        include: {
          user: true;
        };
      };
    };
  }> | null> {
    try {
      const quotation = await this.prisma.quotation.findUnique({
        where: { id },
        include: {
          client: true,
          platform: true,
          operator: {
            include: {
              user: true,
            },
          },
        },
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
  private async generateCodeQuotation(
    clientId: number,
    platformId: number
  ): Promise<string> {
    try {
      const client = await this.clientsService.findById(clientId);
      const platform = await this.platformsService.findById(platformId);
      if (!client || !platform) {
        throwBadRequest("Cliente o plataforma no encontrados");
      }
      const clientName = client.name.replace(/\s+/g, "_").toUpperCase();
      const platformSerial = platform.serial.replace(/\s+/g, "_").toUpperCase();
      const timestamp = Date.now();
      const code = `${clientName}_${platformSerial}_${timestamp}`;
      return code;
    } catch (error) {
      handleServiceError(error, "Error al generar el código de cotización");
    }
  }

  async createQuotation(dto: CreateQuotationDto): Promise<void> {
    try {
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
            codeQuotation: await this.generateCodeQuotation(
              clientId,
              platformId
            ),
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
    } catch (error) {
      handleServiceError(error, "Error al crear la cotización");
    }
  }

  async updateQuotationActive(
    quotationId: number,
    dto: ActivateQuotationDto,
    days: number
  ): Promise<{ quotationPath: string; totalAmount: number }> {
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

      // ✅ Solo buscar operador si se necesita
      let operator: Operator | null = null;
      if (quotation.isNeedOperator) {
        if (!operatorId) throwBadRequest("Falta el ID del operador requerido.");
        operator = await this.prisma.operator.findUnique({
          where: { id: operatorId },
        });

        if (!operator)
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

      return {
        quotationPath: folderPath,
        totalAmount: total,
      };
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
        if (quotation.status === QuotationStatus.PENDIENTE_PAGO) {
          await this.firebaseService.deleteFileFromUrl(quotation.quotationPath);
        }

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
    try {
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
    } catch (error) {
      handleServiceError(error, "Error al obtener las cotizaciones");
    }
  }

  async getQuotationById(id: number): Promise<
    Quotation & {
      client: Client;
      platform: Platform;
      operator: Operator | null;
    }
  > {
    try {
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
    } catch (error) {
      handleServiceError(error, "Error al buscar la cotización por ID");
    }
  }

  async getQuotationByCode(code: string) {
    try {
      const quotation = await this.prisma.quotation.findUnique({
        where: { codeQuotation: code },
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
    } catch (error) {
      handleServiceError(error, "Error al buscar la cotización por código");
    }
  }
}
