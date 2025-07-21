import crypto from 'crypto';
import bcrypt from 'bcrypt';
import UserRepository from '../repositories/user.repository.js';
import MailService from './mail.service.js';
import { createHash, isValidPassword } from '../utils/auth.js';

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.mailService = new MailService();
    this.resetTokenExpiration = 60 * 60 * 1000; // 1 hora en milisegundos
  }

  async requestPasswordReset(email) {
    try {
      // Buscar usuario por email
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return {
          success: true,
          message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
        };
      }

      // Generar token de reset seguro
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetExpires = new Date(Date.now() + this.resetTokenExpiration);

      // Guardar token en la base de datos
      await this.userRepository.addPasswordResetToken(email, hashedToken, resetExpires);

      // Enviar email de recuperación
      await this.mailService.sendPasswordResetEmail(
        user.email,
        resetToken, // Enviamos el token sin hashear
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
      // Hashear el token recibido para comparar con el de la BD
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Buscar usuario por token válido
      const user = await this.userRepository.getUserByResetToken(hashedToken);
      if (!user) {
        throw new Error('Token inválido o expirado');
      }

      // Validar nueva contraseña
      if (!newPassword || newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Verificar que no sea la misma contraseña anterior
      if (isValidPassword(user, newPassword)) {
        throw new Error('No puedes usar la misma contraseña anterior');
      }

      // Hashear nueva contraseña
      const hashedPassword = createHash(newPassword);

      // Actualizar contraseña y limpiar token
      await this.userRepository.updatePassword(user._id, hashedPassword);
      await this.userRepository.clearPasswordResetToken(user._id);

      // Enviar notificación de cambio de contraseña
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
      // Obtener usuario actual
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Buscar usuario completo para verificar contraseña
      const fullUser = await this.userRepository.getUserByEmail(user.email);

      // Verificar contraseña actual
      if (!isValidPassword(fullUser, currentPassword)) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Validar nueva contraseña
      if (!newPassword || newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      // Verificar que no sea la misma contraseña
      if (isValidPassword(fullUser, newPassword)) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }

      // Hashear nueva contraseña
      const hashedPassword = createHash(newPassword);

      // Actualizar contraseña
      await this.userRepository.updatePassword(userId, hashedPassword);

      // Enviar notificación
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
      // No lanzar error para no interrumpir el flujo de registro
      return { success: false, error: error.message };
    }
  }

  async cleanupExpiredTokens() {
    try {
      // Esta función podría ejecutarse periódicamente para limpiar tokens expirados
      // Por ahora, los tokens se validan por fecha en la consulta
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
