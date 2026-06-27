// routes/report.routes.js
import express from "express";
import reportController from "../controller/report.controller.js";
import { verifyToken } from "../../middleware/auth.js";
import { authenticateBranch } from "../../middleware/authenticateBranch.js";

const router = express.Router();

/**
 * @route   GET /api/v1/billing/reports/sales
 * @desc    Get sales report with payment method breakdown
 * @access  Private (requires authentication and branch access)
 * @query   period: today|this_month|this_year|custom
 * @query   startDate: ISO date string (required for custom period)
 * @query   endDate: ISO date string (required for custom period)
 */
router.get(
  "/sales",
  verifyToken,
  authenticateBranch({ allowMultipleBranches: true }),
  reportController.getSalesReport
);

/**
 * @route   GET /api/v1/billing/reports/source-wise
 * @desc    Get source-wise billing report
 * @access  Private (requires authentication and branch access)
 * @query   period: today|this_month|this_year|custom
 * @query   startDate: ISO date string (required for custom period)
 * @query   endDate: ISO date string (required for custom period)
 */
router.get(
  "/source-wise",
  verifyToken,
  authenticateBranch({ allowMultipleBranches: true }),
  reportController.getSourceWiseReport
);

export default router;
