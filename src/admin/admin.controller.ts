import {
  Controller,
  Get,
  UseGuards,
  Param,
  Delete,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { OnlyRoles } from "src/common/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Role } from "src/common/enum/role.enum";

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";

import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { ThrottleErrorDto } from "src/common/dto/throttle-error.dto";
import { UserResponseDto } from "src/users/dto";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@OnlyRoles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Vista del panel de administración" })
  @ApiResponse({ status: 200, description: "Acceso al dashboard exitoso" })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  getDashboard() {
    return { message: "Bienvenido al panel de administración" };
  }

  @Get("users")
  @ApiOperation({ summary: "Listar todos los usuarios" })
  @ApiResponse({
    status: 200,
    description: "Lista de usuarios retornada correctamente",
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete("users/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Eliminar un usuario por ID" })
  @ApiParam({ name: "id", type: Number, description: "ID del usuario" })
  @ApiResponse({ status: 204, description: "Usuario eliminado correctamente" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  deleteUser(@Param("id") id: string) {
    return this.adminService.deleteUserById(+id);
  }

  @Patch("users/:id")
  @ApiOperation({ summary: "Actualizar información del usuario" })
  @ApiParam({ name: "id", type: Number, description: "ID del usuario" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 429, type: ThrottleErrorDto })
  updateUser(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updateUserById(+id, data);
  }
}
