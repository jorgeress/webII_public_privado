import { verifyToken } from '../utils/handleJwt.js';
import User from '../models/user.model.js';

const sessionMiddleware = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: "No se encontró el token" });
        }

        const token = req.headers.authorization.split(' ').pop(); // Bearer <token>
        const dataToken = await verifyToken(token);

        if (!dataToken) {
            return res.status(401).json({ message: "Token no válido" });
        }

        // Importante: Usamos dataToken.userId porque así lo configuramos en handleJwt
        const user = await User.findById(dataToken.userId);
        
        if (!user) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        req.user = user; // Inyectamos el usuario en la petición
        next();
    } catch (err) {
        res.status(401).json({ message: "Sesión no válida" });
    }
};

export default sessionMiddleware;