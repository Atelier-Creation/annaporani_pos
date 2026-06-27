import express from 'express';
import stockRoutes from './stock.routes.js';

const router = express.Router();

router.use('/stock', stockRoutes);

export default router;
