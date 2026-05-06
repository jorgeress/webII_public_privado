// src/routes/client.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';
import {
  createClient, updateClient, listClients, listArchivedClients,
  getClient, deleteClient, restoreClient,
} from '../controllers/client.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(createClientSchema), createClient);
router.put('/:id', validate(updateClientSchema), updateClient);
router.get('/archived', listArchivedClients);
router.get('/', listClients);
router.get('/:id', getClient);
router.delete('/:id', deleteClient);
router.patch('/:id/restore', restoreClient);

export default router;
