//role.dto.js
import { z } from "zod";

export const createRoleSchema = z.object({
  role_name: z
    .string()
    .min(3, "Role name must be at least 3 characters")
    .max(20, "Role name cannot exceed 20 characters"),
  description: z
    .string()
    .max(100, "Description cannot exceed 100 characters")
    .optional(),
});

export const updateRoleSchema = z.object({
  role_name: z
    .string()
    .min(3, "Role name must be at least 3 characters")
    .max(20, "Role name cannot exceed 20 characters")
    .optional(),
  description: z
    .string()
    .max(100, "Description cannot exceed 100 characters")
    .optional(),
});
