import { Router } from 'express';
import { getBookReviews, createReview } from '../controllers/reviews.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createReviewSchema, idParamSchema } from '../schemas/validation.js';

const router = Router({ mergeParams: true });
router.get('/', validate(idParamSchema), asyncHandler(getBookReviews));
router.post('/', authenticate, validate(idParamSchema), validate(createReviewSchema), asyncHandler(createReview));
export default router;