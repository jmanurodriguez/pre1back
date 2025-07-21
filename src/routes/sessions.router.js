import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { isValidEmail } from '../utils/auth.js';
import UserRepository from '../repositories/user.repository.js';
import AuthService from '../services/auth.service.js';

const router = Router();
const userRepository = new UserRepository();
const authService = new AuthService();
const handlePassportError = (err, req, res, next) => {
    if (err) {
        return res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
    next();
};

router.post('/register', async (req, res, next) => {
    passport.authenticate('register', { session: false }, async (err, user, info) => {
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

        try {
            await authService.sendWelcomeEmail(user.email, user.first_name);
        } catch (emailError) {
            console.error('Error enviando email de bienvenida:', emailError);
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

router.get('/current', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'No hay usuario autenticado' 
            });
        }

        // Usar UserRepository para obtener datos seguros del usuario
        const currentUserData = await userRepository.getCurrentUser(req.user);

        res.json({ 
            status: 'success', 
            message: 'Usuario autenticado',
            payload: currentUserData
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

// Ruta para solicitar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'El email es requerido'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Formato de email inválido'
            });
        }

        const result = await authService.requestPasswordReset(email);

        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para validar token de reset
router.get('/validate-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Token requerido'
            });
        }

        const validation = await authService.validateResetToken(token);

        if (!validation.valid) {
            return res.status(400).json({
                status: 'error',
                message: validation.message
            });
        }

        res.json({
            status: 'success',
            message: validation.message
        });
    } catch (error) {
        console.error('Error en validate-reset-token:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para restablecer contraseña con token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        const result = await authService.resetPassword(token, newPassword);

        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        console.error('Error en reset-password:', error);
        
        if (error.message.includes('Token inválido') || 
            error.message.includes('misma contraseña') ||
            error.message.includes('debe tener al menos')) {
            return res.status(400).json({
                status: 'error',
                message: error.message
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para cambiar contraseña (usuario autenticado)
router.post('/change-password', passport.authenticate('current', { session: false }), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }

        const result = await authService.changePassword(
            req.user._id,
            currentPassword,
            newPassword
        );

        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        console.error('Error en change-password:', error);
        
        if (error.message.includes('incorrecta') || 
            error.message.includes('diferente') ||
            error.message.includes('debe tener al menos')) {
            return res.status(400).json({
                status: 'error',
                message: error.message
            });
        }

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
