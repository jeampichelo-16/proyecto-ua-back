import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma, User } from "@prisma/client";
import { throwNotFound } from "src/common/utils/errors";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async deleteUserById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throwNotFound(`Usuario con ID ${id} no encontrado`);

    return this.prisma.user.delete({ where: { id } });
  }

  async updateUserById(
    id: number,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throwNotFound(`Usuario con ID ${id} no encontrado`);

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
