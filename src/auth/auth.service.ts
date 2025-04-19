// auth.service.ts mejorado con estructura enriquecida de errores y respuestas

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { Response } from "express";
import * as jwt from "jsonwebtoken";

import { UsersService } from "../users/users.service";
import { clearAuthCookies } from "src/common/utils/clear-auth-cookies";
import { validateRefreshToken } from "src/common/utils/validate-refresh-token";
import { generateTokens } from "src/common/utils/generate-tokens";
import { MailService } from "src/mail/mail.service";
import { MailTemplate } from "src/mail/constants/mail-template.enum";

import { RegisterDto } from "./dto/register.dto";
import { TokensResponseDto } from "src/common/dto/tokens-response.dto";
import { AuthenticatedUser } from "src/common/types/authenticated-user";

import { Role as AppRole, Role } from "src/common/enum/role.enum";
import { Role as PrismaRole } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService
  ) {}

  // auth.service.ts
  async validateUser(
    email: string,
    password: string,
    expectedRole?: AppRole // 👈 usa tu enum personalizado en la firma
  ): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Credenciales inválidas",
        error: "Unauthorized",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Credenciales inválidas",
        error: "Unauthorized",
      });

    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        statusCode: 401,
        message:
          "Debes verificar tu correo electrónico antes de iniciar sesión.",
        error: "Correo no verificado",
      });
    }

    // 👇 Cast directo para comparar enums de diferentes fuentes
    if (expectedRole && user.role !== (expectedRole as PrismaRole)) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: `No tienes permisos para iniciar sesión como ${expectedRole}`,
        error: "Unauthorized",
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as AppRole, // 👈 casteo al tipo que usas en el dominio
    };
  }

  async loginAndSaveRefreshToken(
    user: AuthenticatedUser
  ): Promise<TokensResponseDto> {
    const tokens = generateTokens(this.jwt, this.configService, {
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async registerUser(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException({
        statusCode: 409,
        message: "El usuario ya existe",
        error: "Conflict",
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      role: dto.role ?? AppRole.CLIENTE,
    });

    const payload = { sub: user.id, type: "verify" };

    if (payload.type !== "verify") {
      throw new BadRequestException({
        statusCode: 400,
        message: "Token incorrecto",
        error: "Bad Request",
      });
    }

    const appUrl = this.configService.get<string>("APP_URL")!;
    const token = jwt.sign(
      payload,
      this.configService.get("JWT_VERIFICATION_SECRET_EMAIL")!,
      {
        expiresIn: this.configService.get("TIMEOUT_VERIFICATION_TOKEN_EMAIL"),
      }
    );
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    await this.mailService.sendTemplateEmail(
      user.email,
      "Confirma tu correo electrónico",
      MailTemplate.VERIFY,
      {
        name: user.email,
        link: verificationUrl,
      }
    );

    return { id: user.id, email: user.email };
  }

  async refreshTokens(
    refreshToken: string,
    res: Response
  ): Promise<TokensResponseDto> {
    try {
      const payload = validateRefreshToken(refreshToken, this.configService);

      if (!payload.sub) {
        clearAuthCookies(res);
        throw new UnauthorizedException({
          statusCode: 401,
          message: "Token inválido",
          error: "Unauthorized",
        });
      }

      const user = await this.usersService.findById(Number(payload.sub));
      if (!user) {
        clearAuthCookies(res);
        throw new UnauthorizedException({
          statusCode: 401,
          message: "Token inválido",
          error: "Unauthorized",
        });
      }

      if (!user.refreshToken) {
        clearAuthCookies(res);
        throw new UnauthorizedException({
          statusCode: 401,
          message: "Token reutilizado — sesión revocada",
          error: "ReusedToken",
        });
      }

      if (user.refreshToken !== refreshToken) {
        await this.usersService.clearRefreshToken(user.id);
        clearAuthCookies(res);
        throw new UnauthorizedException({
          statusCode: 401,
          message: "Token reutilizado — sesión revocada",
          error: "ReusedToken",
        });
      }

      const newTokens = generateTokens(this.jwt, this.configService, {
        sub: user.id,
        email: user.email,
        role: user.role as AppRole,
      });

      await this.usersService.updateRefreshToken(
        user.id,
        newTokens.refreshToken
      );

      return newTokens;
    } catch (err) {
      clearAuthCookies(res);
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Token inválido",
        error: "Unauthorized",
      });
    }
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.clearRefreshToken(userId);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Usuario no encontrado",
        error: "Unauthorized",
      });
    }

    if (user.isEmailVerified) {
      throw new BadRequestException({
        statusCode: 400,
        message: "Este correo ya fue verificado",
        error: "Bad Request",
      });
    }

    const payload = { sub: user.id, type: "verify" };
    const token = jwt.sign(
      payload,
      this.configService.get<string>("JWT_VERIFICATION_SECRET_EMAIL")!,
      {
        expiresIn: this.configService.get<string>(
          "TIMEOUT_VERIFICATION_TOKEN_EMAIL"
        ),
      }
    );

    const appUrl = this.configService.get<string>("APP_URL")!;
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    await this.mailService.sendTemplateEmail(
      user.email,
      "Confirma tu correo electrónico",
      MailTemplate.VERIFY,
      {
        name: user.email,
        link: verificationUrl,
      }
    );
  }

  // src/auth/auth.service.ts
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    // 🔐 Bloqueamos si no existe o si no tiene un rol permitido
    if (!user || (user.role !== Role.CLIENTE && user.role !== Role.EMPLEADO)) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "No estás autorizado para esta operación",
        error: "Unauthorized",
      });
    }

    const payload = { sub: user.id, type: "reset" };

    const token = jwt.sign(
      payload,
      this.configService.get("JWT_VERIFICATION_SECRET_EMAIL")!,
      {
        expiresIn: this.configService.get("TIMEOUT_VERIFICATION_TOKEN_EMAIL"),
      }
    );

    const resetUrl = `${this.configService.get(
      "APP_URL"
    )}/api/auth/reset-password?token=${token}`;

    await this.mailService.sendTemplateEmail(
      user.email,
      "Restablece tu contraseña",
      MailTemplate.RESET_PASSWORD,
      {
        name: user.email,
        link: resetUrl,
      }
    );
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        message: "El correo no está registrado",
        error: "Bad Request",
      });
    }

    const payload = { sub: user.id, type: "reset" };
    const token = jwt.sign(
      payload,
      this.configService.get<string>("JWT_VERIFICATION_SECRET_EMAIL")!,
      {
        expiresIn: this.configService.get<string>(
          "TIMEOUT_VERIFICATION_TOKEN_EMAIL"
        ),
      }
    );

    const resetUrl = `${this.configService.get(
      "APP_URL"
    )}/reset-password?token=${token}`;

    await this.mailService.sendTemplateEmail(
      user.email,
      "Restablece tu contraseña",
      MailTemplate.RESET_PASSWORD,
      {
        name: user.email,
        link: resetUrl,
      }
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = jwt.verify(
        token,
        this.configService.get<string>("JWT_VERIFICATION_SECRET_EMAIL")!
      ) as jwt.JwtPayload;

      if (payload.type !== "reset") {
        throw new BadRequestException({
          statusCode: 400,
          message: "Token inválido para reset",
          error: "Bad Request",
        });
      }

      const user = await this.usersService.findById(Number(payload.sub));
      if (!user) {
        throw new BadRequestException({
          statusCode: 400,
          message: "Usuario no encontrado",
          error: "Bad Request",
        });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await this.usersService.updatePassword(user.id, hashed);
    } catch (err) {
      throw new BadRequestException({
        statusCode: 400,
        message: "Token inválido o expirado",
        error: "Bad Request",
      });
    }
  }
}
