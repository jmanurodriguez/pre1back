import bcrypt from 'bcrypt';

export const createHash = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};


export const isValidPassword = (user, password) => {
    return bcrypt.compareSync(password, user.password);
};

export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, message: 'La contraseña es requerida' };
    }
    
    if (password.length < 6) {
        return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }
    
    if (password.length > 50) {
        return { isValid: false, message: 'La contraseña no puede tener más de 50 caracteres' };
    }
    
    return { isValid: true, message: 'Contraseña válida' };
};
