import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { CreateUserDto, UserResponseDto } from "./dto";
import { Role } from "src/common/enum/role.enum";
import { PrismaService } from "src/modules/prisma/prisma.service";
import {
  throwBadRequest,
  throwConflict,
  throwNotFound,
} from "src/common/utils/errors";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateOperatorDto } from "../operators/dto/create-operator.dto";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { generateSecurePassword } from "src/common/utils/password-generator";
import * as bcrypt from "bcrypt";
import { UpdateOperatorDto } from "../operators/dto/update-operator.dto";
import { ClientResponseDto } from "../clients/dto/client-response.dto";
import { ClientsService } from "../clients/clients.service";
import { CreateClientDto } from "../clients/dto/create-client.dto";
import { UpdateClientDto } from "../clients/dto/update-client.dto";
import { CreateQuotationDto } from "../quotations/dto/create-quotation.dto";
import { QuotationsService } from "../quotations/quotations.service";
import { QuotationStatus } from "src/common/enum/quotation-status.enum";
import { OperatorStatus } from "src/common/enum/operator-status.enum";
import { QuotationSummaryResponseDto } from "../quotations/dto/quotation-response.dto";
import { QuotationDetailResponseDto } from "../quotations/dto/quotation-detail-response.dto";
import { ActiveClientResponseDto } from "../clients/dto/client-active-response.dto";
import { ActiveOperatorResponseDto } from "../operators/dto/active-operator-response.dto";
import { ActiveMachineResponseDto } from "../platforms/dto/active-machine-response.dto";
import { PlatformsService } from "../platforms/platforms.service";
import { OperatorsService } from "../operators/operators.service";
import { ActivateQuotationDto } from "../quotations/dto/active-quotation.dto";
import { validateNamedPDFUploads } from "src/common/utils/file.utils";
import { FirebaseService } from "../firebase/firebase.service";
import { MailService } from "../mail/mail.service";
import {
  MailTemplate,
  MailTypeSender,
} from "../mail/constants/mail-template.enum";
import { format } from "date-fns";
import { es } from "date-fns/locale";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsService: ClientsService,
    private readonly quotationsService: QuotationsService,
    @Inject(forwardRef(() => OperatorsService)) // ✅
    private readonly operatorService: OperatorsService,
    private readonly platformsService: PlatformsService,
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService
  ) {}

  // AUTH - LOGIN / REESTABLECER CONTRASEÑA - ADMIN / LISTAR EMPLEADOS PAGINADOS / CREAR EMPLEADO
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      return user;
    } catch (error) {
      handleServiceError(error, "Error al buscar el usuario por email");
    }
  }

  // AUTH - LOGIN / REESTABLECER CONTRASEÑA
  async findById(id: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throwNotFound("Usuario no encontrado");
      }

      return user;
    } catch (error) {
      handleServiceError(error, "Error al buscar el usuario por ID");
    }
  }

  // AUTH / USER - LOGIN
  async getProfileById(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.findById(id);
      if (!user) throwNotFound("Usuario no encontrado");

      const profile = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as Role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
      };

      return profile;
    } catch (error) {
      handleServiceError(error, "Error al obtener el perfil del usuario");
    }
  }

  // AUTH - LOGIN
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      handleServiceError(
        error,
        "Error al actualizar el último inicio de sesión"
      );
    }
  }

  // AUTH - REFRESH TOKEN
  async updateRefreshToken(userId: number, token: string): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) throwNotFound("Usuario no encontrado");

      return this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: token },
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar el token de refresco");
    }
  }

  // AUTH - REFRESH TOKEN / LOGOUT
  async clearRefreshTokenDB(userId: number): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) throwNotFound("Usuario no encontrado");

      return this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
    } catch (error) {
      handleServiceError(error, "Error al limpiar el token de refresco");
    }
  }

  // AUTH - REESTABLECER CONTRASEÑA
  async updateResetPasswordData(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expiresAt,
        },
      });
    } catch (error) {
      handleServiceError(
        error,
        "Error al actualizar los datos de restablecimiento de contraseña"
      );
    }
  }

  // AUTH - REESTABLECER CONTRASEÑA
  async updatePassword(userId: number, data: Partial<User>): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      handleServiceError(
        error,
        "Error al actualizar la contraseña del usuario"
      );
    }
  }

  //ADMIN - OBTENER EMPLEADOS PAGINADOS / OBTENER OPERARIOS PAGINADOS
  async findUsersByRolesPaginated(
    roles: Role[],
    page: number,
    pageSize: number
  ): Promise<{ data: User[]; total: number; page: number; pageSize: number }> {
    try {
      const skip = (page - 1) * pageSize;

      const [data, total] = await this.prisma.$transaction([
        //obtener los datos del model operario en base al id del usuario
        this.prisma.user.findMany({
          where: {
            role: {
              in: roles,
            },
          },
          skip,
          take: pageSize,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            operario: {
              select: {
                id: true,
                operatorStatus: true,
              },
            },
          },
        }),

        this.prisma.user.count({
          where: {
            role: {
              in: roles,
            },
          },
        }),
      ]);

      return {
        data,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      handleServiceError(
        error,
        "Error al obtener los usuarios por roles paginados"
      );
    }
  }

  //ADMIN - CREAR EMPLEADO
  async findByDni(dni: string): Promise<User | null> {
    try {
      return this.prisma.user.findUnique({ where: { dni } });
    } catch (error) {
      handleServiceError(error, "Error al buscar el usuario por DNI");
    }
  }

  //ADMIN - CREAR EMPLEADO
  async findByUsername(username: string): Promise<User | null> {
    try {
      return this.prisma.user.findUnique({ where: { username } });
    } catch (error) {
      handleServiceError(
        error,
        "Error al buscar el usuario por nombre de usuario"
      );
    }
  }

  //ADMIN - CREAR EMPLEADO
  async createEmployeeUser(dto: CreateUserDto): Promise<User> {
    try {
      const localPartOfEmail = dto.email.split("@")[0];
      const username = dto.username ?? `${localPartOfEmail}${Date.now()}`;
      const firstName = dto.firstName ?? localPartOfEmail;
      const lastName = dto.lastName ?? localPartOfEmail;
      const plainPassword = generateSecurePassword(12);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const existingUser = await this.findByEmail(dto.email);
      const existingClient = await this.clientsService.findByEmail(dto.email);
      const existingDni = await this.findByDni(dto.dni);

      const existingUsername = await this.findByUsername(dto.username);

      if (existingUser || existingDni || existingUsername || existingClient) {
        throwConflict("Usuario ya existente");
      }

      const employeeUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword, // Ensure this is hashed before passing it here
          role: Role.EMPLEADO,
          isEmailVerified: true,
          phone: dto.phone,
          isActive: true,
          dni: dto.dni,
          username,
          firstName,
          lastName,
          createdAt: new Date(),
        },
      });

      return {
        ...employeeUser,
        password: plainPassword, // Return the plain password for the email
      };
    } catch (error) {
      handleServiceError(error, "Error al crear el usuario");
    }
  }

  //ADMIN - ACTUALIZAR EMPLEADO
  async updateUserEmployee(userId: number, dto: UpdateUserDto): Promise<void> {
    try {
      const user = await this.findById(userId);

      if (!user) throwNotFound("El usuario no existe");

      if (user.role !== Role.EMPLEADO) {
        throwBadRequest("No se puede actualizar un usuario que no es empleado");
      }

      // 🔥 Detectar si realmente hay cambios
      const fieldsToCheck: (keyof UpdateUserDto)[] = [
        "firstName",
        "lastName",
        "username",
        "dni",
        "phone",
        "isActive",
      ];

      const noChanges = fieldsToCheck.every((field) => {
        const incomingValue = dto[field];
        if (incomingValue === undefined) return true; // Si no viene, ignorar
        return incomingValue === user[field];
      });

      if (noChanges) {
        throwBadRequest("No se han realizado cambios en el usuario");
      }

      // 🚨 Validar duplicidad de username
      if (dto.username && dto.username !== user.username) {
        const existingUsername = await this.findByUsername(dto.username);
        if (existingUsername && existingUsername.id !== userId) {
          throwConflict("El nombre de usuario ya está en uso");
        }
      }

      // 🚨 Validar duplicidad de dni
      if (dto.dni && dto.dni !== user.dni) {
        const existingDni = await this.findByDni(dto.dni);
        if (existingDni && existingDni.id !== userId) {
          throwConflict("El DNI ya está en uso");
        }
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          username: dto.username,
          dni: dto.dni,
          phone: dto.phone,
          isActive: dto.isActive,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar el usuario");
    }
  }

  //ADMIN - ELIMINAR EMPLEADO
  async deleteUser(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      handleServiceError(error, "Error al eliminar el usuario");
    }
  }

  //ADMIN - CREAR OPERARIO
  async createOperatorUser(dto: CreateOperatorDto) {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: dto.email }, { dni: dto.dni }],
        },
      });

      if (existingUser) {
        throwConflict("Usuario ya existente");
      }

      const username = dto.email.split("@")[0] + Date.now();
      const passwordRandom = generateSecurePassword(12);

      return await this.prisma.user.create({
        data: {
          email: dto.email,
          username,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dni: dto.dni,
          phone: dto.phone,
          password: passwordRandom, // 👈 Luego forzar cambio
          role: Role.OPERARIO,
          isEmailVerified: false,
          isActive: true,
        },
      });
    } catch (error) {
      handleServiceError(error, "Error al crear el operario");
    }
  }

  //ADMIN - ACTUALIZAR OPERARIO
  async updateOperatorUser(
    userId: number,
    dto: UpdateOperatorDto
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throwNotFound("Usuario no encontrado");

      const updates: Partial<typeof user> = {};

      if (dto.firstName !== undefined && dto.firstName !== user.firstName) {
        updates.firstName = dto.firstName;
      }

      if (dto.lastName !== undefined && dto.lastName !== user.lastName) {
        updates.lastName = dto.lastName;
      }

      if (dto.phone !== undefined && dto.phone !== user.phone) {
        updates.phone = dto.phone;
      }

      if (Object.keys(updates).length === 0) {
        // ❌ No hay cambios
        return;
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: updates,
      });
    } catch (error) {
      handleServiceError(error, "Error al actualizar datos del usuario");
    }
  }

  //USER - LISTAR CLIENTES PAGINADOS
  async getAllClientsPaginated(
    page: number,
    pageSize: number
  ): Promise<{
    clients: ClientResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const { data, total } = await this.clientsService.getAllClientsPaginated(
        page,
        pageSize
      );

      const clients: ClientResponseDto[] = data.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email ?? null,
        phone: client.phone ?? null,
        ruc: client.ruc ?? null,
        companyName: client.companyName ?? null,
        address: client.address ?? null,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      }));

      return {
        clients,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      handleServiceError(
        error,
        "Error al obtener la lista de clientes paginada"
      );
    }
  }

  //USER - OBTENER CLIENTES ACTIVOS SIN PAGINAR
  async getAllActiveClients(): Promise<ActiveClientResponseDto[]> {
    try {
      const clients = await this.clientsService.getAllActiveClients();

      const activeClients: ActiveClientResponseDto[] = clients.map(
        (client) => ({
          id: client.id,
          ruc: client.ruc ?? null,
          companyName: client.companyName ?? null,
        })
      );

      return activeClients;
    } catch (error) {
      handleServiceError(
        error,
        "Error al obtener la lista de clientes activos"
      );
    }
  }

  //USER - CREAR CLIENTE
  async createClient(dto: CreateClientDto) {
    try {
      if (!dto.ruc || !dto.email) {
        throwBadRequest("El RUC y el Email son obligatorios");
      }

      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
        },
      });

      if (existingUser) {
        throwConflict("El email ya está en uso");
      }

      const client = await this.clientsService.createClient(dto);

      if (!client) {
        throwBadRequest("No se pudo crear el cliente");
      }
    } catch (error) {
      handleServiceError(error, "Error al crear el cliente");
    }
  }

  //USER - ACTUALIZAR CLIENTE
  async updateClient(clientId: number, dto: UpdateClientDto): Promise<void> {
    try {
      const client = await this.clientsService.findById(clientId);
      if (!client) throwNotFound("Cliente no encontrado");

      await this.clientsService.updateClient(clientId, dto);
    } catch (error) {
      handleServiceError(error, "Error al actualizar el cliente");
    }
  }

  //USER - OBTENER CLIENTE POR ID
  async getClientById(clientId: number): Promise<ClientResponseDto> {
    try {
      const client = await this.clientsService.findById(clientId);
      if (!client) throwNotFound("Cliente no encontrado");

      const clientProfile = {
        id: client.id,
        name: client.name,
        email: client.email ?? null,
        phone: client.phone ?? null,
        ruc: client.ruc ?? null,
        companyName: client.companyName ?? null,
        address: client.address ?? null,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      };

      return clientProfile;
    } catch (error) {
      handleServiceError(error, "Error al obtener el cliente por ID");
    }
  }

  //USER - ELIMINAR CLIENTE
  async deleteClient(clientId: number): Promise<void> {
    try {
      const client = await this.clientsService.findById(clientId);
      if (!client) throwNotFound("Cliente no encontrado");

      await this.clientsService.deleteClient(clientId);
    } catch (error) {
      handleServiceError(error, "Error al eliminar el cliente");
    }
  }

  //QUOTATIONS - REGISTRAR COTIZACION
  async createQuotation(dto: CreateQuotationDto): Promise<void> {
    try {
      await this.quotationsService.createQuotation(dto);
    } catch (error) {
      handleServiceError(error, "Error al registrar la cotización");
    }
  }

  //QUOTATIONS - OBTENER COTIZACIONES PAGINADAS
  async getAllQuotationsPaginated(
    page: number,
    pageSize: number
  ): Promise<{
    quotations: QuotationSummaryResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const { data, total } =
        await this.quotationsService.getAllQuotationsPaginated(page, pageSize);

      const quotations: QuotationSummaryResponseDto[] = data.map((q) => ({
        id: q.id,
        status: q.status,
        startDate: q.startDate,
        endDate: q.endDate,
        createdAt: q.createdAt,
        codeQuotation: q.codeQuotation,
      }));

      return {
        quotations,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      handleServiceError(error, "Error al obtener las cotizaciones paginadas");
    }
  }

  //QUOTATIONS - OBTENER COTIZACION POR ID
  async getQuotationById(id: number): Promise<QuotationDetailResponseDto> {
    try {
      const quotation = await this.quotationsService.getQuotationById(id);

      return {
        id: quotation.id,
        description: quotation.description ?? "",
        amount: quotation.amount,
        deliveryAmount: quotation.deliveryAmount,
        subtotal: quotation.subtotal,
        igv: quotation.igv,
        total: quotation.total,
        typeCurrency: quotation.typeCurrency,
        isNeedOperator: quotation.isNeedOperator,
        status: quotation.status,
        startDate: quotation.startDate,
        endDate: quotation.endDate,
        codeQuotation: quotation.codeQuotation,
        quotationPath: quotation.quotationPath,
        paymentReceiptPath: quotation.paymentReceiptPath ?? "",
        createdAt: quotation.createdAt,
        statusToPendingPagoAt: quotation.statusToPendingPagoAt,
        statusToPagadoAt: quotation.statusToPagadoAt,
        statusToRechazadoAt: quotation.statusToRechazadoAt,
        client: {
          id: quotation.client.id,
          name: quotation.client.name,
          email: quotation.client.email ?? "",
        },
        platform: {
          id: quotation.platform.id,
          serial: quotation.platform.serial,
          brand: quotation.platform.brand,
          model: quotation.platform.model,
        },
        operator: quotation.operator
          ? {
              id: quotation.operator.id,
              userId: quotation.operator.userId,
            }
          : null,
      };
    } catch (error) {
      handleServiceError(error, "Error al obtener la cotización por ID");
    }
  }

  //QUOTATIONS - ACTIVAR COTIZACIONF
  async activateQuotation(
    quotationId: number,
    dto: ActivateQuotationDto
  ): Promise<void> {
    try {
      const quotation = await this.quotationsService.findByIdQuotation(
        quotationId
      );

      if (!quotation) throwNotFound("Cotización no encontrada");

      const clientEmail = await this.clientsService.findById(
        quotation.clientId
      );

      if (!clientEmail || !clientEmail.email) {
        throwBadRequest("El cliente no tiene un correo electrónico válido.");
      }

      if (quotation.status !== QuotationStatus.PENDIENTE_DATOS) {
        throwBadRequest(
          "La cotización ya ha sido activada o está en otro estado."
        );
      }

      // ✅ Si necesita operador, valida que operatorId venga y sea válido
      if (quotation.isNeedOperator) {
        if (!dto.operatorId) {
          throwBadRequest(
            "El ID del operador es obligatorio para esta cotización."
          );
        }

        const operator = await this.prisma.operator.findUnique({
          where: { id: dto.operatorId },
        });

        if (!operator || operator.operatorStatus !== OperatorStatus.ACTIVO) {
          throwBadRequest("El operador no existe o no está activo.");
        }
      }

      // 🔢 Calcular días desde las fechas
      const start = new Date(quotation.startDate);
      const end = new Date(quotation.endDate);

      const diffMs = end.getTime() - start.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

      // 🧠 Delegar el cambio de estado, asignación de operador y PDF
      const quotationResult =
        await this.quotationsService.updateQuotationActive(
          quotationId,
          dto,
          days
        );

      const formattedStartDate = format(
        quotation.startDate,
        "d 'de' MMMM 'de' yyyy",
        { locale: es }
      );
      const formattedEndDate = format(
        quotation.endDate,
        "d 'de' MMMM 'de' yyyy",
        { locale: es }
      );

      await this.mailService.sendTemplateEmail(
        MailTypeSender.MAILZOHO,
        clientEmail.email,
        `Cotización Aprobada - Mansercom (${quotation.codeQuotation})`,
        MailTemplate.SEND_RECEIPT,
        {
          clientName: clientEmail.name,
          receiptPath: quotationResult.quotationPath,
          totalAmount: quotationResult.totalAmount,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          codeQuotation: quotation.codeQuotation,
          year: new Date().getFullYear(),
        }
      );
    } catch (error) {
      handleServiceError(error, "Error al actualizar datos de la cotización");
    }
  }

  private async generateUniqueFirebaseFilename({
    prefix,
    entityId,
    extension = "pdf",
  }: {
    prefix: string; // ej. 'quotations'
    entityId: number | string;
    extension?: string;
  }): Promise<string> {
    const timestamp = Date.now();
    return `${prefix}/${entityId}/payment-receipt-${timestamp}.${extension}`;
  }

  //QUOTATIONS - COMPLETAR COTIZACION (PAGADO)
  async markQuotationAsPaid(
    quotationId: number,
    files: {
      paymentReceiptPath?: Express.Multer.File[];
    }
  ): Promise<void> {
    try {
      validateNamedPDFUploads(files, ["paymentReceiptPath"]);

      const quotation = await this.quotationsService.findByIdQuotation(
        quotationId
      );

      if (!quotation) throwNotFound("Cotización no encontrada");

      if (quotation.status !== QuotationStatus.PENDIENTE_PAGO) {
        throwBadRequest("La cotización no está en estado PENDIENTE_PAGO");
      }

      const paymentReceiptFile = files.paymentReceiptPath?.[0];

      if (!paymentReceiptFile) {
        throwBadRequest("El recibo de pago es obligatorio");
      }

      const paymentReceiptPath = await this.generateUniqueFirebaseFilename({
        prefix: "quotations",
        entityId: quotationId,
        extension: "pdf",
      });

      const paymentReceiptUrl = await this.firebaseService.uploadBuffer(
        paymentReceiptFile.buffer,
        paymentReceiptPath,
        paymentReceiptFile.mimetype
      );

      await this.quotationsService.markQuotationAsPaid(
        quotationId,
        paymentReceiptUrl
      );

      await this.mailService.sendTemplateEmail(
        MailTypeSender.MAILBOT,
        quotation.client.email!,
        `Verificación de Pago - Mansercom (${quotation.codeQuotation})`,
        MailTemplate.PAY_CONFIRMATION,
        {
          clientName: quotation.client.name,
          operatorName: quotation.operator
            ? `${quotation.operator.user.firstName} ${quotation.operator.user.lastName}`
            : "",
          totalAmount: quotation.total,
          startDate: format(quotation.startDate, "d 'de' MMMM 'de' yyyy", {
            locale: es,
          }),
          endDate: format(quotation.endDate, "d 'de' MMMM 'de' yyyy", {
            locale: es,
          }),
          codeQuotation: quotation.codeQuotation,
          year: new Date().getFullYear(),
        }
      );

      await this.mailService.sendTemplateEmail(
        MailTypeSender.MAILBOT,
        quotation.operator?.user.email!,
        `Detalles de la operación - Mansercom (${quotation.codeQuotation})`,
        MailTemplate.OPERATION_DETAILS,
        {
          operatorName: `${quotation.operator?.user.firstName} ${quotation.operator?.user.lastName}`,
          startDate: format(quotation.startDate, "d 'de' MMMM 'de' yyyy", {
            locale: es,
          }),
          endDate: format(quotation.endDate, "d 'de' MMMM 'de' yyyy", {
            locale: es,
          }),
          platformSerial: quotation.platform.serial,
          platformBrand: quotation.platform.brand,
          platformModel: quotation.platform.model,
          platformType: quotation.platform.typePlatform,
          year: new Date().getFullYear(),
        }
      );
    } catch (error) {
      handleServiceError(error, "Error al marcar la cotización como pagada");
    }
  }

  //QUOTATIONS - CANCELAR COTIZACION
  async cancelQuotation(quotationId: number): Promise<void> {
    try {
      const quotation = await this.quotationsService.findByIdQuotation(
        quotationId
      );

      if (!quotation) throwNotFound("Cotización no encontrada");

      if (
        quotation.status !== QuotationStatus.PENDIENTE_DATOS &&
        quotation.status !== QuotationStatus.PENDIENTE_PAGO
      ) {
        throwBadRequest(
          "Solo se puede cancelar cotizaciones en estado PENDIENTE"
        );
      }

      await this.quotationsService.cancelQuotation(quotationId);
    } catch (error) {
      handleServiceError(error, "Error al cancelar la cotización");
    }
  }

  //USERS - LISTAR OPERARIOS ACTIVOS
  async getAllActiveOperators(): Promise<ActiveOperatorResponseDto[]> {
    const operators = await this.operatorService.getAllActiveOperators();

    return operators.map((op) => ({
      id: op.id,
      userId: op.userId,
      firstName: op.user.firstName,
      lastName: op.user.lastName,
      dni: op.user.dni,
    }));
  }

  //USERS - LISTAR PLATAFORMAS ACTIVAS
  async getAllActiveMachines(): Promise<ActiveMachineResponseDto[]> {
    const platforms = await this.platformsService.getAllActiveMachines();

    return platforms.map((platform) => ({
      id: platform.id,
      serial: platform.serial,
      brand: platform.brand,
      model: platform.model,
      typePlatform: platform.typePlatform,
      price: platform.price,
    }));
  }

  /*
  async verifyUserEmail(userId: number): Promise<void> {
    try {
      const user = await this.findById(userId);
    if (!user) throwNotFound("Usuario no encontrado");

    await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
    } catch (error) {
      handleServiceError(error, "Error al verificar el correo del usuario");
    }
  }
    */
}
