import { Injectable, OnModuleInit } from "@nestjs/common";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { ConfigService } from "@nestjs/config";
import { handleServiceError } from "src/common/utils/handle-error.util";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const credentialsPath = path.resolve(
      __dirname,
      "../../config/firebase/credentials.json"
    );
    const storageBucket = this.configService.get<string>(
      "FIREBASE_STORAGE_BUCKET"
    );

    if (!storageBucket) {
      throw new Error("❌ FIREBASE_STORAGE_BUCKET no definido en el .env");
    }

    let serviceAccount: any;

    try {
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(
          `❌ Archivo de credenciales no encontrado en: ${credentialsPath}`
        );
      }

      const fileContent = fs.readFileSync(credentialsPath, "utf-8");
      serviceAccount = JSON.parse(fileContent);

      // ✅ Validación mínima
      const requiredFields = [
        "type",
        "project_id",
        "private_key",
        "client_email",
      ];
      const missingFields = requiredFields.filter(
        (field) => !serviceAccount[field]
      );

      if (missingFields.length > 0) {
        throw new Error(
          `❌ El archivo de credenciales Firebase es inválido. Faltan: ${missingFields.join(
            ", "
          )}`
        );
      }
    } catch (error) {
      handleServiceError(
        error,
        "Error al inicializar Firebase. Revisa tu archivo de credenciales."
      );
    }

    initializeApp({
      credential: cert(serviceAccount),
      storageBucket,
    });
  }

  get storage() {
    return getStorage().bucket();
  }

  async uploadBuffer(
    buffer: Buffer,
    path: string,
    contentType: string
  ): Promise<string> {
    try {
      if (!buffer || buffer.length === 0) throw new Error("Archivo vacío");

      const file = this.storage.file(path);
      await file.save(buffer, {
        metadata: {
          contentType,
          cacheControl: "public, max-age=31536000",
        },
        public: true,
      });

      await file.makePublic();
      return file.publicUrl();
    } catch (error) {
      handleServiceError(error, "❌ Error al subir archivo a Firebase Storage");
    }
  }

  async deleteFileFromUrl(url: string): Promise<void> {
    try {
      const filePath = this.extractStoragePathFromUrl(url);
      await this.storage.file(filePath).delete();
    } catch (error: any) {
      // Ignorar error si el archivo no existe (404)
      if (error.code === 404) {
        console.warn(
          `[FirebaseStorage] Archivo no encontrado para eliminar: ${url}`
        );
        return;
      }

      handleServiceError(error, "Error al eliminar archivo en Firebase");
    }
  }

  private extractStoragePathFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const fullPath = decodeURIComponent(parsed.pathname); // '/<bucket-name>/<file-path>'

      // Eliminamos el nombre del bucket (primer segmento)
      const parts = fullPath.split("/");
      if (parts.length < 3) {
        throw new Error("URL de Firebase inválida");
      }

      // Ejemplo: ['', 'bucket-name', 'machines/PLT-XXX/file.pdf'] → reconstruimos desde el tercer segmento
      const storagePath = parts.slice(2).join("/");
      return storagePath;
    } catch (error) {
      throw new Error(
        "❌ Error al extraer el path del archivo en Firebase Storage"
      );
    }
  }
}
