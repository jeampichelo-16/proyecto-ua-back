// src/common/utils/handle-error.util.ts

import { HttpException } from "@nestjs/common";
import { throwInternalServer } from "./errors";

export function handleServiceError(
  error: unknown,
  contextMessage = "Error interno"
): never {
  if (error instanceof HttpException) {
    throw error; // ⚡ Relanza si es un error que tú mismo lanzaste
  }

  console.error(`[Service Error] ${contextMessage}`, error);

  throwInternalServer(contextMessage); // ⚡ Lanza un error genérico interno controlado
}
