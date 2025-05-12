import * as Joi from "joi";

export const validationSchema = Joi.object({
  // 🌐 Entorno
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  // 🚪 Puerto
  PORT: Joi.number().default(3000),

  // 🛢️ Base de datos
  DATABASE_URL: Joi.string().uri().required(),

  // 🔐 JWT Auth
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  TIMEOUT_ACCESS_TOKEN: Joi.string().default("15m"),
  TIMEOUT_REFRESH_TOKEN: Joi.string().default("7d"),

  // 📨 Verificación por correo
  JWT_VERIFICATION_SECRET_EMAIL: Joi.string().required(),
  TIMEOUT_VERIFICATION_TOKEN_EMAIL: Joi.string().default("1d"),

  // 📫 Correo
  MAIL_USER: Joi.string().email().required(),
  MAIL_PASS: Joi.string().required(),

  // 🌍 URLs
  APP_URL_BACKEND: Joi.string().uri().required(),
  APP_URL_FRONTEND: Joi.string().uri().required(),

  // 👑 Cuenta admin (para seed)
  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().min(6).required(),
  ADMIN_USERNAME: Joi.string().required(),
  ADMIN_FIRST_NAME: Joi.string().required(),
  ADMIN_LAST_NAME: Joi.string().required(),

  // 👷 Cuenta empleado (para seed)
  EMPLOYEE_EMAIL: Joi.string().email().required(),
  EMPLOYEE_PASSWORD: Joi.string().min(6).required(),
  EMPLOYEE_USERNAME: Joi.string().required(),
  EMPLOYEE_FIRST_NAME: Joi.string().required(),
  EMPLOYEE_LAST_NAME: Joi.string().required(),

  //Firebase
  FIREBASE_STORAGE_BUCKET_PROD: Joi.string().required(),
  FIREBASE_STORAGE_BUCKET_DEV: Joi.string().required(),
});
