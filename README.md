# 📦 jose-back-temp

Backend desarrollado en **NestJS** que ofrece un sistema robusto de:

- Autenticación y control de acceso basado en roles
- Gestión de usuarios, clientes, operadores y maquinaria
- Generación y seguimiento de cotizaciones
- Documentos PDF dinámicos
- Envío automatizado de correos
- Integración con Firebase para notificaciones push
- Conexión eficiente a base de datos usando **Prisma ORM**

---

## 🚀 Características principales

- 🔐 Autenticación JWT con roles (`ADMIN`, `CLIENT`, `OPERATOR`)
- 👤 Gestión completa de usuarios y clientes
- 👷 Gestión de operarios y plataformas
- 📄 Cotizaciones automatizadas con PDF
- ✉️ Envío de correos transaccionales (registro, cotizaciones, etc.)
- 📲 Notificaciones push con Firebase Cloud Messaging
- 📚 Prisma ORM para acceso a base de datos
- 🧱 Arquitectura modular y escalable con buenas prácticas NestJS

---

## 🧱 Estructura de carpetas

```bash
src/
├── main.ts                  # Bootstrap de la aplicación
├── app.module.ts            # Módulo raíz de NestJS
├── common/                  # Decoradores, enums, guards, utils reutilizables
│   ├── decorators/
│   ├── guards/
│   ├── enum/
│   └── utils/
├── modules/                 # Módulos funcionales del sistema
│   ├── auth/                # Login, registro, refresh, logout
│   ├── users/               # Gestión de usuarios, cotizaciones
│   ├── clients/             # CRUD de clientes
│   ├── operators/           # Operarios + archivos (certificados)
│   ├── platforms/           # Máquinas + documentos
│   ├── quotations/          # Cotizaciones (gestión y estados)
│   ├── pdf/                 # Generación dinámica de documentos PDF
│   ├── mail/                # Plantillas y envío de correos
│   ├── firebase/            # Notificaciones push
│   └── prisma/              # PrismaService para acceso a DB
````

---

## 🔐 Autenticación y Roles

* Autenticación vía JWT (access + refresh token)
* Control por roles usando `@Roles()` y `RolesGuard`
* Soporte para roles:

  * `ADMIN`
  * `CLIENT`
  * `OPERATOR`

---

## 🛠 Tecnologías usadas

* **NestJS** · framework principal
* **Prisma ORM** · acceso a MySQL
* **Firebase** · notificaciones push
* **Resend API + Nodemailer** · envío de correos
* **Zoho Mail** · recepción de correo entrante (bandeja)
* **PDFKit** · generación dinámica de documentos PDF
* **Swagger** · documentación auto-generada

---

## 📄 Cotizaciones inteligentes

* Registro de cotizaciones para clientes/operadores
* Validación y actualización de estados
* Generación de documento PDF con los datos
* Envío de correo automático y almacenamiento en Firebase

---

## 📤 Envío de correos

El módulo `mail.service.ts` utiliza **plantillas Handlebars** para estructurar correos automáticos y los envía usando **Nodemailer + Resend API**.

Correos automáticos enviados en eventos como:

* Registro y bienvenida
* Confirmación de operaciones
* Cotizaciones generadas o activadas

---

## 📲 Notificaciones push

El servicio de Firebase está configurado para:

* Enviar notificaciones push a clientes
* Integrarse con tokens FCM almacenados por usuario
* Usar condiciones personalizadas por evento o rol

---

## 📚 Endpoints principales

> Todos protegidos por JWT salvo los públicos.
> Documentación Swagger: [`/docs`](http://localhost:3000/docs)

### 🔐 Auth (`/auth`)

| Método | Ruta               | Descripción                      | Público |
| ------ | ------------------ | -------------------------------- | ------- |
| POST   | `/login`           | Inicio de sesión                 | ✅       |
| POST   | `/refresh-token`   | Renovar token de acceso          | ❌       |
| POST   | `/logout`          | Cerrar sesión                    | ❌       |
| POST   | `/forgot-password` | Enviar link de recuperación      | ✅       |
| POST   | `/reset-password`  | Restablecer contraseña con token | ✅       |

---

### 👤 Users (`/users`)

| Método | Ruta                | Descripción               |
| ------ | ------------------- | ------------------------- |
| GET    | `/profile`          | Perfil autenticado        |
| GET    | `/clients`          | Listar clientes paginados |
| POST   | `/clients`          | Crear cliente             |
| PATCH  | `/clients/:id`      | Actualizar cliente        |
| DELETE | `/clients/:id`      | Eliminar cliente          |
| GET    | `/clients/:id`      | Obtener cliente por ID    |
| GET    | `/active-clients`   | Clientes activos          |
| GET    | `/active-operators` | Operadores activos        |
| GET    | `/active-machines`  | Maquinarias activas       |

---

### 📄 Cotizaciones (`/users/quotations`)

| Método | Ruta                       | Descripción                           |
| ------ | -------------------------- | ------------------------------------- |
| POST   | `/quotations`              | Crear nueva cotización                |
| PATCH  | `/quotations/activate/:id` | Activar cotización (`PENDIENTE_PAGO`) |
| PATCH  | `/quotations/pay/:id`      | Marcar como pagada (`PAGADO`)         |
| PATCH  | `/quotations/cancel/:id`   | Cancelar cotización                   |
| GET    | `/quotations`              | Listar cotizaciones                   |
| GET    | `/quotations/:id`          | Obtener cotización por ID             |

---

### 🛠 Admin (`/admin`)

| Método | Ruta                | Descripción                     |
| ------ | ------------------- | ------------------------------- |
| GET    | `/dashboard`        | Resumen general                 |
| GET    | `/employees`        | Listar empleados                |
| POST   | `/employees`        | Crear empleado                  |
| PATCH  | `/employees/:id`    | Editar empleado                 |
| GET    | `/employees/:id`    | Obtener empleado por ID         |
| DELETE | `/employees/:id`    | Eliminar empleado               |
| GET    | `/operators`        | Listar operarios                |
| POST   | `/operators`        | Crear operario (con archivos)   |
| PATCH  | `/operators/:id`    | Actualizar operario             |
| GET    | `/operators/:id`    | Obtener operario por ID         |
| GET    | `/machines`         | Listar maquinaria               |
| POST   | `/machines`         | Crear maquinaria (con archivos) |
| PATCH  | `/machines/:serial` | Editar maquinaria               |
| GET    | `/machines/:serial` | Obtener maquinaria por serial   |

