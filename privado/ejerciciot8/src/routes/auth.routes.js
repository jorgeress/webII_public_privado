import express from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import sessionMiddleware from '../middleware/session.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 * post:
 * summary: Registro de usuario
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [name, email, password]
 * properties:
 * name:
 * type: string
 * email:
 * type: string
 * password:
 * type: string
 * responses:
 * 201:
 * description: Usuario creado
 * 400:
 * description: Error de validacion
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 * post:
 * summary: Login de usuario
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [email, password]
 * properties:
 * email:
 * type: string
 * password:
 * type: string
 * responses:
 * 200:
 * description: Login exitoso
 * 401:
 * description: Credenciales invalidas
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/me:
 * get:
 * summary: Perfil usuario
 * tags: [Auth]
 * security:
 * - BearerToken: []
 * responses:
 * 200:
 * description: Datos del usuario
 * 401:
 * description: No autorizado
 */
router.get('/me', sessionMiddleware, me);

export default router;