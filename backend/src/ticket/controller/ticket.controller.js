import ticketService from '../service/ticket.service.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory for ticket attachments
const UPLOAD_DIR = path.join(__dirname, '../../../../public/uploads/tickets');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ticketController = {

  // POST /api/v1/tickets  — raise a ticket
  async create(req, res) {
    try {
      const { title, description, ticket_type, priority } = req.body;
      if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

      // Handle uploaded files (multer)
      const attachments = (req.files || []).map(f => ({
        url: `/uploads/tickets/${f.filename}`,
        name: f.originalname,
        type: f.mimetype,
        size: f.size,
      }));

      const ticket = await ticketService.createTicket(
        { title, description, ticket_type, priority, attachments },
        req.user
      );
      return res.status(201).json({ success: true, data: ticket, message: 'Ticket raised successfully' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /api/v1/tickets
  async getAll(req, res) {
    try {
      const result = await ticketService.getTickets({ user: req.user, ...req.query });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/v1/tickets/:id
  async getById(req, res) {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      return res.status(200).json({ success: true, data: ticket });
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }
  },

  // GET /api/v1/tickets/stats
  async getStats(req, res) {
    try {
      const stats = await ticketService.getStats(req.user);
      return res.status(200).json({ success: true, data: stats });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PUT /api/v1/tickets/:id/assign  — super admin only
  async assign(req, res) {
    try {
      const ticket = await ticketService.assignTicket(req.params.id, req.body, req.user);
      return res.status(200).json({ success: true, data: ticket, message: 'Ticket assigned' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // PUT /api/v1/tickets/:id/status  — super admin only
  async updateStatus(req, res) {
    try {
      const ticket = await ticketService.updateStatus(req.params.id, req.body);
      return res.status(200).json({ success: true, data: ticket, message: 'Status updated' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // ── Developer management (super admin only) ───────────────────────────────
  async getDevelopers(req, res) {
    try {
      const devs = await ticketService.getDevelopers();
      return res.status(200).json({ success: true, data: devs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async addDeveloper(req, res) {
    try {
      const dev = await ticketService.addDeveloper(req.body, req.user.id);
      return res.status(201).json({ success: true, data: dev, message: 'Developer added' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeDeveloper(req, res) {
    try {
      await ticketService.removeDeveloper(req.params.id);
      return res.status(200).json({ success: true, message: 'Developer removed' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // ── Developer portal ──────────────────────────────────────────────────────
  async developerLogin(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password required' });
      const result = await ticketService.developerLogin({ email, password });
      return res.status(200).json({ success: true, message: 'Login successful', ...result });
    } catch (err) {
      return res.status(401).json({ success: false, message: err.message });
    }
  },

  async developerLogout(req, res) {
    try {
      await ticketService.developerLogout(req.developer.id);
      return res.status(200).json({ success: true, message: 'Logged out' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async developerMe(req, res) {
    try {
      const { Developer } = await import('../models/developer.model.js');
      const dev = await Developer.findByPk(req.developer.id, {
        attributes: { exclude: ['password', 'token'] },
      });
      return res.status(200).json({ success: true, data: dev });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async developerTickets(req, res) {
    try {
      const result = await ticketService.getMyAssignedTickets({
        developer_id: req.developer.id,
        ...req.query,
      });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async developerUpdateStatus(req, res) {
    try {
      const ticket = await ticketService.updateStatus(req.params.id, req.body);
      return res.status(200).json({ success: true, data: ticket, message: 'Status updated' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

export default ticketController;
