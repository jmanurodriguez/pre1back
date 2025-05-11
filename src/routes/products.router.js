import { Router } from 'express';
import Product from '../models/product.model.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, category, status } = req.query;

        const filter = {};
        
        if (category) {
            filter.category = category;
        }
        
        if (status !== undefined) {
            filter.status = status === 'true';
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            lean: true
        };

        if (sort) {
            options.sort = { price: sort === 'asc' ? 1 : -1 };
        }

        const result = await Product.paginate(filter, options);
        
        res.json({
            status: 'success',
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}` : null,
            nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}` : null
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid);
        
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }
        
        res.json({ status: 'success', payload: product });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, description, code, price, status, stock, category, thumbnails } = req.body;

        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }

        const existingProduct = await Product.findOne({ code });
        if (existingProduct) {
            return res.status(400).json({ status: 'error', message: `Ya existe un producto con el código ${code}` });
        }

        const newProduct = new Product({
            title,
            description,
            code,
            price,
            status: status ?? true,
            stock,
            category,
            thumbnails: thumbnails ?? []
        });

        await newProduct.save();
        res.status(201).json({ status: 'success', payload: newProduct });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.put('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const { id: _, ...update } = req.body;
        
        const updatedProduct = await Product.findByIdAndUpdate(
            pid,
            update,
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }
        
        res.json({ status: 'success', payload: updatedProduct });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(pid);
        
        if (!deletedProduct) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }
        
        res.json({ status: 'success', message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default router;