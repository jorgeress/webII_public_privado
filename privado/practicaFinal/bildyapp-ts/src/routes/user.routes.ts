// src/routes/user.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.js';
import { uploadLogo as uploadLogoMiddleware } from '../middleware/upload.js';
import {
  register, verifyEmail, login, updatePersonalData, upsertCompany,
  uploadLogo, getMe, refreshToken, logout, deleteUser, changePassword, inviteUser,
} from '../controllers/user.controller.js';
import {
  registerSchema, validationCodeSchema, loginSchema, personalDataSchema,
  companySchema, changePasswordSchema, inviteSchema, refreshSchema,
} from '../validators/user.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.put('/validation', authenticate, validate(validationCodeSchema), verifyEmail);
router.post('/login', validate(loginSchema), login);
router.put('/register', authenticate, validate(personalDataSchema), updatePersonalData);
router.patch('/company', authenticate, validate(companySchema), upsertCompany);
router.patch('/logo', authenticate, uploadLogoMiddleware, uploadLogo);
router.get('/', authenticate, getMe);
router.post('/refresh', validate(refreshSchema), refreshToken);
router.post('/logout', authenticate, logout);
router.delete('/', authenticate, deleteUser);
router.put('/password', authenticate, validate(changePasswordSchema), changePassword);
router.post('/invite', authenticate, requireRole('admin'), validate(inviteSchema), inviteUser);

export default router;
