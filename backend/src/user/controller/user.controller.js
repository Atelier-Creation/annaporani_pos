// // controllers/user.controller.js
// import userService from "../service/user.service.js";
// import { registerSchema, userLoginSchema } from "../dto/user.dto.js";

// const userController = {
//   // 🔹 Register
//   async register(req, res) {
//     try {
//       // Validate request
//       const data = registerSchema.body.parse(req.body);

//       const user = await userService.register(data);
//       return res.status(201).json({ message: "User registered", user });
//     } catch (err) {
//       return res.status(400).json({ error: err.message || err.errors });
//     }
//   },

//   // 🔹 Login
//   async login(req, res) {
//     try {
//       const data = userLoginSchema.body.parse(req.body);

//       // Here, identifier can be email or phone
//       const identifier = data.identifier;
//       const password = data.password;

//       const result = await userService.login({ identifier, password });
//       return res.json({ message: "Login successful", ...result });
//     } catch (err) {
//       return res.status(400).json({ error: err.message || err.errors });
//     }
//   },

//   // 🔹 Get User Profile
//   async profile(req, res) {
//     try {
//       const user = await userService.getUserById(req.params.id);
//       return res.json({ user });
//     } catch (err) {
//       return res.status(404).json({ error: err.message });
//     }
//   },
// };

// export default userController;


import userService from "../service/user.service.js";
import {
  registerSchema,
  userLoginSchema,
  updateUserSchema,
} from "../dto/user.dto.js";
import { decodeRefreshToken, generateToken, generateRefreshToken } from "../../utils/token.js";

const userController = {
  async createUser(req, res) {
    try {
      console.log('=== CREATE USER ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Use role_id from body, or role if that's what's sent
      const payload = {
        ...req.body,
        role_id: req.body.role_id || req.body.role,
      };
      
      console.log('Payload after mapping:', JSON.stringify(payload, null, 2));
      
      const data = registerSchema.body.parse(payload);
      const user = await userService.createUser(data);
      
      console.log('User created successfully:', user.id);
      console.log('===================');
      
      res.status(201).json({ message: "User created", user });
    } catch (err) {
      console.log('ERROR creating user:', err.message);
      console.log('===================');
      res.status(400).json({ error: err.message });
    }
  },

  async getUsers(req, res) {
    try {
      const result = await userService.getUsers(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json(user);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async getMe(req, res) {
    try {
      console.log('=== GET ME ===');
      console.log('req.user:', req.user);
      
      if (!req.user || !req.user.id) {
        console.log('ERROR: req.user or req.user.id is undefined');
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      console.log('Fetching user with ID:', req.user.id);
      const user = await userService.getMe(req.user.id);
      console.log('User found:', user.username);
      console.log('===================');
      
      res.json(user);
    } catch (err) {
      console.log('ERROR in getMe:', err.message);
      console.log('===================');
      res.status(404).json({ error: err.message });
    }
  },

  async loginUser(req, res) {
    try {
      console.log("=== LOGIN DEBUG START ===");
      console.log("1. Raw Request Body:", JSON.stringify(req.body, null, 2));
      console.log("2. Request Headers:", JSON.stringify(req.headers, null, 2));
      
      const data = userLoginSchema.body.parse(req.body);
      console.log("3. Parsed Data:", JSON.stringify(data, null, 2));
      
      if (!data.identifier || !data.password) {
        console.log("4. ERROR: Missing identifier or password");
        return res.status(400).json({ error: "Identifier and password are required" });
      }

      console.log("5. Calling userService.loginUser...");
      const result = await userService.loginUser(data);
      console.log("6. Login successful, user:", result.user.username);
      console.log("=== LOGIN DEBUG END ===");
      
      res.json({ message: "Login success", ...result });
    } catch (err) {
      console.log("=== LOGIN ERROR ===");
      console.log("Error message:", err.message);
      console.log("Error stack:", err.stack);
      console.log("===================");
      res.status(400).json({ error: err.message });
    }
  },

  async updateUserById(req, res) {
    try {
      console.log('=== UPDATE USER ===');
      console.log('Request params:', req.params);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request user:', req.user);
      
      const data = updateUserSchema.body.parse(req.body);
      
      // Get updated_by from req.user if available, otherwise null
      const updatedBy = req.user?.id || null;
      
      console.log('Parsed data:', JSON.stringify(data, null, 2));
      console.log('Updated by:', updatedBy);
      
      const user = await userService.updateUserById(
        req.params.id,
        data,
        updatedBy
      );
      
      console.log('User updated successfully');
      console.log('===================');
      
      res.json({ message: "User updated", user });
    } catch (err) {
      console.log('ERROR updating user:', err.message);
      console.log('Error stack:', err.stack);
      console.log('===================');
      res.status(400).json({ error: err.message });
    }
  },

  async softDeleteUser(req, res) {
    try {
      await userService.softDeleteUser(req.params.id, req.user.id);
      res.json({ message: "User soft deleted" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async restoreUser(req, res) {
    try {
      await userService.restoreUser(req.params.id);
      res.json({ message: "User restored" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },


async refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token missing" });

    // Decode refresh token
    const decoded = decodeRefreshToken(refreshToken);
    if (!decoded?.id) return res.status(400).json({ error: "Invalid refresh token" });

    // Generate new access token
    const accessToken = await userService.refreshAccessToken(decoded.id);

    // Generate a new refresh token
    const newRefreshToken = generateRefreshToken({ id: decoded.id });

    res.json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
},


  async logoutUser(req, res) {
    try {
      await userService.logoutUser(req.user.id);
      res.json({ message: "Logged out" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async sendOtpToken(req, res) {
    try {
      const otp = await userService.sendOtpToken(req.body.identifier);
      res.json({ message: "OTP sent", otp });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async userAlreadyExists(req, res) {
    const exists = await userService.userAlreadyExists(req.query.email);
    res.json({ exists });
  },

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      await userService.changePassword(req.user.id, oldPassword, newPassword);
      res.json({ message: "Password changed" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

export default userController;
