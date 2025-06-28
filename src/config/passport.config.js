import passport from 'passport';
import local from 'passport-local';
import jwt from 'passport-jwt';
import User from '../models/user.model.js';
import Cart from '../models/cart.model.js';
import { createHash, isValidPassword, isValidEmail, validatePassword } from '../utils/auth.js';

const LocalStrategy = local.Strategy;
const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;

const initializePassport = () => {
    passport.use('register', new LocalStrategy(
        { 
            passReqToCallback: true, 
            usernameField: 'email',
            passwordField: 'password'
        },
        async (req, username, password, done) => {
            const { first_name, last_name, email, age } = req.body;
            
            try {
                if (!first_name || !last_name || !email || !password) {
                    return done(null, false, { message: 'Todos los campos son obligatorios' });
                }

                if (!isValidEmail(email)) {
                    return done(null, false, { message: 'El formato del email no es válido' });
                }

                const passwordValidation = validatePassword(password);
                if (!passwordValidation.isValid) {
                    return done(null, false, { message: passwordValidation.message });
                }

                if (age && (age < 0 || age > 120)) {
                    return done(null, false, { message: 'La edad debe estar entre 0 y 120 años' });
                }

                const existingUser = await User.findOne({ email: email.toLowerCase() });
                if (existingUser) {
                    return done(null, false, { message: 'Ya existe un usuario con este email' });
                }

                const newCart = new Cart({ products: [] });
                const savedCart = await newCart.save();

                const newUser = {
                    first_name: first_name.trim(),
                    last_name: last_name.trim(),
                    email: email.toLowerCase(),
                    age: age ? parseInt(age) : undefined,
                    password: createHash(password),
                    cart: savedCart._id
                };

                const result = await User.create(newUser);
                console.log(`Usuario registrado exitosamente: ${result.email}`);
                
                return done(null, result);
            } catch (error) {
                console.error('Error en registro:', error);
                return done(error);
            }
        }
    ));

    passport.use('login', new LocalStrategy(
        { 
            usernameField: 'email',
            passwordField: 'password'
        },
        async (username, password, done) => {
            try {
                if (!username || !password) {
                    return done(null, false, { message: 'Email y contraseña son requeridos' });
                }

                if (!isValidEmail(username)) {
                    return done(null, false, { message: 'El formato del email no es válido' });
                }

                const user = await User.findOne({ email: username.toLowerCase() }).populate('cart');
                if (!user) {
                    return done(null, false, { message: 'Email o contraseña incorrectos' });
                }

                if (!isValidPassword(user, password)) {
                    return done(null, false, { message: 'Email o contraseña incorrectos' });
                }

                console.log(`Login exitoso para usuario: ${user.email}`);
                return done(null, user);
            } catch (error) {
                console.error('Error en login:', error);
                return done(error);
            }
        }
    ));

    passport.use('jwt', new JWTStrategy(
        {
            jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor, ExtractJWT.fromAuthHeaderAsBearerToken()]),
            secretOrKey: process.env.JWT_SECRET
        },
        async (jwt_payload, done) => {
            try {
                if (!jwt_payload.user || !jwt_payload.user._id) {
                    return done(null, false);
                }

                const user = await User.findById(jwt_payload.user._id).populate('cart');
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (error) {
                console.error('Error en JWT strategy:', error);
                return done(error);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id).populate('cart');
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};

const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
};

export default initializePassport;
