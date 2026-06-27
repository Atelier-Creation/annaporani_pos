// dto/category.dto.js
import { z } from "zod";

// ✅ Schema for creating a category
export const createCategorySchema = z.object({
  category_name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .nullable()
    .optional()
    .transform(val => val || null),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  is_active: z.boolean().optional().default(true),
});

// ✅ Schema for updating a category (all fields optional)
export const updateCategorySchema = createCategorySchema.partial();
