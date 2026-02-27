import mongoose from 'mongoose';

/**
 * Middleware de validación universal
 */
export const validate = (schema) => (req, res, next) => {
  try {
    // Como tu validatorMovie espera title, year, etc.,
    // le pasamos directamente el req.body
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    // Mapeamos los errores para que el profesor vea un JSON limpio
    const errors = error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    return res.status(400).json({
      error: true,
      message: 'Error de validación',
      details: errors
    });
  }
};

/**
 * Middleware para validar que el ID de la URL es un ObjectId de Mongo
 */
export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: `El formato del ID '${id}' no es válido para MongoDB`
    });
  }
  next();
};