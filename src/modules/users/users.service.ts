import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { CreateUserDto, UserResponseDto } from "./dto";
import { Role } from "src/common/enum/role.enum";
import { PrismaService } from "src/modules/prisma/prisma.service";
import {
  throwBadRequest,
  throwConflict,
  throwNotFound,
} from "src/common/utils/errors";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateOperatorDto } from "../operators/dto/create-operator.dto";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { generateSecurePassword } from "src/common/utils/password-generator";
import * as bcrypt from "bcrypt";
import { UpdateOperatorDto } from "../operators/dto/update-operator.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // AUTH - LOGIN / REESTABLECER CONTRASEÑA - ADMIN / LISTAR EMPLEADOS PAGINADOS / CREAR EMPLEADO
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      return user;
    } catch (error) {
      handleServiceError(error, "Error al buscar el usuario por email");
    }
  }

  // AUTH - LOGIN / REESTABLECER CONTRASEÑA
  async findById(id: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throwNotFound("Usuario no encontrado");
      }

      return user;
    } catch (error) {
      handleServiceError(error, "Error al buscar el usuario por ID");
    }
  }

  // AUTH - LOGIN
  async getProfileById(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.findById(id);
      if (!user) throwNotFound("Usuario no encontrado");

      const profile = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as Role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
      };

      return profile;
    } catch (error) {
      handleServiceError(error, "Error al obtener el perfil del usuario");
    }
  }

  // AUTH - LOGIN
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      handleServiceError(
        error,
        "Error al actualizar el último inicio de sesión"
      );
    }
  }

  // AUTH - REFRESH TOKEN
  async updateRefreshToken(userId: number, token: string): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) throwNotFound("Usuario no encontrado");

      return this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: token },
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar el token de refresco");
    }
  }

  // AUTH - REFRESH TOKEN / LOGOUT
  async clearRefreshTokenDB(userId: number): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) throwNotFound("Usuario no encontrado");

      return this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
    } catch (error) {
      handleServiceError(error, "Error al limpiar el token de refresco");
    }
  }

  // AUTH - REESTABLECER CONTRASEÑA
  async updateResetPasswordData(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expiresAt,
        },
      });
    } catch (error) {
      handleServiceError(
        error,
        "Error al actualizar los datos de restablecimiento de contraseña"
      );
    }
  }

  // AUTH - REESTABLECER CONTRASEÑA
  async updatePassword(userId: number, data: Partial<User>): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      handleServiceError(
        error,
        "Error al actualizar la contraseña del usuario"
      );
    }
  }

  //ADMIN - OBTENER EMPLEADOS PAGINADOS / OBTENER OPERARIOS PAGINADOS
  async findUsersByRolesPaginated(
    roles: Role[],
    page,
    pageSize
  ): Promise<{ data: User[]; total: number; page: number; pageSize: number }> {
    try {
      const skip = (page - 1) * pageSize;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where: {
            role: {
              in: roles,
            },
          },
          skip,
          take: pageSize,
          orderBy: {
            createdAt: "desc",
          },
        }),
        this.prisma.user.count({
          where: {
            role: {
              in: roles,
            },
          },
        }),
      ]);

      return {
        data,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      handleServiceError(
        error,
        "Error al obtener los usuarios por roles paginados"
      );
    }
  }

  //ADMIN - CREAR EMPLEADO
  async findByDni(dni: string): Promise<User | null> {
    try {
      return this.prisma.user.findUnique({ where: { dni } });
    } catch (error) {
      handleServiceError(error, "Error al buscar el usuario por DNI");
    }
  }

  //ADMIN - CREAR EMPLEADO
  async findByUsername(username: string): Promise<User | null> {
    try {
      return this.prisma.user.findUnique({ where: { username } });
    } catch (error) {
      handleServiceError(
        error,
        "Error al buscar el usuario por nombre de usuario"
      );
    }
  }

  //ADMIN - CREAR EMPLEADO
  async createEmployeeUser(dto: CreateUserDto): Promise<User> {
    try {
      const localPartOfEmail = dto.email.split("@")[0];
      const username = dto.username ?? `${localPartOfEmail}${Date.now()}`;
      const firstName = dto.firstName ?? localPartOfEmail;
      const lastName = dto.lastName ?? localPartOfEmail;
      const plainPassword = generateSecurePassword(12);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const existingUser = await this.findByEmail(dto.email);

      const existingDni = await this.findByDni(dto.dni);

      const existingUsername = await this.findByUsername(dto.username);

      if (existingUser || existingDni || existingUsername) {
        throwConflict("Usuario ya existente");
      }

      const employeeUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword, // Ensure this is hashed before passing it here
          role: Role.EMPLEADO,
          isEmailVerified: true,
          phone: dto.phone,
          isActive: true,
          dni: dto.dni,
          username,
          firstName,
          lastName,
          createdAt: new Date(),
        },
      });

      return employeeUser;
    } catch (error) {
      handleServiceError(error, "Error al crear el usuario");
    }
  }

  //ADMIN - ACTUALIZAR EMPLEADO
  async updateUserEmployee(userId: number, dto: UpdateUserDto): Promise<void> {
    try {
      const user = await this.findById(userId);

      if (!user) throwNotFound("El usuario no existe");

      if (user.role !== Role.EMPLEADO) {
        throwBadRequest("No se puede actualizar un usuario que no es empleado");
      }

      // 🔥 Detectar si realmente hay cambios
      const fieldsToCheck: (keyof UpdateUserDto)[] = [
        "firstName",
        "lastName",
        "username",
        "dni",
        "phone",
        "isActive",
      ];

      const noChanges = fieldsToCheck.every((field) => {
        const incomingValue = dto[field];
        if (incomingValue === undefined) return true; // Si no viene, ignorar
        return incomingValue === user[field];
      });

      if (noChanges) {
        throwBadRequest("No se han realizado cambios en el usuario");
      }

      // 🚨 Validar duplicidad de username
      if (dto.username && dto.username !== user.username) {
        const existingUsername = await this.findByUsername(dto.username);
        if (existingUsername && existingUsername.id !== userId) {
          throwConflict("El nombre de usuario ya está en uso");
        }
      }

      // 🚨 Validar duplicidad de dni
      if (dto.dni && dto.dni !== user.dni) {
        const existingDni = await this.findByDni(dto.dni);
        if (existingDni && existingDni.id !== userId) {
          throwConflict("El DNI ya está en uso");
        }
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          username: dto.username,
          dni: dto.dni,
          phone: dto.phone,
          isActive: dto.isActive,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar el usuario");
    }
  }

  //ADMIN - ELIMINAR EMPLEADO
  async deleteUser(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      handleServiceError(error, "Error al eliminar el usuario");
    }
  }

  //ADMIN - CREAR OPERARIO
  async createOperatorUser(dto: CreateOperatorDto): Promise<User> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: dto.email }, { dni: dto.dni }],
        },
      });

      if (existingUser) {
        throwConflict("Usuario ya existente");
      }

      const username = dto.email.split("@")[0] + Date.now();
      const passwordRandom = generateSecurePassword(12);

      return this.prisma.user.create({
        data: {
          email: dto.email,
          username,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dni: dto.dni,
          phone: dto.phone,
          password: passwordRandom, // 👈 Luego forzar cambio
          role: Role.OPERARIO,
          isEmailVerified: false,
          isActive: true,
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al crear el operario");
    }
  }

  //ADMIN - ACTUALIZAR OPERARIO
  async updateOperatorUser(
    userId: number,
    dto: UpdateOperatorDto
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throwNotFound("Usuario no encontrado");

      const updates: Partial<typeof user> = {};

      if (dto.firstName !== undefined && dto.firstName !== user.firstName) {
        updates.firstName = dto.firstName;
      }

      if (dto.lastName !== undefined && dto.lastName !== user.lastName) {
        updates.lastName = dto.lastName;
      }

      if (dto.phone !== undefined && dto.phone !== user.phone) {
        updates.phone = dto.phone;
      }

      if (Object.keys(updates).length === 0) {
        // ❌ No hay cambios
        return;
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: updates,
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar datos del usuario");
    }
  }

  /*
  async verifyUserEmail(userId: number): Promise<void> {
    try {
      const user = await this.findById(userId);
    if (!user) throwNotFound("Usuario no encontrado");

    await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
    } catch (error) {
      handleServiceError(error, "Error al verificar el correo del usuario");
    }
  }
    */
}
