class ProductDTO {
  constructor(product) {
    this.id = product._id || product.id;
    this.title = product.title;
    this.description = product.description;
    this.thumbnail = product.thumbnail;
    this.code = product.code;
    this.price = product.price;
    this.stock = product.stock;
    this.category = product.category;
    this.status = product.status;
    this.tags = product.tags;
    this.createdAt = product.createdAt;
  }

  static getPublicResponse(product) {
    return {
      id: product._id || product.id,
      title: product.title,
      description: product.description,
      thumbnail: product.thumbnail,
      price: product.price,
      stock: product.stock,
      category: product.category,
      status: product.status,
      tags: product.tags
    };
  }

  static getAdminResponse(product) {
    return {
      id: product._id || product.id,
      title: product.title,
      description: product.description,
      thumbnail: product.thumbnail,
      code: product.code,
      price: product.price,
      stock: product.stock,
      category: product.category,
      status: product.status,
      tags: product.tags,
      createdAt: product.createdAt
    };
  }

  static getCartResponse(product) {
    return {
      id: product._id || product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      stock: product.stock,
      status: product.status
    };
  }

  static getTicketResponse(product, quantity, priceAtPurchase) {
    return {
      product: product._id || product.id,
      title: product.title,
      quantity: quantity,
      price: priceAtPurchase || product.price,
      subtotal: (priceAtPurchase || product.price) * quantity
    };
  }

  static getSearchResponse(product) {
    return {
      id: product._id || product.id,
      title: product.title,
      description: product.description,
      thumbnail: product.thumbnail,
      price: product.price,
      category: product.category,
      stock: product.stock,
      status: product.status
    };
  }

  static getStockResponse(product) {
    return {
      id: product._id || product.id,
      title: product.title,
      stock: product.stock,
      status: product.status
    };
  }
}

export default ProductDTO;
