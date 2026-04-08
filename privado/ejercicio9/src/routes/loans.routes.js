import { Router } from 'express';
import { getMyLoans, getAllLoans, createLoan, returnLoan } from '../controllers/loans.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createLoanSchema, idParamSchema } from '../schemas/validation.js';

const router = Router();
router.get('/', authenticate, asyncHandler(getMyLoans));
router.get('/all', authenticate, authorize('LIBRARIAN', 'ADMIN'), asyncHandler(getAllLoans));
router.post('/', authenticate, validate(createLoanSchema), asyncHandler(createLoan));
router.put('/:id/return', authenticate, validate(idParamSchema), asyncHandler(returnLoan));
export default router;