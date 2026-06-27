import Ticket from '../models/ticket.model.js';
import Developer from '../models/developer.model.js';
import { Op } from 'sequelize';
import '../models/associations.js';
import bcrypt from 'bcrypt';
import { generateToken, generateRefreshToken } from '../../utils/token.js';
import { sendTicketCreatedEmail, sendTicketAssignedEmail } from './ticket.email.js';

const ticketService = {

  // ── Auto-generate ticket number ───────────────────────────────────────────
  async generateTicketNo() {
    const last = await Ticket.findOne({ order: [['createdAt', 'DESC']] });
    if (!last) return 'DBT-001';
    const match = last.ticket_no.match(/DBT-(\d+)/);
    const next = match ? parseInt(match[1]) + 1 : 1;
    return `DBT-${String(next).padStart(3, '0')}`;
  },

  // ── Create ticket ─────────────────────────────────────────────────────────
  async createTicket({ title, description, ticket_type, priority, attachments }, user) {
    const ticket_no = await this.generateTicketNo();
    const ticket = await Ticket.create({
      ticket_no,
      title,
      description,
      ticket_type: ticket_type || 'bug',
      priority:    priority    || 'medium',
      status:      'open',
      attachments: attachments || [],
      raised_by:       user.id,
      raised_by_name:  user.username,
      raised_by_email: user.email,
    });

    // Send email notification (non-blocking)
    sendTicketCreatedEmail(ticket.get({ plain: true })).catch(err =>
      console.error('[Ticket Email] Failed to send:', err.message)
    );

    return ticket;
  },

  // ── Get all tickets (super_admin sees all, others see own) ────────────────
  async getTickets({ user, status, ticket_type, page = 1, limit = 20 } = {}) {
    const where = {};
    if (user.role_name !== 'super admin') where.raised_by = user.id;
    if (status && status !== 'all')      where.status = status;
    if (ticket_type && ticket_type !== 'all') where.ticket_type = ticket_type;

    const { count, rows } = await Ticket.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } };
  },

  // ── Get single ticket ─────────────────────────────────────────────────────
  async getTicketById(id) {
    const t = await Ticket.findByPk(id);
    if (!t) throw new Error('Ticket not found');
    return t;
  },

  // ── Assign to developer (super_admin only) ────────────────────────────────
  async assignTicket(id, { developer_id, admin_notes }) {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) throw new Error('Ticket not found');

    const dev = await Developer.findByPk(developer_id);
    if (!dev) throw new Error('Developer not found');

    await ticket.update({
      assigned_to:       dev.id,
      assigned_to_name:  dev.name,
      assigned_to_email: dev.email,
      assigned_at:       new Date(),
      status:            'assigned',
      admin_notes:       admin_notes || ticket.admin_notes,
    });

    // Send email to developer (non-blocking)
    const updatedTicket = ticket.get({ plain: true });
    updatedTicket.admin_notes = admin_notes || ticket.admin_notes;
    sendTicketAssignedEmail(updatedTicket, dev.email, dev.name).catch(err =>
      console.error('[Ticket Email] Failed to send assignment email:', err.message)
    );

    return ticket;
  },

  // ── Update status (super_admin only) ──────────────────────────────────────
  async updateStatus(id, { status, admin_notes, completion_note }) {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) throw new Error('Ticket not found');

    const updates = { status };
    if (admin_notes)     updates.admin_notes     = admin_notes;
    if (completion_note) updates.completion_note = completion_note;
    if (status === 'completed') updates.resolved_at = new Date();
    if (status === 'approved')  updates.approved_at  = new Date();

    await ticket.update(updates);
    return ticket;
  },

  // ── Developers list ───────────────────────────────────────────────────────
  async getDevelopers() {
    return await Developer.findAll({
      where: { is_active: true },
      order: [['createdAt', 'DESC']],
    });
  },

  async addDeveloper({ name, email, phone, skills, password }, created_by) {
    if (!name || !email) throw new Error('Name and email are required');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

    const exists = await Developer.findOne({ where: { email } });
    if (exists) throw new Error('A developer with this email already exists');

    const hashed = await bcrypt.hash(password, 10);
    return await Developer.create({ name, email, phone: phone || null, skills: skills || '', password: hashed, created_by });
  },

  // ── Developer auth ────────────────────────────────────────────────────────
  async developerLogin({ email, password }) {
    const dev = await Developer.findOne({ where: { email, is_active: true } });
    if (!dev) throw new Error('Invalid credentials');
    if (!dev.password) throw new Error('Password not set. Contact super admin.');

    const valid = await bcrypt.compare(password, dev.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = generateToken({
      id: dev.id,
      username: dev.name,
      email: dev.email,
      role_name: 'developer',
    });

    await dev.update({ token });
    const data = dev.get({ plain: true });
    delete data.password;
    delete data.token;
    return { developer: data, token };
  },

  async developerLogout(id) {
    await Developer.update({ token: null }, { where: { id } });
  },

  // Developer's own tickets (assigned to them)
  async getMyAssignedTickets({ developer_id, status, page = 1, limit = 20 }) {
    const where = { assigned_to: developer_id };
    if (status && status !== 'all') where.status = status;
    const { count, rows } = await Ticket.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } };
  },

  async removeDeveloper(id) {
    const dev = await Developer.findByPk(id);
    if (!dev) throw new Error('Developer not found');
    await dev.update({ is_active: false });
  },

  // ── Stats for dashboard ───────────────────────────────────────────────────
  async getStats(user) {
    const where = user.role_name !== 'super admin' ? { raised_by: user.id } : {};
    const [open, assigned, in_progress, completed, approved] = await Promise.all([
      Ticket.count({ where: { ...where, status: 'open' } }),
      Ticket.count({ where: { ...where, status: 'assigned' } }),
      Ticket.count({ where: { ...where, status: 'in_progress' } }),
      Ticket.count({ where: { ...where, status: 'completed' } }),
      Ticket.count({ where: { ...where, status: 'approved' } }),
    ]);
    return { open, assigned, in_progress, completed, approved,
      total: open + assigned + in_progress + completed + approved };
  },
};

export default ticketService;
