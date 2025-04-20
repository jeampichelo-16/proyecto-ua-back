// src/common/utils/errors.ts

import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";

/**
 * 401 - No autorizado
 */
export function throwUnauthorized(message = "No autorizado"): never {
  throw new UnauthorizedException({
    statusCode: 401,
    message,
    error: "Unauthorized",
  });
}

/**
 * 403 - Prohibido
 */
export function throwForbidden(message = "Acceso denegado"): never {
  throw new ForbiddenException({
    statusCode: 403,
    message,
    error: "Forbidden",
  });
}

/**
 * 404 - No encontrado
 */
export function throwNotFound(message = "Recurso no encontrado"): never {
  throw new NotFoundException({
    statusCode: 404,
    message,
    error: "Not Found",
  });
}

/**
 * 400 - Solicitud inválida
 */
export function throwBadRequest(message = "Solicitud inválida"): never {
  throw new BadRequestException({
    statusCode: 400,
    message,
    error: "Bad Request",
  });
}

/**
 * 409 - Conflicto (registro duplicado, etc)
 */
export function throwConflict(message = "Conflicto con la operación"): never {
  throw new ConflictException({
    statusCode: 409,
    message,
    error: "Conflict",
  });
}
