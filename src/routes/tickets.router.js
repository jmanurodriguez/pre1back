import { Router } from 'express';
import TicketRepository from '../repositories/ticket.repository.js';
import { authenticateCurrent, isAdmin, isAdminOrOwner } from '../middlewares/auth.js';

const router = Router();
const ticketRepository = new TicketRepository();

router.get('/', authenticateCurrent, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            startDate, 
            endDate, 
            status,
            minAmount,
            maxAmount 
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            startDate,
            endDate,
            status,
            minAmount,
            maxAmount
        };

        let result;
        const isAdmin = req.user.role === 'admin';

        if (isAdmin) {
            result = await ticketRepository.getAllTickets(options, true);
        } else {
            result = await ticketRepository.getUserTickets(req.user.email, options);
        }

        res.json({
            status: 'success',
            payload: result.tickets,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/stats', authenticateCurrent, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const options = { startDate, endDate };
        
        const stats = await ticketRepository.getTicketStats(options);
        
        res.json({
            status: 'success',
            payload: stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/my-summary', authenticateCurrent, async (req, res) => {
    try {
        const summary = await ticketRepository.getUserTicketSummary(req.user.email);
        
        res.json({
            status: 'success',
            payload: summary
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/:id', authenticateCurrent, async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user.role === 'admin';
        
        const ticket = await ticketRepository.getTicketById(id, isAdmin);
        
        if (!isAdmin && ticket.purchaser !== req.user.email) {
            return res.status(403).json({
                status: 'error',
                message: 'No tienes permisos para ver este ticket'
            });
        }
        
        res.json({
            status: 'success',
            payload: ticket
        });
    } catch (error) {
        if (error.message === 'Ticket no encontrado') {
            return res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/code/:code', authenticateCurrent, async (req, res) => {
    try {
        const { code } = req.params;
        const isAdmin = req.user.role === 'admin';
        
        const ticket = await ticketRepository.getTicketByCode(code, isAdmin);
        
        if (!isAdmin && ticket.purchaser !== req.user.email) {
            return res.status(403).json({
                status: 'error',
                message: 'No tienes permisos para ver este ticket'
            });
        }
        
        res.json({
            status: 'success',
            payload: ticket
        });
    } catch (error) {
        if (error.message === 'Ticket no encontrado') {
            return res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/:id/receipt', authenticateCurrent, async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.role === 'admin' ? null : req.user.email;
        
        const receipt = await ticketRepository.getTicketReceipt(id, userEmail);
        
        res.json({
            status: 'success',
            payload: receipt
        });
    } catch (error) {
        if (error.message === 'Ticket no encontrado' ||
            error.message.includes('permisos')) {
            return res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.patch('/:id/status', authenticateCurrent, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                status: 'error',
                message: 'El estado es requerido'
            });
        }

        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`
            });
        }

        const result = await ticketRepository.updateTicketStatus(id, status, true);
        
        res.json({
            status: 'success',
            payload: result
        });
    } catch (error) {
        if (error.message === 'Ticket no encontrado') {
            return res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.delete('/:id', authenticateCurrent, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await ticketRepository.deleteTicket(id, true);
        
        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        if (error.message === 'Ticket no encontrado') {
            return res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/date-range/:startDate/:endDate', authenticateCurrent, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };

        const result = await ticketRepository.getTicketsByDateRange(startDate, endDate, options);
        
        res.json({
            status: 'success',
            payload: result.tickets,
            pagination: result.pagination,
            dateRange: result.dateRange
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

export default router;
