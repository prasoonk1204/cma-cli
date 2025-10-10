import express, { type Express } from "express";
import cors from "cors";
import type { CorsOptions } from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import connectDB from "./config/connectDB.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();

// Environment variable validation
const requiredEnvVars = ["NODE_ENV"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} is not set, using default value`);
  }
});

const app: Express = express();
app.disable("x-powered-by");
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
  "http://localhost:5173",
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware with security limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Logging
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (_req, res) => {
  const healthResponse = {
    message: "Server is running !",
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  };

  res.status(200).json(healthResponse);
});

// API routes
app.use("/api", routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to database if MongoDB URI is provided
    if (process.env.MONGODB_URI) {
      await connectDB();
      console.log("✅ Database connected successfully");
    } else {
      console.log("⚠️  No MongoDB URI provided, running without database");
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      console.log(
        `📊 Health check available at http://localhost:${PORT}/health`,
      );
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Try another port.`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();

export default app;
