import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const basePassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[0-9]/, 'Include at least one number')

export const organizationSignupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .regex(/^[0-9+\-\s()]+$/, 'Digits, spaces and +()- only'),
  password: basePassword,
  address: z.string().min(5, 'Address is required'),
  capacity: z
    .coerce.number({ invalid_type_error: 'Enter a number' })
    .int('Whole numbers only')
    .positive('Must be greater than zero'),
  notes: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  max_distance_km: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().positive().optional()),
  food_preferences: z.string().optional(),
})
