import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import {
  throwBadRequest,
  throwConflict,
  throwNotFound,
} from "src/common/utils/errors";
import { QuotationStatus } from "src/common/enum/quotation-status.enum";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { Platform } from "@prisma/client";
import { PdfService } from "../pdf/pdf.service";
import { MailService } from "../mail/mail.service";
import { FirebaseService } from "../firebase/firebase.service";

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
    const { clientId, operatorId, days, description } = dto;

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Validar cliente
        const client = await tx.client.findUnique({ where: { id: clientId } });
        if (!client || !client.isActive) {
          throwBadRequest("El cliente no existe o está inactivo");
        }

        // 2. Obtener plataforma libre y bloquear la ejecución
        const [randomPlatform] = await tx.$queryRaw<Platform[]>`
          SELECT * FROM "Platform"
          WHERE "status" = 'ACTIVO'
          AND "id" NOT IN (SELECT "platformId" FROM "Quotation")
          ORDER BY RANDOM()
          LIMIT 1
        `;

        if (!randomPlatform) {
          throwNotFound(
            "No hay plataformas activas disponibles sin cotización"
          );
        }

        const platformId = randomPlatform.id;

        // 3. Verificar si alguien ya la usó (dentro de la transacción!)
        const alreadyUsed = await tx.quotation.findUnique({
          where: { platformId },
        });
        if (alreadyUsed) {
          throwConflict("La plataforma ya fue asignada en otra cotización");
        }

        // 4. Validar operario
        const operator = await tx.operator.findUnique({
          where: { id: operatorId },
        });
        if (!operator || operator.operatorStatus !== "ACTIVO") {
          throwBadRequest("El operario no está activo o no existe");
        }

        // 5. Validar horómetro
        const horometerRequired = days * 8;
        if (horometerRequired > randomPlatform.horometerMaintenance) {
          throwBadRequest(
            `El horómetro requerido (${horometerRequired}h) excede el límite (${randomPlatform.horometerMaintenance}h)`
          );
        }

        // 6. Calcular montos
        const amount = randomPlatform.price;
        const subtotal = amount * days;
        const igv = subtotal * 0.18;
        const total = subtotal + igv;

        // 7. Crear cotización
        const quotation = await tx.quotation.create({
          data: {
            clientId,
            platformId,
            operatorId,
            description,
            days,
            typeCurrency: "S/",
            amount,
            subtotal,
            igv,
            total,
            quotationPath: "",
            status: QuotationStatus.PENDIENTE,
          },
        });

        // 8. Generar PDF

        const pdfBuffer = await this.pdfService.generateQuotationPdf(
          quotation,
          client,
          operator,
          randomPlatform
        );

        const generateNameFolder = await this.generateUniqueFirebaseFilename({
          prefix: "quotations",
          entityId: quotation.id,
        });

        // 9. Guardar PDF en Firebase
        const folderPath = await this.firebaseService.uploadBuffer(
          pdfBuffer,
          generateNameFolder,
          "application/pdf"
        );

        // 10. Actualizar cotización con la ruta del PDF
        await tx.quotation.update({
          where: { id: quotation.id },
          data: { quotationPath: folderPath },
        });
      });
    } catch (error) {
      handleServiceError(
        error,
        "Error al registrar la cotización (transacción)"
      );
    }
  }
}
