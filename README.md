# 📌 auth-back-model

**auth-back-model** es un backend desarrollado con NestJS que proporciona funcionalidades completas de autenticación y gestión de usuarios. Este proyecto es ideal para aplicaciones que requieren un sistema robusto de autenticación, incluyendo verificación por correo electrónico, restablecimiento de contraseñas y control de roles de usuario.

---

## 🚀 Características Principales

- **Registro de Usuarios**: Permite a nuevos usuarios registrarse en el sistema.
- **Inicio de Sesión**: Autenticación de usuarios mediante correo electrónico y contraseña.
- **Verificación de Correo Electrónico**: Envía un enlace de verificación al correo del usuario para confirmar su cuenta.
- **Restablecimiento de Contraseña**: Permite a los usuarios restablecer su contraseña en caso de olvido.
- **Gestión de Roles**: Control de acceso basado en roles como ADMIN, EMPLEADO y CLIENTE.
- **Protección de Rutas**: Acceso restringido a ciertas rutas según el rol del usuario.
- **Envío de Correos Electrónicos**: Integración para el envío de correos electrónicos para verificación y restablecimiento de contraseñas.

---

## 🛠️ Tecnologías Utilizadas

- **[NestJS](https://nestjs.com/)**: Framework para construir aplicaciones del lado del servidor eficientes y escalables.
- **[Prisma](https://www.prisma.io/)**: ORM para interactuar con la base de datos.
- **[JWT](https://jwt.io/)**: Para la gestión de autenticación mediante tokens.
- **[Bcrypt](https://www.npmjs.com/package/bcrypt)**: Para el hash de contraseñas.
- **[Nodemailer](https://nodemailer.com/)**: Para el envío de correos electrónicos.
- **[Handlebars](https://handlebarsjs.com/)**: Motor de plantillas para correos electrónicos.

---

## ⚙️ Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/SebaschaM/auth-back-model.git
cd auth-back-model
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto y define las siguientes variables:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_base_datos
JWT_SECRET=tu_secreto_jwt
JWT_VERIFICATION_SECRET_EMAIL=tu_secreto_verificacion_email
TIMEOUT_VERIFICATION_TOKEN_EMAIL=3600s
APP_URL_FRONTEND=http://localhost:5173
APP_URL_BACKEND=http://localhost:3000
MAIL_HOST=smtp.ejemplo.com
MAIL_PORT=587
MAIL_USER=tu_correo@ejemplo.com
MAIL_PASS=tu_contraseña_correo
```

Asegúrate de reemplazar los valores con tus propias configuraciones.

### 4. Configurar la Base de Datos

Ejecuta las migraciones de Prisma para configurar la base de datos:

```bash
npx prisma migrate dev --name init
```

### 5. Iniciar el Servidor

```bash
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`.

---

## 📬 Funcionalidades de Correo Electrónico

El sistema envía correos electrónicos para:

- **Verificación de Cuenta**: Tras el registro, el usuario recibe un correo con un enlace para verificar su cuenta.
- **Restablecimiento de Contraseña**: Si el usuario olvida su contraseña, puede solicitar un enlace para restablecerla.

Asegúrate de que las configuraciones de correo en el archivo `.env` sean correctas para que estas funcionalidades operen adecuadamente.

---

## 🔐 Gestión de Roles y Acceso

El sistema define los siguientes roles:

- **ADMIN**: Acceso completo a todas las funcionalidades.
- **EMPLEADO**: Acceso limitado a ciertas funcionalidades.
- **CLIENTE**: Acceso básico a funcionalidades específicas.

El acceso a las rutas está protegido mediante guardias que verifican el rol del usuario antes de permitir el acceso.

---

## 📫 Endpoints Principales

### Autenticación

- `POST /api/auth/register`: Registro de nuevos usuarios.
- `POST /api/auth/login`: Inicio de sesión.
- `GET /api/auth/verify-email?token=...`: Verificación de correo electrónico.
- `POST /api/auth/forgot-password`: Solicitar restablecimiento de contraseña.
- `POST /api/auth/reset-password`: Restablecer contraseña utilizando un token.

### Usuarios

- `GET /api/users/me`: Obtener información del usuario autenticado.
- `PATCH /api/users/change-password`: Cambiar la contraseña del usuario autenticado.

---

## 🧪 Pruebas

Para ejecutar las pruebas, utiliza el siguiente comando:

```bash
npm run test
```

Asegúrate de tener configurada una base de datos de pruebas y las variables de entorno correspondientes.

---

## 📄 Licencia

Este proyecto está licenciado bajo la [MIT License](LICENSE).

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si deseas contribuir, por favor sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commits (`git commit -am 'Agrega nueva funcionalidad'`).
4. Sube tus cambios a tu fork (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request en este repositorio.

---

## 📞 Contacto

Para consultas o soporte, por favor contacta a:

- **Nombre**: Sebastián Ch.
- **Correo Electrónico**: schaquila@autonoma.edu.pe
