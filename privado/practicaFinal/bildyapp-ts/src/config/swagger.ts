// src/config/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BildyApp API',
      version: '2.0.0',
      description: 'API REST para la gestión de albaranes entre clientes y proveedores.',
    },
    servers: [{ url: '/api', description: 'API base' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Address: {
          type: 'object',
          properties: {
            street: { type: 'string', example: 'Calle Mayor' },
            number: { type: 'string', example: '10' },
            postal: { type: 'string', example: '28001' },
            city: { type: 'string', example: 'Madrid' },
            province: { type: 'string', example: 'Madrid' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            lastName: { type: 'string' },
            nif: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'guest'] },
            status: { type: 'string', enum: ['pending', 'verified'] },
            company: { type: 'string' },
            address: { $ref: '#/components/schemas/Address' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            owner: { type: 'string' },
            name: { type: 'string' },
            cif: { type: 'string' },
            logo: { type: 'string', nullable: true },
            isFreelance: { type: 'boolean' },
            address: { $ref: '#/components/schemas/Address' },
          },
        },
        ClientInput: {
          type: 'object',
          required: ['name', 'cif'],
          properties: {
            name: { type: 'string', example: 'Construcciones García S.L.' },
            cif: { type: 'string', example: 'B12345678' },
            email: { type: 'string', format: 'email', example: 'contacto@garcia.com' },
            phone: { type: 'string', example: '912345678' },
            address: { $ref: '#/components/schemas/Address' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Construcciones García S.L.' },
            cif: { type: 'string', example: 'B12345678' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { $ref: '#/components/schemas/Address' },
            deleted: { type: 'boolean' },
          },
        },
        ProjectInput: {
          type: 'object',
          required: ['name', 'projectCode', 'client'],
          properties: {
            name: { type: 'string', example: 'Reforma oficinas Madrid' },
            projectCode: { type: 'string', example: 'PRJ-2024-001' },
            client: { type: 'string', example: '507f1f77bcf86cd799439011' },
            address: { $ref: '#/components/schemas/Address' },
            email: { type: 'string', example: 'obra@empresa.com' },
            notes: { type: 'string', example: 'Acceso por puerta lateral' },
            active: { type: 'boolean', example: true },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            projectCode: { type: 'string' },
            client: { type: 'string' },
            address: { $ref: '#/components/schemas/Address' },
            email: { type: 'string' },
            notes: { type: 'string' },
            active: { type: 'boolean' },
            deleted: { type: 'boolean' },
          },
        },
        Worker: {
          type: 'object',
          required: ['name', 'hours'],
          properties: {
            name: { type: 'string', example: 'Juan García' },
            hours: { type: 'number', example: 8 },
          },
        },
        DeliveryNoteInput: {
          type: 'object',
          required: ['project', 'client', 'format', 'workDate'],
          properties: {
            project: { type: 'string', example: '507f1f77bcf86cd799439011' },
            client: { type: 'string', example: '507f1f77bcf86cd799439012' },
            format: { type: 'string', enum: ['material', 'hours'], example: 'hours' },
            description: { type: 'string', example: 'Trabajo de instalación' },
            workDate: { type: 'string', format: 'date', example: '2025-06-15' },
            hours: { type: 'number', example: 8, description: 'Requerido si format=hours' },
            workers: { type: 'array', items: { '$ref': '#/components/schemas/Worker' }, description: 'Alternativa a hours' },
            material: { type: 'string', example: 'Cemento Portland', description: 'Requerido si format=material' },
            quantity: { type: 'number', example: 200 },
            unit: { type: 'string', example: 'kg' },
          },
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            project: { type: 'string' },
            client: { type: 'string' },
            format: { type: 'string', enum: ['material', 'hours'] },
            description: { type: 'string' },
            workDate: { type: 'string', format: 'date' },
            material: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            hours: { type: 'number' },
            workers: { type: 'array', items: { '$ref': '#/components/schemas/Worker' } },
            signed: { type: 'boolean' },
            signedAt: { type: 'string', format: 'date-time' },
            signatureUrl: { type: 'string' },
            pdfUrl: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Descripción del error' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            totalItems: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
            currentPage: { type: 'integer', example: 1 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/user/register': {
        post: {
          tags: ['Users'], summary: 'Registrar usuario', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', example: 'usuario@empresa.com' }, password: { type: 'string', minLength: 8, example: 'Password123' } } } } } },
          responses: { 201: { description: 'Usuario registrado. Email con código de verificación enviado.' }, 400: { description: 'Datos inválidos' }, 409: { description: 'Email ya registrado' } },
        },
        put: {
          tags: ['Users'], summary: 'Actualizar datos personales',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'lastName', 'nif'], properties: { name: { type: 'string', example: 'Carlos' }, lastName: { type: 'string', example: 'García López' }, nif: { type: 'string', example: '12345678A' }, address: { '$ref': '#/components/schemas/Address' } } } } } },
          responses: { 200: { description: 'Datos actualizados' }, 401: { description: 'No autenticado' } },
        },
      },
      '/user/login': {
        post: {
          tags: ['Users'], summary: 'Iniciar sesión', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', example: 'usuario@empresa.com' }, password: { type: 'string', example: 'Password123' } } } } } },
          responses: { 200: { description: 'Login exitoso. Copia el accessToken y úsalo en Authorize.' }, 401: { description: 'Credenciales incorrectas o email no verificado' } },
        },
      },
      '/user/validation': {
        put: {
          tags: ['Users'], summary: 'Verificar email con código de 6 dígitos',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string', example: '123456' } } } } } },
          responses: { 200: { description: 'Email verificado' }, 400: { description: 'Código incorrecto' } },
        },
      },
      '/user': {
        get: { tags: ['Users'], summary: 'Obtener usuario autenticado', responses: { 200: { description: 'Datos del usuario con compañía populada' }, 401: { description: 'No autenticado' } } },
        delete: {
          tags: ['Users'], summary: 'Eliminar usuario',
          parameters: [{ in: 'query', name: 'soft', schema: { type: 'boolean' }, description: 'true = borrado lógico' }],
          responses: { 200: { description: 'Usuario eliminado' } },
        },
      },
      '/user/company': {
        patch: {
          tags: ['Users'], summary: 'Crear compañía o unirse a una existente por CIF',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { oneOf: [
              { title: 'Empresa', type: 'object', required: ['isFreelance', 'name', 'cif'], properties: { isFreelance: { type: 'boolean', example: false }, name: { type: 'string', example: 'Mi Empresa SL' }, cif: { type: 'string', example: 'B87654321' }, address: { '$ref': '#/components/schemas/Address' } } },
              { title: 'Autónomo', type: 'object', required: ['isFreelance'], properties: { isFreelance: { type: 'boolean', example: true } } },
            ] } } },
          },
          responses: { 200: { description: 'Compañía configurada. Vuelve a hacer login para obtener token actualizado.' } },
        },
      },
      '/user/logo': {
        patch: {
          tags: ['Users'], summary: 'Subir logo de la compañía',
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['logo'], properties: { logo: { type: 'string', format: 'binary', description: 'Imagen del logo (jpg, png, webp — máx 5MB)' } } } } } },
          responses: { 200: { description: 'Logo subido a Cloudinary' }, 400: { description: 'No se recibió imagen' } },
        },
      },
      '/user/password': {
        put: {
          tags: ['Users'], summary: 'Cambiar contraseña',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string', example: 'Password123' }, newPassword: { type: 'string', example: 'NuevaPassword456' } } } } } },
          responses: { 200: { description: 'Contraseña actualizada. Todas las sesiones cerradas.' }, 401: { description: 'Contraseña actual incorrecta' } },
        },
      },
      '/user/logout': {
        post: {
          tags: ['Users'], summary: 'Cerrar sesión',
          requestBody: { required: false, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string', description: 'Omitir = cerrar todas las sesiones' } } } } } },
          responses: { 200: { description: 'Sesión cerrada' } },
        },
      },
      '/user/refresh': {
        post: {
          tags: ['Users'], summary: 'Renovar access token', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
          responses: { 200: { description: 'Nuevos tokens generados' }, 401: { description: 'Refresh token inválido' } },
        },
      },
      '/user/invite': {
        post: {
          tags: ['Users'], summary: 'Invitar compañero a la compañía (solo admin)',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'name'], properties: { email: { type: 'string', format: 'email', example: 'compañero@empresa.com' }, name: { type: 'string', example: 'Ana' }, lastName: { type: 'string', example: 'Martínez' } } } } } },
          responses: { 201: { description: 'Invitación enviada por email' }, 403: { description: 'Solo los admins pueden invitar' } },
        },
      },
      '/client': {
        post: {
          tags: ['Clients'], summary: 'Crear cliente',
          requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/ClientInput' } } } },
          responses: { 201: { description: 'Cliente creado' }, 400: { description: 'Datos inválidos' }, 409: { description: 'CIF duplicado en esta compañía' } },
        },
        get: {
          tags: ['Clients'], summary: 'Listar clientes',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'name', schema: { type: 'string' }, description: 'Búsqueda parcial por nombre' },
            { in: 'query', name: 'sort', schema: { type: 'string', default: 'createdAt' }, description: 'Prefija con - para descendente' },
          ],
          responses: { 200: { description: 'Lista paginada de clientes' } },
        },
      },
      '/client/archived': {
        get: { tags: ['Clients'], summary: 'Listar clientes archivados', responses: { 200: { description: 'Lista de archivados' } } },
      },
      '/client/{id}': {
        get: { tags: ['Clients'], summary: 'Obtener cliente', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cliente' }, 404: { description: 'No encontrado' } } },
        put: {
          tags: ['Clients'], summary: 'Actualizar cliente',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/ClientInput' } } } },
          responses: { 200: { description: 'Actualizado' }, 404: { description: 'No encontrado' } },
        },
        delete: {
          tags: ['Clients'], summary: 'Eliminar cliente',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }, { in: 'query', name: 'soft', schema: { type: 'boolean' }, description: 'true = archivar' }],
          responses: { 200: { description: 'Eliminado' } },
        },
      },
      '/client/{id}/restore': {
        patch: { tags: ['Clients'], summary: 'Restaurar cliente archivado', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Restaurado' } } },
      },
      '/project': {
        post: {
          tags: ['Projects'], summary: 'Crear proyecto',
          requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/ProjectInput' } } } },
          responses: { 201: { description: 'Proyecto creado' }, 404: { description: 'Cliente no encontrado' }, 409: { description: 'Código duplicado' } },
        },
        get: {
          tags: ['Projects'], summary: 'Listar proyectos',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'client', schema: { type: 'string' }, description: 'Filtrar por ID de cliente' },
            { in: 'query', name: 'name', schema: { type: 'string' } },
            { in: 'query', name: 'active', schema: { type: 'boolean' } },
            { in: 'query', name: 'sort', schema: { type: 'string', default: '-createdAt' } },
          ],
          responses: { 200: { description: 'Lista paginada de proyectos' } },
        },
      },
      '/project/archived': {
        get: { tags: ['Projects'], summary: 'Listar proyectos archivados', responses: { 200: { description: 'Lista' } } },
      },
      '/project/{id}': {
        get: { tags: ['Projects'], summary: 'Obtener proyecto', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Proyecto con cliente populado' }, 404: { description: 'No encontrado' } } },
        put: {
          tags: ['Projects'], summary: 'Actualizar proyecto',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/ProjectInput' } } } },
          responses: { 200: { description: 'Actualizado' } },
        },
        delete: {
          tags: ['Projects'], summary: 'Eliminar proyecto',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }, { in: 'query', name: 'soft', schema: { type: 'boolean' } }],
          responses: { 200: { description: 'Eliminado' } },
        },
      },
      '/project/{id}/restore': {
        patch: { tags: ['Projects'], summary: 'Restaurar proyecto archivado', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Restaurado' } } },
      },
      '/deliverynote': {
        post: {
          tags: ['DeliveryNotes'], summary: 'Crear albarán',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/DeliveryNoteInput' },
                examples: {
                  horas: { summary: 'Horas con trabajadores', value: { project: '507f1f77bcf86cd799439011', client: '507f1f77bcf86cd799439012', format: 'hours', workDate: '2025-06-15', description: 'Instalación de andamios', workers: [{ name: 'Juan García', hours: 8 }, { name: 'Ana López', hours: 6 }] } },
                  materiales: { summary: 'Materiales', value: { project: '507f1f77bcf86cd799439011', client: '507f1f77bcf86cd799439012', format: 'material', workDate: '2025-06-15', material: 'Cemento Portland', quantity: 200, unit: 'kg' } },
                },
              },
            },
          },
          responses: { 201: { description: 'Albarán creado' }, 400: { description: 'Faltan campos según el formato elegido' }, 404: { description: 'Proyecto o cliente no encontrado' } },
        },
        get: {
          tags: ['DeliveryNotes'], summary: 'Listar albaranes',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'project', schema: { type: 'string' } },
            { in: 'query', name: 'client', schema: { type: 'string' } },
            { in: 'query', name: 'format', schema: { type: 'string', enum: ['material', 'hours'] } },
            { in: 'query', name: 'signed', schema: { type: 'boolean' } },
            { in: 'query', name: 'from', schema: { type: 'string', format: 'date' }, description: 'workDate >= from' },
            { in: 'query', name: 'to', schema: { type: 'string', format: 'date' }, description: 'workDate <= to' },
            { in: 'query', name: 'sort', schema: { type: 'string', default: '-workDate' } },
          ],
          responses: { 200: { description: 'Lista paginada de albaranes' } },
        },
      },
      '/deliverynote/pdf/{id}': {
        get: {
          tags: ['DeliveryNotes'], summary: 'Descargar PDF',
          description: 'Si firmado y tiene pdfUrl → redirect 302 a Cloudinary. Si no → genera PDF al vuelo.',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'PDF generado', content: { 'application/pdf': {} } }, 302: { description: 'Redirect a Cloudinary' }, 404: { description: 'No encontrado' } },
        },
      },
      '/deliverynote/{id}': {
        get: { tags: ['DeliveryNotes'], summary: 'Obtener albarán con populate', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Albarán con datos de usuario, cliente y proyecto' }, 404: { description: 'No encontrado' } } },
        delete: { tags: ['DeliveryNotes'], summary: 'Eliminar albarán (solo si no firmado)', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Eliminado' }, 409: { description: 'No se puede eliminar un albarán firmado' } } },
      },
      '/deliverynote/{id}/sign': {
        patch: {
          tags: ['DeliveryNotes'], summary: 'Firmar albarán — subir imagen de firma',
          description: 'Optimiza la imagen con Sharp (máx 800px WebP), sube a Cloudinary, genera PDF y lo sube también.',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['signature'], properties: { signature: { type: 'string', format: 'binary', description: 'Imagen de la firma (jpg, png, webp — máx 5MB)' } } } } } },
          responses: { 200: { description: 'Firmado. Devuelve signatureUrl y pdfUrl de Cloudinary.' }, 400: { description: 'No se recibió imagen' }, 404: { description: 'No encontrado' }, 409: { description: 'Ya firmado' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);