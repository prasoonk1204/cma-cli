// @ts-nocheck
import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  if (process.env.NODE_ENV === "test") {
    return { messageId: "test-message-id" };
  }

  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Auth System",
      link: process.env.FRONTEND_URL || "http://localhost:3000",
    },
  });

  if (!mailGenerator.product.link) {
    throw new Error(
      "FRONTEND_URL environment variable is required for email links",
    );
  }

  const requiredEnvVars = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required SMTP environment variables: ${missing.join(", ")}`,
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const emailHtml = mailGenerator.generate(options.mailgenContent);
  const emailText = mailGenerator.generatePlaintext(options.mailgenContent);

  const mail = {
    from: process.env.EMAIL_FROM || `"Auth System" <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailHtml,
  };

  try {
    const result = await transporter.sendMail(mail);
    return result;
  } catch (error) {
    console.error("Email sending failed. Check your SMTP credentials in .env.");
    console.error("Error:", error);
    throw error;
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => ({
  body: {
    name: username,
    intro: "Welcome to Auth System! We're very excited to have you on board.",
    action: {
      instructions: "To verify your email, please click the button below:",
      button: {
        color: "#22BC66",
        text: "Verify your email",
        link: verificationUrl,
      },
    },
    outro:
      "Need help or have questions? Just reply to this email, we'd love to help.",
  },
});

const forgotPasswordMailgenContent = (username, passwordResetUrl) => ({
  body: {
    name: username,
    intro: "We received a request to reset your password.",
    action: {
      instructions: "Click the button below to reset your password:",
      button: {
        color: "#22BC66",
        text: "Reset password",
        link: passwordResetUrl,
      },
    },
    outro: "If you didn't request a password reset, please ignore this email.",
  },
});

const welcomeMailgenContent = (username) => ({
  body: {
    name: username,
    intro:
      "Welcome to Auth System! Your account has been successfully created.",
    action: {
      instructions: "Get started by exploring our features:",
      button: {
        color: "#22BC66",
        text: "Get Started",
        link: process.env.FRONTEND_URL || "https://localhost:3000",
      },
    },
    outro:
      "Need help or have questions? Just reply to this email, we'd love to help.",
  },
});

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  welcomeMailgenContent,
};
