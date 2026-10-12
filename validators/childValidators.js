const { z } = require('zod');

const createChildSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(50),
  age: z.number().int().min(8, 'must be at least 8').max(16, 'must be 16 or under'),
  preferredLanguage: z.enum(['en', 'yo', 'pcm']).optional(),
});

const updateChildSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  preferredLanguage: z.enum(['en', 'yo', 'pcm']).optional(),
});

// Either a text response or a selected option must be provided.
const submitChallengeSchema = z
  .object({
    responseText: z.string().trim().max(2000).optional(),
    selectedOption: z.string().trim().max(200).optional(),
  })
  .refine((body) => body.responseText || body.selectedOption, {
    message: 'Provide either responseText or selectedOption',
  });

module.exports = { createChildSchema, updateChildSchema, submitChallengeSchema };