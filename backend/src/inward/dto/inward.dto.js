// dto/inward.dto.js
import { z } from "zod";

// Inward Item Schema (Dress Shop)
const inwardItemSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  // Dress Shop Specific Fields
  size: z.string().max(20, "Size cannot exceed 20 characters").optional(),
  color: z.string().max(50, "Color cannot exceed 50 characters").optional(),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .min(1, "Quantity must be at least 1"),
  unit_price: z
    .number({ invalid_type_error: "Unit price must be a number" })
    .min(0, "Unit price cannot be negative")
    .default(0),
  unit: z.string().max(20, "Unit cannot exceed 20 characters").optional().default('piece'),
  total_price: z
    .number({ invalid_type_error: "Total price must be a number" })
    .min(0, "Total price cannot be negative")
    .default(0),
  expiry_date: z
    .string()
    .datetime("Expiry date must be a valid date")
    .optional(),
  batch_number: z
    .string()
    .max(50, "Batch number cannot exceed 50 characters")
    .optional(),
  barcode: z
    .string()
    .max(100, "Barcode cannot exceed 100 characters")
    .optional(),
});

// Inward Schema
export const createInwardSchema = z.object({
  inward_no: z
    .string()
    .min(1, "Inward number is required")
    .max(50, "Inward number cannot exceed 50 characters"),
  supplier_name: z
    .string()
    .min(1, "Supplier name is required")
    .max(100, "Supplier name cannot exceed 100 characters"),
  received_date: z
    .string()
    .datetime("Received date must be a valid datetime"),
  supplier_invoice: z.string().max(100, "Supplier invoice cannot exceed 100 characters").optional(),
  total_amount: z
    .number({ invalid_type_error: "Total amount must be a number" })
    .min(0, "Total amount cannot be negative"),
  total_quantity: z
    .number({ invalid_type_error: "Total quantity must be a number" })
    .min(0, "Total quantity cannot be negative"),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
  is_active: z.boolean().optional().default(true),

  // ✅ Array of inward items
  inward_items: z.array(inwardItemSchema).min(1, "At least one inward item is required"),
});

// ✅ For update (all optional)
export const updateInwardSchema = createInwardSchema.partial();
