import passport from 'passport';

export const authenticateJWT = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ 
                status: 'error', 
                message: 'Error interno del servidor' 
            });
        }
        
        if (!user) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.' 
            });
        }
        
        req.user = user;
        next();
    })(req, res, next);
};

export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'No hay usuario autenticado' 
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Acceso denegado. Se requieren permisos de administrador.' 
        });
    }
    
    next();
};

export const isOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'No hay usuario autenticado' 
        });
    }
    
    const resourceUserId = req.params.uid || req.params.userId;
    
    if (req.user._id.toString() !== resourceUserId && req.user.role !== 'admin') {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Acceso denegado. Solo puedes acceder a tus propios recursos.' 
        });
    }
    
    next();
};

export const isAdminOrOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'No hay usuario autenticado' 
        });
    }
    
    const resourceUserId = req.params.uid || req.params.userId;
    
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
        return next();
    }
    
    return res.status(403).json({ 
        status: 'error', 
        message: 'Acceso denegado. No tienes permisos para acceder a este recurso.' 
    });
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'No hay usuario autenticado' 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error', 
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}` 
            });
        }
        
        next();
    };
};

export const optionalAuth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
};
