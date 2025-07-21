import Product from '../models/product.model.js';

class ProductDAO {
  async create(productData) {
    try {
      const product = new Product(productData);
      return await product.save();
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Product.findById(id);
    } catch (error) {
      throw new Error(`Error al buscar producto por ID: ${error.message}`);
    }
  }

  async findByCode(code) {
    try {
      return await Product.findOne({ code });
    } catch (error) {
      throw new Error(`Error al buscar producto por código: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = {}, 
        filter = {},
        category,
        status,
        minPrice,
        maxPrice,
        search
      } = options;

      const mongoFilter = { ...filter };
      
      if (category) {
        mongoFilter.category = { $regex: category, $options: 'i' };
      }
      
      if (status !== undefined) {
        mongoFilter.status = status;
      }
      
      if (minPrice || maxPrice) {
        mongoFilter.price = {};
        if (minPrice) mongoFilter.price.$gte = Number(minPrice);
        if (maxPrice) mongoFilter.price.$lte = Number(maxPrice);
      }
      
      if (search) {
        mongoFilter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      return await Product.paginate(mongoFilter, {
        page,
        limit,
        sort,
        lean: false
      });
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      return await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await Product.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  async updateStock(id, newStock) {
    try {
      return await Product.findByIdAndUpdate(
        id,
        { stock: newStock },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error al actualizar stock: ${error.message}`);
    }
  }

  async decrementStock(id, quantity) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      if (product.stock < quantity) {
        throw new Error('Stock insuficiente');
      }
      
      return await Product.findByIdAndUpdate(
        id,
        { $inc: { stock: -quantity } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error al decrementar stock: ${error.message}`);
    }
  }

  async incrementStock(id, quantity) {
    try {
      return await Product.findByIdAndUpdate(
        id,
        { $inc: { stock: quantity } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error al incrementar stock: ${error.message}`);
    }
  }

  async findByCategory(category, options = {}) {
    try {
      const { page = 1, limit = 10, sort = {} } = options;
      
      return await Product.paginate(
        { category: { $regex: category, $options: 'i' }, status: true },
        { page, limit, sort }
      );
    } catch (error) {
      throw new Error(`Error al buscar productos por categoría: ${error.message}`);
    }
  }

  async getCategories() {
    try {
      return await Product.distinct('category');
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }
}

export default ProductDAO;
