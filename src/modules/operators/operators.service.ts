import { forwardRef, Inject, Injectable } from "@nestjs/common";

import { CreateOperatorDto } from "./dto/create-operator.dto";
import { PrismaService } from "../prisma/prisma.service";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { UsersService } from "../users/users.service";
import { UpdateOperatorDto } from "./dto/update-operator.dto";
import { throwNotFound } from "src/common/utils/errors";
import { Prisma } from "@prisma/client";
import { OperatorStatus } from "src/common/enum/operator-status.enum";

@Injectable()
export class OperatorsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UsersService)) // 👈 FIX CRUCIAL
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
          costService: dto.costService,
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al crear el operario");
    }
  }
  //ADMIN - ACTUALIZAR OPERARIO
  async updateOperatorInfo(
    operatorId: number,
    updates: {
      operatorStatus?: OperatorStatus;
      emoPDFPath?: string;
      operativityCertificatePath?: string;
      costService?: number;
    }
  ): Promise<void> {
    try {
      const operator = await this.prisma.operator.findUnique({
        where: { id: operatorId },
      });

      if (!operator) throwNotFound("Operario no encontrado");

      const updateData: Prisma.OperatorUpdateInput = {};

      if (
        updates.operatorStatus &&
        updates.operatorStatus !== operator.operatorStatus
      ) {
        updateData.operatorStatus =
          updates.operatorStatus as Prisma.OperatorUpdateInput["operatorStatus"];
      }

      if (updates.emoPDFPath && updates.emoPDFPath !== operator.emoPDFPath) {
        updateData.emoPDFPath = updates.emoPDFPath;
      }

      if (
        updates.costService !== undefined &&
        updates.costService !== operator.costService
      ) {
        updateData.costService = updates.costService;
      }

      if (
        updates.operativityCertificatePath &&
        updates.operativityCertificatePath !==
          operator.operativityCertificatePath
      ) {
        updateData.operativityCertificatePath =
          updates.operativityCertificatePath;
      }

      if (Object.keys(updateData).length === 0) return;

      await this.prisma.operator.update({
        where: { id: operatorId },
        data: updateData,
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

  //ADMIN - OBTENER OPERARIOS ACTIVOS
  async getAllActiveOperators() {
    try {
      return this.prisma.operator.findMany({
        where: {
          operatorStatus: OperatorStatus.ACTIVO,
        },
        include: {
          user: true, // 👈 Para poder acceder a user.firstName, dni, etc.
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al obtener los operarios activos");
    }
  }
}
