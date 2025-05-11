import { Router } from 'express';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const newCart = new Cart({ products: [] });
        await newCart.save();
        res.status(201).json({ status: 'success', payload: newCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate('products.product');
        
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado` });
        }
        
        res.json({ status: 'success', payload: cart.products });
    } catch (error) {
        res.status(404).json({ status: 'error', message: error.message });
    }
});

router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity = 1 } = req.body;

        const product = await Product.findById(pid);
        if (!product) {
            return res.status(404).json({ status: 'error', message: `Producto con ID ${pid} no encontrado` });
        }

        const cart = await Cart.findById(cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado` });
        }

        const productIndex = cart.products.findIndex(
            item => item.product.toString() === pid
        );
        
        if (productIndex !== -1) {
            
            cart.products[productIndex].quantity += quantity;
        } else {
            
            cart.products.push({ product: pid, quantity });
        }
        
        await cart.save();
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        
        const cart = await Cart.findById(cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado` });
        }

        cart.products = cart.products.filter(
            item => item.product.toString() !== pid
        );
        
        await cart.save();
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.put('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;
        
        if (!Array.isArray(products)) {
            return res.status(400).json({ status: 'error', message: 'Products debe ser un array' });
        }
        
        const cart = await Cart.findById(cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado` });
        }

        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ status: 'error', message: `Producto con ID ${item.product} no encontrado` });
            }
        }
        
        cart.products = products;
        await cart.save();
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
            return res.status(400).json({ status: 'error', message: 'La cantidad debe ser un número entero positivo' });
        }
        
        const cart = await Cart.findById(cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado` });
        }
        
        const productIndex = cart.products.findIndex(
            item => item.product.toString() === pid
        );
        
        if (productIndex === -1) {
            return res.status(404).json({ status: 'error', message: `Producto con ID ${pid} no encontrado en el carrito` });
        }
        
        cart.products[productIndex].quantity = quantity;
        await cart.save();
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        
        const cart = await Cart.findById(cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado` });
        }
        
        cart.products = [];
        await cart.save();
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default router;