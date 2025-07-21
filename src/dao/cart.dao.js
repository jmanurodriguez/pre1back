import Cart from '../models/cart.model.js';

class CartDAO {
  async create() {
    try {
      const cart = new Cart({ products: [] });
      return await cart.save();
    } catch (error) {
      throw new Error(`Error al crear carrito: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Cart.findById(id).populate('products.product');
    } catch (error) {
      throw new Error(`Error al buscar carrito por ID: ${error.message}`);
    }
  }

  async addProduct(cartId, productId, quantity = 1) {
    try {
      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      const existingProductIndex = cart.products.findIndex(
        item => item.product.toString() === productId.toString()
      );

      if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }

      return await cart.save();
    } catch (error) {
      throw new Error(`Error al agregar producto al carrito: ${error.message}`);
    }
  }

  async updateProductQuantity(cartId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeProduct(cartId, productId);
      }

      const result = await Cart.findOneAndUpdate(
        { 
          _id: cartId, 
          'products.product': productId 
        },
        { 
          $set: { 'products.$.quantity': quantity } 
        },
        { new: true }
      ).populate('products.product');

      if (!result) {
        throw new Error('Carrito o producto no encontrado');
      }

      return result;
    } catch (error) {
      throw new Error(`Error al actualizar cantidad del producto: ${error.message}`);
    }
  }

  async removeProduct(cartId, productId) {
    try {
      const result = await Cart.findByIdAndUpdate(
        cartId,
        { 
          $pull: { products: { product: productId } } 
        },
        { new: true }
      ).populate('products.product');

      if (!result) {
        throw new Error('Carrito no encontrado');
      }

      return result;
    } catch (error) {
      throw new Error(`Error al eliminar producto del carrito: ${error.message}`);
    }
  }

  async clearCart(cartId) {
    try {
      const result = await Cart.findByIdAndUpdate(
        cartId,
        { products: [] },
        { new: true }
      );

      if (!result) {
        throw new Error('Carrito no encontrado');
      }

      return result;
    } catch (error) {
      throw new Error(`Error al vaciar carrito: ${error.message}`);
    }
  }

  async delete(cartId) {
    try {
      return await Cart.findByIdAndDelete(cartId);
    } catch (error) {
      throw new Error(`Error al eliminar carrito: ${error.message}`);
    }
  }

  async getCartTotal(cartId) {
    try {
      const cart = await Cart.findById(cartId).populate('products.product');
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      let total = 0;
      let itemCount = 0;

      cart.products.forEach(item => {
        if (item.product && item.product.status) {
          total += item.product.price * item.quantity;
          itemCount += item.quantity;
        }
      });

      return {
        total,
        itemCount,
        cart
      };
    } catch (error) {
      throw new Error(`Error al calcular total del carrito: ${error.message}`);
    }
  }

  async validateCartProducts(cartId) {
    try {
      const cart = await Cart.findById(cartId).populate('products.product');
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      const validProducts = [];
      const invalidProducts = [];

      for (const item of cart.products) {
        if (!item.product) {
          invalidProducts.push({ reason: 'Producto eliminado', item });
          continue;
        }

        if (!item.product.status) {
          invalidProducts.push({ reason: 'Producto no disponible', item });
          continue;
        }

        if (item.product.stock < item.quantity) {
          invalidProducts.push({ 
            reason: 'Stock insuficiente', 
            item,
            availableStock: item.product.stock 
          });
          continue;
        }

        validProducts.push(item);
      }

      return {
        validProducts,
        invalidProducts,
        cart
      };
    } catch (error) {
      throw new Error(`Error al validar productos del carrito: ${error.message}`);
    }
  }

  async removeInvalidProducts(cartId) {
    try {
      const cart = await Cart.findById(cartId).populate('products.product');
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      const validProducts = cart.products.filter(item => 
        item.product && 
        item.product.status && 
        item.product.stock >= item.quantity
      );

      cart.products = validProducts;
      return await cart.save();
    } catch (error) {
      throw new Error(`Error al limpiar productos inválidos: ${error.message}`);
    }
  }
}

export default CartDAO;
