import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import User from "../models/user.js";
import type { IUser } from "../models/user.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import generateToken from "../utils/generateToken.js";
import { sanitizeQuery } from "../middleware/querySanitizer.js";

const router = Router();

interface PaginationQuery {
  page?: string;
  limit?: string;
}

// Get all users (admin only)
router.get(
  "/",
  protect,
  admin,
  sanitizeQuery,
  async (
    req: Request<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      PaginationQuery
    >,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const page = parseInt(req.query.page || "1");
      const limit = parseInt(req.query.limit || "10");
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments();

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get user by ID (admin only)
router.get(
  "/:id",
  protect,
  admin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.params.id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "name" in error &&
        error.name === "CastError"
      ) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      next(error);
    }
  },
);

// Create new user
router.post(
  "/",
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
      }

      const user = new User({ name, email, password });
      await user.save();

      const token = generateToken(user._id);

      // Remove password from response
      const userResponse = user.toObject();
      delete (userResponse as unknown as Record<string, unknown>).password;

      res.status(201).json({
        message: "User created successfully",
        user: userResponse,
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

// User login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (user && (await user.comparePassword(password))) {
        // Generate token
        const token = generateToken(user._id);

        // Remove password from response
        const userResponse = user.toObject();
        delete (userResponse as unknown as Record<string, unknown>).password;

        res.json({
          message: "Login successful",
          user: userResponse,
          token,
        });
      } else {
        res.status(401).json({ message: "Invalid email or password" });
      }
    } catch (error) {
      next(error);
    }
  },
);

// Update user (admin only)
router.put(
  "/:id",
  protect,
  admin,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { name, email } = req.body;
      const updateData: Partial<IUser> = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;

      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User updated successfully",
        user,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "name" in error &&
        error.name === "CastError"
      ) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      if (error instanceof Error && "code" in error && error.code === 11000) {
        return res.status(409).json({ message: "Email already exists" });
      }
      next(error);
    }
  },
);

// Delete user (admin only)
router.delete(
  "/:id",
  protect,
  admin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "name" in error &&
        error.name === "CastError"
      ) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      next(error);
    }
  },
);

export default router;
