import { memoryStorage } from "multer";

export function multerOptionsMemory(maxFileSizeInMb: number) {
  return {
    storage: memoryStorage(),
    limits: {
      fileSize: maxFileSizeInMb * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== "application/pdf") {
        const error = new Error(
          "Formato de archivo no permitido. Solo se permiten archivos PDF."
        );
        (error as any).status = 415; // Puedes capturar esto con un filtro global
        return cb(error, false);
      }
      cb(null, true);
    },
  };
}
