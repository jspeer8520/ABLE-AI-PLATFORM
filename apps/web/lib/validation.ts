import { z } from 'zod';

/**
 * Client-side auth validation schemas. These mirror the backend validators
 * (`backend/src/api/validators/auth.validators.ts`) so users get immediate
 * feedback; the backend remains the authoritative validator.
 */

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .max(120, 'Name must be at most 120 characters')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
