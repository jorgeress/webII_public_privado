import { Router } from 'express';
import { getAll, getOne, create, update, remove, getAdminAll, publish } from '../controllers/podcasts.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { podcastSchema } from '../validators/podcast.validator.js';
import sessionMiddleware from '../middleware/session.middleware.js';
import rolMiddleware from '../middleware/rol.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/podcasts:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Listar podcasts publicados
 *     responses:
 *       200:
 *         description: Lista de podcasts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Podcast'
 */
router.get('/', getAll);

/**
 * @openapi
 * /api/podcasts/admin/all:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Listar todos los podcasts (admin)
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Lista completa de podcasts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Podcast'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.get('/admin/all', sessionMiddleware, rolMiddleware(['admin']), getAdminAll);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Obtener un podcast
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Podcast'
 *       404:
 *         description: Podcast no encontrado
 */
router.get('/:id', getOne);

/**
 * @openapi
 * /api/podcasts:
 *   post:
 *     tags:
 *       - Podcasts
 *     summary: Crear podcast
 *     security:
 *       - BearerToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Podcast'
 *     responses:
 *       201:
 *         description: Podcast creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Podcast'
 *       401:
 *         description: No autorizado
 */
router.post('/', sessionMiddleware, validate(podcastSchema), create);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   put:
 *     tags:
 *       - Podcasts
 *     summary: Actualizar propio podcast
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Podcast'
 *     responses:
 *       200:
 *         description: Podcast actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No eres el autor
 */
router.put('/:id', sessionMiddleware, validate(podcastSchema), update);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   delete:
 *     tags:
 *       - Podcasts
 *     summary: Eliminar podcast (admin)
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.delete('/:id', sessionMiddleware, rolMiddleware(['admin']), remove);

/**
 * @openapi
 * /api/podcasts/{id}/publish:
 *   patch:
 *     tags:
 *       - Podcasts
 *     summary: Publicar/despublicar podcast (admin)
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de publicación actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.patch('/:id/publish', sessionMiddleware, rolMiddleware(['admin']), publish);

export default router;