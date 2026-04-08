import { Router } from 'express';
import { getBooks, getBook, createBook, updateBook, deleteBook } from '../controllers/books.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBookSchema, updateBookSchema, booksQuerySchema, idParamSchema } from '../schemas/validation.js';

const router = Router();
router.get('/', validate(booksQuerySchema), asyncHandler(getBooks));
router.get('/:id', validate(idParamSchema), asyncHandler(getBook));
router.post('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), validate(createBookSchema), asyncHandler(createBook));
router.put('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), validate(idParamSchema), validate(updateBookSchema), asyncHandler(updateBook));
router.delete('/:id', authenticate, authorize('ADMIN'), validate(idParamSchema), asyncHandler(deleteBook));
export default router;