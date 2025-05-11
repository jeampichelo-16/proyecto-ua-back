import { Injectable } from "@nestjs/common";
import { CreateUserDto, UserResponseDto } from "src/modules/users/dto";
import { Role } from "src/common/enum/role.enum";
import { UsersService } from "../users/users.service";
import {
  throwBadRequest,
  throwConflict,
  throwForbidden,
  throwNotFound,
} from "src/common/utils/errors";
import { MailService } from "../mail/mail.service";
import { MailTemplate } from "../mail/constants/mail-template.enum";
import { UpdateUserDto } from "../users/dto/update-user.dto";
import { OperatorsService } from "../operators/operators.service";
import { CreateOperatorDto } from "../operators/dto/create-operator.dto";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { validateNamedPDFUploads } from "src/common/utils/file.utils";
import { UpdateOperatorDto } from "../operators/dto/update-operator.dto";
import { FirebaseService } from "../firebase/firebase.service";
import { OperatorStatus } from "src/common/enum/operator-status.enum";
import { PlatformsService } from "../platforms/platforms.service";
import { CreateMachineDto } from "../platforms/dto/create-platform.dto";
import { generatePlatformSerial } from "src/common/utils/generate-platform-serial.util";
import { UpdateMachineDto } from "../platforms/dto/update-machine.dto";
import { PlatformStatus } from "src/common/enum/platform-status.enum";
import { PlatformType } from "src/common/enum/platform-type.enum";
import { MachineResponseDto } from "../platforms/dto/machine-response.dto";
import {
  DashboardSummaryDto,
  QuotationRatePoint,
  ResponseTimePoint,
} from "./dto/dashboard-summary.dto";
import { toZonedTime } from "date-fns-tz";
import { subDays } from "date-fns";
import { PrismaService } from "../prisma/prisma.service";
import { QuotationStatus } from "src/common/enum/quotation-status.enum";

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly operatorService: OperatorsService,
    private readonly firebaseService: FirebaseService,
    private readonly platformsService: PlatformsService,
    private readonly prisma: PrismaService
  ) {}

  async getClientsSummary() {
    /*
    const TIMEZONE = "America/Lima";
    const limaNow = toZonedTime(new Date(), TIMEZONE);
    const startDate = subDays(limaNow, 30);

    const [totalClients, totalQuotations, activeOperators, totalApproved] =
      await Promise.all([
        this.prisma.client.count(),
        this.prisma.quotation.count(),
        this.prisma.operator.count({ where: { operatorStatus: "ACTIVO" } }),
        this.prisma.quotation.count({
          where: { status: QuotationStatus.APROBADO },
        }),
      ]);

    const quotations = await this.prisma.quotation.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });

    const grouped = new Map<
      string,
      { total: number; processed: number; responseTimes: number[] }
    >();

    for (const q of quotations) {
      const date = q.createdAt.toISOString().split("T")[0];
      const record = grouped.get(date) ?? {
        total: 0,
        processed: 0,
        responseTimes: [],
      };

      record.total += 1;

      if (q.status !== QuotationStatus.PENDIENTE) {
        record.processed += 1;
        const diffHrs =
          (q.updatedAt.getTime() - q.createdAt.getTime()) / (1000 * 60 * 60);
        record.responseTimes.push(diffHrs);
      }

      grouped.set(date, record);
    }

    let rateSum = 0;
    let rateCount = 0;
    let responseSum = 0;
    let responseCount = 0;

    const quotationRateSeries: QuotationRatePoint[] = [];
    const responseTimeSeries: ResponseTimePoint[] = [];

    for (const [
      date,
      { total, processed, responseTimes },
    ] of grouped.entries()) {
      const rate = total > 0 ? (processed / total) * 100 : 0;
      quotationRateSeries.push({
        date,
        total,
        processed,
        rate: +rate.toFixed(2),
      });

      rateSum += rate;
      rateCount++;

      const avgResponse = responseTimes.length
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      responseTimeSeries.push({
        date,
        responseHours: +avgResponse.toFixed(2),
      });

      responseSum += avgResponse;
      if (avgResponse > 0) responseCount++;
    }

    const quotationConversionRate =
      totalQuotations > 0
        ? +((totalApproved / totalQuotations) * 100).toFixed(2)
        : 0;

    const avgResponseTimeInHours =
      responseCount > 0 ? +(responseSum / responseCount).toFixed(2) : 0;

    const quotationRateAvg =
      rateCount > 0 ? +(rateSum / rateCount).toFixed(2) : 0;

    return {
      totalClients,
      totalQuotations,
      activeOperators,
      quotationRateAvg,
      avgResponseTimeInHours,
      quotationConversionRate, // ✅ Incluido en respuesta
      quotationRateSeries: quotationRateSeries.sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
      responseTimeSeries: responseTimeSeries.sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    };
    */
  }

  //EMPLEADOS
  async getAllEmployeePaginated(
    page: number,
    pageSize: number
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const { data, total } = await this.usersService.findUsersByRolesPaginated(
        [Role.EMPLEADO],
        page,
        pageSize
      );

      const users = data.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        dni: user.dni,
        role: user.role as Role,
        phone: user.phone,
        isActive: user.isActive,
      }));

      return {
        users,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      handleServiceError(
        error,
        "Error al obtener la lista de empleados paginada"
      );
    }
  }

  async createEmployee(dto: CreateUserDto) {
    try {
      const user = await this.usersService.createEmployeeUser(dto);

      if (!user) {
        throwBadRequest("No se pudo crear el usuario");
      }

      await this.mailService.sendTemplateEmail(
        user.email,
        "Confirma tu correo electrónico",
        MailTemplate.SENDPASSWORD,
        {
          email: user.email,
          name: user.firstName,
          generatedPassword: user.password,
        }
      );
    } catch (error) {
      handleServiceError(error, "Error al crear el empleado");
    }
  }

  async updateEmployee(userId: number, dto: UpdateUserDto) {
    try {
      await this.usersService.updateUserEmployee(userId, dto);
    } catch (error) {
      handleServiceError(error, "Error al actualizar el empleado");
    }
  }

  async getEmployeeById(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.usersService.findById(id);

      if (!user) {
        throwNotFound("El empleado no existe");
      }

      if (user.role !== Role.EMPLEADO) {
        throwForbidden("No puedes ver usuarios que no son empleados");
      }

      const employeeProfile = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        dni: user.dni,
        phone: user.phone,
        isActive: user.isActive,
        role: user.role as Role,
      };

      return employeeProfile;
    } catch (error) {
      handleServiceError(error, "Error al obtener el empleado por ID");
    }
  }

  async deleteEmployee(id: number) {
    try {
      const user = await this.usersService.findById(id);
      if (!user) {
        throwNotFound("El empleado no existe");
      }
      if (user.role !== Role.EMPLEADO) {
        throwForbidden("No puedes eliminar usuarios que no son empleados");
      }
      await this.usersService.deleteUser(id);
    } catch (error) {
      handleServiceError(error, "Error al eliminar el empleado");
    }
  }

  //OPERADORES
  //LISTO
  async createOperatorWithFiles(
    dto: CreateOperatorDto,
    files: {
      emoPDFPath?: Express.Multer.File[];
      operativityCertificatePath?: Express.Multer.File[];
    }
  ): Promise<void> {
    try {
      validateNamedPDFUploads(files, [
        "emoPDFPath",
        "operativityCertificatePath",
      ]);

      const [existingEmailUser, existingDniUser] = await Promise.all([
        this.usersService.findByEmail(dto.email),
        this.usersService.findByDni(dto.dni),
      ]);

      if (existingEmailUser || existingDniUser) {
        throwConflict("Usuario ya existe");
      }

      const folder = `operators/${dto.dni}`;
      const emoPDF = files.emoPDFPath?.[0];
      const operativityPDF = files.operativityCertificatePath?.[0];

      if (!emoPDF || !operativityPDF) {
        throwBadRequest("Archivos no válidos o faltantes");
      }

      const emoUrl = await this.firebaseService.uploadBuffer(
        emoPDF.buffer,
        `${folder}/emo-certificado-${Date.now()}.pdf`,
        emoPDF.mimetype
      );

      const operativityUrl = await this.firebaseService.uploadBuffer(
        operativityPDF.buffer,
        `${folder}/operatividad-certificado-${Date.now()}.pdf`,
        operativityPDF.mimetype
      );

      await this.operatorService.createOperator(dto, emoUrl, operativityUrl);
    } catch (error) {
      handleServiceError(error, "Error al crear el operario");
    }
  }

  //LISTO
  async updateOperatorWithFiles(
    operatorId: number,
    dto: UpdateOperatorDto,
    files: {
      emoPDFPath?: Express.Multer.File[];
      operativityCertificatePath?: Express.Multer.File[];
    }
  ): Promise<void> {
    try {
      const operator = await this.operatorService.getById(operatorId);
      if (!operator) throwNotFound("Operario no encontrado");

      const incomingDto: UpdateOperatorDto = {
        ...dto,
        operatorStatus: dto.operatorStatus?.toUpperCase() as OperatorStatus,
      };

      const hasDataChanges = await this.hasOperatorChanges(
        {
          firstName: operator.user.firstName,
          lastName: operator.user.lastName,
          phone: operator.user.phone,
          status: operator.operatorStatus as OperatorStatus,
          costService: operator.costService,
        },
        incomingDto
      );

      const hasFileChanges =
        (files.emoPDFPath?.length ?? 0) > 0 ||
        (files.operativityCertificatePath?.length ?? 0) > 0;

      if (!hasDataChanges && !hasFileChanges) {
        throwBadRequest(
          "No se han realizado cambios en los datos del operario o archivos"
        );
      }

      // 📦 Subir archivos si existen
      const folder = `operators/${operator.user.dni}`;
      let emoPDFUrl = operator.emoPDFPath;
      let operativityPDFUrl = operator.operativityCertificatePath;

      if (files.emoPDFPath?.[0]) {
        await this.firebaseService.deleteFileFromUrl(operator.emoPDFPath);
        emoPDFUrl = await this.firebaseService.uploadBuffer(
          files.emoPDFPath[0].buffer,
          `${folder}/emo-certificado-${Date.now()}.pdf`,
          files.emoPDFPath[0].mimetype
        );
      }

      if (files.operativityCertificatePath?.[0]) {
        await this.firebaseService.deleteFileFromUrl(
          operator.operativityCertificatePath
        );
        operativityPDFUrl = await this.firebaseService.uploadBuffer(
          files.operativityCertificatePath[0].buffer,
          `${folder}/operatividad-certificado-${Date.now()}.pdf`,
          files.operativityCertificatePath[0].mimetype
        );
      }

      // 1️⃣ Actualiza datos del usuario
      await this.usersService.updateOperatorUser(operator.userId, incomingDto);

      // 2️⃣ Luego actualiza datos del operador
      await this.operatorService.updateOperatorInfo(operatorId, {
        operatorStatus: incomingDto.operatorStatus,
        emoPDFPath: emoPDFUrl,
        operativityCertificatePath: operativityPDFUrl,
        costService: incomingDto.costService,
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar el operario");
    }
  }

  //LISTO
  async hasOperatorChanges(
    current: {
      firstName: string;
      lastName: string;
      phone: string | null;
      costService: number;
      status: OperatorStatus;
    },
    incoming: UpdateOperatorDto
  ): Promise<boolean> {
    const normalize = (val: string | null | undefined) => val?.trim() ?? null;

    return (
      (incoming.firstName !== undefined &&
        normalize(incoming.firstName) !== normalize(current.firstName)) ||
      (incoming.lastName !== undefined &&
        normalize(incoming.lastName) !== normalize(current.lastName)) ||
      (incoming.phone !== undefined &&
        normalize(incoming.phone) !== normalize(current.phone)) ||
      (incoming.operatorStatus !== undefined &&
        incoming.operatorStatus !== current.status) ||
      (incoming.costService !== undefined &&
        incoming.costService !== current.costService)
    );
  }

  //LISTO
  async getAllOperatorsPaginated(
    page: number,
    pageSize: number
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const { data, total } = await this.usersService.findUsersByRolesPaginated(
        [Role.OPERARIO],
        page,
        pageSize
      );

      const users = data.map((user: any) => ({
        id: user.id,
        idOperator: user.operario?.[0]?.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        dni: user.dni,
        role: user.role as Role,
        phone: user.phone,
        operatorStatus: user.operario?.[0]?.operatorStatus,
        isActive: user.isActive,
      }));

      return {
        users,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      handleServiceError(
        error,
        "Error al obtener la lista de operarios paginada"
      );
    }
  }

  //LISTO
  async getOperatorById(operatorId: number) {
    const operator = await this.operatorService.getById(operatorId);

    if (!operator) {
      throwNotFound("Operario no encontrado");
    }

    const profileOperator = {
      idOperator: operator.id,
      email: operator.user.email,
      username: operator.user.username,
      firstName: operator.user.firstName,
      lastName: operator.user.lastName,
      costService: operator.costService,
      dni: operator.user.dni,
      phone: operator.user.phone,
      operatorStatus: operator.operatorStatus as OperatorStatus,
      role: operator.user.role as Role,
      emoPDFPath: operator.emoPDFPath,
      operativityCertificatePath: operator.operativityCertificatePath,
    };

    return profileOperator;
  }

  /*
  //LISTO
  async deleteOperator(operatorId: number) {
    const operator = await this.operatorService.getById(operatorId);

    if (!operator) {
      throwNotFound("Operario no encontrado");
    }

    await this.firebaseService.deleteFileFromUrl(operator.emoPDFPath);
    await this.firebaseService.deleteFileFromUrl(
      operator.operativityCertificatePath
    );

    await this.operatorService.deleteOperator(operatorId);
  }
  */
 
  //PLATAFORMAS - MAQUINARIA
  //LISTO
  async createMachineWithFiles(
    dto: CreateMachineDto,
    files: {
      operativityCertificatePath?: Express.Multer.File[];
      ownershipDocumentPath?: Express.Multer.File[];
    }
  ): Promise<void> {
    try {
      validateNamedPDFUploads(files, [
        "operativityCertificatePath",
        "ownershipDocumentPath",
      ]);

      let serialPlatform: string;

      do {
        serialPlatform = generatePlatformSerial();
      } while (await this.platformsService.getBySerial(serialPlatform));

      const existsMachinery = await this.platformsService.getBySerial(
        serialPlatform
      );

      if (existsMachinery) {
        throwConflict("La maquinaria ya existe");
      }

      const folder = `machines/${serialPlatform}`;
      const operativityPDF = files.operativityCertificatePath?.[0];
      const ownershipPDF = files.ownershipDocumentPath?.[0];

      if (!operativityPDF || !ownershipPDF) {
        throwBadRequest("Archivos no válidos o faltantes");
      }

      const operativityPath = await this.firebaseService.uploadBuffer(
        operativityPDF.buffer,
        `${folder}/operatividad-certificado-${Date.now()}.pdf`,
        operativityPDF.mimetype
      );

      const ownershipPath = await this.firebaseService.uploadBuffer(
        ownershipPDF.buffer,
        `${folder}/documento-propiedad-${Date.now()}.pdf`,
        ownershipPDF.mimetype
      );

      await this.platformsService.createMachine(
        dto,
        serialPlatform,
        operativityPath,
        ownershipPath
      );
    } catch (error) {
      handleServiceError(error, "Error al crear la maquinaria");
    }
  }

  //LISTO
  async updateMachineWithFiles(
    machineSerial: string,
    dto: UpdateMachineDto,
    files: {
      operativityCertificatePath?: Express.Multer.File[];
      ownershipDocumentPath?: Express.Multer.File[];
    }
  ): Promise<void> {
    try {
      const machine = await this.platformsService.getBySerial(machineSerial);

      if (!machine) throwNotFound("Maquinaria no encontrada");

      if (machine.status == PlatformStatus.EN_COTIZACION) {
        throwBadRequest("No se puede actualizar una maquinaria en cotización");
      }

      const incomingDto: UpdateMachineDto = {
        ...dto,
        typePlatform: dto.typePlatform?.toUpperCase() as PlatformType,
        status: dto.status?.toUpperCase() as PlatformStatus,
      };

      const hasDataChanges = await this.hasMachineChanges(
        {
          brand: machine.brand,
          model: machine.model,
          typePlatform: machine.typePlatform as PlatformType,
          price: machine.price,
          status: machine.status as PlatformStatus,
          description: machine.description,
        },
        incomingDto
      );

      const hasFileChanges =
        (files.operativityCertificatePath?.length ?? 0) > 0 ||
        (files.ownershipDocumentPath?.length ?? 0) > 0;

      if (!hasDataChanges && !hasFileChanges) {
        throwBadRequest(
          "No se han realizado cambios en los datos de la maquinaria o archivos"
        );
      }

      const folder = `machines/${machineSerial}`;
      let operativityPDFUrl = machine.operativityCertificatePath;
      let ownershipPDFUrl = machine.ownershipDocumentPath;

      // Subida de archivo operatividad
      if (files.operativityCertificatePath?.[0]) {
        await this.firebaseService.deleteFileFromUrl(
          machine.operativityCertificatePath
        );
        operativityPDFUrl = await this.firebaseService.uploadBuffer(
          files.operativityCertificatePath[0].buffer,
          `${folder}/operatividad-certificado-${Date.now()}.pdf`,
          files.operativityCertificatePath[0].mimetype
        );
      }

      // Subida de archivo documento de propiedad
      if (files.ownershipDocumentPath?.[0]) {
        await this.firebaseService.deleteFileFromUrl(
          machine.ownershipDocumentPath
        );
        ownershipPDFUrl = await this.firebaseService.uploadBuffer(
          files.ownershipDocumentPath[0].buffer,
          `${folder}/documento-propiedad-${Date.now()}.pdf`,
          files.ownershipDocumentPath[0].mimetype
        );
      }

      await this.platformsService.updateMachine(
        machineSerial,
        dto,
        operativityPDFUrl,
        ownershipPDFUrl
      );
    } catch (error) {
      handleServiceError(error, "Error al actualizar la maquinaria");
    }
  }

  //LISTO
  async hasMachineChanges(
    current: {
      brand: string;
      model: string;
      typePlatform: PlatformType;
      price: number;
      status: PlatformStatus;
      description: string | null;
    },
    incoming: UpdateMachineDto
  ): Promise<boolean> {
    const normalize = (val: string | null | undefined) => val?.trim() ?? null;

    return (
      (incoming.brand !== undefined &&
        normalize(incoming.brand) !== normalize(current.brand)) ||
      (incoming.model !== undefined &&
        normalize(incoming.model) !== normalize(current.model)) ||
      (incoming.typePlatform !== undefined &&
        incoming.typePlatform !== current.typePlatform) ||
      (incoming.price !== undefined && incoming.price !== current.price) ||
      (incoming.status !== undefined && incoming.status !== current.status) ||
      (incoming.description !== undefined &&
        normalize(incoming.description) !== normalize(current.description))
    );
  }

  //LISTO
  async getMachineBySerial(machineSerial: string): Promise<MachineResponseDto> {
    try {
      const machine = await this.platformsService.getBySerial(machineSerial);

      if (!machine) throwNotFound("Maquinaria no encontrada");

      const machineInfo = {
        serial: machine.serial,
        brand: machine.brand,
        model: machine.model,
        typePlatform: machine.typePlatform as PlatformType,
        price: machine.price,
        status: machine.status as PlatformStatus,
        description: machine.description,
        operativityCertificatePath: machine.operativityCertificatePath,
        ownershipDocumentPath: machine.ownershipDocumentPath,
      };

      return machineInfo;
    } catch (error) {
      handleServiceError(error, "Error al obtener la maquinaria por serial");
    }
  }

  //LISTO
  async getAllMachinesPaginated(
    page: number,
    pageSize: number
  ): Promise<{
    machines: MachineResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const { platforms, total } =
        await this.platformsService.getAllMachinesPaginated(page, pageSize);

      const machines = platforms.map((machine) => ({
        serial: machine.serial,
        brand: machine.brand,
        model: machine.model,
        typePlatform: machine.typePlatform as PlatformType,
        price: machine.price,
        status: machine.status as PlatformStatus,
        description: machine.description,
        operativityCertificatePath: machine.operativityCertificatePath,
        ownershipDocumentPath: machine.ownershipDocumentPath,
      }));

      return {
        machines,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      handleServiceError(error, "Error al obtener la maquinaria paginada");
    }
  }

  /*
  //LISTO
  async deleteMachine(machineSerial: string) {
    try {
      const machine = await this.platformsService.getBySerial(machineSerial);

      if (!machine) throwNotFound("Maquinaria no encontrada");

      await this.firebaseService.deleteFileFromUrl(
        machine.operativityCertificatePath
      );
      await this.firebaseService.deleteFileFromUrl(
        machine.ownershipDocumentPath
      );

      await this.platformsService.deleteMachine(machineSerial);
    } catch (error) {
      handleServiceError(error, "Error al eliminar la maquinaria");
    }
  }
  */
}
