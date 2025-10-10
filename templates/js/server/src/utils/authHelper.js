import jwt from "jsonwebtoken";

// Authentication helper utilities

// Generate JWT token for user authentication
export const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Parse duration string (e.g., "7d", "24h", "60m") to milliseconds
const parseDuration = (str) => {
  if (!str) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  const num = parseInt(str.slice(0, -1));
  const unit = str.slice(-1);
  switch (unit) {
    case "d":
      return num * 24 * 60 * 60 * 1000; // Days
    case "h":
      return num * 60 * 60 * 1000; // Hours
    case "m":
      return num * 60 * 1000; // Minutes
    default:
      return parseInt(str) || 7 * 24 * 60 * 60 * 1000;
  }
};

// Set secure HTTP-only cookie with JWT token
export const setTokenCookie = (res, token) => {
  const cookieExpires = process.env.COOKIE_EXPIRES_IN || "7d";
  const options = {
    httpOnly: true, // Prevent XSS attacks
    sameSite: "lax", // CSRF protection
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    expires: new Date(Date.now() + parseDuration(cookieExpires)),
  };
  res.cookie("token", token, options);
};

// Send standardized error response
export const sendError = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};
