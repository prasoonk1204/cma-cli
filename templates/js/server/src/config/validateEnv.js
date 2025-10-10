// Environment variable validation
// Ensures all required environment variables are present before server starts
const validateEnv = () => {
  const isTest = process.env.NODE_ENV === "test";

  // Core required variables
  const requiredEnvVars = ["JWT_SECRET"];

  // Database not required in test environment (uses in-memory DB)
  if (!isTest) {
    requiredEnvVars.push("MONGODB_URI");
  }

  // Check for missing required variables
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((envVar) => console.error(`   - ${envVar}`));
    console.error(
      "\n💡 Copy .env.example to .env and fill in the required values",
    );
    process.exit(1);
  }

  // Security warnings
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn(
      "⚠️  JWT_SECRET should be at least 32 characters long for security",
    );
  }

  // Optional service warnings
  if (!process.env.SMTP_HOST && !isTest) {
    console.warn(
      "⚠️  Email service not configured - password reset and verification emails will fail",
    );
  }

  if (!isTest) {
    console.log("✅ Environment variables validated successfully");
  }
};

export default validateEnv;
