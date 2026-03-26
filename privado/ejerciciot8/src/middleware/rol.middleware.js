const rolMiddleware = (roles) => (req, res, next) => {
  try {
    const { user } = req;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: 'NOT_ALLOWED' });
    }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'ERROR_PERMISSIONS' });
  }
};

export default rolMiddleware;