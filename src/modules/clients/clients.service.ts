import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Client } from "@prisma/client";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { CreateClientDto } from "./dto/create-client.dto";
import {
  throwBadRequest,
  throwConflict,
  throwNotFound,
} from "src/common/utils/errors";
import { UpdateClientDto } from "./dto/update-client.dto";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Client | null> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { email },
      });

      if (!client) {
        throwNotFound("No se encontró el cliente");
      }

      return client;
    } catch (error) {
      handleServiceError(error, "Error al buscar el cliente por email");
    }
  }

  async findByRuc(ruc: string): Promise<Client | null> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { ruc },
      });

      if (!client) {
        throwNotFound("No se encontró el cliente");
      }

      return client;
    } catch (error) {
      handleServiceError(error, "Error al buscar el cliente por RUC");
    }
  }

  async findById(id: number): Promise<Client | null> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!client) {
        throwNotFound("No se encontró el cliente");
      }

      return client;
    } catch (error) {
      handleServiceError(error, "Error al buscar el cliente por ID");
    }
  }

  //LISTAR CLIENTE PAGINADOS
  async getAllClientsPaginated(
    page: number,
    pageSize: number
  ): Promise<{
    data: Client[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.client.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" }, // orden opcional
        }),
        this.prisma.client.count(),
      ]);

      return {
        data,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      handleServiceError(error, "Error al obtener los clientes paginados");
    }
  }

  //CREAR CLIENTE
  async createClient(dto: CreateClientDto): Promise<Client> {
    try {
      const existingClient = await this.prisma.client.findUnique({
        where: { email: dto.email },
      });

      const existingClientRuc = await this.prisma.client.findUnique({
        where: { ruc: dto.ruc },
      });

      if (existingClient || existingClientRuc) {
        throwConflict("Usuario ya existente");
      }

      const client = await this.prisma.client.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          ruc: dto.ruc,
          companyName: dto.companyName,
          address: dto.address,
        },
      });
      return client;
    } catch (error) {
      handleServiceError(error, "Error al crear el cliente");
    }
  }

  //ACTUALIZAR CLIENTE
  async updateClient(id: number, dto: UpdateClientDto): Promise<Client | null> {
    try {
      const existingClient = await this.findById(id);

      if (!existingClient) {
        throwNotFound("No se encontró el cliente");
      }

      // 🚨 Validación de cambios reales
      const noChanges =
        (!dto.name || dto.name === existingClient.name) &&
        (!dto.email || dto.email === existingClient.email) &&
        (!dto.phone || dto.phone === existingClient.phone) &&
        (!dto.ruc || dto.ruc === existingClient.ruc) &&
        (!dto.companyName || dto.companyName === existingClient.companyName) &&
        (!dto.address || dto.address === existingClient.address);

      if (noChanges) {
        throwBadRequest("No se detectaron cambios en los datos del cliente");
      }

      const updatedClient = await this.prisma.client.update({
        where: { id },
        data: {
          name: dto.name ?? existingClient.name,
          email: dto.email ?? existingClient.email,
          phone: dto.phone ?? existingClient.phone,
          ruc: dto.ruc ?? existingClient.ruc,
          companyName: dto.companyName ?? existingClient.companyName,
          address: dto.address ?? existingClient.address,
        },
      });

      return updatedClient;
    } catch (error) {
      handleServiceError(error, "Error al actualizar el cliente");
    }
  }

  //ELIMINAR CLIENTE
  async deleteClient(id: number): Promise<Client | null> {
    try {
      const existingClient = await this.findById(id);

      if (!existingClient) {
        throwNotFound("No se encontró el cliente");
      }

      const deletedClient = await this.prisma.client.delete({
        where: { id },
      });

      return deletedClient;
    } catch (error) {
      handleServiceError(error, "Error al eliminar el cliente");
    }
  }
}
