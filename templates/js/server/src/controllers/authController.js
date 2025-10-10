import crypto from "crypto";
import User from "../models/userModel.js";
import {
  generateToken,
  setTokenCookie,
  sendError,
} from "../utils/authHelper.js";
import {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  welcomeMailgenContent,
} from "../utils/sendEmail.js";

// Authentication controller - handles user registration, login, password reset, etc.

// Register new user and send verification email
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return sendError(res, 400, "All fields are required");

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return sendError(res, 409, "User with this email already exists");

    // Create new user and generate verification token
    const user = await User.create({ name, email, password });
    const verificationToken = user.createVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}&id=${user._id}`;

    await sendEmail({
      email: user.email,
      subject: "Verify your email - Auth System",
      mailgenContent: emailVerificationMailgenContent(
        user.name,
        verificationUrl,
      ),
    }).catch(async (emailError) => {
      console.error("Email send error:", emailError);
      await User.findByIdAndDelete(user._id);
      throw new Error("Failed to send verification email");
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. Verification email sent.",
    });
  } catch (error) {
    console.error("Register Error:", error);
    sendError(res, 500, "Internal server error");
  }
};

// Authenticate user and return JWT token
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return sendError(res, 400, "Email and password are required");

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return sendError(res, 401, "Invalid email or password");

    // Generate JWT token and set cookie
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Remove password from response
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    sendError(res, 500, "Internal server error");
  }
};

// Clear authentication cookie to log out user
export const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // Expire immediately
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    sendError(res, 500, "Internal server error");
  }
};

// Send password reset email to user
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, "Email is required");

    const user = await User.findOne({ email });
    // Always return success message to prevent email enumeration
    if (!user)
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a reset link was sent",
      });

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/password-reset?token=${resetToken}&id=${user._id}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request - Auth System",
        mailgenContent: forgotPasswordMailgenContent(user.name, resetUrl),
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Clean up tokens if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return sendError(res, 500, "Error sending email");
    }

    res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link was sent",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    sendError(res, 500, "Internal server error");
  }
};

// Reset user password using reset token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token || !password)
      return sendError(res, 400, "Token and password are required");

    // Hash the token to match stored version
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Token not expired
    }).select("+password");

    if (!user) return sendError(res, 400, "Token is invalid or expired");

    // Update password and clear reset tokens
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log user in automatically after password reset
    const jwtToken = generateToken(user._id);
    setTokenCookie(res, jwtToken);

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      user: userData,
      token: jwtToken,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    sendError(res, 500, "Internal server error");
  }
};

// Verify user email using verification token
export const verifyEmail = async (req, res) => {
  try {
    const { token, id } = req.query;
    if (!token || !id)
      return sendError(res, 400, "Invalid or missing verification link");

    // Hash the token to match stored version
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findById(id);

    if (!user) return sendError(res, 404, "User not found");
    if (user.verificationToken !== hashedToken)
      return sendError(res, 400, "Invalid verification token");

    // Mark user as verified and clear verification token
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    await sendEmail({
      email: user.email,
      subject: "Welcome to Auth System!",
      mailgenContent: welcomeMailgenContent(user.name),
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify Email Error:", error);
    sendError(res, 500, "Internal server error");
  }
};
