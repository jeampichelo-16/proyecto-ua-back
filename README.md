### 📄 `README.md`

```md
# 🛡️ Sistema de Autenticación con Roles - NestJS + Prisma

Este proyecto implementa un sistema de autenticación robusto usando:

- 🔐 **JWT + Cookies** para manejo de sesiones.
- 🧑‍💼 **Autenticación basada en roles** (ADMIN, EMPLEADO, CLIENTE).
- 📧 **Verificación por correo electrónico**.
- 📦 **Prisma** como ORM y PostgreSQL/MySQL como base de datos.

---

## 🚀 Requisitos

- Node.js >= 18
- PostgreSQL o MySQL (según tu configuración de `DATABASE_URL`)
- `.env` configurado correctamente con las variables:
  - `DATABASE_URL`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_VERIFICATION_SECRET_EMAIL`
  - `TIMEOUT_VERIFICATION_TOKEN_EMAIL`
  - `APP_URL_BACKEND`
  - y configuraciones de correo (SMTP)

---

## 🧑‍💻 Instalación

```bash
npm install
```

---

## 🧪 Desarrollo

```bash
npm run start
```

> ✅ Este comando:
>
> - Compila y ejecuta el servidor en modo desarrollo.
> - Copia automáticamente los archivos de plantillas `src/mail/templates/*.hbs` a `dist/src/mail/templates/`.

---

## 🌱 Insertar Seed Inicial (Cuenta Admin)

Para crear una cuenta de administrador predeterminada:

```bash
npm run seed
```

> Esto creará una cuenta con los siguientes datos:

```txt
Correo: admin@admin.com
Contraseña: admin123
Rol: ADMIN
```

📌 Se crea solo si no existe previamente.

---

## 🧪 Pruebas de roles

| Ruta | Rol requerido | Protegida por |
|------|---------------|---------------|
| `GET /users/profile` | CLIENTE / ADMIN / EMPLEADO | JWT |
| `GET /admin/dashboard` | ADMIN o EMPLEADO | JWT + Rol |

---

## 📁 Estructura del proyecto

```txt
src/
├── auth/             # Módulo de autenticación
├── users/            # Módulo de usuarios
├── admin/            # Módulo de administración (Dashboard)
├── common/
│   ├── guards/       # Guards como JwtAuthGuard y RolesGuard
│   ├── utils/        # Funciones auxiliares
│   ├── enum/         # Enum centralizado de roles
│   └── dto/          # DTOs compartidos (ThrottleErrorDto, etc.)
├── mail/             # Servicio de envío de correos
└── prisma/seed.ts    # Script para seed inicial
```

---

## 🧾 Licencia

MIT - SebasChaquila © 2025
```