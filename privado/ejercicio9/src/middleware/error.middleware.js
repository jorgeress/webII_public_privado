export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, res) => {
  res.status(404).json({
    error: true,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: true, message: 'Token inválido' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: true, message: 'Token expirado' });
  }

  // Prisma: registro no encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({ error: true, message: 'Registro no encontrado' });
  }
  // Prisma: violación de unique
  if (err.code === 'P2002') {
    return res.status(409).json({ error: true, message: 'Ya existe un registro con ese valor' });
  }

  res.status(err.status || err.statusCode || 500).json({
    error: true,
    message: err.message || 'Error interno del servidor'
  });
};