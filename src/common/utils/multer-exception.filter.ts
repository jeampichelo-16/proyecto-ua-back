import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { Response } from "express";
import { throwBadRequest, throwInternalServer } from "../utils/errors"; // ✅ Importa tus funciones

// Mapeo de errores comunes de Multer
const multerErrorsMap: { [key: string]: () => never } = {
  LIMIT_FILE_SIZE: () =>
    throwBadRequest("El archivo supera el tamaño máximo permitido"),
  LIMIT_UNEXPECTED_FILE: () =>
    throwBadRequest("Se envió un archivo inesperado"),
  LIMIT_PART_COUNT: () =>
    throwBadRequest("Se enviaron demasiadas partes en la solicitud"),
  LIMIT_FILE_COUNT: () => throwBadRequest("Se enviaron demasiados archivos"),
  LIMIT_FIELD_KEY: () =>
    throwBadRequest("El nombre de campo del archivo es demasiado largo"),
  LIMIT_FIELD_VALUE: () =>
    throwBadRequest("El valor del campo del archivo es demasiado largo"),
};

@Catch(Error)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    try {
      if (exception?.code && multerErrorsMap[exception.code]) {
        // Si es un error Multer conocido, relanzamos un error propio
        multerErrorsMap[exception.code]();
      }

      if (exception?.status) {
        // Si el error ya tiene un status lanzado manualmente (como 415 de tipo no permitido)
        response.status(exception.status).json({
          statusCode: exception.status,
          message: exception.message,
          error: exception.error || "Bad Request",
        });
      } else {
        // Si no sabemos qué fue el error (ej: crash raro), lanzar error genérico
        throwInternalServer("Error inesperado al procesar archivo");
      }
    } catch (newError: any) {
      response.status(newError.getStatus?.() || 500).json({
        statusCode: newError.getStatus?.() || 500,
        message: newError.message || "Error interno al procesar archivo",
        error: "Internal Server Error",
      });
    }
  }
}
