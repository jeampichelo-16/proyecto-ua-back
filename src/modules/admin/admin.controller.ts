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
  Query,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { OnlyRoles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enum/role.enum";
import { AdminService } from "./admin.service";
import { CreateUserDto, UserResponseDto } from "src/modules/users/dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { PaginationQueryDto } from "src/common/dto/pagination-query.dto";
import { MessageResponseDto } from "src/common/dto/message-response.dto";
import { SkipThrottle } from "@nestjs/throttler";
import { UpdateUserDto } from "../users/dto/update-user.dto";
import { CreateOperatorDto } from "../operators/dto/create-operator.dto";
import { UpdateOperatorDto } from "../operators/dto/update-operator.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { multerOptionsMemory } from "src/common/utils/multer-options.util";
import { CreateMachineDto } from "../platforms/dto/create-platform.dto";
import { UpdateMachineDto } from "../platforms/dto/update-machine.dto";
import { MachineResponseDto } from "../platforms/dto/machine-response.dto";

@SkipThrottle()
@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@OnlyRoles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Vista del panel de administración" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async getClientsSummary() {
    return this.adminService.getClientsSummary(); // Internamente usa ClientsService
  }

  //employees
  @Get("employees")
  @HttpCode(200)
  @ApiOperation({
    summary: "Listar todos los empleados",
  })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async getEmployeesPaginated(
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<MessageResponseDto> {
    const employeesPaginated = await this.adminService.getAllEmployeePaginated(
      paginationQuery.page ?? 1,
      paginationQuery.pageSize ?? 10
    );
    return {
      message: "Lista de empleados obtenida correctamente",
      statusCode: 200,
      success: true,
      data: employeesPaginated,
    };
  }

  @Post("employees")
  @HttpCode(201)
  @ApiOperation({ summary: "Crear un nuevo empleado" })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async createEmployee(
    @Body() createUserDto: CreateUserDto
  ): Promise<MessageResponseDto> {
    await this.adminService.createEmployee(createUserDto);
    return {
      message: "Usuario registrado correctamente",
      statusCode: 201,
      success: true,
    };
  }

  @Patch("employees/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Actualizar un empleado existente" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiParam({ name: "id", type: Number })
  async updateEmployee(
    @Param("id") id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<MessageResponseDto> {
    await this.adminService.updateEmployee(Number(id), updateUserDto);
    return {
      message: "Empleado actualizado correctamente",
      statusCode: 200,
      success: true,
    };
  }

  @Get("employees/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Obtener el perfil de un empleado por ID" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiParam({ name: "id", type: Number })
  async getEmployeeById(@Param("id") id: string) {
    const user = await this.adminService.getEmployeeById(Number(id));

    return {
      message: "Empleado obtenido correctamente",
      statusCode: 200,
      success: true,
      data: user,
    };
  }

  @Delete("employees/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Eliminar un empleado por ID" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiParam({ name: "id", type: Number })
  async deleteEmployee(@Param("id") id: string) {
    await this.adminService.deleteEmployee(Number(id));
    return {
      message: "Empleado eliminado correctamente",
      statusCode: 200,
      success: true,
    };
  }

  //operarios
  @Get("operators")
  @HttpCode(200)
  @ApiOperation({
    summary: "Listar todos los operarios",
  })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async getAllOperatorsPaginated(
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<MessageResponseDto> {
    const usersPaginated = await this.adminService.getAllOperatorsPaginated(
      paginationQuery.page ?? 1,
      paginationQuery.pageSize ?? 10
    );
    return {
      message: "Lista de operarios obtenida correctamente",
      statusCode: 200,
      success: true,
      data: usersPaginated,
    };
  }

  @Post("operators")
  @HttpCode(201)
  @ApiOperation({ summary: "Crear un nuevo operario" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "emoPDFPath", maxCount: 1 },
        { name: "operativityCertificatePath", maxCount: 1 },
      ],
      multerOptionsMemory(2)
    )
  )
  async createOperator(
    @UploadedFiles()
    files: {
      emoPDFPath?: Express.Multer.File[];
      operativityCertificatePath?: Express.Multer.File[];
    },
    @Body() dto: CreateOperatorDto // 👈 Aquí usa el nuevo DTO correcto
  ): Promise<MessageResponseDto> {
    await this.adminService.createOperatorWithFiles(dto, files);

    return {
      message: "Operario registrado correctamente",
      statusCode: 201,
      success: true,
    };
  }

  @Patch("operators/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Actualizar un operario existente" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiParam({ name: "id", type: Number })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "emoPDFPath", maxCount: 1 },
        { name: "operativityCertificatePath", maxCount: 1 },
      ],
      multerOptionsMemory(2)
    )
  )
  async updateOperator(
    @Param("id") id: number,
    @UploadedFiles()
    files: {
      emoPDFPath?: Express.Multer.File[];
      operativityCertificatePath?: Express.Multer.File[];
    },
    @Body() updateDto: UpdateOperatorDto
  ): Promise<MessageResponseDto> {
    await this.adminService.updateOperatorWithFiles(id, updateDto, files);
    return {
      message: "Operario actualizado correctamente",
      success: true,
      statusCode: 200,
    };
  }

  @Get("operators/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Obtener el perfil de un operario por ID" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiParam({ name: "id", type: Number })
  async getOperatorById(@Param("id") id: string) {
    const user = await this.adminService.getOperatorById(Number(id));

    return {
      message: "Operario obtenido correctamente",
      statusCode: 200,
      success: true,
      data: user,
    };
  }

  @Delete("operators/:id")
  @HttpCode(200)
  @ApiOperation({ summary: "Eliminar un operario por ID" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiParam({ name: "id", type: Number })
  async deleteOperator(@Param("id") id: string) {
    await this.adminService.deleteOperator(Number(id));
    return {
      message: "Operario eliminado correctamente",
      statusCode: 200,
      success: true,
    };
  }

  //maquinarias
  @Post("machines")
  @HttpCode(201)
  @ApiOperation({ summary: "Crear una nueva maquinaria" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "operativityCertificatePath", maxCount: 1 },
        { name: "ownershipDocumentPath", maxCount: 1 },
      ],
      multerOptionsMemory(2)
    )
  )
  async createMachine(
    @UploadedFiles()
    files: {
      operativityCertificatePath?: Express.Multer.File[];
      ownershipDocumentPath?: Express.Multer.File[];
    },
    @Body() dto: CreateMachineDto // 👈 Aquí usa el nuevo DTO correcto
  ): Promise<MessageResponseDto> {
    await this.adminService.createMachineWithFiles(dto, files);

    return {
      message: "Maquinaria registrada correctamente",
      statusCode: 201,
      success: true,
    };
  }

  @Patch("machines/:serial")
  @HttpCode(200)
  @ApiOperation({ summary: "Actualizar una maquinaria existente" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiParam({ name: "serial", type: String })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "operativityCertificatePath", maxCount: 1 },
        { name: "ownershipDocumentPath", maxCount: 1 },
      ],
      multerOptionsMemory(2)
    )
  )
  async updateMachine(
    @Param("serial") serial: string,
    @UploadedFiles()
    files: {
      operativityCertificatePath?: Express.Multer.File[];
      ownershipDocumentPath?: Express.Multer.File[];
    },
    @Body() updateDto: UpdateMachineDto
  ): Promise<MessageResponseDto> {
    await this.adminService.updateMachineWithFiles(serial, updateDto, files);
    return {
      message: "Maquinaria actualizada correctamente",
      success: true,
      statusCode: 200,
    };
  }

  @Get("machines/:serial")
  @HttpCode(200)
  @ApiOperation({ summary: "Obtener el perfil de una maquinaria por serial" })
  @ApiResponse({ status: 200, type: MachineResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiParam({ name: "serial", type: String })
  async getMachineBySerial(@Param("serial") serial: string) {
    const machine = await this.adminService.getMachineBySerial(serial);

    return {
      message: "Maquinaria obtenida correctamente",
      statusCode: 200,
      success: true,
      data: machine,
    };
  }

  @Get("machines")
  @HttpCode(200)
  @ApiOperation({
    summary: "Listar todas las maquinarias",
  })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async getAllMachinesPaginated(
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<MessageResponseDto> {
    const machinesPaginated = await this.adminService.getAllMachinesPaginated(
      paginationQuery.page ?? 1,
      paginationQuery.pageSize ?? 10
    );
    return {
      message: "Lista de maquinarias obtenida correctamente",
      statusCode: 200,
      success: true,
      data: machinesPaginated,
    };
  }

  @Delete("machines/:serial")
  @HttpCode(200)
  @ApiOperation({ summary: "Eliminar una maquinaria por serial" })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiParam({ name: "serial", type: String })
  async deleteMachine(@Param("serial") serial: string) {
    await this.adminService.deleteMachine(serial);
    return {
      message: "Maquinaria eliminada correctamente",
      statusCode: 200,
      success: true,
    };
  }

  
}
