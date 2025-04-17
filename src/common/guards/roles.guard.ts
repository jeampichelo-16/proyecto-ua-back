// ✅ src/common/guards/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ONLY_ROLES_KEY } from "../decorators/roles.decorator";
import { Role } from "../enum/role.enum";
import { AuthenticatedRequest } from "../types/authenticated-user";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<Role[]>(
      ONLY_ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!allowedRoles) return true; // No hay restricciones

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;

    if (!user || !user.role) {
      throw new ForbiddenException("Acceso denegado: usuario no autenticado.");
    }

    const isAllowed = allowedRoles.includes(user.role);

    if (!isAllowed) {
      throw new ForbiddenException(
        `Acceso denegado: no tienes el rol necesario (${user.role})`
      );
    }

    return true;
  }
}
