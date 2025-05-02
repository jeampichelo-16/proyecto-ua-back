import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { CreateMachineDto } from "./dto/create-platform.dto";
import { UpdateMachineDto } from "./dto/update-machine.dto";
import { throwNotFound } from "src/common/utils/errors";
import { Prisma } from "@prisma/client";
import { PlatformStatus } from "src/common/enum/platform-status.enum";

@Injectable()
export class PlatformsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBySerial(serial: string) {
    try {
      return this.prisma.platform.findUnique({
        where: { serial },
      });
    } catch (error) {
      handleServiceError(error, "Error al obtener la plataforma por serial.");
    }
  }

  //CREAR PLATAFORMA
  async createMachine(
    createMachineDto: CreateMachineDto,
    serialPlatform: string,
    operativityCertificatePath: string,
    ownershipDocumentPath: string
  ): Promise<void> {
    try {
      await this.prisma.platform.create({
        data: {
          ...createMachineDto,
          operativityCertificatePath,
          ownershipDocumentPath,
          serial: serialPlatform,
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al crear la plataforma.");
    }
  }

  //ACTUALIZAR PLATAFORMA
  async updateMachine(
    machineSerial: string,
    updateMachineDto: UpdateMachineDto,
    operativityCertificatePath?: string,
    ownershipDocumentPath?: string
  ): Promise<void> {
    try {
      const platform = await this.prisma.platform.findUnique({
        where: { serial: machineSerial },
      });

      if (!platform) throwNotFound("Plataforma no encontrada.");

      const platformUpdates: Prisma.PlatformUpdateInput = {};

      // Campos básicos (condicionalmente, para evitar sobreescrituras innecesarias)
      if (
        updateMachineDto.brand !== undefined &&
        updateMachineDto.brand !== platform.brand
      ) {
        platformUpdates.brand = updateMachineDto.brand;
      }

      if (
        updateMachineDto.model !== undefined &&
        updateMachineDto.model !== platform.model
      ) {
        platformUpdates.model = updateMachineDto.model;
      }

      if (
        updateMachineDto.typePlatform !== undefined &&
        updateMachineDto.typePlatform !== platform.typePlatform
      ) {
        platformUpdates.typePlatform = updateMachineDto.typePlatform;
      }

      if (
        updateMachineDto.price !== undefined &&
        updateMachineDto.price !== platform.price
      ) {
        platformUpdates.price = updateMachineDto.price;
      }

      if (
        updateMachineDto.status !== undefined &&
        updateMachineDto.status !== platform.status
      ) {
        platformUpdates.status = updateMachineDto.status;
      }

      if (
        updateMachineDto.description !== undefined &&
        updateMachineDto.description !== platform.description
      ) {
        platformUpdates.description = updateMachineDto.description;
      }

      // Archivos (PDFs)
      if (
        operativityCertificatePath &&
        operativityCertificatePath !== platform.operativityCertificatePath
      ) {
        platformUpdates.operativityCertificatePath = operativityCertificatePath;
      }

      if (
        ownershipDocumentPath &&
        ownershipDocumentPath !== platform.ownershipDocumentPath
      ) {
        platformUpdates.ownershipDocumentPath = ownershipDocumentPath;
      }

      // 🧠 Validación final
      if (Object.keys(platformUpdates).length === 0) return;

      // ⚠️ Si se va a mantenimiento, reiniciar horómetro
      if (updateMachineDto.status === PlatformStatus.EN_MANTENIMIENTO) {
        platformUpdates.horometerMaintenance = 200;
        platformUpdates.status = PlatformStatus.EN_MANTENIMIENTO;
      }

      await this.prisma.platform.update({
        where: { serial: machineSerial },
        data: platformUpdates,
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar la plataforma.");
    }
  }

  //OBTENER TODAS LAS PLATAFORMAS
  async getAllMachinesPaginated(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ platforms: any[]; total: number }> {
    try {
      const where = search
        ? {
            OR: [
              { brand: { contains: search, mode: "insensitive" } },
              { model: { contains: search, mode: "insensitive" } },
              { serial: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [platforms, total] = await this.prisma.$transaction([
        this.prisma.platform.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" }, // orden opcional
        }),
        this.prisma.platform.count({ where }),
      ]);

      return { platforms, total };
    } catch (error) {
      handleServiceError(error, "Error al obtener las plataformas.");
    }
  }

  //ELIMINAR PLATAFORMA
  async deleteMachine(serial: string): Promise<void> {
    try {
      const platform = await this.prisma.platform.findUnique({
        where: { serial },
      });
      if (!platform) throwNotFound("Plataforma no encontrada.");

      await this.prisma.platform.delete({
        where: { serial },
      });
    } catch (error) {
      handleServiceError(error, "Error al eliminar la plataforma.");
    }
  }
}
