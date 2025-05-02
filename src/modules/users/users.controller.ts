import {
  Controller,
  Get,
  UseGuards,
  Req,
  HttpCode,
  Query,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UserResponseDto } from "./dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { OnlyRoles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Role } from "src/common/enum/role.enum";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { AuthenticatedRequest } from "src/common/types/authenticated-user";
import { MessageResponseDto } from "src/common/dto/message-response.dto";
import { PaginationQueryDto } from "src/common/dto/pagination-query.dto";
import { CreateClientDto } from "../clients/dto/create-client.dto";
import { UpdateClientDto } from "../clients/dto/update-client.dto";
import { CreateQuotationDto } from "../quotations/dto/create-quotation.dto";
import { UpdateQuotationDto } from "../quotations/dto/update-quotation-delivery.dto";

@ApiTags("users")
@Controller("users")
@SkipThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@OnlyRoles(Role.ADMIN, Role.EMPLEADO)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener perfil del usuario autenticado" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.getProfileById(req.user.id);
  }

  //clientes
  @Get("clients")
  @HttpCode(200)
  @ApiOperation({
    summary: "Listar todos los clientes",
  })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async getAllClientsPaginated(
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<MessageResponseDto> {
    const clientsPaginated = await this.usersService.getAllClientsPaginated(
      paginationQuery.page ?? 1,
      paginationQuery.pageSize ?? 10
    );
    return {
      message: "Lista de clientes obtenida correctamente",
      statusCode: 200,
      success: true,
      data: clientsPaginated,
    };
  }

  @Post("clients")
  @HttpCode(201)
  @ApiOperation({ summary: "Crear un nuevo cliente" })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async createClient(
    @Body() createUserDto: CreateClientDto
  ): Promise<MessageResponseDto> {
    await this.usersService.createClient(createUserDto);
    return {
      message: "Cliente registrado correctamente",
      statusCode: 201,
      success: true,
    };
  }

  @Patch("clients/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Actualizar un cliente" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async updateClient(
    @Param("id") id: number,
    @Body() updateUserDto: UpdateClientDto
  ): Promise<MessageResponseDto> {
    await this.usersService.updateClient(id, updateUserDto);
    return {
      message: "Cliente actualizado correctamente",
      statusCode: 200,
      success: true,
    };
  }

  @Get("clients/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Obtener un cliente por ID" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async getClientById(@Param("id") id: number): Promise<MessageResponseDto> {
    const client = await this.usersService.getClientById(id);
    return {
      message: "Cliente obtenido correctamente",
      statusCode: 200,
      success: true,
      data: client,
    };
  }

  @Delete("clients/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Eliminar un cliente" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async deleteClient(@Param("id") id: number): Promise<MessageResponseDto> {
    await this.usersService.deleteClient(id);
    return {
      message: "Cliente eliminado correctamente",
      statusCode: 200,
      success: true,
    };
  }

  //crear cotizacion
  @Post("quotations")
  @HttpCode(201)
  @ApiOperation({ summary: "Registrar una cotización" })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async createQuotation(
    @Body() dto: CreateQuotationDto
  ): Promise<MessageResponseDto> {
    await this.usersService.createQuotation(dto);

    return {
      message: "Cotización registrada correctamente",
      statusCode: 201,
      success: true,
    };
  }

  //activar cotizacion
  @Patch("quotations/:id/activate")
  @HttpCode(200)
  @ApiOperation({ summary: "Activar una cotización" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async activateQuotation(
    @Param("id") id: number,
    @Body() dto: UpdateQuotationDto
  ): Promise<MessageResponseDto> {
    await this.usersService.activateQuotation( id, dto);

    return {
      message: "Cotización activada correctamente",
      statusCode: 200,
      success: true,
    };
  }

  //cancelar cotizacion
  @Patch("quotations/:id/cancel")
  @HttpCode(200)
  @ApiOperation({ summary: "Cancelar una cotización" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async cancelQuotation(
    @Param("id") id: number
  ): Promise<MessageResponseDto> {
    await this.usersService.cancelQuotation(id);

    return {
      message: "Cotización cancelada correctamente",
      statusCode: 200,
      success: true,
    };
  }

  //listar cotizaciones activas paginadas 
  

  //lisar cotizaciones paginadas
}
