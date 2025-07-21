import TicketDAO from '../dao/ticket.dao.js';
import TicketDTO from '../dto/ticket.dto.js';

class TicketRepository {
  constructor() {
    this.ticketDAO = new TicketDAO();
  }

  async createTicket(ticketData) {
    try {
      // Validar datos requeridos
      this.validateTicketData(ticketData);
      
      // Calcular el monto total
      const amount = ticketData.products.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      // Asegurar que cada producto tenga subtotal
      const products = ticketData.products.map(item => ({
        ...item,
        subtotal: item.price * item.quantity
      }));

      const finalTicketData = {
        ...ticketData,
        amount,
        products
      };

      const ticket = await this.ticketDAO.create(finalTicketData);
      return TicketDTO.getCreationResponse(ticket);
    } catch (error) {
      throw error;
    }
  }

  async getTicketById(id, isAdmin = false) {
    try {
      const ticket = await this.ticketDAO.findById(id);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }
      
      return isAdmin 
        ? TicketDTO.getAdminResponse(ticket)
        : TicketDTO.getDetailResponse(ticket);
    } catch (error) {
      throw error;
    }
  }

  async getTicketByCode(code, isAdmin = false) {
    try {
      const ticket = await this.ticketDAO.findByCode(code);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }
      
      return isAdmin 
        ? TicketDTO.getAdminResponse(ticket)
        : TicketDTO.getDetailResponse(ticket);
    } catch (error) {
      throw error;
    }
  }

  async getUserTickets(userEmail, options = {}) {
    try {
      const result = await this.ticketDAO.findByPurchaser(userEmail, options);
      
      return {
        tickets: result.tickets.map(ticket => TicketDTO.getUserHistoryResponse(ticket)),
        pagination: result.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllTickets(options = {}, isAdmin = false) {
    try {
      const result = await this.ticketDAO.findAll(options);
      
      const tickets = result.tickets.map(ticket => 
        isAdmin 
          ? TicketDTO.getAdminResponse(ticket)
          : TicketDTO.getListResponse(ticket)
      );

      return {
        tickets,
        pagination: result.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  async updateTicketStatus(id, status, isAdmin = false) {
    try {
      if (!isAdmin) {
        throw new Error('No tienes permisos para actualizar el estado del ticket');
      }

      const ticket = await this.ticketDAO.updateStatus(id, status);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }
      
      return TicketDTO.getStatusUpdateResponse(ticket);
    } catch (error) {
      throw error;
    }
  }

  async deleteTicket(id, isAdmin = false) {
    try {
      if (!isAdmin) {
        throw new Error('No tienes permisos para eliminar tickets');
      }

      const ticket = await this.ticketDAO.delete(id);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }
      
      return { message: 'Ticket eliminado correctamente' };
    } catch (error) {
      throw error;
    }
  }

  async getTicketsByDateRange(startDate, endDate, options = {}) {
    try {
      const result = await this.ticketDAO.getTicketsByDateRange(startDate, endDate, options);
      
      return {
        tickets: result.tickets.map(ticket => TicketDTO.getListResponse(ticket)),
        pagination: result.pagination,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      throw error;
    }
  }

  async getTicketStats(options = {}) {
    try {
      const stats = await this.ticketDAO.getTicketStats(options);
      return TicketDTO.getStatsResponse(stats);
    } catch (error) {
      throw error;
    }
  }

  async getTicketReceipt(ticketId, userEmail = null) {
    try {
      const ticket = await this.ticketDAO.findById(ticketId);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      // Si se proporciona email, verificar que sea el propietario
      if (userEmail && ticket.purchaser !== userEmail) {
        throw new Error('No tienes permisos para ver este ticket');
      }
      
      return TicketDTO.getReceiptResponse(ticket);
    } catch (error) {
      throw error;
    }
  }

  async processCartPurchase(cartProducts, userEmail) {
    try {
      if (!cartProducts || cartProducts.length === 0) {
        throw new Error('No hay productos para procesar');
      }

      const ticketData = {
        purchaser: userEmail,
        products: cartProducts.map(item => ({
          product: item.product,
          title: item.title,
          quantity: item.quantity,
          price: item.price
        }))
      };

      return await this.createTicket(ticketData);
    } catch (error) {
      throw error;
    }
  }

  async getUserTicketSummary(userEmail) {
    try {
      const result = await this.ticketDAO.findByPurchaser(userEmail, { limit: 1000 });
      
      const summary = {
        totalTickets: result.tickets.length,
        totalSpent: result.tickets.reduce((sum, ticket) => sum + ticket.amount, 0),
        averageTicket: 0,
        lastPurchase: null,
        statusBreakdown: {
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0
        }
      };

      if (summary.totalTickets > 0) {
        summary.averageTicket = Math.round((summary.totalSpent / summary.totalTickets) * 100) / 100;
        summary.lastPurchase = result.tickets[0]?.purchase_datetime;
        
        result.tickets.forEach(ticket => {
          summary.statusBreakdown[ticket.status]++;
        });
      }

      return summary;
    } catch (error) {
      throw error;
    }
  }

  // Validaciones privadas
  validateTicketData(data) {
    if (!data.purchaser) {
      throw new Error('El email del comprador es requerido');
    }
    
    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      throw new Error('Debe incluir al menos un producto');
    }

    data.products.forEach((product, index) => {
      if (!product.product) {
        throw new Error(`Producto ${index + 1}: ID del producto requerido`);
      }
      if (!product.title) {
        throw new Error(`Producto ${index + 1}: Título requerido`);
      }
      if (!product.quantity || product.quantity <= 0) {
        throw new Error(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      if (!product.price || product.price <= 0) {
        throw new Error(`Producto ${index + 1}: Precio debe ser mayor a 0`);
      }
    });

    // Validar formato de email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.purchaser)) {
      throw new Error('Formato de email inválido');
    }
  }
}

export default TicketRepository;
