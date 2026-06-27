import express from 'express';
import inwardRoutes from './inward.routes.js';

const router = express.Router();

router.use('/inward', inwardRoutes);

export default router;