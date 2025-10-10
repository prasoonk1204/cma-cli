import request from "supertest";
import app from "../server.js";
import User from "../models/userModel.js";
import { generateToken } from "../utils/authHelper.js";

describe("Auth API", () => {
  describe("POST /api/users/register", () => {
    it("should register a new user with valid data", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("registered successfully");
    });

    it("should return 400 for invalid email", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Validation failed");
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for short password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "123",
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Validation failed");
    });

    it("should return 409 for duplicate email", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      await User.create(userData);

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("already exists");
    });
  });

  describe("POST /api/users/login", () => {
    beforeEach(async () => {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should login with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 401 for invalid email", async () => {
      const loginData = {
        email: "wrong@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty(
        "message",
        "Invalid email or password",
      );
    });

    it("should return 401 for invalid password", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/users/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty(
        "message",
        "Invalid email or password",
      );
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({ email: "test@example.com" })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Validation failed");
    });
  });

  describe("POST /api/users/logout", () => {
    it("should logout successfully", async () => {
      const user = new User({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
      await user.save();
      const token = generateToken(user._id);

      const response = await request(app)
        .post("/api/users/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Logged out successfully",
      );
    });
  });

  describe("POST /api/users/forgot", () => {
    beforeEach(async () => {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should send reset email for valid email", async () => {
      const response = await request(app)
        .post("/api/users/forgot")
        .send({ email: "test@example.com" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.message).toContain("reset link was sent");
    });

    it("should return generic message for invalid email", async () => {
      const response = await request(app)
        .post("/api/users/forgot")
        .send({ email: "nonexistent@example.com" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.message).toContain("reset link was sent");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/users/forgot")
        .send({ email: "invalid-email" })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Validation failed");
    });
  });
});
