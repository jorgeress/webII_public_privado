// src/routes/deliverynote.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { uploadSignature } from '../middleware/upload.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import {
  createDeliveryNote, listDeliveryNotes, getDeliveryNote,
  downloadPdf, signDeliveryNote, deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(createDeliveryNoteSchema), createDeliveryNote);
router.get('/pdf/:id', downloadPdf);   // antes de /:id para evitar colisión
router.get('/', listDeliveryNotes);
router.get('/:id', getDeliveryNote);
router.patch('/:id/sign', uploadSignature, signDeliveryNote);
router.delete('/:id', deleteDeliveryNote);

export default router;
