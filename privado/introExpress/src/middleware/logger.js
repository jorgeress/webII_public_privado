export const requestLogger = (req, res, next) => {
  const now = new Date();
  const timestamp = now.toLocaleString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};