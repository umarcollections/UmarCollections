import { z } from 'zod';

// Mirrors backend/src/validators/auth/auth.schema.js so users see the
// same rules before the request is sent
export const PASSWORD_MIN = 6;

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .pipe(z.email('Please provide a valid email'));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  email: emailField,
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .max(72, 'Password must be at most 72 characters'),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    password: signupSchema.shape.password,
    confirmPassword: z.string().min(1, 'Type the new password again'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "The passwords don't match",
    path: ['confirmPassword'],
  });
