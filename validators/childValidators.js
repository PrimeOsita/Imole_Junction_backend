const { z } = require('zod');

const createChildSchema = z.object({
  FirstName: z.string().trim().min(1, 'is required').max(50),
  LastName: z.string().trim().min(1, 'is required').max(50),
  UserName: z.string().trim().min(1, 'is required').max(50),
  ageRange: z.enum(['6-9', '10-13', '14-17'], {
    errorMap: () => ({ message: 'must be one of: 6-9, 10-13, or 14-17' }),
  }),
  preferredLanguage: z.enum(['en', 'yo', 'pcm']).optional(),
});

const updateChildSchema = z.object({
  FirstName: z.string().trim().min(1).max(50).optional(),
  LastName: z.string().trim().min(1).max(50).optional(),
  UserName: z.string().trim().min(1).max(50).optional(),
  ageRange: z.enum(['6-9', '10-13', '14-17']).optional(),
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