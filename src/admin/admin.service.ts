import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class AdminService {
  private prisma = new PrismaClient();

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async deleteUserById(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  async updateUserById(id: number, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
