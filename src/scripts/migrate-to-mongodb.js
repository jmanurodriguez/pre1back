import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import Product from '../models/product.model.js';
import Cart from '../models/cart.model.js';
import mongoose from 'mongoose';
import { connect } from 'http2';

const connectMongoDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://proyecto-final:finalpass@final.plkc1to.mongodb.net/myEcommerce?retryWrites=true&w=majority&appName=Final");
        console.log('Conexión a MongoDB establecida con éxito');
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        throw error;
    }
};

connectMongoDB();
// Configuración de rutas para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.join(__dirname, '..', 'data', 'products.json');
const cartsFilePath = path.join(__dirname, '..', 'data', 'carts.json');

async function migrateProducts() {
    try {
        // Leer productos desde el archivo JSON
        const productsData = await fs.readFile(productsFilePath, 'utf-8');
        const products = JSON.parse(productsData);

        console.log(`Encontrados ${products.length} productos para migrar`);

        // Eliminar todos los productos existentes en MongoDB (opcional)
        await Product.deleteMany({});
        
        // Insertar productos en MongoDB
        // Modificar los IDs para que sean compatibles con MongoDB
        const productsToInsert = products.map(product => {
            const { id, ...productData } = product;
            return productData;
        });
        
        await Product.insertMany(productsToInsert);
        
        console.log(`${productsToInsert.length} productos migrados exitosamente a MongoDB`);
        
        
        const insertedProducts = await Product.find();
        return insertedProducts;
    } catch (error) {
        console.error('Error al migrar productos:', error);
        throw error;
    }
}

async function migrateCart(insertedProducts) {
    try {
        
        const cartsData = await fs.readFile(cartsFilePath, 'utf-8');
        const carts = JSON.parse(cartsData);
        
        console.log(`Encontrados ${carts.length} carritos para migrar`);
        
        // Eliminar todos los carritos existentes en MongoDB (opcional)
        await Cart.deleteMany({});
        
        // Crear un mapeo de IDs de productos antiguos a nuevos IDs de MongoDB
        const productsMap = {};
        insertedProducts.forEach(product => {
            // Asumimos que el código es único y puede usarse para mapear
            productsMap[product.code] = product._id.toString();
        });
        
        // Insertar carritos en MongoDB transformando las referencias de productos
        for (const cart of carts) {
            const newCart = new Cart({
                products: []
            });
            
            // Si hay productos en el carrito, intentamos mapearlos
            if (cart.products && cart.products.length > 0) {
                for (const item of cart.products) {
                    // Buscar el producto por su ID original en la lista de productos insertados
                    const productInMongo = await Product.findOne({ code: item.id });
                    
                    if (productInMongo) {
                        newCart.products.push({
                            product: productInMongo._id,
                            quantity: item.quantity
                        });
                    } else {
                        console.warn(`Producto con ID ${item.id} no encontrado para el carrito`);
                    }
                }
            }
            
            await newCart.save();
        }
        
        console.log(`${carts.length} carritos migrados exitosamente a MongoDB`);
    } catch (error) {
        console.error('Error al migrar carritos:', error);
        throw error;
    }
}

async function migrate() {
    try {
        // Conectar a la base de datos
        await connectDB();
        
        // Migrar productos primero
        const insertedProducts = await migrateProducts();
        
        // Luego migrar carritos
        await migrateCart(insertedProducts);
        
        console.log('Migración completada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
}

// Ejecutar el script de migración
migrate();