const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        // req.user logic comes from authMiddleware (jwt.verify)
        if (!req.user || !req.user.user.permissions) {
            return res.status(403).json({ message: 'Acesso Negado: Permissões não encontradas no Token' });
        }

        const hasPermission = req.user.user.permissions.includes(requiredPermission);

        if (!hasPermission) {
            return res.status(403).json({ message: `Acesso Negado: Requer permissão '${requiredPermission}'` });
        }

        next();
    };
};

module.exports = checkPermission;
