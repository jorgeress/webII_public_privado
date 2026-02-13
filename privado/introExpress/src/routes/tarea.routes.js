import { Router } from 'express';
import * as controller from '../controllers/tarea.controller.js';
import { validate } from '../middleware/validateRequest.js';
import { createTareaSchema, updateTareaSchema } from '../schemas/tarea.schema.js';

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createTareaSchema), controller.create);
router.put('/:id', validate(updateTareaSchema), controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/toggle', controller.toggleStatus);

export default router;