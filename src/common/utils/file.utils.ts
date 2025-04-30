import { BadRequestException } from "@nestjs/common";
import { handleServiceError } from "./handle-error.util";

export function validateNamedPDFUploads(
  files: Record<string, Express.Multer.File[]>,
  requiredFields: string[],
  requiredCount = 1
): void {
  try {
    for (const fieldName of requiredFields) {
      const uploadedFiles = files[fieldName];

      // Validar presencia y cantidad mínima
      if (
        !Array.isArray(uploadedFiles) ||
        uploadedFiles.length < requiredCount
      ) {
        throw new BadRequestException(
          `Se requiere ${requiredCount} archivo(s) PDF para el campo "${fieldName}".`
        );
      }

      // Validar tipo MIME
      const invalidFile = uploadedFiles.find(
        (file) => file.mimetype !== "application/pdf"
      );

      if (invalidFile) {
        throw new BadRequestException(
          `El archivo "${invalidFile.originalname}" en "${fieldName}" no es un PDF válido.`
        );
      }
    }
  } catch (error) {
    handleServiceError(error, "❌ Falló la validación de archivos PDF.");
  }
}
