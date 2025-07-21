import CartDAO from '../dao/cart.dao.js';
import ProductDAO from '../dao/product.dao.js';
import CartDTO from '../dto/cart.dto.js';
import ProductDTO from '../dto/product.dto.js';

class CartRepository {
  constructor() {
    this.cartDAO = new CartDAO();
    this.productDAO = new ProductDAO();
  }

  async createCart() {
    try {
      const cart = await this.cartDAO.create();
      return CartDTO.getBasicResponse(cart);
    } catch (error) {
      throw error;
    }
  }

  async getCartById(cartId) {
    try {
      const cart = await this.cartDAO.findById(cartId);
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }
      return CartDTO.getBasicResponse(cart);
    } catch (error) {
      throw error;
    }
  }

  async addProductToCart(cartId, productId, quantity = 1) {
    try {
      const product = await this.productDAO.findById(productId);
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      if (!product.status) {
        throw new Error('Producto no disponible');
      }
      
      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);
      }

      const currentCart = await this.cartDAO.findById(cartId);
      if (!currentCart) {
        throw new Error('Carrito no encontrado');
      }

      const existingProduct = currentCart.products.find(
        item => item.product.toString() === productId.toString()
      );

      const totalQuantity = existingProduct ? 
        existingProduct.quantity + quantity : quantity;

      if (product.stock < totalQuantity) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock}, solicitado: ${totalQuantity}`);
      }

      const updatedCart = await this.cartDAO.addProduct(cartId, productId, quantity);
      const populatedCart = await this.cartDAO.findById(cartId);
      
      const addedProduct = {
        product,
        quantity
      };

      return CartDTO.getAddProductResponse(populatedCart, addedProduct);
    } catch (error) {
      throw error;
    }
  }

  async updateProductQuantity(cartId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeProductFromCart(cartId, productId);
      }

      const product = await this.productDAO.findById(productId);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);
      }

      const updatedCart = await this.cartDAO.updateProductQuantity(cartId, productId, quantity);
      return CartDTO.getBasicResponse(updatedCart);
    } catch (error) {
      throw error;
    }
  }

  async removeProductFromCart(cartId, productId) {
    try {
      const updatedCart = await this.cartDAO.removeProduct(cartId, productId);
      return {
        ...CartDTO.getBasicResponse(updatedCart),
        message: 'Producto eliminado del carrito'
      };
    } catch (error) {
      throw error;
    }
  }

  async clearCart(cartId) {
    try {
      const clearedCart = await this.cartDAO.clearCart(cartId);
      return {
        ...CartDTO.getBasicResponse(clearedCart),
        message: 'Carrito vaciado correctamente'
      };
    } catch (error) {
      throw error;
    }
  }

  async getCartSummary(cartId) {
    try {
      const cart = await this.cartDAO.findById(cartId);
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }
      return CartDTO.getSummaryResponse(cart);
    } catch (error) {
      throw error;
    }
  }

  async validateCartForCheckout(cartId) {
    try {
      const validationResult = await this.cartDAO.validateCartProducts(cartId);
      
      if (validationResult.invalidProducts.length === 0) {
        return {
          valid: true,
          cart: CartDTO.getCheckoutResponse(validationResult.cart),
          products: CartDTO.getTicketProductsResponse(validationResult.validProducts)
        };
      }

      return {
        valid: false,
        cart: CartDTO.getCheckoutResponse(validationResult.cart, validationResult),
        validProducts: CartDTO.getTicketProductsResponse(validationResult.validProducts),
        invalidProducts: CartDTO.getUnavailableProductsResponse(validationResult.invalidProducts),
        message: 'Algunos productos no están disponibles o tienen stock insuficiente'
      };
    } catch (error) {
      throw error;
    }
  }

  async processCartForPurchase(cartId) {
    try {
      const validationResult = await this.cartDAO.validateCartProducts(cartId);
      
      if (validationResult.validProducts.length === 0) {
        throw new Error('No hay productos válidos para procesar la compra');
      }

      const validProducts = CartDTO.getTicketProductsResponse(validationResult.validProducts);
      const total = validProducts.reduce((sum, item) => sum + item.subtotal, 0);

      const failedProducts = validationResult.invalidProducts.length > 0 ? 
        CartDTO.getUnavailableProductsResponse(validationResult.invalidProducts) : [];

      return {
        success: true,
        validProducts,
        failedProducts,
        total,
        message: failedProducts.length > 0 ? 
          'Compra procesada parcialmente' : 
          'Compra procesada completamente'
      };
    } catch (error) {
      throw error;
    }
  }

  async removeInvalidProducts(cartId) {
    try {
      const cleanedCart = await this.cartDAO.removeInvalidProducts(cartId);
      return {
        ...CartDTO.getBasicResponse(cleanedCart),
        message: 'Productos no disponibles removidos del carrito'
      };
    } catch (error) {
      throw error;
    }
  }

  async getCartTotal(cartId) {
    try {
      const result = await this.cartDAO.getCartTotal(cartId);
      return {
        total: result.total,
        itemCount: result.itemCount,
        cart: CartDTO.getBasicResponse(result.cart)
      };
    } catch (error) {
      throw error;
    }
  }
}

export default CartRepository;
