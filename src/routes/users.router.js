import { Router } from 'express';
import passport from 'passport';
import User from '../models/user.model.js';
import { createHash, validatePassword, isValidEmail } from '../utils/auth.js';

const router = Router();

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'No hay usuario autenticado' 
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Acceso denegado. Se requieren permisos de administrador' 
        });
    }
    
    next();
};

router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort } = req.query;
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            lean: true,
            populate: 'cart'
        };
        
        if (sort) {
            options.sort = sort === 'asc' ? { createdAt: 1 } : { createdAt: -1 };
        }
        
        const result = await User.paginate({}, options);
        
        res.json({
            status: 'success',
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/api/users?page=${result.prevPage}&limit=${limit}` : null,
            nextLink: result.hasNextPage ? `/api/users?page=${result.nextPage}&limit=${limit}` : null
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
});

router.get('/:uid', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
    try {
        const { uid } = req.params;
        
        const user = await User.findById(uid).populate('cart');
        
        if (!user) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Usuario no encontrado' 
            });
        }
        
        res.json({ 
            status: 'success', 
            payload: user 
        });
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
});

    router.put('/:uid', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
    try {
        const { uid } = req.params;
        const { first_name, last_name, email, age, role, password } = req.body;
        
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Usuario no encontrado' 
            });
        }
        
        if (email && email !== user.email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'El formato del email no es válido' 
                });
            }
            
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Ya existe un usuario con este email' 
                });
            }
        }
        
        if (password) {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: passwordValidation.message 
                });
            }
        }
        
        if (age && (age < 0 || age > 120)) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'La edad debe estar entre 0 y 120 años' 
            });
        }
        
        const updateData = {};
        if (first_name) updateData.first_name = first_name.trim();
        if (last_name) updateData.last_name = last_name.trim();
        if (email) updateData.email = email.toLowerCase();
        if (age !== undefined) updateData.age = parseInt(age);
        if (role && ['user', 'admin'].includes(role)) updateData.role = role;
        if (password) updateData.password = createHash(password);
        
        const updatedUser = await User.findByIdAndUpdate(
            uid, 
            updateData, 
            { new: true, runValidators: true }
        ).populate('cart');
        
        res.json({ 
            status: 'success', 
            message: 'Usuario actualizado correctamente',
            payload: updatedUser 
        });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
});

router.delete('/:uid', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
    try {
        const { uid } = req.params;      
        if (uid === req.user._id.toString()) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'No puedes eliminar tu propia cuenta' 
            });
        }
        
        const deletedUser = await User.findByIdAndDelete(uid);
        
        if (!deletedUser) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Usuario no encontrado' 
            });
        }
        
        res.json({ 
            status: 'success', 
            message: 'Usuario eliminado correctamente',
            payload: deletedUser
        });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
});

export default router;
