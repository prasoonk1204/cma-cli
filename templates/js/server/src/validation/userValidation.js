import { body, query } from "express-validator";

// User management validation rules

// User update validation (admin only)
export const updateUserValidation = [
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
];

// Query parameter validation for pagination
export const queryValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(), // Max 100 items per page
];
