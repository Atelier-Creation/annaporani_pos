// dto/billing.dto.js
import { z } from "zod";

// Billing Item Schema (Dress Shop)
const billingItemSchema = z.object({
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
  mrp: z
    .number({ invalid_type_error: "MRP must be a number" })
    .min(0, "MRP cannot be negative")
    .optional(),
  discount_percentage: z
    .number({ invalid_type_error: "Discount percentage must be a number" })
    .min(0, "Discount percentage cannot be negative")
    .max(100, "Discount percentage cannot exceed 100")
    .default(0),
  total_price: z
    .number({ invalid_type_error: "Total price must be a number" })
    .min(0, "Total price cannot be negative")
    .default(0),
  discount: z
    .number({ invalid_type_error: "Discount must be a number" })
    .min(0, "Discount cannot be negative")
    .default(0),
  tax: z
    .number({ invalid_type_error: "Tax must be a number" })
    .min(0, "Tax cannot be negative")
    .default(0),
  barcode: z
    .string()
    .max(100, "Barcode cannot exceed 100 characters")
    .optional(),
});

// Split Payment Item Schema
const splitPaymentItemSchema = z.object({
  method: z.enum([
    'cash',
    'credit_card',
    'debit_card',
    'UPI Current Account',
    'UPI Normal Account',
    'net_banking'
  ], {
    errorMap: () => ({ message: "Invalid payment method" })
  }),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0, "Amount cannot be negative")
});

// Billing Schema
export const createBillingSchema = z.object({
  bill_no: z
    .string()
    .min(1, "Bill number is required")
    .max(50, "Bill number cannot exceed 50 characters"),
  type: z
    .enum(["Casier Billing", "Customer Billing", "other"])
    .default("Casier Billing"),

  customer_name: z
    .string()
    .min(1, "Customer name is required")
    .max(100, "Customer name cannot exceed 100 characters"),
  customer_phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Customer phone must be 10 digits")
    .optional(),
  coupon_code: z
    .string()
    .max(20, "Coupon code cannot exceed 20 characters")
    .optional()
    .nullable(),
  billing_date: z
    .string()
    .datetime("Billing date must be a valid datetime"),
  counter_no: z
    .enum(['Counter 1', 'Counter 2', 'Counter 3', 'Counter 4', 'Counter 5'])
    .optional(),
  tax_amount: z
    .number({ invalid_type_error: "Tax amount must be a number" })
    .min(0, "Tax amount cannot be negative"),
  discount_amount: z
    .number({ invalid_type_error: "Discount amount must be a number" })
    .min(0, "Discount amount cannot be negative"),
  coupon_discount: z
    .number({ invalid_type_error: "Coupon discount must be a number" })
    .min(0, "Coupon discount cannot be negative")
    .default(0),
  total_amount: z
    .number({ invalid_type_error: "Total amount must be a number" })
    .min(0, "Total amount cannot be negative"),
  paid_amount: z
    .number({ invalid_type_error: "Paid amount must be a number" })
    .min(0, "Paid amount cannot be negative")
    .optional(),
  payment_method: z
    .enum([
      'cash',
      'credit_card',
      'debit_card',
      'UPI Current Account',
      'UPI Normal Account',
      'net_banking',
      'split'
    ])
    .default("cash"),
  payment_details: z
    .array(splitPaymentItemSchema)
    .min(1, "Split payment must have at least one payment method")
    .optional()
    .nullable(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  total_quantity: z
    .number({ invalid_type_error: "Total quantity must be a number" })
    .min(0, "Total quantity cannot be negative"),
  status: z
    .enum(["pending", "paid", "partially_paid", "cancelled"]),
  is_active: z.boolean().optional().default(true),
  branch_id: z.string().uuid("Branch ID must be a valid UUID").optional(),

  billing_items: z
    .array(billingItemSchema)
    .min(1, "At least one billing item is required"),
}).refine(
  (data) => {
    // If payment method is 'split', payment_details must be provided
    if (data.payment_method === 'split') {
      return data.payment_details && data.payment_details.length > 0;
    }
    return true;
  },
  {
    message: "Split payment requires payment_details array",
    path: ["payment_details"],
  }
).refine(
  (data) => {
    // If payment method is 'split', validate total matches
    if (data.payment_method === 'split' && data.payment_details) {
      const splitTotal = data.payment_details.reduce((sum, p) => sum + p.amount, 0);
      // Allow small floating point differences (0.01)
      return Math.abs(splitTotal - data.total_amount) < 0.01;
    }
    return true;
  },
  {
    message: "Split payment total must equal bill total amount",
    path: ["payment_details"],
  }
);

export const updateBillingSchema = createBillingSchema.partial();
