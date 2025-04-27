import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { setAuthCookies } from "src/common/utils/cookies";
import { SkipThrottle } from "@nestjs/throttler";

// DTOs del módulo auth
import { LoginDto } from "./dto/login.dto";

// DTOs comunes
import { MessageResponseDto } from "src/common/dto/message-response.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";

// Tipado de req.user
import { AuthenticatedRequest } from "src/common/types/authenticated-user";

// Swagger
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

// Otros
import { ThrottleErrorDto } from "src/common/dto/throttle-error.dto";
import { Role as AppRole } from "src/common/enum/role.enum";
import { Public } from "src/common/decorators/public.decorator";
import { OnlyRoles } from "src/common/decorators/roles.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UsersService } from "src/users/users.service";
import { LoginResponseDto } from "./dto/login-response.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Inicio de sesión con cookies" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(
      dto.email,
      dto.password,
      dto.role as AppRole
    );
    const tokens = await this.authService.loginAndSaveRefreshToken(user);
    setAuthCookies(res, tokens);
    const profileUser = await this.usersService.getProfileById(user.id);
    return {
      message: "Inicio de sesión exitoso ✅",
      statusCode: 200,
      success: true,
      user: profileUser,
    };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @OnlyRoles(AppRole.ADMIN, AppRole.EMPLEADO)
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

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @OnlyRoles(AppRole.ADMIN, AppRole.EMPLEADO)
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
  @Post("forgot-password")
  @HttpCode(200)
  @ApiOperation({ summary: "Solicitar recuperación de contraseña" })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto
  ): Promise<MessageResponseDto> {
    await this.authService.sendResetPasswordEmail(dto.email);
    return {
      message: "Correo enviado para restablecer contraseña",
      statusCode: 200,
      success: true,
    };
  }

  @Public()
  @Post("reset-password")
  @HttpCode(200)
  @ApiOperation({ summary: "Restablecer contraseña con token" })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async resetPassword(
    @Body() dto: ResetPasswordDto
  ): Promise<MessageResponseDto> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return {
      message: "Contraseña restablecida correctamente",
      statusCode: 200,
      success: true,
    };
  }

  /*
  @Public()
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
      await this.authService.verifyEmailToken(token);

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
  }*/

  /*
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
  */

  /*
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
  */
}
