import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  HttpCode,
  Query,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { setAuthCookies } from "src/common/utils/cookies";
import * as jwt from "jsonwebtoken";
import { UsersService } from "src/users/users.service";
import { ConfigService } from "@nestjs/config";
import { SkipThrottle } from "@nestjs/throttler";

// DTOs del módulo auth
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";

// DTOs comunes
import { MessageResponseDto } from "src/common/dto/message-response.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { TokensResponseDto } from "src/common/dto/tokens-response.dto";
import { VerifyEmailResponseDto } from "src/common/dto/verify-email-response.dto";

// Tipado de req.user
import { AuthenticatedRequest } from "src/common/types/authenticated-user";

// Swagger
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";

// Otros
import { ThrottleErrorDto } from "src/common/dto/throttle-error.dto";
import { Role as AppRole } from "src/common/enum/role.enum";
import { Public } from "src/common/decorators/public.decorator";
import { OnlyRoles } from "src/common/decorators/roles.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {}

  @Public()
  @Post("register")
  @HttpCode(201)
  @ApiOperation({ summary: "Registro de usuario" })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async register(@Body() dto: RegisterDto): Promise<MessageResponseDto> {
    await this.authService.registerUser(dto);
    return {
      message: "Usuario registrado correctamente ✅",
      statusCode: 201,
      success: true,
    };
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Inicio de sesión con cookies" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<MessageResponseDto> {
    const user = await this.authService.validateUser(
      dto.email,
      dto.password,
      dto.role as AppRole
    );
    const tokens = await this.authService.loginAndSaveRefreshToken(user);
    setAuthCookies(res, tokens);
    return {
      message: "Inicio de sesión exitoso ✅",
      statusCode: 200,
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @OnlyRoles(AppRole.ADMIN, AppRole.EMPLEADO, AppRole.CLIENTE)
  @Post("refresh-token")
  @HttpCode(200)
  @ApiOperation({ summary: "Rotar token de acceso" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<MessageResponseDto> {
    const tokens = await this.authService.refreshTokens(
      req.cookies?.refresh_token,
      res
    );
    setAuthCookies(res, tokens);
    return {
      message: "Token actualizado correctamente ✅",
      statusCode: 200,
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @OnlyRoles(AppRole.ADMIN, AppRole.EMPLEADO, AppRole.CLIENTE)
  @SkipThrottle()
  @Post("logout")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cerrar sesión y limpiar cookies" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<MessageResponseDto> {
    await this.authService.logout(req.user.id);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return {
      message: "Sesión cerrada correctamente ✅",
      statusCode: 200,
      success: true,
    };
  }

  @Public()
  @SkipThrottle()
  @Get("verify-email")
  @ApiOperation({ summary: "Verificar correo electrónico con token" })
  @ApiQuery({ name: "token", required: true })
  @ApiResponse({ status: 200, type: VerifyEmailResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async verifyEmail(
    @Query("token") token: string
  ): Promise<VerifyEmailResponseDto> {
    if (!token || typeof token !== "string") {
      throw new BadRequestException({
        statusCode: 400,
        message: "Token no válido",
        error: "Bad Request",
      });
    }

    try {
      const payload = jwt.verify(
        token,
        this.configService.get<string>("JWT_VERIFICATION_SECRET_EMAIL")!
      ) as jwt.JwtPayload;

      await this.usersService.verifyUserEmail(Number(payload.sub));

      return {
        message: "Correo verificado correctamente ✅",
        statusCode: 200,
        success: true,
      };
    } catch (err) {
      throw new BadRequestException({
        statusCode: 400,
        message: "Token inválido o expirado",
        error: "Bad Request",
      });
    }
  }

  @Public()
  @Post("resend-verification")
  @HttpCode(200)
  @ApiOperation({ summary: "Reenviar correo de verificación" })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async resendVerification(
    @Body() dto: ResendVerificationDto
  ): Promise<MessageResponseDto> {
    await this.authService.resendVerificationEmail(dto.email);
    return {
      message: "Correo de verificación reenviado ✅",
      statusCode: 200,
      success: true,
    };
  }
}
