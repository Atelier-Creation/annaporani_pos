// dto/product.dto.js
import { z } from "zod";

//  Schema for creating a product (Dress Shop)
export const createProductSchema = z.object({
  product_name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name cannot exceed 100 characters"),
  product_code: z
    .string()
    .min(1, "Product code is required")
    .max(50, "Product code cannot exceed 50 characters").optional(),
  category_id: z.string().uuid("Category ID must be a valid UUID").optional().nullable(),
  sub_category_id: z.string().uuid("Subcategory ID must be a valid UUID").optional().nullable(),
  brand: z.string().max(50, "Brand cannot exceed 50 characters").optional(),
  
  // Sweet/Snack Shop Specific Fields
  portion_size: z.string().max(50, "Portion size cannot exceed 50 characters").optional(),
  dietary_preference: z.enum(['Veg', 'Non-Veg', 'Vegan', 'Eggless', 'Sugar-Free']).optional().default('Veg'),
  shelf_life: z.string().max(50, "Shelf life cannot exceed 50 characters").optional(),
  allergen_info: z.string().max(255, "Allergen info cannot exceed 255 characters").optional(),
  temperature: z.enum(['Hot', 'Cold', 'Room Temperature']).optional(),
  preparation_time: z.string().max(50, "Preparation time cannot exceed 50 characters").optional(),

  
  unit: z.string().max(20, "Unit cannot exceed 20 characters").optional().default('piece'),
  purchase_price: z
    .number({ invalid_type_error: "Purchase price must be a number" })
    .min(0, "Purchase price cannot be negative")
    .optional()
    .default(0),
  selling_price: z
    .number({ invalid_type_error: "Selling price must be a number" })
    .min(0, "Selling price cannot be negative")
    .optional()
    .default(0),
  mrp: z
    .number({ invalid_type_error: "MRP must be a number" })
    .min(0, "MRP cannot be negative")
    .optional(),
  discount_percentage: z
    .number({ invalid_type_error: "Discount percentage must be a number" })
    .min(0, "Discount percentage cannot be negative")
    .max(100, "Discount percentage cannot exceed 100")
    .optional()
    .default(0),
  tax_percentage: z
    .number({ invalid_type_error: "Tax percentage must be a number" })
    .min(0, "Tax percentage cannot be negative")
    .max(100, "Tax percentage cannot exceed 100")
    .optional()
    .default(0),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  care_instructions: z.string().max(500, "Care instructions cannot exceed 500 characters").optional(),
  barcode: z.string().max(100, "Barcode cannot exceed 100 characters").optional(),
  sku: z.string().max(100, "SKU cannot exceed 100 characters").optional(),
  image_url: z.string().url("Invalid image URL").max(255).optional(),
  status: z.enum(["active", "inactive", "out_of_stock"]).optional().default("active"),
  is_active: z.boolean().optional().default(true),
});

// ✅ Schema for updating a product (all fields optional)
export const updateProductSchema = createProductSchema.partial();
