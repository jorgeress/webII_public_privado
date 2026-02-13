// src/routes/index.js
import { Router } from 'express';
import cursosRoutes from './cursos.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import { usuarios } from '../data/usuarios.js';
import tareaRoutes from './tarea.routes.js';

const router = Router();

router.use('/cursos/programacion', cursosRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/tarea', tareaRoutes);


router.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Cursos v1.0',
    endpoints: {
      cursos: '/api/cursos/programacion',
      health: '/health',
      usuarios: '/api/usuarios',
      tarea: '/api/tarea'
    }
  });
});

export default router;