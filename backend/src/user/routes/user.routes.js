import { Router } from "express";
import userController from "../controller/user.controller.js";
// (optionally) import authMiddleware to protect routes
import { verifyToken } from "../../middleware/auth.js";
const router = Router();

// Specific routes MUST come before parameterized routes
// PUBLIC ROUTES (no auth required)
router.post("/login", (req, res, next) => {
  console.log("=== LOGIN ROUTE HIT ===");
  console.log("Body:", req.body);
  console.log("Headers:", req.headers);
  next();
}, userController.loginUser);

router.post("/logout", userController.logoutUser);
router.post("/refresh-token", userController.refreshAccessToken);
router.post("/send-otp", userController.sendOtpToken);
router.get("/exists", userController.userAlreadyExists);

// PROTECTED ROUTES (auth required)
// IMPORTANT: /me routes MUST come before /:id to avoid being caught by the parameterized route
router.get("/me", verifyToken, userController.getMe);
router.get("/me/profile", verifyToken, userController.getMe);
router.post("/change-password", verifyToken, userController.changePassword);

// CRUD routes
router.post("/", userController.createUser);
router.get("/", userController.getUsers);

// Parameterized routes MUST come last to avoid catching specific routes
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUserById);
router.delete("/:id", userController.softDeleteUser);
router.patch("/:id/restore", userController.restoreUser);

export default router;
