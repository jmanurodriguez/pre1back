import { Router } from 'express';
import Product from '../models/product.model.js';
import Cart from '../models/cart.model.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const options = {
            page: 1,
            limit: 10,
            lean: true
        };
        
        const result = await Product.paginate({}, options);
        res.render('home', { products: result.docs });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

router.get('/products', async (req, res) => {
    try {
        const { page = 1, limit = 10, sort, category, minPrice, maxPrice, stock } = req.query;

        const filter = {};
        
        if (category) {
            filter.category = category;
        }
        
        if (minPrice) {
            filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
        }
        
        if (maxPrice) {
            filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
        }
        
        if (stock === 'on') {
            filter.stock = { $gt: 0 };
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            lean: true
        };

        if (sort) {
            if (sort === '1' || sort === '-1') {
                options.sort = { price: parseInt(sort) };
            } else if (sort === 'newest') {
                options.sort = { createdAt: -1 };
            } else if (sort === 'az') {
                options.sort = { title: 1 };
            } else if (sort === 'za') {
                options.sort = { title: -1 };
            }
        }

        const result = await Product.paginate(filter, options);

        const allCategories = await Product.distinct('category');

        const totalPages = result.totalPages;
        const currentPage = result.page;
        const pageNumbers = [];

        const maxPagesToShow = 5;
        let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
        let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(endPage - maxPagesToShow + 1, 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        
        res.render('products', {
            products: result.docs,
            pagination: {
                totalDocs: result.totalDocs,
                limit: result.limit,
                totalPages: result.totalPages,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                pageNumbers: pageNumbers
            },
            availableFilters: {
                categories: allCategories
            },
            appliedFilters: {
                category,
                sort,
                minPrice,
                maxPrice,
                stock: stock === 'on'
            }
        });
    } catch (error) {
        console.error('Error en la ruta /products:', error);
        res.status(500).render('error', { error: error.message });
    }
});

router.get('/products/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid).lean();
        
        if (!product) {
            return res.status(404).render('error', { error: 'Producto no encontrado' });
        }

        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id } 
        }).limit(4).lean();
        
        res.render('product-detail', { product, relatedProducts });
    } catch (error) {
        res.status(404).render('error', { error: error.message });
    }
});

router.get('/carts/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate('products.product').lean();
        
        if (!cart) {
            return res.status(404).render('error', { error: 'Carrito no encontrado' });
        }
        
        res.render('cart', { cart });
    } catch (error) {
        res.status(404).render('error', { error: error.message });
    }
});

router.get('/realtimeproducts', async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.render('realTimeProducts', { products });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

router.get('/admin/products', async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.render('admin-products', { products });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

export default router;