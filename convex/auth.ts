import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a random auth token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simple hash function for passwords (in production, use bcrypt or similar)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16) + "_" + password.length + "_" + password.split("").reverse().join("");
}

// Create an anonymous user
export const createAnonymousUser = mutation({
  args: {},
  handler: async (ctx) => {
    const authToken = generateToken();
    const userId = await ctx.db.insert("users", {
      authToken,
      createdAt: Date.now(),
    });
    return { userId, authToken };
  },
});

// Get user by auth token
export const getUser = query({
  args: { authToken: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_token", (q) => q.eq("authToken", args.authToken))
      .first();
    return user;
  },
});

// Login with email (creates user if doesn't exist, or returns existing)
export const loginWithEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Check if user with this email exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      return { userId: existingUser._id, authToken: existingUser.authToken };
    }

    // Create new user with email
    const authToken = generateToken();
    const userId = await ctx.db.insert("users", {
      authToken,
      email: args.email,
      createdAt: Date.now(),
    });
    return { userId, authToken };
  },
});

// Link email to existing anonymous user
export const linkEmail = mutation({
  args: { authToken: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_token", (q) => q.eq("authToken", args.authToken))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if email is already in use
    const existingWithEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingWithEmail && existingWithEmail._id !== user._id) {
      throw new Error("Email already in use");
    }

    await ctx.db.patch(user._id, { email: args.email });
    return { success: true };
  },
});

// Admin login
export const adminLogin = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!admin) {
      throw new Error("Invalid credentials");
    }

    const passwordHash = hashPassword(args.password);
    if (admin.passwordHash !== passwordHash) {
      throw new Error("Invalid credentials");
    }

    // Return admin info (in production, create a session token)
    return { adminId: admin._id, email: admin.email };
  },
});

// Seed admin account (run once to create initial admin)
export const seedAdmin = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    // Check if admin already exists
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return { success: false, message: "Admin already exists" };
    }

    const passwordHash = hashPassword(args.password);
    await ctx.db.insert("admins", {
      email: args.email,
      passwordHash,
      createdAt: Date.now(),
    });

    return { success: true, message: "Admin created successfully" };
  },
});

// Verify admin by email (for session validation)
export const verifyAdmin = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return admin ? { adminId: admin._id, email: admin.email } : null;
  },
});
