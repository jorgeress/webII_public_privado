export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    });
  }

  
  req.validated = result.data;

  next();
};