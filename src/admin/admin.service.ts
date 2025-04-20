import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { UserResponseDto } from "src/users/dto";
import { Role } from "src/common/enum/role.enum";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.EMPLEADO, Role.OPERARIO], // ✅ usa tu enum personalizado
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role, // ✅ casteo al enum local
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt, // ✅ fix para el tipo
    }));
  }
}
