import { Injectable } from "@nestjs/common";

import { CreateOperatorDto } from "./dto/create-operator.dto";
import { PrismaService } from "../prisma/prisma.service";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { UsersService } from "../users/users.service";
import { UpdateOperatorDto } from "./dto/update-operator.dto";
import { throwNotFound } from "src/common/utils/errors";
import { Prisma } from "@prisma/client";

@Injectable()
export class OperatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {}

  async getById(operatorId: number) {
    try {
      return await this.prisma.operator.findUnique({
        where: { id: operatorId },
        include: {
          user: true, // 🔥 Necesario para acceder a DNI, nombre, etc.
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al buscar el operario por ID");
    }
  }

  //ADMIN - CREAR OPERARIO
  async createOperator(
    dto: CreateOperatorDto,
    emoPDFPath: string,
    operativityCertificatePath: string
  ): Promise<void> {
    try {
      const user = await this.usersService.createOperatorUser(dto);

      await this.prisma.operator.create({
        data: {
          userId: user.id,
          emoPDFPath, // 🔥 Se guarda la ruta que generamos
          operativityCertificatePath, // 🔥 Se guarda la otra ruta
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al crear el operario");
    }
  }

  //ADMIN - ACTUALIZAR OPERARIO
  async updateOperator(
    operatorId: number,
    dto: UpdateOperatorDto,
    emoPDFPath?: string,
    operativityCertificatePath?: string
  ): Promise<void> {
    try {
      const operator = await this.prisma.operator.findUnique({
        where: { id: operatorId },
        include: { user: true }, // solo para comparar datos
      });

      if (!operator) throwNotFound("Operario no encontrado");

      // Actualizar usuario si cambió
      await this.usersService.updateOperatorUser(operator.userId, dto);

      // ✅ Cambios válidos y esperados por Prisma
      const operatorUpdates: Prisma.OperatorUpdateInput = {};

      if (
        dto.operatorStatus !== undefined &&
        dto.operatorStatus !== operator.operatorStatus
      ) {
        operatorUpdates.operatorStatus = dto.operatorStatus;
      }

      if (emoPDFPath && emoPDFPath !== operator.emoPDFPath) {
        operatorUpdates.emoPDFPath = emoPDFPath;
      }

      if (
        operativityCertificatePath &&
        operativityCertificatePath !== operator.operativityCertificatePath
      ) {
        operatorUpdates.operativityCertificatePath = operativityCertificatePath;
      }

      if (Object.keys(operatorUpdates).length === 0) {
        return; // 🚫 Sin cambios reales
      }

      await this.prisma.operator.update({
        where: { id: operatorId },
        data: operatorUpdates,
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar el operario");
    }
  }

  //ADMIN - ELIMINAR OPERARIO
  async deleteOperator(operatorId: number): Promise<void> {
    try {
      const operator = await this.prisma.operator.findUnique({
        where: { id: operatorId },
      });

      if (!operator) throwNotFound("Operario no encontrado");

      await this.prisma.operator.delete({
        where: { id: operatorId },
      });

      await this.prisma.user.delete({
        where: { id: operator.userId },
      });
    } catch (error) {
      handleServiceError(error, "Error al eliminar el operario");
    }
  }

}
