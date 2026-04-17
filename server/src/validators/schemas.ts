import { z } from "zod";

// Product registration schema (matches SPEC.md POST /api/products)
export const createProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters").max(255),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  sku: z.string().min(3, "SKU must be at least 3 characters").max(100),
  origin: z.string().min(2, "Origin must be specified"),
  harvestDate: z.string().datetime("Invalid harvest date format").optional(),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.enum(["kg", "tons", "liters", "units"], {
    errorMap: () => ({ message: "Invalid unit. Must be one of: kg, tons, liters, units" })
  }),
  certification: z.string().optional(),
  farmerId: z.string().min(1, "Farmer ID required"),
  geolocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Checkpoint creation schema (matches SPEC.md POST /api/checkpoints)
export const createCheckpointSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional()
  }),
  timestamp: z.string().datetime("Invalid timestamp format"),
  handler: z.object({
    id: z.string().min(1, "Handler ID required"),
    name: z.string().min(1, "Handler name required"),
    role: z.enum(["farmer", "logistics", "distributor", "retailer"], {
      errorMap: () => ({ message: "Invalid role" })
    })
  }),
  status: z.enum(["harvested", "processed", "shipped", "delivered", "verified"], {
    errorMap: () => ({ message: "Invalid status" })
  }),
  notes: z.string().max(500).optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  photoUrl: z.string().url().optional()
});

export type CreateCheckpointInput = z.infer<typeof createCheckpointSchema>;

// Authentication schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["farmer", "logistics", "auditor"], {
    errorMap: () => ({ message: "Invalid role. Must be one of: farmer, logistics, auditor" })
  })
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Verification schema (public endpoint)
export const verifyProductSchema = z.object({
  productId: z.string().min(1, "Product ID required")
});

export type VerifyProductInput = z.infer<typeof verifyProductSchema>;
