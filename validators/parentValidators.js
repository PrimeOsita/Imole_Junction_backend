// const { z } = require('zod');

// const registerParentSchema = z
//   .object({
//     name: z.string().trim().min(1, 'is required'),
//     email: z.string().trim().email().optional(),
//     phone: z.string().trim().min(7).optional(),
//     password: z.string().min(8, 'must be at least 8 characters'),
//   })
//   .refine((body) => body.email || body.phone, {
//     message: 'Provide an email or a phone number',
//   });

// const loginParentSchema = z
//   .object({
//     email: z.string().trim().email().optional(),
//     phone: z.string().trim().min(7).optional(),
//     password: z.string().min(1, 'is required'),
//   })
//   .refine((body) => body.email || body.phone, {
//     message: 'Provide an email or a phone number',
//   });

// const verifyParentEmailSchema = z.object({
//   email: z.string().trim().email(),
//   otp: z.string().regex(/^\d{4}$/, 'must be a 4-digit verification code'),
// });

// const resendParentEmailOtpSchema = z.object({
//   email: z.string().trim().email(),
// });

// const linkChildSchema = z.object({
//   linkCode: z.string().trim().min(6).max(6),
// });

// module.exports = {
//   registerParentSchema,
//   loginParentSchema,
//   verifyParentEmailSchema,
//   resendParentEmailOtpSchema,
//   linkChildSchema,
// };

const { z } = require('zod');

// Leave empty to accept any real email domain. To accept Gmail only, use ['gmail.com'].
const ALLOWED_EMAIL_DOMAINS = [];

// letters/digits/._%+- before the @, a real domain with a 2+ letter ending after it
const EMAIL_PATTERN = /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

// Nigerian mobile: 0 + (7|8|9) + (0|1) + 8 digits, or the same after +234 / 234
const NIGERIAN_MOBILE = /^(?:\+?234|0)([789][01]\d{8})$/;

// Strict, used only when creating an account. Login, verify and resend keep the
// lenient email check so older accounts can still get in.
const registrationEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'is too long')
  .regex(EMAIL_PATTERN, 'must be a valid email address')
  .refine((email) => !email.includes('..'), 'must be a valid email address')
  .refine(
    (email) => ALLOWED_EMAIL_DOMAINS.length === 0 || ALLOWED_EMAIL_DOMAINS.includes(email.split('@')[1]),
    `must be a ${ALLOWED_EMAIL_DOMAINS.join(' or ')} address`
  );

// Accepts 0801 234 5678, 08012345678, 2348012345678 or +2348012345678 and always
// hands the service the same format: +2348012345678
const nigerianPhone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-()]/g, ''))
  .refine((value) => NIGERIAN_MOBILE.test(value), {
    message: 'must be a valid Nigerian mobile number, for example 08012345678 or +2348012345678',
  })
  .transform((value) => `+234${value.match(NIGERIAN_MOBILE)[1]}`);

// bcrypt only reads the first 72 bytes, so longer passwords are refused instead of silently cut
const strongPassword = z
  .string()
  .min(8, 'must be at least 8 characters')
  .regex(/[a-z]/, 'must include a lowercase letter')
  .regex(/[A-Z]/, 'must include an uppercase letter')
  .regex(/\d/, 'must include a number')
  .regex(/[^A-Za-z0-9]/, 'must include a special character, for example ! @ # $')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'must be 72 characters or fewer');

const registerParentSchema = z.object({
  name: z.string().trim().min(1, 'is required'),
  email: registrationEmail,
  phone: nigerianPhone.optional(),
  password: strongPassword,
});

const loginParentSchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: nigerianPhone.optional(),
    password: z.string().min(1, 'is required'),
  })
  .refine((body) => body.email || body.phone, {
    message: 'Provide an email or a phone number',
  });

const verifyParentEmailSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().regex(/^\d{4}$/, 'must be a 4-digit verification code'),
});

const resendParentEmailOtpSchema = z.object({
  email: z.string().trim().email(),
});

const linkChildSchema = z.object({
  linkCode: z.string().trim().min(6).max(6),
});
console.log('Parent validators loaded successfully');
module.exports = {
  registerParentSchema,
  loginParentSchema,
  verifyParentEmailSchema,
  resendParentEmailOtpSchema,
  linkChildSchema,
};

