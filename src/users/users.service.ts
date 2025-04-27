import { Injectable } from "@nestjs/common";
import { User, Role as PrismaRole } from "@prisma/client";
import { CreateUserDto, UserResponseDto } from "./dto";
import { Role } from "src/common/enum/role.enum";
import { PrismaService } from "src/prisma/prisma.service";
import { throwNotFound } from "src/common/utils/errors";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
        role: (dto.role ?? Role.EMPLEADO) as PrismaRole, // 👈 casteo necesario
        isEmailVerified: false,
        username: dto.username ?? `${dto.email.split("@")[0]}${Date.now()}`, // 👈 username por defecto
        firstName: dto.email.split("@")[0], // 👈 firstName por defecto
        lastName: dto.email.split("@")[0], // 👈 lastName por defecto
      },
    });
  }

  async updateRefreshToken(userId: number, token: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throwNotFound("Usuario no encontrado");

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
    const user = await this.findById(userId);
    if (!user) throwNotFound("Usuario no encontrado");

    await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }

  async updatePassword(userId: number, data: Partial<User>): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updateResetPasswordData(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expiresAt,
      },
    });
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async getProfileById(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.findById(id);
      if (!user) throwNotFound("Usuario no encontrado");

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as Role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      };
    } catch (error) {
      throwNotFound("Usuario no encontrado");
    }
  }
}
