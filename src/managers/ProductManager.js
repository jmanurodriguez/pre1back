import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ProductManager {
    constructor() {
        this.path = path.join(__dirname, '../data/products.json');
    }

    getProducts = async () => {
        try {
            const productsJSON = await fs.promises.readFile(this.path, 'utf-8');
            return JSON.parse(productsJSON);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Si el archivo no existe, lo creamos con un array vacío
                await fs.promises.writeFile(this.path, '[]');
                return [];
            }
            throw error;
        }
    }

    getProductById = async (pid) => {
        try {
            const products = await this.getProducts();
            const product = products.find(p => p.id === parseInt(pid));
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            return product;
        } catch (error) {
            throw error;
        }
    }

    addProduct = async (productData) => {
        try {
            const { title, description, code, price, status, stock, category, thumbnails } = productData;

            if (!title || !description || !code || !price || !stock || !category) {
                throw new Error('Todos los campos son obligatorios');
            }

            const products = await this.getProducts();
            const id = products.length > 0 
                ? Math.max(...products.map(p => p.id)) + 1 
                : 1;

            const product = {
                id,
                title,
                description,
                code,
                price,
                status: status ?? true,
                stock,
                category,
                thumbnails: thumbnails ?? []
            };

            products.push(product);
            await fs.promises.writeFile(this.path, JSON.stringify(products, null, 2));
            return product;
        } catch (error) {
            throw error;
        }
    }

    setProductById = async (pid, updatedFields) => {
        try {
            const products = await this.getProducts();
            const index = products.findIndex(p => p.id === parseInt(pid));
            
            if (index === -1) {
                throw new Error('Producto no encontrado');
            }

            const { id: _, ...fieldsToUpdate } = updatedFields;
            products[index] = { ...products[index], ...fieldsToUpdate };
            
            await fs.promises.writeFile(this.path, JSON.stringify(products, null, 2));
            return products[index];
        } catch (error) {
            throw error;
        }
    }

    deleteProductById = async (pid) => {
        try {
            const products = await this.getProducts();
            const index = products.findIndex(p => p.id === parseInt(pid));
            
            if (index === -1) {
                throw new Error('Producto no encontrado');
            }

            products.splice(index, 1);
            await fs.promises.writeFile(this.path, JSON.stringify(products, null, 2));
        } catch (error) {
            throw error;
        }
    }
}

export default ProductManager;