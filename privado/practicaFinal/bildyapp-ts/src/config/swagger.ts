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
            street: { type: 'string' }, number: { type: 'string' },
            postal: { type: 'string' }, city: { type: 'string' },
            province: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' }, lastName: { type: 'string' },
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
            name: { type: 'string' }, cif: { type: 'string' },
            logo: { type: 'string', nullable: true },
            isFreelance: { type: 'boolean' },
            address: { $ref: '#/components/schemas/Address' },
          },
        },
        Client: {
          type: 'object',
          required: ['name', 'cif'],
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
        Project: {
          type: 'object',
          required: ['name', 'projectCode', 'client'],
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Reforma oficinas Madrid' },
            projectCode: { type: 'string', example: 'PRJ-2024-001' },
            client: { type: 'string' },
            address: { $ref: '#/components/schemas/Address' },
            email: { type: 'string' }, notes: { type: 'string' },
            active: { type: 'boolean' }, deleted: { type: 'boolean' },
          },
        },
        Worker: {
          type: 'object',
          required: ['name', 'hours'],
          properties: {
            name: { type: 'string' }, hours: { type: 'number' },
          },
        },
        DeliveryNote: {
          type: 'object',
          required: ['project', 'client', 'format', 'workDate'],
          properties: {
            _id: { type: 'string' },
            project: { type: 'string' }, client: { type: 'string' },
            format: { type: 'string', enum: ['material', 'hours'] },
            description: { type: 'string' },
            workDate: { type: 'string', format: 'date' },
            material: { type: 'string' }, quantity: { type: 'number' },
            unit: { type: 'string' }, hours: { type: 'number' },
            workers: { type: 'array', items: { $ref: '#/components/schemas/Worker' } },
            signed: { type: 'boolean' }, signedAt: { type: 'string', format: 'date-time' },
            signatureUrl: { type: 'string' }, pdfUrl: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            totalItems: { type: 'integer' }, totalPages: { type: 'integer' },
            currentPage: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      // ── USER ──────────────────────────────────────────────────────────────
      '/user/register': {
        post: {
          tags: ['Users'], summary: 'Registrar usuario', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: {
            required: ['email', 'password'],
            properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } },
          }}}},
          responses: {
            201: { description: 'Usuario registrado', content: { 'application/json': { schema: {
              properties: { status: { type: 'string' }, accessToken: { type: 'string' }, refreshToken: { type: 'string' } },
            }}}},
            409: { description: 'Email ya registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        put: {
          tags: ['Users'], summary: 'Actualizar datos personales',
          requestBody: { required: true, content: { 'application/json': { schema: {
            required: ['name', 'lastName', 'nif'],
            properties: { name: { type: 'string' }, lastName: { type: 'string' }, nif: { type: 'string' } },
          }}}},
          responses: { 200: { description: 'Datos actualizados' }, 401: { description: 'No autenticado' } },
        },
      },
      '/user/login': {
        post: {
          tags: ['Users'], summary: 'Iniciar sesión', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: {
            required: ['email', 'password'],
            properties: { email: { type: 'string' }, password: { type: 'string' } },
          }}}},
          responses: {
            200: { description: 'Login exitoso' },
            401: { description: 'Credenciales incorrectas o email no verificado' },
          },
        },
      },
      '/user/validation': {
        put: {
          tags: ['Users'], summary: 'Verificar email con código',
          requestBody: { required: true, content: { 'application/json': { schema: {
            required: ['code'],
            properties: { code: { type: 'string', example: '123456' } },
          }}}},
          responses: { 200: { description: 'Email verificado' }, 400: { description: 'Código incorrecto' } },
        },
      },
      '/user': {
        get: {
          tags: ['Users'], summary: 'Obtener usuario autenticado',
          responses: { 200: { description: 'Datos del usuario', content: { 'application/json': { schema: {
            properties: { status: { type: 'string' }, data: { $ref: '#/components/schemas/User' } },
          }}}}, 401: { description: 'No autenticado' } },
        },
        delete: {
          tags: ['Users'], summary: 'Eliminar usuario',
          parameters: [{ in: 'query', name: 'soft', schema: { type: 'boolean' }, description: 'Borrado lógico' }],
          responses: { 200: { description: 'Usuario eliminado' } },
        },
      },
      '/user/company': {
        patch: {
          tags: ['Users'], summary: 'Crear o unirse a compañía',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                 oneOf: [
                    {
                      title: 'Empresa',
                      required: ['isFreelance', 'name', 'cif'],
                      properties: {
                        isFreelance: { type: 'boolean', example: false },
                        name: { type: 'string', example: 'Mi Empresa SL' },
                        cif: { type: 'string', example: 'B87654321' },
                        address: { $ref: '#/components/schemas/Address' },
                      },
                    },
                    {
                      title: 'Autónomo',
                      required: ['isFreelance'],
                      properties: {
                        isFreelance: { type: 'boolean', example: true },
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: { 200: { description: 'Compañía configurada' } },
        },
      },
      // ── CLIENTS ───────────────────────────────────────────────────────────
      '/client': {
        post: {
          tags: ['Clients'], summary: 'Crear cliente',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } },
          responses: { 201: { description: 'Cliente creado' }, 409: { description: 'CIF duplicado' } },
        },
        get: {
          tags: ['Clients'], summary: 'Listar clientes',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'name', schema: { type: 'string' }, description: 'Búsqueda parcial' },
            { in: 'query', name: 'sort', schema: { type: 'string', default: 'createdAt' } },
          ],
          responses: { 200: { description: 'Lista de clientes con paginación' } },
        },
      },
      '/client/archived': {
        get: { tags: ['Clients'], summary: 'Listar clientes archivados', responses: { 200: { description: 'Lista' } } },
      },
      '/client/{id}': {
        get: { tags: ['Clients'], summary: 'Obtener cliente', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cliente' }, 404: { description: 'No encontrado' } } },
        put: { tags: ['Clients'], summary: 'Actualizar cliente', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Actualizado' } } },
        delete: { tags: ['Clients'], summary: 'Eliminar cliente', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }, { in: 'query', name: 'soft', schema: { type: 'boolean' } }], responses: { 200: { description: 'Eliminado' } } },
      },
      '/client/{id}/restore': {
        patch: { tags: ['Clients'], summary: 'Restaurar cliente archivado', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Restaurado' } } },
      },
      // ── PROJECTS ──────────────────────────────────────────────────────────
      '/project': {
        post: { tags: ['Projects'], summary: 'Crear proyecto', responses: { 201: { description: 'Creado' }, 409: { description: 'Código duplicado' } } },
        get: {
          tags: ['Projects'], summary: 'Listar proyectos',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'client', schema: { type: 'string' } },
            { in: 'query', name: 'name', schema: { type: 'string' } },
            { in: 'query', name: 'active', schema: { type: 'boolean' } },
            { in: 'query', name: 'sort', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Lista con paginación' } },
        },
      },
      '/project/archived': {
        get: { tags: ['Projects'], summary: 'Proyectos archivados', responses: { 200: { description: 'Lista' } } },
      },
      '/project/{id}': {
        get: { tags: ['Projects'], summary: 'Obtener proyecto', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Proyecto' }, 404: { description: 'No encontrado' } } },
        put: { tags: ['Projects'], summary: 'Actualizar proyecto', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Actualizado' } } },
        delete: { tags: ['Projects'], summary: 'Eliminar proyecto', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Eliminado' } } },
      },
      '/project/{id}/restore': {
        patch: { tags: ['Projects'], summary: 'Restaurar proyecto', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Restaurado' } } },
      },
      // ── DELIVERY NOTES ────────────────────────────────────────────────────
      '/deliverynote': {
        post: {
          tags: ['DeliveryNotes'], summary: 'Crear albarán',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DeliveryNote' } } } },
          responses: { 201: { description: 'Albarán creado' } },
        },
        get: {
          tags: ['DeliveryNotes'], summary: 'Listar albaranes',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'project', schema: { type: 'string' } },
            { in: 'query', name: 'client', schema: { type: 'string' } },
            { in: 'query', name: 'format', schema: { type: 'string', enum: ['material', 'hours'] } },
            { in: 'query', name: 'signed', schema: { type: 'boolean' } },
            { in: 'query', name: 'from', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'sort', schema: { type: 'string', default: '-workDate' } },
          ],
          responses: { 200: { description: 'Lista con paginación' } },
        },
      },
      '/deliverynote/pdf/{id}': {
        get: { tags: ['DeliveryNotes'], summary: 'Descargar PDF del albarán', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'PDF', content: { 'application/pdf': {} } }, 302: { description: 'Redirect a PDF en la nube' } } },
      },
      '/deliverynote/{id}': {
        get: { tags: ['DeliveryNotes'], summary: 'Obtener albarán', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Albarán con datos relacionados' }, 404: { description: 'No encontrado' } } },
        delete: { tags: ['DeliveryNotes'], summary: 'Eliminar albarán (solo si no está firmado)', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Eliminado' }, 409: { description: 'Firmado, no se puede eliminar' } } },
      },
      '/deliverynote/{id}/sign': {
        patch: {
          tags: ['DeliveryNotes'], summary: 'Firmar albarán (subir imagen de firma)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: {
            required: ['signature'],
            properties: { signature: { type: 'string', format: 'binary' } },
          }}}},
          responses: { 200: { description: 'Albarán firmado con URL de firma y PDF' }, 409: { description: 'Ya firmado' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
