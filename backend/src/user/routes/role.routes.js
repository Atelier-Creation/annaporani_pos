// routes/role.routes.js
import express from "express";
import roleController from "../controller/role.controller.js";

const router = express.Router();

router.post('/role', roleController.create);
router.get('/role', roleController.getAll);
router.get('/role/:id', roleController.getById);
router.put('/role/:id', roleController.update);
router.delete('/role/:id', roleController.delete);

export default router;
