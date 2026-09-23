import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { setupTestDB } from "./setup.js";

setupTestDB();

describe("Auth Service — Registration", () => {
  test("registers a new user with valid details and returns safe user data and JWT", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "family.test@example.com",
        password: "password123",
        role: "FAMILY",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/registered successfully/i);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("user");

    const { user, token } = res.body.data;
    expect(user.email).toBe("family.test@example.com");
    expect(user.role).toBe("FAMILY");
    expect(user.accountType).toBe("FAMILY_ACCOUNT");
    expect(user).toHaveProperty("userId");
    expect(user).toHaveProperty("referenceId");
    expect(Array.isArray(user.family_member_ids)).toBe(true);
    expect(user.family_member_ids.length).toBeGreaterThan(0);

    // Password must NEVER be returned
    expect(user.password).toBeUndefined();
    expect(user.password_hash).toBeUndefined();

    // Verify password is hashed in database
    const savedUser = await User.findOne({ email: "family.test@example.com" });
    expect(savedUser).toBeDefined();
    expect(savedUser.password_hash).not.toBe("password123");
    expect(savedUser.password_hash.startsWith("$2")).toBe(true);

    // Verify token contains required claims
    const decoded = jwt.decode(token);
    expect(decoded.userId).toBe(user.userId);
    expect(decoded.role).toBe("FAMILY");
    expect(decoded.referenceId).toBe(user.referenceId);
    expect(decoded.family_member_ids).toEqual(user.family_member_ids);
  });

  test("rejects duplicate email with 409 Conflict", async () => {
    // Register first user
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "duplicate@example.com",
        password: "password123",
      });

    // Attempt second registration with same email
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "DUPLICATE@example.com", // Case insensitive duplicate
        password: "differentPassword123",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("rejects missing or empty email with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        password: "password123",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email/i);
  });

  test("rejects invalid email format with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "not-an-email",
        password: "password123",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("rejects password shorter than 6 characters with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "shortpass@example.com",
        password: "12345",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/at least 6 characters/i);
  });

  test("rejects invalid role with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "invalidrole@example.com",
        password: "password123",
        role: "SUPER_ADMIN",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid role/i);
  });
});

describe("Auth Service — Login", () => {
  beforeEach(async () => {
    // Seed test user
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "login.user@example.com",
        password: "secretPassword123",
        role: "DOCTOR",
      });
  });

  test("successfully logs in with valid credentials and returns JWT with required claims", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login.user@example.com",
        password: "secretPassword123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/login successful/i);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("user");

    const { user, token } = res.body.data;
    expect(user.email).toBe("login.user@example.com");
    expect(user.role).toBe("DOCTOR");
    expect(user.password).toBeUndefined();
    expect(user.password_hash).toBeUndefined();

    // Verify JWT claims
    const decoded = jwt.decode(token);
    expect(decoded.userId).toBe(user.userId);
    expect(decoded.role).toBe("DOCTOR");
    expect(decoded.referenceId).toBe(user.referenceId);
    expect(Array.isArray(decoded.family_member_ids)).toBe(true);
  });

  test("rejects invalid password with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login.user@example.com",
        password: "WRONG_PASSWORD_HERE",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test("rejects nonexistent user with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "ghost.user@example.com",
        password: "somePassword123",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test("rejects missing email or password with 400 Bad Request", async () => {
    const resNoPass = await request(app)
      .post("/api/auth/login")
      .send({ email: "login.user@example.com" });
    expect(resNoPass.status).toBe(400);

    const resNoEmail = await request(app)
      .post("/api/auth/login")
      .send({ password: "somePassword123" });
    expect(resNoEmail.status).toBe(400);
  });
});

describe("Auth Service — Authentication & Profile (/api/auth/me)", () => {
  let validToken;
  let registeredUser;

  beforeEach(async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        email: "profile.test@example.com",
        password: "password123",
        role: "FAMILY",
      });
    validToken = regRes.body.data.token;
    registeredUser = regRes.body.data.user;
  });

  test("GET /api/auth/me returns authenticated user's safe profile with valid JWT", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(registeredUser.userId);
    expect(res.body.data.email).toBe(registeredUser.email);
    expect(res.body.data.role).toBe("FAMILY");
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.password_hash).toBeUndefined();
  });

  test("rejects missing Authorization header with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Authentication required/i);
  });

  test("rejects malformed Authorization header with 401 Unauthorized", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Basic some_basic_token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Authentication required/i);
  });

  test("rejects invalid signature token with 401 Unauthorized", async () => {
    const forgedToken = jwt.sign(
      { userId: "fake_id", role: "CHAIRMAN" },
      "wrong_secret_key_used_for_forgery"
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  test("rejects expired token with 401 Unauthorized", async () => {
    const expiredToken = jwt.sign(
      { userId: registeredUser.userId, role: "FAMILY" },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" }
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/expired/i);
  });
});
