import express from 'express';
import { 
  getItems, getItem, createItem, updateItem, deleteItem, 
  rentMovie, returnMovie, uploadCover, getCover, getTopStats 
} from '../controllers/movie.controller.js';
import { uploadMiddleware } from '../utils/handleStorage.js';

// Importamos los validadores que ajustamos antes
import { validate, validateObjectId } from '../middleware/validate.middleware.js';
import { validatorMovie } from '../schemas/movie.schema.js';

const router = express.Router();

//  Rutas generales 
router.get('/', getItems);
router.get('/stats/top', getTopStats);

//  Rutas con validación de ID 
// Usamos validateObjectId('id') para asegurar que el :id sea un formato válido de Mongo
router.get('/:id', validateObjectId('id'), getItem);

//  Crear película 
// Aquí aplicamos esquema de Zod 
router.post('/', validate(validatorMovie), createItem);

router.put('/:id', validateObjectId('id'), updateItem);
router.delete('/:id', validateObjectId('id'), deleteItem);

//  Lógica de negocio 
router.post('/:id/rent', validateObjectId('id'), rentMovie);
router.post('/:id/return', validateObjectId('id'), returnMovie);

// Cover
router.patch('/:id/cover', validateObjectId('id'), uploadMiddleware.single('cover'), uploadCover);
router.get('/:id/cover', validateObjectId('id'), getCover);

export default router;