// routes/permission.routes.js
import express from "express";
import permissionController from "../controller/permission.controller.js";
import { verifyToken } from "../../middleware/auth.js";

const router = express.Router();

// All permission routes require authentication
router.get('/permission/all', verifyToken, permissionController.getAllFlat);   // for dropdowns
router.get('/permission', verifyToken, permissionController.getAll);            // paginated
router.get('/permission/:id', verifyToken, permissionController.getById);
router.post('/permission', verifyToken, permissionController.create);
router.put('/permission/:id', verifyToken, permissionController.update);
router.delete('/permission/:id', verifyToken, permissionController.delete);

export default router;
