import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import ticketController from '../controller/ticket.controller.js';
import { verifyToken } from '../../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Multer storage for attachments
const UPLOAD_DIR = path.join(__dirname, '../../../../public/uploads/tickets');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `ticket-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi|mp3|wav|ogg|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error(`File type .${ext} is not allowed`));
  },
});

// Developer JWT verify middleware
const verifyDeveloper = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Missing token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '3540e43edf1f1ed4811552d2b0d5a9fd1b4b23b8b7f0c48c83c621ed103454a6');
    if (decoded.role_name !== 'developer')
      return res.status(403).json({ success: false, message: 'Developer access only' });
    req.developer = decoded;
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Super admin check middleware
const isSuperAdmin = (req, res, next) => {
  if (req.user?.role_name === 'super admin') return next();
  return res.status(403).json({ success: false, message: 'Super admin only' });
};

const router = Router();

// ── All authenticated users ───────────────────────────────────────────────
router.get('/tickets/stats',      verifyToken, ticketController.getStats);
router.get('/tickets',            verifyToken, ticketController.getAll);
router.get('/tickets/:id',        verifyToken, ticketController.getById);
router.post('/tickets',           verifyToken, upload.array('attachments', 5), ticketController.create);

// ── Super admin only ──────────────────────────────────────────────────────
router.put('/tickets/:id/assign', verifyToken, isSuperAdmin, ticketController.assign);
router.put('/tickets/:id/status', verifyToken, isSuperAdmin, ticketController.updateStatus);
router.get('/developers',         verifyToken, isSuperAdmin, ticketController.getDevelopers);
router.post('/developers',        verifyToken, isSuperAdmin, ticketController.addDeveloper);
router.delete('/developers/:id',  verifyToken, isSuperAdmin, ticketController.removeDeveloper);

// ── Developer portal (developer JWT) ─────────────────────────────────────
router.post('/developer/login',          ticketController.developerLogin);
router.post('/developer/logout',         verifyDeveloper, ticketController.developerLogout);
router.get('/developer/me',              verifyDeveloper, ticketController.developerMe);
router.get('/developer/tickets',         verifyDeveloper, ticketController.developerTickets);
router.put('/developer/tickets/:id/status', verifyDeveloper, ticketController.developerUpdateStatus);

export default router;
