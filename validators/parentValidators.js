const { z } = require('zod');

const registerParentSchema = z
  .object({
    name: z.string().trim().min(1, 'is required'),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(7).optional(),
    password: z.string().min(8, 'must be at least 8 characters'),
  })
  .refine((body) => body.email || body.phone, {
    message: 'Provide an email or a phone number',
  });

const loginParentSchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(7).optional(),
    password: z.string().min(1, 'is required'),
  })
  .refine((body) => body.email || body.phone, {
    message: 'Provide an email or a phone number',
  });

const linkChildSchema = z.object({
  linkCode: z.string().trim().min(6).max(6),
});

module.exports = { registerParentSchema, loginParentSchema, linkChildSchema };