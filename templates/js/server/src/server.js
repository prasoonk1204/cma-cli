// Core dependencies for Express server
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; // Security headers
import compression from "compression"; // Response compression
import rateLimit from "express-rate-limit"; // Rate limiting
import morgan from "morgan"; // HTTP request logger
import cookieParser from "cookie-parser"; // Parse cookies

// Application modules
import connectDB from "./config/connectDB.js";
import validateEnv from "./config/validateEnv.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// Load environment variables and validate them
dotenv.config();
validateEnv();

const app = express();
app.disable("x-powered-by"); // Remove Express signature for security

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Security and performance middleware
app.use(helmet()); // Set security headers
app.use(compression()); // Compress responses
app.use(express.json({ limit: "1mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// CORS configuration - allow specific origins
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Allow cookies
  }),
);

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Max requests per window
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// HTTP request logging
if (NODE_ENV === "development") {
  app.use(morgan("dev")); // Concise output for development
} else {
  app.use(morgan("combined")); // Standard Apache combined log format
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Server is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// API routes
app.use("/api", routes);

// Error handling middleware (must be last)
app.use(notFound); // Handle 404 errors
app.use(errorHandler); // Handle all other errors

if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      if (process.env.MONGODB_URI) {
        await connectDB();
        console.log("✅ Database connected successfully");
      } else {
        console.log("⚠️  No MongoDB URI provided, running without database");
      }

      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
        console.log(
          `📊 Health check available at http://localhost:${PORT}/health`,
        );
      });
    } catch (error) {
      console.error(
        "❌ Failed to start server:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  })();
}

export default app;
