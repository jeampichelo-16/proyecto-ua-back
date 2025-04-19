import { Injectable } from "@nestjs/common";
import { PrismaClient, User, Role as PrismaRole } from "@prisma/client";
import { CreateUserDto } from "./dto";
import { Role } from "src/common/enum/role.enum";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: dto.password,
        role: (dto.role ?? Role.CLIENTE) as PrismaRole, // 👈 casteo necesario
      },
    });
  }

  async updateRefreshToken(userId: number, token: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token },
    });
  }

  async clearRefreshToken(userId: number): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async verifyUserEmail(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }

  async updatePassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
  }
}
