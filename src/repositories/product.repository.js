import ProductDAO from '../dao/product.dao.js';
import ProductDTO from '../dto/product.dto.js';

class ProductRepository {
  constructor() {
    this.productDAO = new ProductDAO();
  }

  async createProduct(productData) {
    try {
      // Validaciones de negocio
      this.validateProductData(productData);
      
      // Verificar que el código no exista
      const existingProduct = await this.productDAO.findByCode(productData.code);
      if (existingProduct) {
        throw new Error('Ya existe un producto con ese código');
      }

      const product = await this.productDAO.create(productData);
      return ProductDTO.getAdminResponse(product);
    } catch (error) {
      throw error;
    }
  }

  async getProductById(id, isAdmin = false) {
    try {
      const product = await this.productDAO.findById(id);
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      return isAdmin 
        ? ProductDTO.getAdminResponse(product)
        : ProductDTO.getPublicResponse(product);
    } catch (error) {
      throw error;
    }
  }

  async getAllProducts(options = {}, isAdmin = false) {
    try {
      const result = await this.productDAO.findAll(options);
      
      const products = result.docs.map(product => 
        isAdmin 
          ? ProductDTO.getAdminResponse(product)
          : ProductDTO.getPublicResponse(product)
      );

      return {
        products,
        pagination: {
          totalDocs: result.totalDocs,
          limit: result.limit,
          totalPages: result.totalPages,
          page: result.page,
          pagingCounter: result.pagingCounter,
          hasPrevPage: result.hasPrevPage,
          hasNextPage: result.hasNextPage,
          prevPage: result.prevPage,
          nextPage: result.nextPage
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(id, updateData) {
    try {
      // Validar que el producto existe
      const existingProduct = await this.productDAO.findById(id);
      if (!existingProduct) {
        throw new Error('Producto no encontrado');
      }

      // Si se actualiza el código, verificar que no exista
      if (updateData.code && updateData.code !== existingProduct.code) {
        const codeExists = await this.productDAO.findByCode(updateData.code);
        if (codeExists) {
          throw new Error('Ya existe un producto con ese código');
        }
      }

      // Validar datos de actualización
      this.validateUpdateData(updateData);

      const product = await this.productDAO.update(id, updateData);
      return ProductDTO.getAdminResponse(product);
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const product = await this.productDAO.delete(id);
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      return { message: 'Producto eliminado correctamente' };
    } catch (error) {
      throw error;
    }
  }

  async updateStock(id, newStock) {
    try {
      if (newStock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      const product = await this.productDAO.updateStock(id, newStock);
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      return ProductDTO.getStockResponse(product);
    } catch (error) {
      throw error;
    }
  }

  async decrementStock(id, quantity) {
    try {
      if (quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      const product = await this.productDAO.decrementStock(id, quantity);
      return ProductDTO.getStockResponse(product);
    } catch (error) {
      throw error;
    }
  }

  async incrementStock(id, quantity) {
    try {
      if (quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      const product = await this.productDAO.incrementStock(id, quantity);
      return ProductDTO.getStockResponse(product);
    } catch (error) {
      throw error;
    }
  }

  async getProductsByCategory(category, options = {}) {
    try {
      const result = await this.productDAO.findByCategory(category, options);
      
      const products = result.docs.map(product => 
        ProductDTO.getPublicResponse(product)
      );

      return {
        products,
        category,
        pagination: {
          totalDocs: result.totalDocs,
          limit: result.limit,
          totalPages: result.totalPages,
          page: result.page,
          pagingCounter: result.pagingCounter,
          hasPrevPage: result.hasPrevPage,
          hasNextPage: result.hasNextPage,
          prevPage: result.prevPage,
          nextPage: result.nextPage
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getCategories() {
    try {
      return await this.productDAO.getCategories();
    } catch (error) {
      throw error;
    }
  }

  async getProductForCart(id) {
    try {
      const product = await this.productDAO.findById(id);
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      if (!product.status) {
        throw new Error('Producto no disponible');
      }
      
      return ProductDTO.getCartResponse(product);
    } catch (error) {
      throw error;
    }
  }

  async checkStock(id, quantity) {
    try {
      const product = await this.productDAO.findById(id);
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      return {
        available: product.stock >= quantity,
        currentStock: product.stock,
        requested: quantity
      };
    } catch (error) {
      throw error;
    }
  }

  // Validaciones privadas
  validateProductData(data) {
    if (!data.title) throw new Error('El título es requerido');
    if (!data.description) throw new Error('La descripción es requerida');
    if (!data.code) throw new Error('El código es requerido');
    if (!data.price || data.price <= 0) throw new Error('El precio debe ser mayor a 0');
    if (!data.stock || data.stock < 0) throw new Error('El stock no puede ser negativo');
    if (!data.category) throw new Error('La categoría es requerida');
  }

  validateUpdateData(data) {
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }
    if (data.stock !== undefined && data.stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }
  }
}

export default ProductRepository;
