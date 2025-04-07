import fs from 'fs';

class CartManager {
    constructor() {
        this.path = './src/data/carts.json';
    }

    getCarts = async () => {
        try {
            const cartsJson = await fs.promises.readFile(this.path, 'utf-8');
            return JSON.parse(cartsJson);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    generateNewId = (carts) => {
        if (carts.length > 0) {
            return carts[carts.length - 1].id + 1;
        } else {
            return 1;
        }
    }

    addCart = async () => {
        const cartsJson = await fs.promises.readFile(this.path, 'utf-8');
        const carts = JSON.parse(cartsJson);

        const id = this.generateNewId(carts);
        carts.push({ id, products: [] });

        await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 2), 'utf-8');
        return carts;
    }

    getProductsInCartById = async (cid) => {
        const cartsJson = await fs.promises.readFile(this.path, 'utf-8');
        const carts = JSON.parse(cartsJson);

        const cart = carts.find(cartData => cartData.id == cid);
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }
        return cart.products;
    }

    addProductInCart = async (cid, pid, quantity) => {
        const cartsJson = await fs.promises.readFile(this.path, 'utf-8');
        const carts = JSON.parse(cartsJson);

        const cartIndex = carts.findIndex(cart => cart.id === cid);
        if (cartIndex === -1) {
            throw new Error('Carrito no encontrado');
        }

        const cart = carts[cartIndex];
        const existingProductIndex = cart.products.findIndex(p => p.product === pid);

        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += quantity;
        } else {
            cart.products.push({ product: pid, quantity });
        }

        await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 2), 'utf-8');
        return carts;
    }
}

export default CartManager; 