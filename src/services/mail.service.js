import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: process.env.MAIL_PORT || 587,
      secure: false, // true para puerto 465, false para otros puertos
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendPasswordResetEmail(userEmail, resetToken, userName) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'E-commerce'}" <${process.env.MAIL_USER}>`,
        to: userEmail,
        subject: 'Recuperación de Contraseña - E-commerce',
        html: this.getPasswordResetTemplate(userName, resetUrl, resetToken)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de recuperación enviado:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email de recuperación enviado correctamente'
      };
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      throw new Error(`Error al enviar email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    try {
      const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'E-commerce'}" <${process.env.MAIL_USER}>`,
        to: userEmail,
        subject: '¡Bienvenido a nuestro E-commerce!',
        html: this.getWelcomeTemplate(userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de bienvenida enviado:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error al enviar email de bienvenida:', error);
      // No lanzar error para no interrumpir el registro
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendPurchaseConfirmation(userEmail, userName, ticket) {
    try {
      const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'E-commerce'}" <${process.env.MAIL_USER}>`,
        to: userEmail,
        subject: `Confirmación de Compra - Ticket #${ticket.code}`,
        html: this.getPurchaseConfirmationTemplate(userName, ticket)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de confirmación de compra enviado:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error al enviar email de confirmación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendPasswordChangeNotification(userEmail, userName) {
    try {
      const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'E-commerce'}" <${process.env.MAIL_USER}>`,
        to: userEmail,
        subject: 'Contraseña Cambiada - E-commerce',
        html: this.getPasswordChangeTemplate(userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de cambio de contraseña enviado:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error al enviar notificación de cambio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Template para email de recuperación de contraseña
  getPasswordResetTemplate(userName, resetUrl, token) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Recuperación de Contraseña</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #218838; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Recuperación de Contraseña</h1>
            </div>
            <div class="content">
                <h2>Hola ${userName},</h2>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Este enlace expirará en <strong>1 hora</strong></li>
                        <li>Solo puedes usar este enlace una vez</li>
                        <li>No podrás usar tu contraseña anterior</li>
                    </ul>
                </div>
                
                <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 3px;">${resetUrl}</p>
                
                <p><strong>Código de verificación:</strong> <code>${token}</code></p>
                
                <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
            </div>
            <div class="footer">
                <p>Este es un email automático, por favor no respondas.</p>
                <p>&copy; ${new Date().getFullYear()} E-commerce. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  // Template para email de bienvenida
  getWelcomeTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>¡Bienvenido!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Bienvenido a nuestro E-commerce!</h1>
            </div>
            <div class="content">
                <h2>Hola ${userName},</h2>
                <p>¡Gracias por registrarte en nuestro e-commerce! Tu cuenta ha sido creada exitosamente.</p>
                <p>Ahora puedes:</p>
                <ul>
                    <li>Explorar nuestros productos</li>
                    <li>Agregar artículos a tu carrito</li>
                    <li>Realizar compras seguras</li>
                    <li>Gestionar tu perfil</li>
                </ul>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}" class="button">Comenzar a Comprar</a>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} E-commerce. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  // Template para confirmación de compra
  getPurchaseConfirmationTemplate(userName, ticket) {
    const productsHtml = ticket.products.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.subtotal}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Confirmación de Compra</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #007bff; color: white; padding: 10px; text-align: left; }
            .total { background: #e9ecef; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Compra Confirmada!</h1>
            </div>
            <div class="content">
                <h2>Hola ${userName},</h2>
                <p>Tu compra ha sido procesada exitosamente. Aquí están los detalles:</p>
                
                <div class="ticket-info">
                    <p><strong>Número de Ticket:</strong> ${ticket.code}</p>
                    <p><strong>Fecha:</strong> ${new Date(ticket.purchase_datetime).toLocaleString('es-ES')}</p>
                    <p><strong>Estado:</strong> ${ticket.status}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productsHtml}
                        <tr class="total">
                            <td colspan="3" style="padding: 10px; text-align: right;">Total:</td>
                            <td style="padding: 10px; text-align: right;">$${ticket.amount}</td>
                        </tr>
                    </tbody>
                </table>
                
                <p>Recibirás una notificación cuando tu pedido sea procesado.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} E-commerce. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  // Template para notificación de cambio de contraseña
  getPasswordChangeTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Contraseña Cambiada</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Contraseña Actualizada</h1>
            </div>
            <div class="content">
                <h2>Hola ${userName},</h2>
                <p>Tu contraseña ha sido cambiada exitosamente.</p>
                <p><strong>Fecha del cambio:</strong> ${new Date().toLocaleString('es-ES')}</p>
                <p>Si no realizaste este cambio, contacta inmediatamente con nuestro soporte.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} E-commerce. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Conexión de email configurada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de email:', error.message);
      return false;
    }
  }
}

export default MailService;
