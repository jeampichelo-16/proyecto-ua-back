import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { OnlyRoles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enum/role.enum";
import { AdminService } from "./admin.service";
import { CreateUserDto, UserResponseDto } from "src/users/dto";
import { ThrottleErrorDto } from "src/common/dto/throttle-error.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@OnlyRoles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Vista del panel de administración" })
  getDashboard() {
    return { message: "Bienvenido al panel de administración" };
  }

  @Get("users")
  @HttpCode(200)
  @ApiOperation({ summary: "Listar todos los usuarios" })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  getAllUsers(): Promise<UserResponseDto[]> {
    return this.adminService.getAllUsers();
  }
}
