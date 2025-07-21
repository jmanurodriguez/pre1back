import { Router } from 'express';
import ProductRepository from '../repositories/product.repository.js';
import { authenticateCurrent, adminOnlyProducts, optionalAuth } from '../middlewares/auth.js';

const router = Router();
const productRepository = new ProductRepository();

router.get('/', optionalAuth, async (req, res) => {
    try {
        const { 
            limit = 10, 
            page = 1, 
            sort, 
            category, 
            status,
            minPrice,
            maxPrice,
            search 
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            category,
            status: status !== undefined ? status === 'true' : undefined,
            minPrice,
            maxPrice,
            search
        };

        if (sort) {
            options.sort = { price: sort === 'asc' ? 1 : -1 };
        }

        const isAdmin = req.user?.role === 'admin';
        const result = await productRepository.getAllProducts(options, isAdmin);

        const buildLink = (pageNum) => {
            const params = new URLSearchParams();
            params.append('page', pageNum);
            params.append('limit', limit);
            if (sort) params.append('sort', sort);
            if (category) params.append('category', category);
            if (status !== undefined) params.append('status', status);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            if (search) params.append('search', search);
            return `/api/products?${params.toString()}`;
        };

        res.json({
            status: 'success',
            payload: result.products,
            totalPages: result.pagination.totalPages,
            prevPage: result.pagination.prevPage,
            nextPage: result.pagination.nextPage,
            page: result.pagination.page,
            hasPrevPage: result.pagination.hasPrevPage,
            hasNextPage: result.pagination.hasNextPage,
            prevLink: result.pagination.hasPrevPage ? buildLink(result.pagination.prevPage) : null,
            nextLink: result.pagination.hasNextPage ? buildLink(result.pagination.nextPage) : null
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const categories = await productRepository.getCategories();
        res.json({
            status: 'success',
            payload: categories
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.get('/:pid', optionalAuth, async (req, res) => {
    try {
        const { pid } = req.params;
        const isAdmin = req.user?.role === 'admin';
        
        const product = await productRepository.getProductById(pid, isAdmin);
        
        res.json({ 
            status: 'success', 
            payload: product 
        });
    } catch (error) {
        if (error.message === 'Producto no encontrado') {
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

router.post('/', authenticateCurrent, adminOnlyProducts, async (req, res) => {
    try {
        const { title, description, code, price, status, stock, category, thumbnails, tags } = req.body;

        const productData = {
            title,
            description,
            code,
            price: parseFloat(price),
            status: status ?? true,
            stock: parseInt(stock),
            category,
            thumbnail: thumbnails?.[0] || '',
            tags: tags || []
        };

        const newProduct = await productRepository.createProduct(productData);
        
        res.status(201).json({ 
            status: 'success', 
            payload: newProduct,
            message: 'Producto creado correctamente'
        });
    } catch (error) {
        if (error.message.includes('requerido') || 
            error.message.includes('código') ||
            error.message.includes('precio') ||
            error.message.includes('stock')) {
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

router.put('/:pid', authenticateCurrent, adminOnlyProducts, async (req, res) => {
    try {
        const { pid } = req.params;
        const { id: _, ...updateData } = req.body;

        if (updateData.price) {
            updateData.price = parseFloat(updateData.price);
        }
        if (updateData.stock !== undefined) {
            updateData.stock = parseInt(updateData.stock);
        }

        const updatedProduct = await productRepository.updateProduct(pid, updateData);
        
        res.json({ 
            status: 'success', 
            payload: updatedProduct,
            message: 'Producto actualizado correctamente'
        });
    } catch (error) {
        if (error.message === 'Producto no encontrado') {
            return res.status(404).json({ 
                status: 'error', 
                message: error.message 
            });
        }
        if (error.message.includes('código') ||
            error.message.includes('precio') ||
            error.message.includes('stock')) {
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

router.delete('/:pid', authenticateCurrent, adminOnlyProducts, async (req, res) => {
    try {
        const { pid } = req.params;
        const result = await productRepository.deleteProduct(pid);
        
        res.json({ 
            status: 'success', 
            message: result.message 
        });
    } catch (error) {
        if (error.message === 'Producto no encontrado') {
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

router.patch('/:pid/stock', authenticateCurrent, adminOnlyProducts, async (req, res) => {
    try {
        const { pid } = req.params;
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Stock debe ser un número mayor o igual a 0'
            });
        }

        const result = await productRepository.updateStock(pid, parseInt(stock));
        
        res.json({ 
            status: 'success', 
            payload: result,
            message: 'Stock actualizado correctamente'
        });
    } catch (error) {
        if (error.message === 'Producto no encontrado') {
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