import { validationResult } from "express-validator";

// Validation error handler middleware
// Checks for validation errors and returns formatted response
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(), // Array of validation error objects
    });
  }
  next(); // No errors, continue to next middleware
};
