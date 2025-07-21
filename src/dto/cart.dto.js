import ProductDTO from './product.dto.js';

class CartDTO {
  constructor(cart) {
    this.id = cart._id || cart.id;
    this.products = cart.products?.map(item => ({
      product: ProductDTO.getCartResponse(item.product),
      quantity: item.quantity,
      subtotal: item.product ? item.product.price * item.quantity : 0
    })) || [];
    this.createdAt = cart.createdAt;
    this.updatedAt = cart.updatedAt;
  }

  static getBasicResponse(cart) {
    const products = cart.products?.map(item => ({
      product: item.product ? ProductDTO.getCartResponse(item.product) : null,
      quantity: item.quantity,
      subtotal: item.product ? item.product.price * item.quantity : 0
    })) || [];

    const total = products.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const itemCount = products.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart._id || cart.id,
      products,
      total,
      itemCount,
      updatedAt: cart.updatedAt
    };
  }

  static getCheckoutResponse(cart, validationResult = null) {
    const products = cart.products?.map(item => ({
      product: item.product ? ProductDTO.getCartResponse(item.product) : null,
      quantity: item.quantity,
      subtotal: item.product ? item.product.price * item.quantity : 0,
      available: item.product ? item.product.stock >= item.quantity : false
    })) || [];

    const total = products
      .filter(item => item.available)
      .reduce((sum, item) => sum + item.subtotal, 0);
    
    const itemCount = products
      .filter(item => item.available)
      .reduce((sum, item) => sum + item.quantity, 0);

    const response = {
      id: cart._id || cart.id,
      products,
      total,
      itemCount,
      updatedAt: cart.updatedAt
    };

    if (validationResult) {
      response.validation = {
        validProducts: validationResult.validProducts.length,
        invalidProducts: validationResult.invalidProducts.length,
        issues: validationResult.invalidProducts.map(item => ({
          productId: item.item.product?._id,
          productTitle: item.item.product?.title,
          reason: item.reason,
          requestedQuantity: item.item.quantity,
          availableStock: item.availableStock
        }))
      };
    }

    return response;
  }

  static getSummaryResponse(cart) {
    const itemCount = cart.products?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const total = cart.products?.reduce((sum, item) => {
      return sum + (item.product ? item.product.price * item.quantity : 0);
    }, 0) || 0;

    return {
      id: cart._id || cart.id,
      itemCount,
      total,
      updatedAt: cart.updatedAt
    };
  }

  static getAddProductResponse(cart, addedProduct) {
    const cartResponse = CartDTO.getBasicResponse(cart);
    
    return {
      ...cartResponse,
      lastAdded: {
        product: ProductDTO.getCartResponse(addedProduct.product),
        quantity: addedProduct.quantity,
        subtotal: addedProduct.product.price * addedProduct.quantity
      },
      message: 'Producto agregado al carrito correctamente'
    };
  }

  static getTicketProductsResponse(validProducts) {
    return validProducts.map(item => ({
      product: item.product._id,
      title: item.product.title,
      quantity: item.quantity,
      price: item.product.price,
      subtotal: item.product.price * item.quantity
    }));
  }

  static getUnavailableProductsResponse(invalidProducts) {
    return invalidProducts.map(item => ({
      product: item.item.product ? {
        id: item.item.product._id,
        title: item.item.product.title,
        price: item.item.product.price
      } : null,
      requestedQuantity: item.item.quantity,
      availableStock: item.availableStock,
      reason: item.reason
    }));
  }
}

export default CartDTO;
