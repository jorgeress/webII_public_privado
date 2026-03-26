import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js'; // Importa lo que acabamos de configurar
import podcastRoutes from './routes/podcasts.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// 1. Swagger en la ruta /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 2. Las rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/podcasts', podcastRoutes);

export default app;