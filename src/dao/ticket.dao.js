import Ticket from '../models/ticket.model.js';

class TicketDAO {
  async create(ticketData) {
    try {
      const ticket = new Ticket(ticketData);
      return await ticket.save();
    } catch (error) {
      throw new Error(`Error al crear ticket: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Ticket.findById(id).populate('products.product');
    } catch (error) {
      throw new Error(`Error al buscar ticket por ID: ${error.message}`);
    }
  }

  async findByCode(code) {
    try {
      return await Ticket.findOne({ code }).populate('products.product');
    } catch (error) {
      throw new Error(`Error al buscar ticket por código: ${error.message}`);
    }
  }

  async findByPurchaser(purchaser, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { purchase_datetime: -1 } } = options;
      
      const skip = (page - 1) * limit;
      
      const tickets = await Ticket.find({ purchaser })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('products.product');
      
      const total = await Ticket.countDocuments({ purchaser });
      
      return {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error al buscar tickets por comprador: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = { purchase_datetime: -1 },
        filter = {},
        startDate,
        endDate,
        status,
        minAmount,
        maxAmount
      } = options;

      const mongoFilter = { ...filter };
      
      if (startDate || endDate) {
        mongoFilter.purchase_datetime = {};
        if (startDate) mongoFilter.purchase_datetime.$gte = new Date(startDate);
        if (endDate) mongoFilter.purchase_datetime.$lte = new Date(endDate);
      }
      
      if (status) {
        mongoFilter.status = status;
      }
      
      if (minAmount || maxAmount) {
        mongoFilter.amount = {};
        if (minAmount) mongoFilter.amount.$gte = Number(minAmount);
        if (maxAmount) mongoFilter.amount.$lte = Number(maxAmount);
      }

      const skip = (page - 1) * limit;
      
      const tickets = await Ticket.find(mongoFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('products.product');
      
      const total = await Ticket.countDocuments(mongoFilter);
      
      return {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener tickets: ${error.message}`);
    }
  }

  async updateStatus(id, status) {
    try {
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Estado inválido');
      }

      return await Ticket.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('products.product');
    } catch (error) {
      throw new Error(`Error al actualizar estado del ticket: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await Ticket.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar ticket: ${error.message}`);
    }
  }

  async getTicketsByDateRange(startDate, endDate, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      const mongoFilter = {
        purchase_datetime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      const skip = (page - 1) * limit;
      
      const tickets = await Ticket.find(mongoFilter)
        .sort({ purchase_datetime: -1 })
        .skip(skip)
        .limit(limit)
        .populate('products.product');
      
      const total = await Ticket.countDocuments(mongoFilter);
      
      return {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener tickets por rango de fechas: ${error.message}`);
    }
  }

  async getTicketStats(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      let matchStage = {};
      if (startDate || endDate) {
        matchStage.purchase_datetime = {};
        if (startDate) matchStage.purchase_datetime.$gte = new Date(startDate);
        if (endDate) matchStage.purchase_datetime.$lte = new Date(endDate);
      }

      const stats = await Ticket.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
            minAmount: { $min: '$amount' }
          }
        }
      ]);

      const statusStats = await Ticket.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        general: stats[0] || {
          totalTickets: 0,
          totalAmount: 0,
          averageAmount: 0,
          maxAmount: 0,
          minAmount: 0
        },
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas de tickets: ${error.message}`);
    }
  }
}

export default TicketDAO;
