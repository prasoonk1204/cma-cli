import { body } from "express-validator";

// Authentication validation rules using express-validator

// User registration validation
export const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// User login validation
export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Forgot password validation
export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

// Password reset validation
export const resetPasswordValidation = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];
