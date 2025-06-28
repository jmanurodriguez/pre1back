import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { isValidEmail } from '../utils/auth.js';

const router = Router();
const handlePassportError = (err, req, res, next) => {
    if (err) {
        return res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
    next();
};

router.post('/register', (req, res, next) => {
    passport.authenticate('register', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Error en registro:', err);
            return res.status(500).json({ 
                status: 'error', 
                message: 'Error interno del servidor' 
            });
        }
        
        if (!user) {
            return res.status(400).json({ 
                status: 'error', 
                message: info?.message || 'Error en el registro' 
            });
        }
        
        res.status(201).json({ 
            status: 'success', 
            message: 'Usuario registrado correctamente',
            payload: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                age: user.age,
                role: user.role
            }
        });
    })(req, res, next);
});

router.post('/login', (req, res, next) => {
    passport.authenticate('login', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ 
                status: 'error', 
                message: 'Error interno del servidor' 
            });
        }
        
        if (!user) {
            return res.status(401).json({ 
                status: 'error', 
                message: info?.message || 'Credenciales inválidas' 
            });
        }
        
        try {
            const tokenPayload = {
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            };
            
            const token = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.cookie('jwt', token, { 
                httpOnly: true, 
                maxAge: 24 * 60 * 60 * 1000, 
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'strict'
            });
            
            res.json({ 
                status: 'success', 
                message: 'Login exitoso',
                payload: {
                    id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    age: user.age,
                    role: user.role,
                    cart: user.cart
                },
                token: token
            });
        } catch (error) {
            console.error('Error generando JWT:', error);
            res.status(500).json({ 
                status: 'error', 
                message: 'Error interno del servidor' 
            });
        }
    })(req, res, next);
});

router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'No hay usuario autenticado' 
            });
        }

        res.json({ 
            status: 'success', 
            message: 'Usuario autenticado',
            payload: {
                id: req.user._id,
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                email: req.user.email,
                age: req.user.age,
                role: req.user.role,
                cart: req.user.cart,
                createdAt: req.user.createdAt,
                updatedAt: req.user.updatedAt
            }
        });
    } catch (error) {
        console.error('Error en /current:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
});

router.post('/logout', (req, res) => {
    try {
        res.clearCookie('jwt').json({ 
            status: 'success', 
            message: 'Logout exitoso' 
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
});

router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'No hay usuario autenticado' 
            });
        }

        res.json({ 
            status: 'success', 
            payload: req.user
        });
    } catch (error) {
        console.error('Error en /profile:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
});

router.use('*', (req, res) => {
    res.status(404).json({ 
        status: 'error', 
        message: 'Ruta no encontrada' 
    });
});

router.use(handlePassportError);

export default router;
