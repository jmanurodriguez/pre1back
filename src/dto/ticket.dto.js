class TicketDTO {
  constructor(ticket) {
    this.id = ticket._id || ticket.id;
    this.code = ticket.code;
    this.purchase_datetime = ticket.purchase_datetime;
    this.amount = ticket.amount;
    this.purchaser = ticket.purchaser;
    this.products = ticket.products?.map(item => ({
      product: item.product?._id || item.product,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    })) || [];
    this.status = ticket.status;
    this.createdAt = ticket.createdAt;
    this.updatedAt = ticket.updatedAt;
  }

  static getCreationResponse(ticket) {
    return {
      id: ticket._id || ticket.id,
      code: ticket.code,
      purchase_datetime: ticket.purchase_datetime,
      amount: ticket.amount,
      purchaser: ticket.purchaser,
      products: ticket.products?.map(item => ({
        product: item.product?._id || item.product,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })) || [],
      status: ticket.status,
      message: 'Ticket generado correctamente'
    };
  }

  static getListResponse(ticket) {
    const productCount = ticket.products?.length || 0;
    const totalItems = ticket.products?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return {
      id: ticket._id || ticket.id,
      code: ticket.code,
      purchase_datetime: ticket.purchase_datetime,
      amount: ticket.amount,
      purchaser: ticket.purchaser,
      status: ticket.status,
      productCount,
      totalItems,
      createdAt: ticket.createdAt
    };
  }

  static getDetailResponse(ticket) {
    return {
      id: ticket._id || ticket.id,
      code: ticket.code,
      purchase_datetime: ticket.purchase_datetime,
      amount: ticket.amount,
      purchaser: ticket.purchaser,
      products: ticket.products?.map(item => ({
        product: {
          id: item.product?._id || item.product,
          title: item.title,
          currentPrice: item.product?.price,
          currentStock: item.product?.stock,
          currentStatus: item.product?.status
        },
        quantity: item.quantity,
        priceAtPurchase: item.price, 
        subtotal: item.subtotal
      })) || [],
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    };
  }

  static getUserHistoryResponse(ticket) {
    return {
      id: ticket._id || ticket.id,
      code: ticket.code,
      purchase_datetime: ticket.purchase_datetime,
      amount: ticket.amount,
      status: ticket.status,
      productCount: ticket.products?.length || 0,
      products: ticket.products?.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })) || []
    };
  }

  static getAdminResponse(ticket) {
    return {
      id: ticket._id || ticket.id,
      code: ticket.code,
      purchase_datetime: ticket.purchase_datetime,
      amount: ticket.amount,
      purchaser: ticket.purchaser,
      status: ticket.status,
      productCount: ticket.products?.length || 0,
      totalItems: ticket.products?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      products: ticket.products?.map(item => ({
        product: {
          id: item.product?._id || item.product,
          title: item.title,
          category: item.product?.category
        },
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })) || [],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    };
  }

  static getStatsResponse(stats) {
    return {
      general: {
        totalTickets: stats.general.totalTickets,
        totalRevenue: stats.general.totalAmount,
        averageTicketValue: Math.round(stats.general.averageAmount * 100) / 100,
        highestTicket: stats.general.maxAmount,
        lowestTicket: stats.general.minAmount
      },
      statusDistribution: stats.byStatus,
      summary: {
        completedPercentage: stats.byStatus.completed ? 
          Math.round((stats.byStatus.completed / stats.general.totalTickets) * 100) : 0,
        pendingCount: stats.byStatus.pending || 0,
        cancelledCount: stats.byStatus.cancelled || 0
      }
    };
  }

  static getReceiptResponse(ticket) {
    return {
      ticketNumber: ticket.code,
      date: ticket.purchase_datetime,
      customerEmail: ticket.purchaser,
      items: ticket.products?.map(item => ({
        description: item.title,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.subtotal
      })) || [],
      subtotal: ticket.amount,
      total: ticket.amount,
      status: ticket.status,
      orderDate: ticket.createdAt
    };
  }

  static getStatusUpdateResponse(ticket) {
    return {
      id: ticket._id || ticket.id,
      code: ticket.code,
      status: ticket.status,
      updatedAt: ticket.updatedAt,
      message: `Estado del ticket actualizado a: ${ticket.status}`
    };
  }
}

export default TicketDTO;
