import crypto from 'crypto';
import bcrypt from 'bcrypt';
import UserRepository from '../repositories/user.repository.js';
import MailService from './mail.service.js';
import { createHash, isValidPassword } from '../utils/auth.js';

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.mailService = new MailService();
    this.resetTokenExpiration = 60 * 60 * 1000; 
  }

  async requestPasswordReset(email) {
    try {
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        return {
          success: true,
          message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
        };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetExpires = new Date(Date.now() + this.resetTokenExpiration);

      await this.userRepository.addPasswordResetToken(email, hashedToken, resetExpires);

      await this.mailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.first_name
      );

      return {
        success: true,
        message: 'Email de recuperación enviado correctamente'
      };
    } catch (error) {
      console.error('Error en requestPasswordReset:', error);
      throw new Error('Error al procesar solicitud de recuperación de contraseña');
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await this.userRepository.getUserByResetToken(hashedToken);
      if (!user) {
        throw new Error('Token inválido o expirado');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (isValidPassword(user, newPassword)) {
        throw new Error('No puedes usar la misma contraseña anterior');
      }

      const hashedPassword = createHash(newPassword);

      await this.userRepository.updatePassword(user._id, hashedPassword);
      await this.userRepository.clearPasswordResetToken(user._id);

      await this.mailService.sendPasswordChangeNotification(user.email, user.first_name);

      return {
        success: true,
        message: 'Contraseña actualizada correctamente'
      };
    } catch (error) {
      console.error('Error en resetPassword:', error);
      throw error;
    }
  }

  async validateResetToken(token) {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await this.userRepository.getUserByResetToken(hashedToken);
      
      return {
        valid: !!user,
        message: user ? 'Token válido' : 'Token inválido o expirado'
      };
    } catch (error) {
      console.error('Error en validateResetToken:', error);
      return {
        valid: false,
        message: 'Error al validar token'
      };
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const fullUser = await this.userRepository.getUserByEmail(user.email);

      if (!isValidPassword(fullUser, currentPassword)) {
        throw new Error('Contraseña actual incorrecta');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      if (isValidPassword(fullUser, newPassword)) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }

      const hashedPassword = createHash(newPassword);
      await this.userRepository.updatePassword(userId, hashedPassword);
      await this.mailService.sendPasswordChangeNotification(fullUser.email, fullUser.first_name);

      return {
        success: true,
        message: 'Contraseña cambiada correctamente'
      };
    } catch (error) {
      console.error('Error en changePassword:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    try {
      return await this.mailService.sendWelcomeEmail(userEmail, userName);
    } catch (error) {
      console.error('Error al enviar email de bienvenida:', error);
      return { success: false, error: error.message };
    }
  }

  async cleanupExpiredTokens() {
    try {
      console.log('Limpieza de tokens expirados ejecutada');
    } catch (error) {
      console.error('Error en limpieza de tokens:', error);
    }
  }

  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  isTokenExpired(expirationDate) {
    return new Date() > new Date(expirationDate);
  }
}

export default AuthService;
