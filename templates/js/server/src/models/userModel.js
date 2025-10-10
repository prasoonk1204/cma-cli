import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// User model schema with authentication features
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false }, // Hidden by default
    isAdmin: { type: Boolean, default: false },
    // Password reset functionality
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    // Email verification functionality
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
  },
  { timestamps: true }, // Adds createdAt and updatedAt
);

// Hash password before saving to database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12); // Higher salt rounds for security
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare provided password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token (expires in 1 hour)
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  // Store hashed version in database
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken; // Return unhashed token for email
};

// Generate email verification token
userSchema.methods.createVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  // Store hashed version in database
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  return token; // Return unhashed token for email
};

const User = mongoose.model("User", userSchema);
export default User;
