import { throwBadRequest } from "../utils/errors";
import { handleServiceError } from "./handle-error.util";

export function validateNamedPDFUploads(
  files: {
    emoPDFPath?: Express.Multer.File[];
    operativityCertificatePath?: Express.Multer.File[];
  },
  requiredCount = 1
): void {
  try {
    if (
      !files.emoPDFPath ||
      files.emoPDFPath.length < requiredCount ||
      !files.operativityCertificatePath ||
      files.operativityCertificatePath.length < requiredCount
    ) {
      throwBadRequest(
        "Debes subir exactamente dos archivos PDF: EMO y Operatividad"
      );
    }
  } catch (error) {
    handleServiceError(error, "Error al validar los archivos PDF subidos");
  }
}

