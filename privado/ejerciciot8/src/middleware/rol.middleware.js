const checkRol = (roles) => (req, res, next) => {
    try {
        const { user } = req;
        const rolesByUser = user.role; // 'user' o 'admin'

        // Comprobamos si el rol del usuario está en la lista permitida
        const checkValueRol = roles.includes(rolesByUser);

        if (!checkValueRol) {
            return res.status(403).json({ message: "No tienes permisos de administrador" });
        }

        next();
    } catch (e) {
        res.status(403).json({ message: "Error de permisos" });
    }
};

export default checkRol;