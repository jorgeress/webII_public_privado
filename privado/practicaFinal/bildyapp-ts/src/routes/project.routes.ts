// src/routes/project.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
import {
  createProject, updateProject, listProjects, listArchivedProjects,
  getProject, deleteProject, restoreProject,
} from '../controllers/project.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(createProjectSchema), createProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.get('/archived', listArchivedProjects);
router.get('/', listProjects);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);
router.patch('/:id/restore', restoreProject);

export default router;
