# BildyApp API

Backend completo para la gestión de albaranes (partes de horas o materiales) entre clientes y proveedores. Desarrollado con **Node.js**, **Express**, **TypeScript** y **MongoDB**.

---

## Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Runtime | Node.js 22 + TypeScript (strict mode) |
| Framework | Express 5 |
| Base de datos | MongoDB + Mongoose |
| Autenticación | JWT (access + refresh tokens) |
| Validación | Zod |
| Almacenamiento nube | Cloudinary (firmas, PDFs, logos) |
| Procesado de imagen | Sharp |
| Generación PDF | pdfkit |
| Email | Nodemailer + Mailtrap |
| WebSockets | Socket.IO |
| Documentación | Swagger / OpenAPI 3.0 |
| Testing | Jest + Supertest + mongodb-memory-server |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Seguridad | Helmet, rate limiting, express-mongo-sanitize |

---

## Instalación y ejecución local

### Requisitos
- Node.js 22+
- MongoDB (local o Atlas)

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd bildyapp-api
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 3. Ejecutar en desarrollo
npm run dev
```

La API estará disponible en `http://localhost:3000`.

---

## Ejecución con Docker

```bash
# Copia y configura las variables de entorno
cp .env.example .env

# Levanta la app + MongoDB
docker compose up --build

# En segundo plano
docker compose up -d --build

# Parar
docker compose down
```

La API estará en `http://localhost:3000` y MongoDB en `localhost:27017`.

---

## Tests

```bash
# Ejecutar tests
npm test

# Modo watch
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

Los tests usan `mongodb-memory-server` — **no necesitas MongoDB instalado**.

---

## Documentación Swagger

Con la API corriendo, accede a:

```
http://localhost:3000/api-docs
```

---

## Health check

```
GET http://localhost:3000/health
```

Respuesta:
```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 42.3,
  "timestamp": "2025-06-15T10:00:00.000Z"
}
```

---

## WebSockets (Socket.IO)

Conecta con autenticación JWT:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'TU_ACCESS_TOKEN' }
});

// Eventos disponibles (solo para usuarios de la misma compañía):
socket.on('client:new',          (client) => console.log('Nuevo cliente:', client));
socket.on('project:new',         (project) => console.log('Nuevo proyecto:', project));
socket.on('deliverynote:new',    (note) => console.log('Nuevo albarán:', note));
socket.on('deliverynote:signed', ({ id, pdfUrl }) => console.log('Albarán firmado:', id));
```

---

## Endpoints

### Usuarios
| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/api/user/register` | ❌ | Registro |
| PUT | `/api/user/validation` | ✅ | Verificar email |
| POST | `/api/user/login` | ❌ | Login |
| PUT | `/api/user/register` | ✅ | Datos personales |
| PATCH | `/api/user/company` | ✅ | Crear/unirse a compañía |
| PATCH | `/api/user/logo` | ✅ | Subir logo |
| GET | `/api/user` | ✅ | Obtener usuario |
| POST | `/api/user/logout` | ✅ | Logout |
| DELETE | `/api/user` | ✅ | Eliminar usuario |
| PUT | `/api/user/password` | ✅ | Cambiar contraseña |
| POST | `/api/user/invite` | ✅ admin | Invitar compañero |

### Clientes
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/client` | Crear |
| GET | `/api/client` | Listar (paginado + filtros) |
| GET | `/api/client/archived` | Listar archivados |
| GET | `/api/client/:id` | Obtener |
| PUT | `/api/client/:id` | Actualizar |
| DELETE | `/api/client/:id` | Eliminar (`?soft=true`) |
| PATCH | `/api/client/:id/restore` | Restaurar |

### Proyectos
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/project` | Crear |
| GET | `/api/project` | Listar (paginado + filtros) |
| GET | `/api/project/archived` | Listar archivados |
| GET | `/api/project/:id` | Obtener |
| PUT | `/api/project/:id` | Actualizar |
| DELETE | `/api/project/:id` | Eliminar (`?soft=true`) |
| PATCH | `/api/project/:id/restore` | Restaurar |

### Albaranes
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/deliverynote` | Crear |
| GET | `/api/deliverynote` | Listar (paginado + filtros) |
| GET | `/api/deliverynote/:id` | Obtener (con populate) |
| GET | `/api/deliverynote/pdf/:id` | Descargar PDF |
| PATCH | `/api/deliverynote/:id/sign` | Firmar (multipart) |
| DELETE | `/api/deliverynote/:id` | Eliminar (solo si no firmado) |

---

## Variables de entorno

Ver `.env.example` para la lista completa con instrucciones.

### Servicios externos necesarios

**Cloudinary** (gratuito): [cloudinary.com](https://cloudinary.com)
- Subida de firmas, PDFs y logos

**Mailtrap** (gratuito): [mailtrap.io](https://mailtrap.io)
- Email de verificación en desarrollo
- Ir a *Email Testing → SMTP Settings* para obtener las credenciales

**Slack Webhook** (opcional): [api.slack.com/apps](https://api.slack.com/apps)
- Notificaciones de errores 5XX

---

## Estructura del proyecto

```
src/
├── config/          # Configuración centralizada + Swagger
├── controllers/     # Lógica de negocio (MVC)
├── middleware/      # Auth, validación, rate-limit, upload, errors
├── models/          # Mongoose schemas con tipos TypeScript
├── routes/          # Definición de rutas
├── services/        # Mail, Storage, PDF, Logger
├── types/           # Augmentaciones de tipos Express
├── utils/           # AppError
├── validators/      # Schemas Zod
├── app.ts           # Express + Socket.IO
└── index.ts         # Entry point + graceful shutdown

tests/
├── helpers.ts       # Utilidades compartidas
├── setup.ts         # mongodb-memory-server
├── teardown.ts
├── auth.test.ts
├── client.test.ts
├── project.test.ts
└── deliverynote.test.ts
```
