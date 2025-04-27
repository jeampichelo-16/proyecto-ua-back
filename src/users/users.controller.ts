import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UserResponseDto } from "./dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { ThrottleErrorDto } from "src/common/dto/throttle-error.dto";
import { OnlyRoles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Role } from "src/common/enum/role.enum";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { AuthenticatedRequest } from "src/common/types/authenticated-user";

@SkipThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@OnlyRoles(Role.ADMIN, Role.EMPLEADO)
@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener perfil del usuario autenticado" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.getProfileById(req.user.id);
  }
}
