import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { tokenSign } from '../utils/handleJwt.js';

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });
    const token = tokenSign(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Buscamos al usuario incluyendo el password (por si tu schema lo tiene como select: false)
    const user = await User.findOne({ email }).select('+password'); 
    
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Verificamos que password y user.password existan antes de comparar
    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = tokenSign(user);
    
    // Devolvemos el usuario sin la contraseña
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const me = async (req, res) => {
  try {
    // req.user ya contiene el objeto del usuario de la base de datos
    // gracias al sessionMiddleware.
    res.status(200).json(req.user); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { register, login, me };