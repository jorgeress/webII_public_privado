import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const sessionMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'NOT_TOKEN' });
    }

    const token = req.headers.authorization.split(' ').pop();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'INVALID_TOKEN' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'USER_NOT_FOUND' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'NOT_SESSION' });
  }
};

export default sessionMiddleware;