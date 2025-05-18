// src/config/validate-mail-templates.ts
import { existsSync } from "fs";
import { join } from "path";

const REQUIRED_TEMPLATES = [
  "reset-password",
  "send-password",
  "send-receipt",
  "pay-confirmation",
  "operation-details"
];

export function validateMailTemplatesOnStartup() {
  const missing: string[] = [];

  for (const name of REQUIRED_TEMPLATES) {
    const path = join(__dirname, "../modules/mail/templates", `${name}.hbs`);
    if (!existsSync(path)) {
      console.log("❌ Plantilla de correo faltante:", path);
      missing.push(`${name}.hbs`);
    }
  }

  if (missing.length) {
    throw new Error(`❌ Faltan plantillas de correo: ${missing.join(", ")}`);
  }

  console.log("✅ Todas las plantillas de correo requeridas están presentes.");
}
