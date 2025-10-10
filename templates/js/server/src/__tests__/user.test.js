import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";
import User from "../models/userModel.js";
import { generateToken } from "../utils/authHelper.js";

describe("User API", () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;

  beforeEach(async () => {
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      isAdmin: true,
    });

    regularUser = await User.create({
      name: "Regular User",
      email: "user@example.com",
      password: "password123",
      isAdmin: false,
    });

    adminToken = generateToken(adminUser._id);
    userToken = generateToken(regularUser._id);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("GET /api/users", () => {
    it("should get users list for admin", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("users");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBe(2);
    });

    it("should return 403 for non-admin user", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.message).toContain("Admin privileges required");
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app).get("/api/users").expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.message).toContain("token missing");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/users?page=1&limit=1")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get user by id for admin", async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("name", "Regular User");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message", "User not found");
    });

    it("should return 403 for non-admin user", async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain("Admin privileges required");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user for admin", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "User updated successfully",
      );
      expect(response.body.user).toHaveProperty("name", "Updated Name");
      expect(response.body.user).toHaveProperty("email", "updated@example.com");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" })
        .expect(404);

      expect(response.body).toHaveProperty("message", "User not found");
    });

    it("should return 403 for non-admin user", async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Test" })
        .expect(403);

      expect(response.body.message).toContain("Admin privileges required");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user for admin", async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "User deleted successfully",
      );

      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message", "User not found");
    });

    it("should return 403 for non-admin user", async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain("Admin privileges required");
    });
  });
});
