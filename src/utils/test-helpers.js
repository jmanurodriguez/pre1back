import MailService from '../services/mail.service.js';
import AuthService from '../services/auth.service.js';
import ProductRepository from '../repositories/product.repository.js';
import CartRepository from '../repositories/cart.repository.js';
import TicketRepository from '../repositories/ticket.repository.js';
import UserRepository from '../repositories/user.repository.js';

const testServices = async () => {
    console.log('🧪 Iniciando pruebas de servicios...\n');

    const mailService = new MailService();
    const authService = new AuthService();
    const productRepository = new ProductRepository();
    const cartRepository = new CartRepository();
    const ticketRepository = new TicketRepository();
    const userRepository = new UserRepository();

    try {
        console.log('1. 📧 Probando conexión de email...');
        const emailTest = await mailService.testConnection();
        console.log(emailTest ? '✅ Email configurado correctamente' : '❌ Error en configuración de email');

        console.log('\n2. 🛍️ Probando ProductRepository...');
        const categories = await productRepository.getCategories();
        console.log(`✅ Categorías obtenidas: ${categories.length}`);

        console.log('\n3. 🛒 Probando CartRepository...');
        const newCart = await cartRepository.createCart();
        console.log(`✅ Carrito creado: ${newCart.id}`);

        console.log('\n4. 🎫 Probando TicketRepository...');
        const stats = await ticketRepository.getTicketStats();
        console.log(`✅ Estadísticas de tickets obtenidas`);

        console.log('\n5. 👤 Probando UserRepository...');
        const users = await userRepository.getAllUsers({ limit: 1 });
        console.log(`✅ Usuarios obtenidos: ${users.users.length}`);

        console.log('\n🎉 Todas las pruebas completadas exitosamente!');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    }
};

const testEmailTemplates = async () => {
    console.log('📧 Probando templates de email...\n');
    
    const mailService = new MailService();
    
    const mockUser = 'test@example.com';
    const mockUserName = 'Usuario Test';
    const mockToken = 'abc123def456';
    
    const mockTicket = {
        code: 'TICKET-001',
        purchase_datetime: new Date(),
        amount: 150.50,
        products: [
            { title: 'Producto 1', quantity: 2, price: 50.25, subtotal: 100.50 },
            { title: 'Producto 2', quantity: 1, price: 50.00, subtotal: 50.00 }
        ],
        status: 'completed'
    };

    try {
        console.log('1. Template de recuperación de contraseña');
        const resetTemplate = mailService.getPasswordResetTemplate(
            mockUserName, 
            `http://localhost:8080/reset-password?token=${mockToken}`, 
            mockToken
        );
        console.log('✅ Template de reset generado');

        console.log('2. Template de bienvenida');
        const welcomeTemplate = mailService.getWelcomeTemplate(mockUserName);
        console.log('✅ Template de bienvenida generado');

        console.log('3. Template de confirmación de compra');
        const purchaseTemplate = mailService.getPurchaseConfirmationTemplate(mockUserName, mockTicket);
        console.log('✅ Template de confirmación generado');

        console.log('4. Template de cambio de contraseña');
        const changeTemplate = mailService.getPasswordChangeTemplate(mockUserName);
        console.log('✅ Template de cambio generado');

        console.log('\n🎉 Todos los templates generados correctamente!');

    } catch (error) {
        console.error('❌ Error generando templates:', error.message);
    }
};

const displayNewEndpoints = () => {
    console.log('\n🚀 NUEVOS ENDPOINTS DISPONIBLES:\n');
    
    console.log('📧 AUTENTICACIÓN Y RECUPERACIÓN:');
    console.log('- POST /api/sessions/forgot-password');
    console.log('- GET  /api/sessions/validate-reset-token/:token');
    console.log('- POST /api/sessions/reset-password');
    console.log('- POST /api/sessions/change-password');
    
    console.log('\n🛍️ PRODUCTOS (Solo Admin):');
    console.log('- GET  /api/products/categories');
    console.log('- PATCH /api/products/:pid/stock');
    
    console.log('\n🛒 CARRITOS (Solo Usuario):');
    console.log('- POST /api/carts/:cid/purchase');
    console.log('- GET  /api/carts/:cid/summary');
    console.log('- POST /api/carts/:cid/validate');
    console.log('- DELETE /api/carts/:cid/invalid-products');
    
    console.log('\n🎫 TICKETS:');
    console.log('- GET  /api/tickets');
    console.log('- GET  /api/tickets/stats');
    console.log('- GET  /api/tickets/my-summary');
    console.log('- GET  /api/tickets/:id');
    console.log('- GET  /api/tickets/code/:code');
    console.log('- GET  /api/tickets/:id/receipt');
    console.log('- PATCH /api/tickets/:id/status');
    console.log('- DELETE /api/tickets/:id');
    console.log('- GET  /api/tickets/date-range/:startDate/:endDate');
    
    console.log('\n🔐 MIDDLEWARES IMPLEMENTADOS:');
    console.log('- authenticateCurrent (estrategia "current")');
    console.log('- adminOnlyProducts (solo admin para productos)');
    console.log('- userOnlyCart (solo usuario para carrito)');
    console.log('- isOwnCart (verificación de propiedad)');
    
    console.log('\n📁 ARQUITECTURA IMPLEMENTADA:');
    console.log('- Patrón Repository completo');
    console.log('- DAOs para acceso a datos');
    console.log('- DTOs para transferencia segura');
    console.log('- Sistema de mailing con NodeMailer');
    console.log('- Recuperación de contraseña');
    console.log('- Lógica de compra completa');
    console.log('- Verificación de stock');
    console.log('- Generación automática de tickets');
};

export { testServices, testEmailTemplates, displayNewEndpoints };
