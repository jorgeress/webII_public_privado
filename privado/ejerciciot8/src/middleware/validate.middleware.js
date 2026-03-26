export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    // Aquí transformamos el error de Zod en un 400 para el test
    return res.status(400).json({
      message: "Error de validación",
      errors: error.errors.map(err => ({
        path: err.path[1],
        message: err.message
      }))
    });
  }
};