// dto/subcategory.dto.js
import { z } from "zod";

// ✅ Schema for creating a subcategory
export const createSubcategorySchema = z.object({
  subcategory_name: z
    .string()
    .min(1, "Subcategory name is required")
    .max(100, "Subcategory name cannot exceed 100 characters"),
  category_id: z.string().uuid("Category ID must be a valid UUID"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  is_active: z.boolean().optional().default(true),
});

// ✅ Schema for updating a subcategory (all fields optional)
export const updateSubcategorySchema = createSubcategorySchema.partial();
