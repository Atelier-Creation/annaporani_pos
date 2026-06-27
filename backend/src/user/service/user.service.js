import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import "../models/associations.js"; // Import associations
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { generateToken, generateRefreshToken } from "../../utils/token.js";

const userService = {
  // 🔹 Create a new user
  async createUser({ username, email, password, phone, role_id, created_by }) {
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new Error("Email already exists");

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashed,
      phone,
      role_id,
      created_by,
    });

    const userData = user.get({ plain: true });
    delete userData.password;
    delete userData.token;

    return userData;
  },

  // 🔹 Get all active users with pagination
  async getUsers(params = {}) {
    const { page = 1, limit = 10, search = '' } = params;
    const offset = (page - 1) * limit;

    const whereClause = { is_active: true };

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password", "token"] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'role_name', 'description']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  },

  // 🔹 Get user by ID
  async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password", "token"] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'role_name', 'description']
      }]
    });
    if (!user) throw new Error("User not found");
    return user;
  },

  // 🔹 Get current user (by token payload)
  async getMe(id) {
    return await this.getUserById(id);
  },

  // 🔹 Login user (email or phone)
  async loginUser({ identifier, password }) {
    console.log("=== SERVICE LOGIN DEBUG ===");
    console.log("1. Looking for user with identifier:", identifier);

    // Import Permission model here to avoid circular dependency if any, or just ensure it's available
    const { Permission } = await import("../models/associations.js");

    const user = await User.findOne({
      where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
      include: [
        {
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }
      ]
    });

    console.log("2. User found:", user ? `Yes (ID: ${user.id}, Username: ${user.username})` : "No");

    if (!user) {
      console.log("3. ERROR: User not found");
      throw new Error("Invalid credentials");
    }

    console.log("3. Comparing password...");
    const valid = await bcrypt.compare(password, user.password);
    console.log("4. Password valid:", valid);

    if (!valid) {
      console.log("5. ERROR: Invalid password");
      throw new Error("Invalid credentials");
    }

    console.log("5. Password correct, generating tokens...");

    // Extract permission codes into a simple array of strings
    const permissions = user.role?.permissions?.map(p => p.code) || [];

    // Generate access & refresh tokens
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role?.role_name,
      permissions: permissions
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    console.log("6. Tokens generated, updating user record...");

    // Save access token in DB
    await user.update({ token });

    console.log("7. Login complete for user:", user.username);

    // Prepare user object for response (AFTER updating token in DB)
    const userData = user.get({ plain: true });
    delete userData.password;
    delete userData.token; // Remove token from user object
    userData.permissions = permissions; // Send permissions in response body too (optional, but helpful for UI state)

    console.log("=== SERVICE LOGIN DEBUG END ===");

    return { user: userData, token, refreshToken };
  },

  // 🔹 Refresh access token
  async refreshAccessToken(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const newToken = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
    });

    await user.update({ token: newToken });
    return newToken;
  },

  // 🔹 Logout user
  async logoutUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    await user.update({ token: null });
    return true;
  },

  // 🔹 Update user by ID
  async updateUserById(id, updateData, updated_by) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.update({ ...updateData, updated_by });
    const userData = user.get({ plain: true });
    delete userData.password;
    delete userData.token;
    return userData;
  },

  // 🔹 Soft delete user
  async softDeleteUser(id, deleted_by) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.update({ is_active: false, deleted_by });
    return true;
  },

  // 🔹 Restore user
  async restoreUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.update({ is_active: true, deleted_by: null });
    return true;
  },

  // 🔹 Change password
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error("Old password is incorrect");

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });
    return true;
  },

  // 🔹 Send OTP token (dummy placeholder)
  async sendOtpToken(identifier) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Save OTP in DB/Redis and send via email/SMS if needed
    return otp;
  },

  // 🔹 Check if user already exists
  async userAlreadyExists(email) {
    const user = await User.findOne({ where: { email } });
    return !!user;
  },
};

export default userService;
