import express from 'express';
import { Server } from 'socket.io';
import handlebars from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import productsRouter from './routes/products.router.js';
import cartRouter from './routes/cart.router.js';
import viewsRouter from './routes/views.router.js';
import Product from './models/product.model.js';
import connectDB from './config/database.js';
import { registerHandlebarsHelpers, multiply, calculateTotal, eq, range } from './utils/handlebars-helpers.js';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const hbs = handlebars.create({
    helpers: {
        multiply,
        calculateTotal,
        eq,
        range
    }
});

registerHandlebarsHelpers(hbs);

app.engine('handlebars', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, 'public')));

connectDB();

app.use('/api/products', productsRouter);
app.use('/api/carts', cartRouter);
app.use('/', viewsRouter);

const httpServer = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

const io = new Server(httpServer);

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    Product.paginate({}, { page: 1, limit: 100, lean: true })
        .then(result => {
            socket.emit('products', result.docs);
        }).catch(error => {
            console.error("Error al obtener productos:", error);
        });

    socket.on('newProduct', async (productData) => {
        try {
            
            if (!productData.title || !productData.description || !productData.code || 
                !productData.price || !productData.stock || !productData.category) {
                socket.emit('error', { message: 'Todos los campos son obligatorios' });
                return;
            }

            const existingProduct = await Product.findOne({ code: productData.code });
            if (existingProduct) {
                socket.emit('error', { message: `Ya existe un producto con el código ${productData.code}` });
                return;
            }

            const newProduct = new Product({
                title: productData.title,
                description: productData.description,
                code: productData.code,
                price: productData.price,
                status: productData.status ?? true,
                stock: productData.stock,
                category: productData.category,
                thumbnails: productData.thumbnails ?? []
            });

            await newProduct.save();

            const result = await Product.paginate({}, { page: 1, limit: 100, lean: true });

            io.emit('products', result.docs);
        } catch (error) {
            console.error("Error al agregar producto:", error);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('deleteProduct', async (id) => {
        try {
            const deletedProduct = await Product.findByIdAndDelete(id);
            
            if (!deletedProduct) {
                socket.emit('error', { message: 'Producto no encontrado' });
                return;
            }

            const result = await Product.paginate({}, { page: 1, limit: 100, lean: true });

            io.emit('products', result.docs);
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            socket.emit('error', { message: error.message });
        }
    });
});

export default app;