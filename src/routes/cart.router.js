import { Router } from 'express';
import CartRepository from '../repositories/cart.repository.js';
import TicketRepository from '../repositories/ticket.repository.js';
import ProductRepository from '../repositories/product.repository.js';
import MailService from '../services/mail.service.js';
import { authenticateCurrent, userOnlyCart, isOwnCart, isAdmin } from '../middlewares/auth.js';

const router = Router();
const cartRepository = new CartRepository();
const ticketRepository = new TicketRepository();
const productRepository = new ProductRepository();
const mailService = new MailService();

router.post('/', authenticateCurrent, isAdmin, async (req, res) => {
    try {
        const newCart = await cartRepository.createCart();
        res.status(201).json({ 
            status: 'success', 
            payload: newCart,
            message: 'Carrito creado correctamente'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.get('/:cid', authenticateCurrent, isOwnCart, async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await cartRepository.getCartById(cid);
        
        res.json({ 
            status: 'success', 
            payload: cart 
        });
    } catch (error) {
        if (error.message === 'Carrito no encontrado') {
            return res.status(404).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.post('/:cid/products/:pid', authenticateCurrent, userOnlyCart, isOwnCart, async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity = 1 } = req.body;

        if (!quantity || quantity <= 0 || !Number.isInteger(Number(quantity))) {
            return res.status(400).json({
                status: 'error',
                message: 'La cantidad debe ser un número entero positivo'
            });
        }

        const result = await cartRepository.addProductToCart(cid, pid, Number(quantity));
        
        res.json({ 
            status: 'success', 
            payload: result 
        });
    } catch (error) {
        if (error.message.includes('no encontrado') ||
            error.message.includes('no disponible') ||
            error.message.includes('Stock insuficiente')) {
            return res.status(400).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.delete('/:cid/products/:pid', authenticateCurrent, userOnlyCart, isOwnCart, async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const result = await cartRepository.removeProductFromCart(cid, pid);
        
        res.json({ 
            status: 'success', 
            payload: result 
        });
    } catch (error) {
        if (error.message === 'Carrito no encontrado') {
            return res.status(404).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.put('/:cid/products/:pid', authenticateCurrent, userOnlyCart, isOwnCart, async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity <= 0 || !Number.isInteger(Number(quantity))) {
            return res.status(400).json({
                status: 'error',
                message: 'La cantidad debe ser un número entero positivo'
            });
        }

        const result = await cartRepository.updateProductQuantity(cid, pid, Number(quantity));
        
        res.json({ 
            status: 'success', 
            payload: result 
        });
    } catch (error) {
        if (error.message.includes('no encontrado') ||
            error.message.includes('Stock insuficiente')) {
            return res.status(400).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.delete('/:cid', authenticateCurrent, userOnlyCart, isOwnCart, async (req, res) => {
    try {
        const { cid } = req.params;
        const result = await cartRepository.clearCart(cid);
        
        res.json({ 
            status: 'success', 
            payload: result 
        });
    } catch (error) {
        if (error.message === 'Carrito no encontrado') {
            return res.status(404).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.post('/:cid/purchase', authenticateCurrent, userOnlyCart, isOwnCart, async (req, res) => {
    try {
        const { cid } = req.params;
        const userEmail = req.user.email;
        const userName = req.user.first_name;

        const validation = await cartRepository.validateCartForCheckout(cid);
        
        if (!validation.valid) {
            return res.status(400).json({
                status: 'error',
                message: validation.message,
                payload: {
                    cart: validation.cart,
                    validProducts: validation.validProducts || [],
                    invalidProducts: validation.invalidProducts || []
                }
            });
        }

        const purchaseResult = await cartRepository.processCartForPurchase(cid);
        
        if (purchaseResult.validProducts.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No hay productos válidos para procesar la compra'
            });
        }

        for (const item of purchaseResult.validProducts) {
            await productRepository.decrementStock(item.product, item.quantity);
        }

        const ticket = await ticketRepository.processCartPurchase(
            purchaseResult.validProducts, 
            userEmail
        );

        await cartRepository.clearCart(cid);

        try {
            await mailService.sendPurchaseConfirmation(userEmail, userName, ticket);
        } catch (emailError) {
            console.error('Error enviando email de confirmación:', emailError);
        }

        const response = {
            status: 'success',
            message: purchaseResult.message,
            payload: {
                ticket,
                purchasedProducts: purchaseResult.validProducts
            }
        };

        if (purchaseResult.failedProducts.length > 0) {
            response.payload.failedProducts = purchaseResult.failedProducts;
            response.message = 'Compra procesada parcialmente. Algunos productos no estaban disponibles.';
        }

        res.status(201).json(response);
    } catch (error) {
        console.error('Error en purchase:', error);
        if (error.message === 'Carrito no encontrado' ||
            error.message.includes('productos válidos')) {
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

router.get('/:cid/summary', authenticateCurrent, isOwnCart, async (req, res) => {
    try {
        const { cid } = req.params;
        const summary = await cartRepository.getCartSummary(cid);
        
        res.json({ 
            status: 'success', 
            payload: summary 
        });
    } catch (error) {
        if (error.message === 'Carrito no encontrado') {
            return res.status(404).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.post('/:cid/validate', authenticateCurrent, isOwnCart, async (req, res) => {
    try {
        const { cid } = req.params;
        const validation = await cartRepository.validateCartForCheckout(cid);
        
        res.json({ 
            status: 'success', 
            payload: validation 
        });
    } catch (error) {
        if (error.message === 'Carrito no encontrado') {
            return res.status(404).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.delete('/:cid/invalid-products', authenticateCurrent, userOnlyCart, isOwnCart, async (req, res) => {
    try {
        const { cid } = req.params;
        const result = await cartRepository.removeInvalidProducts(cid);
        
        res.json({ 
            status: 'success', 
            payload: result 
        });
    } catch (error) {
        if (error.message === 'Carrito no encontrado') {
            return res.status(404).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

export default router;