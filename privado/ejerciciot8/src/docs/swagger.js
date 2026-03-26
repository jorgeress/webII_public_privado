import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'PodcastHub API',
      version: '1.0.0',
      description: 'API para la gestión de podcasts - Ejercicio T8',
    },
    components: {
      securitySchemes: {
        BearerToken: {               // Este nombre debe coincidir con el de tus rutas
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: {
        Podcast: {
          type: 'object',
          required: ['title', 'description', 'category', 'duration'],
          properties: {
            title: { type: 'string', example: 'Mi Podcast Tech' },
            description: { type: 'string', example: 'Hablando sobre Node.js y Swagger' },
            category: { type: 'string', enum: ['tech', 'science', 'history', 'comedy', 'news'] },
            duration: { type: 'number', example: 3600 },
            episodes: { type: 'number', example: 1 },
            published: { type: 'boolean', example: false },
            author: { type: 'string', description: 'ID del usuario' }
          }
        },
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.routes.js', './src/routes/*.js'],
};

// Generar el espectro a partir de las opciones
const swaggerSpec = swaggerJsdoc(options);

// ESTO ES LO QUE TE FALTABA: Exportación por defecto para app.js
export default swaggerSpec;