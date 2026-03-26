import jwt from 'jsonwebtoken';

/**
 * Firma el token con el ID del usuario y el rol
 */
export const tokenSign = (user) => {
  return jwt.sign(
    {
      userId: user._id, // Asegúrate de que sea userId para el middleware
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

/**
 * Verifica si el token es válido
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
};