// routes/inward.routes.js
import express from "express";
import inwardController from "../controller/inward.controller.js";
import { verifyToken } from "../../middleware/auth.js";
import { authenticateBranch, authenticateBranchRole } from "../../middleware/authenticateBranch.js";

const router = express.Router();

// ✅ Create a new inward with items - requires branch access
router.post("/inward", verifyToken, authenticateBranch(), inwardController.create);

// ✅ Get all inwards (with filters + pagination) - allows multiple branches
router.get("/inward", verifyToken, authenticateBranch(true), inwardController.getAll);

// ✅ Get inward by ID (with items) - requires branch access
router.get("/inward/:id", verifyToken, authenticateBranch(), inwardController.getById);

// ✅ Update inward by ID (with items) - requires manager/admin role
router.put("/inward/:id", verifyToken, authenticateBranch(), inwardController.update);

// ✅ Delete inward by ID (soft delete) - requires admin role
router.delete("/inward/:id", verifyToken, authenticateBranch(), authenticateBranchRole(['admin']), inwardController.delete);

export default router;
