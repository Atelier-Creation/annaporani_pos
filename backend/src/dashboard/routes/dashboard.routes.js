// routes/dashboard.routes.js
import express from "express";
import { getDashboardData, getDashboardSummary, getRecentBills, getRevenueByDate } from "../controller/dashboard.controller.js";
import { verifyToken } from "../../middleware/auth.js";
import { authenticateBranch } from "../../middleware/authenticateBranch.js";

const router = express.Router();

// Test route to verify routing is working
router.get("/test", (req, res) => {
  res.json({ message: "Dashboard routes are working!" });
});

// ✅ Comprehensive dashboard data (new endpoint)
router.get("/data", verifyToken, authenticateBranch(true), getDashboardData);

// ✅ Dashboard summary (total bills, users, products, revenue) - legacy  
router.get("/summary", verifyToken, authenticateBranch(true), getDashboardSummary);

// ✅ Recent bills with items - legacy
router.get("/recent-bills", verifyToken, authenticateBranch(true), getRecentBills);

// ✅ Revenue grouped by date (last 7 days) - legacy
router.get("/revenue", verifyToken, authenticateBranch(true), getRevenueByDate);

export default router;
