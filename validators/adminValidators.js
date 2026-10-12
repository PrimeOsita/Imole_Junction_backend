const { z } = require('zod');

const languageEnum = z.enum(['en', 'yo', 'pcm']);

const translationSchema = z.object({
  language: languageEnum,
  prompt: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).optional(),
  correctAnswer: z.string().trim().optional(),
});

const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const createChallengeSchema = z.object({
  skillId: z.string().length(24, 'must be a valid ID'),
  type: z.enum(['text', 'multiple_choice']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  isActive: z.boolean().optional(),
  translations: z.array(translationSchema).min(1),
});

const updateChallengeSchema = z.object({
  skillId: z.string().length(24).optional(),
  type: z.enum(['text', 'multiple_choice']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  isActive: z.boolean().optional(),
});

const updateTranslationSchema = z.object({
  prompt: z.string().trim().min(1).optional(),
  options: z.array(z.string().trim().min(1)).optional(),
  correctAnswer: z.string().trim().optional(),
});
const createAdminSchema = z.object({
  name: z.string().trim().min(1, 'is required'),
  email: z.string().trim().email(),
  password: z.string().min(8, 'must be at least 8 characters'),
  role: z.enum(['content_manager', 'super_admin']),
});

const updateAdminSchema = z
  .object({
    role: z.enum(['content_manager', 'super_admin']).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8, 'must be at least 8 characters').optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Provide at least one of role, isActive or password',
  });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'is required'),
  newPassword: z.string().min(8, 'must be at least 8 characters'),
});

module.exports = {
  translationSchema,
  adminLoginSchema,
  createChallengeSchema,
  updateChallengeSchema,
  updateTranslationSchema,
  createAdminSchema,
  updateAdminSchema,
  changePasswordSchema,
};