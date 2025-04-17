import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // 🌐 Entorno
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // 🚪 Puerto
  PORT: Joi.number().default(3000),

  // 🛢️ Base de datos
  DATABASE_URL: Joi.string().uri().required(),

  // 🔐 JWT Auth
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  TIMEOUT_ACCESS_TOKEN: Joi.string().default('15m'),      // formato como 15m, 1h, etc.
  TIMEOUT_REFRESH_TOKEN: Joi.string().default('7d'),

  // 📨 Verificación por correo
  JWT_VERIFICATION_SECRET_EMAIL: Joi.string().required(),
  TIMEOUT_VERIFICATION_TOKEN_EMAIL: Joi.string().default('1d'),

  // 📫 Correo
  MAIL_USER: Joi.string().email().required(),
  MAIL_PASS: Joi.string().required(),

  // 🌍 Frontend / App
  APP_URL: Joi.string().uri().required(),

  // 👑 Cuenta admin inicial (para seed)
  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().min(6).required(),
});
