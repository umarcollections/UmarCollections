import { z } from 'zod';

// Shared field rules, reused by the users validators
export const nameField = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name is required')
  .max(50, 'Name must be at most 50 characters');

export const emailField = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Please provide a valid email'));

export const passwordField = z
  .string({ error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password must be at most 72 characters'); // bcrypt only uses the first 72 bytes

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z.object({
  token: z
    .string({ error: 'Reset link is missing' })
    .trim()
    .min(1, 'Reset link is missing')
    .max(200),
  password: passwordField,
});

// The ID token Google's sign-in button hands the browser
export const googleLoginSchema = z.object({
  credential: z
    .string({ error: 'Google sign-in failed, please try again' })
    .min(1, 'Google sign-in failed, please try again')
    .max(4096),
});
