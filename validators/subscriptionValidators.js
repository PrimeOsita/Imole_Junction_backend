const { z } = require('zod');

const startPremiumCheckoutSchema = z.object({
  billingInterval: z.enum(['monthly', 'yearly']).optional(),
});

const verifyPremiumPaymentSchema = z.object({
  txRef: z.string().trim().min(1).max(128),
  transactionId: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d+$/, 'must be a numeric Flutterwave transaction ID'),
  ]),
});

module.exports = { startPremiumCheckoutSchema, verifyPremiumPaymentSchema };
