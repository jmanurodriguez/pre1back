import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CartManager {
    constructor() {
        this.path = path.join(__dirname, '../data/carts.json');
    }

    getCartById = async (cid) => {
        try {
            const cartsJson = await fs.promises.readFile(this.path, 'utf-8');
            const carts = JSON.parse(cartsJson);
            const cart = carts.find(cart => cart.id === parseInt(cid));
            
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
            
            return cart;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    addCart = async () => {
        try {
            const carts = await this.getCarts();
            const id = this.generateNewId(carts);
            const newCart = { id, products: [] };
            
            carts.push(newCart);
            await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 2));
            return newCart;
        } catch (error) {
            throw error;
        }
    }

    getCarts = async () => {
        try {
            const cartsJson = await fs.promises.readFile(this.path, 'utf-8');
            return JSON.parse(cartsJson);
        } catch (error) {
            if (error.code === 'ENOENT') {
                
                await fs.promises.writeFile(this.path, '[]');
                return [];
            }
            throw error;
        }
    }

    generateNewId = (carts) => {
        if (carts.length === 0) return 1;
        return Math.max(...carts.map(cart => cart.id)) + 1;
    }

    addProductInCartById = async (cid, product) => {
        try {
            const carts = await this.getCarts();
            const cartIndex = carts.findIndex(cart => cart.id === parseInt(cid));
            
            if (cartIndex === -1) {
                throw new Error('Carrito no encontrado');
            }

            const existingProductIndex = carts[cartIndex].products.findIndex(
                p => p.id === product.id
            );

            if (existingProductIndex !== -1) {
                carts[cartIndex].products[existingProductIndex].quantity += product.quantity;
            } else {
                carts[cartIndex].products.push(product);
            }

            await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 2));
            return carts[cartIndex];
        } catch (error) {
            throw error;
        }
    }
}

export default CartManager;