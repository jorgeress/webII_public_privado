import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.js';
import { uploadLogo as uploadLogoMiddleware } from '../middleware/upload.js';
import {
  register,
  verifyEmail,
  login,
  updatePersonalData,
  upsertCompany,
  uploadLogo,
  getMe,
  refreshToken,
  logout,
  deleteUser,
  changePassword,
  inviteUser,
} from '../controllers/user.controller.js';
import {
  registerSchema,
  validationCodeSchema,
  loginSchema,
  personalDataSchema,
  companySchema,
  changePasswordSchema,
  inviteSchema,
  refreshSchema,
} from '../validators/user.validator.js';

const router = Router();

// 1. Registro
router.post('/register', validate(registerSchema), register);

// 2. Validación del email
router.put('/validation', authenticate, validate(validationCodeSchema), verifyEmail);

// 3. Login
router.post('/login', validate(loginSchema), login);

// 4a. Onboarding — Datos personales
router.put('/register', authenticate, validate(personalDataSchema), updatePersonalData);

// 4b. Onboarding — Compañía
router.patch('/company', authenticate, validate(companySchema), upsertCompany);

// 5. Logo de la compañía
router.patch('/logo', authenticate, uploadLogoMiddleware, uploadLogo);

// 6. Obtener usuario
router.get('/', authenticate, getMe);

// 7. Gestión de sesión
router.post('/refresh', validate(refreshSchema), refreshToken);
router.post('/logout', authenticate, logout);

// 8. Eliminar usuario
router.delete('/', authenticate, deleteUser);

// 9. Cambiar contraseña
router.put('/password', authenticate, validate(changePasswordSchema), changePassword);

// 10. Invitar compañero (solo admin)
router.post('/invite', authenticate, requireRole('admin'), validate(inviteSchema), inviteUser);

export default router;