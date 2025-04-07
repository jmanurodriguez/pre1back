import fs from 'fs';

class ProductManager {
    constructor() {
        this.path = './src/data/products.json';
    }

    getProducts = async () => {
        try {
            const productsJSON = await fs.promises.readFile(this.path, 'utf-8');
            const products = JSON.parse(productsJSON);
            return products;
        } catch (error) {
            return [];
        }
    }

    getProductById = async (productId) => {
        const products = await this.getProducts();
        const product = products.find(p => p.id === productId);
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        return product;
    }

    addProduct = async (newProduct) => {
        const { title, description, code, price, status, stock, category, thumbnails } = newProduct;

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
    }

    updateProduct = async (id, updatedFields) => {
        const products = await this.getProducts();
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) {
            throw new Error('Producto no encontrado');
        }

        const { id: _, ...fieldsToUpdate } = updatedFields;
        products[index] = { ...products[index], ...fieldsToUpdate };
        
        await fs.promises.writeFile(this.path, JSON.stringify(products, null, 2));
        return products[index];
    }

    deleteProduct = async (id) => {
        const products = await this.getProducts();
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) {
            throw new Error('Producto no encontrado');
        }

        products.splice(index, 1);
        await fs.promises.writeFile(this.path, JSON.stringify(products, null, 2));
    }
}

export default ProductManager; 