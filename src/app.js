import express from 'express';
import ProductManager from './managers/ProductManager.js';
import CartManager from './managers/CartManager.js';

const app = express();
app.use(express.json());

const productManager = new ProductManager();
const cartManager = new CartManager();


app.get('/api/products', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.status(200).json({ products, message: "Lista de productos" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:pid', async (req, res) => {
    try {
        const product = await productManager.getProductById(parseInt(req.params.pid));
        res.status(200).json({ product, message: "Producto encontrado" });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = await productManager.addProduct(req.body);
        res.status(201).json({ product: newProduct, message: "Producto creado exitosamente" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/products/:pid', async (req, res) => {
    try {
        const updatedProduct = await productManager.updateProduct(parseInt(req.params.pid), req.body);
        res.status(200).json({ product: updatedProduct, message: "Producto actualizado exitosamente" });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.delete('/api/products/:pid', async (req, res) => {
    try {
        await productManager.deleteProduct(parseInt(req.params.pid));
        res.status(200).json({ message: "Producto eliminado exitosamente" });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.post('/api/carts', async (req, res) => {
    try {
        const carts = await cartManager.addCart();
        res.status(201).json({ carts, message: "Nuevo carrito creado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/carts/:cid', async (req, res) => {
    try {
        const cid = parseInt(req.params.cid);
        const products = await cartManager.getProductsInCartById(cid);
        res.status(200).json({ products, message: "Lista de productos" });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.post('/api/carts/:cid/product/:pid', async (req, res) => {
    try {
        const cid = parseInt(req.params.cid);
        const pid = parseInt(req.params.pid);
        const quantity = req.body.quantity || 1;

        const carts = await cartManager.addProductInCart(cid, pid, quantity);
        res.status(200).json({ carts, message: "Nuevo producto añadido" });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log('Servidor iniciado en el puerto 8080');
});

process.on('SIGINT', () => {
    console.log('\nCerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nCerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
}); 