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

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly operatorService: OperatorsService,
    private readonly firebaseService: FirebaseService
  ) {}

  async getClientsSummary() {
    return { message: "Bienvenido al panel de administración" };
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
        "Error al obtener la lista de operarios paginada"
      );
    }
  }

  async createOperatorWithFiles(
    dto: CreateOperatorDto,
    files: {
      emoPDFPath?: Express.Multer.File[];
      operativityCertificatePath?: Express.Multer.File[];
    }
  ): Promise<void> {
    try {
      validateNamedPDFUploads(files);

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

      const folder = `operators/${operator.user.dni}`;
      let emoPDFUrl = operator.emoPDFPath;
      let operativityPDFUrl = operator.operativityCertificatePath;

      // Subida de archivo EMO
      if (files.emoPDFPath?.[0]) {
        await this.firebaseService.deleteFileFromUrl(operator.emoPDFPath);
        emoPDFUrl = await this.firebaseService.uploadBuffer(
          files.emoPDFPath[0].buffer,
          `${folder}/emo-certificado-${Date.now()}.pdf`,
          files.emoPDFPath[0].mimetype
        );
      }

      // Subida de archivo operatividad
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

      await this.operatorService.updateOperator(
        operatorId,
        dto,
        emoPDFUrl,
        operativityPDFUrl
      );
    } catch (error) {
      handleServiceError(error, "Error al actualizar el operario");
    }
  }

  async hasOperatorChanges(
    current: {
      firstName: string;
      lastName: string;
      phone: string | null;
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
        incoming.operatorStatus !== current.status)
    );
  }

  async getOperatorById(operatorId: number) {
    const operator = await this.operatorService.getById(operatorId);

    if (!operator) {
      throwNotFound("Operario no encontrado");
    }

    const profileOperator = {
      id: operator.id,
      email: operator.user.email,
      username: operator.user.username,
      firstName: operator.user.firstName,
      lastName: operator.user.lastName,
      dni: operator.user.dni,
      phone: operator.user.phone,
      isActive: operator.user.isActive,
      role: operator.user.role as Role,
      emoPDFPath: operator.emoPDFPath,
      operativityCertificatePath: operator.operativityCertificatePath,
    };

    return profileOperator;
  }

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
}
