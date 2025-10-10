import { Router } from "express";
// Authentication controllers
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";
// User management controllers
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
// Authentication middleware
import { protect, admin } from "../middleware/authMiddleware.js";
// Validation middleware
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../validation/authValidation.js";
import {
  updateUserValidation,
  queryValidation,
} from "../validation/userValidation.js";
import { handleValidationErrors } from "../validation/validationHandler.js";

const router = Router();

// Authentication routes (public)
router.post("/register", registerValidation, handleValidationErrors, register);
router.post("/login", loginValidation, handleValidationErrors, login);
router.post("/logout", protect, logout); // Requires authentication
router.post(
  "/forgot",
  forgotPasswordValidation,
  handleValidationErrors,
  forgotPassword,
);
router.post(
  "/reset/:token",
  resetPasswordValidation,
  handleValidationErrors,
  resetPassword,
);
router.get("/verify-email", verifyEmail); // Email verification callback

// User management routes (admin only)
router.get(
  "/",
  protect,
  admin,
  queryValidation,
  handleValidationErrors,
  getUsers,
);
router.get("/:id", protect, admin, getUserById);
router.put(
  "/:id",
  protect,
  admin,
  updateUserValidation,
  handleValidationErrors,
  updateUser,
);
router.delete("/:id", protect, admin, deleteUser);

export default router;
