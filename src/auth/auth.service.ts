// auth.service.ts mejorado con estructura enriquecida de errores y respuestas

import { Injectable, UnauthorizedException } from "@nestjs/common";
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

import { TokensResponseDto } from "src/common/dto/tokens-response.dto";
import { AuthenticatedUser } from "src/common/types/authenticated-user";

import { Role as AppRole, Role } from "src/common/enum/role.enum";
import { Role as PrismaRole } from "@prisma/client";
import {
  throwBadRequest,
  throwForbidden,
  throwNotFound,
  throwUnauthorized,
} from "src/common/utils/errors";
import { generateFrontendUrl } from "src/common/utils/generate-url";
import { parseExpiration } from "../common/utils/parseExpiration";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService
  ) {}

  async validateUser(
    email: string,
    password: string,
    expectedRole?: AppRole
  ): Promise<AuthenticatedUser> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) throwUnauthorized("Credenciales inválidas");

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throwUnauthorized("Credenciales inválidas");

      if (!user.isEmailVerified) {
        throwUnauthorized(
          "Debes verificar tu correo electrónico antes de iniciar sesión."
        );
      }

      if (!user.isActive) {
        throwUnauthorized("Tu cuenta ha sido desactivada");
      }

      if (expectedRole && user.role !== (expectedRole as PrismaRole)) {
        throwUnauthorized(
          `No tienes permisos para iniciar sesión como ${expectedRole}`
        );
      }

      await this.usersService.updateLastLogin(user.id);

      return {
        id: user.id,
        email: user.email,
        role: user.role as AppRole,
      };
    } catch (error) {
      throwUnauthorized("Error al validar el usuario");
    }
  }

  async loginAndSaveRefreshToken(
    user: AuthenticatedUser
  ): Promise<TokensResponseDto> {
    try {
      const tokens = generateTokens(this.jwt, this.configService, {
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      throwUnauthorized("Error al generar los tokens de autenticación");
    }
  }

  async refreshTokens(
    refreshToken: string,
    res: Response
  ): Promise<TokensResponseDto> {
    try {
      const payload = validateRefreshToken(refreshToken, this.configService);

      if (!payload.sub) {
        clearAuthCookies(res);
        throwUnauthorized("Token inválido");
      }

      const user = await this.usersService.findById(Number(payload.sub));
      if (!user) {
        clearAuthCookies(res);
        throwUnauthorized("Token inválido");
      }

      if (!user.refreshToken) {
        clearAuthCookies(res);
        throwUnauthorized("Token reutilizado — sesión revocada");
      }

      if (user.refreshToken !== refreshToken) {
        await this.usersService.clearRefreshToken(user.id);
        clearAuthCookies(res);
        throwUnauthorized("Token reutilizado — sesión revocada");
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
      throwUnauthorized("Token inválido");
    }
  }

  async logout(userId: number): Promise<void> {
    try {
      await this.usersService.clearRefreshToken(userId);
    } catch (error) {
      throwBadRequest("Error al cerrar sesión");
    }
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    try {
      const user = await this.usersService.findByEmail(email);
      const secret = this.configService.get<string>(
        "JWT_VERIFICATION_SECRET_EMAIL"
      )!;
      const expiresIn = this.configService.get<string>(
        "TIMEOUT_VERIFICATION_TOKEN_EMAIL"
      )!;

      if (!user) throwNotFound("Usuario no encontrado");
      //observacion
      if (!user.isEmailVerified || !user.isActive) {
        throwBadRequest("Usuario no disponible para restablecer contraseña");
      }

      const payload = { sub: user.id, type: "reset" };

      const token = jwt.sign(payload, secret, { expiresIn });

      const expiresAt = new Date(Date.now() + parseExpiration(expiresIn));

      await this.usersService.updateResetPasswordData(
        user.id,
        token,
        expiresAt
      );

      const resetUrl = generateFrontendUrl(
        this.configService.get<string>("APP_URL_FRONTEND")!,
        "/auth/restablecer-contrasena",
        token
      );

      await this.mailService.sendTemplateEmail(
        user.email,
        "Restablece tu contraseña",
        MailTemplate.RESET_PASSWORD,
        {
          name: user.email,
          link: resetUrl,
        }
      );
    } catch (error) {
      throwBadRequest(
        "Error al enviar el correo de recuperación de contraseña"
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = jwt.verify(
        token,
        this.configService.get<string>("JWT_VERIFICATION_SECRET_EMAIL")!,
        { algorithms: ["HS256"] }
      ) as jwt.JwtPayload;

      if (payload.type !== "reset") {
        throwBadRequest("Token inválido para reset");
      }

      const user = await this.usersService.findById(Number(payload.sub));
      if (!user) throwNotFound("Usuario no encontrado");

      if (!user.resetPasswordToken || !user.resetPasswordExpires) {
        throwBadRequest(
          "No hay solicitud activa de recuperación de contraseña"
        );
      }

      if (user.resetPasswordToken !== token) {
        throwBadRequest("Token de recuperación no coincide");
      }
      if (user.resetPasswordExpires.getTime() < Date.now()) {
        throwBadRequest("El enlace de recuperación ha expirado");
      }

      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        throwBadRequest("La nueva contraseña no puede ser igual a la anterior");
      }

      const hashed = await bcrypt.hash(newPassword, 10);

      await this.usersService.updatePassword(user.id, {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      });

      await this.usersService.clearRefreshToken(user.id);
    } catch (err) {
      throwBadRequest("Token inválido o expirado");
    }
  }

  /*
    async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throwNotFound("Usuario no encontrado");
    if (user.isEmailVerified) throwBadRequest("Este correo ya fue verificado");

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

    const verificationUrl = generateFrontendUrl(
      this.configService.get<string>("APP_URL_BACKEND")!,
      "/api/auth/verify-email",
      token
    );

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
      role: dto.role ?? Role.EMPLEADO,
    });

    const payload = { sub: user.id, type: "verify" };

    if (payload.type !== "verify") {
      throw new BadRequestException({
        statusCode: 400,
        message: "Token incorrecto",
        error: "Bad Request",
      });
    }

    const appUrl = this.configService.get<string>("APP_URL_FRONTEND")!;
    const token = jwt.sign(
      payload,
      this.configService.get("JWT_VERIFICATION_SECRET_EMAIL")!,
      {
        expiresIn: this.configService.get("TIMEOUT_VERIFICATION_TOKEN_EMAIL"),
      }
    );
    const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;

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
  */

  /*
  async verifyEmailToken(token: string): Promise<void> {
    const payload = jwt.verify(
      token,
      this.configService.get<string>("JWT_VERIFICATION_SECRET_EMAIL")!
    ) as jwt.JwtPayload;

    const user = await this.usersService.findById(Number(payload.sub));
    if (!user) throwNotFound("Usuario no encontrado");
    if (user.isEmailVerified) throwBadRequest("Este correo ya fue verificado");

    await this.usersService.verifyUserEmail(user.id);
  }*/
}
