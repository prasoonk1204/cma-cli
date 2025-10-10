import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Authentication middleware - protects routes requiring login

// Verify JWT token and attach user to request
export const protect = async (req, res, next) => {
  try {
    // Extract token from cookie or Authorization header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or no longer exists",
      });
    }

    // Attach user to request object for use in route handlers
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    const msg =
      err.name === "TokenExpiredError"
        ? "Session expired, please log in again"
        : "Not authorized, invalid token";

    res.status(401).json({
      success: false,
      message: msg,
    });
  }
};

// Admin authorization middleware - requires admin privileges
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();

  return res.status(403).json({
    success: false,
    message: "Admin privileges required",
  });
};
