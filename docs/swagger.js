// OpenAPI 3 documentation for the IMOLE API.
// Served by server.js at /api-docs (see the lines to add there).

const languages = ['en', 'yo', 'pcm'];
const skillSlugs = [
  'mental_math',
  'persuasive_speaking',
  'financial_literacy',
  'creative_problem_solving',
  'emotional_intelligence',
];

// ---------- small helpers so the paths below stay readable ----------
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const reply = (description, schema) => ({ description, content: json(schema) });
const body = (schema) => ({ required: true, content: json(schema) });
const bearer = (scheme) => [{ [scheme]: [] }];
const pathParam = (name, description) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string' },
});

const errorRefs = {
  400: 'BadRequest',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'NotFound',
  409: 'Conflict',
  429: 'TooManyRequests',
};
const errors = (...codes) =>
  Object.fromEntries(codes.map((code) => [code, { $ref: `#/components/responses/${errorRefs[code]}` }]));

const dateTime = { type: 'string', format: 'date-time' };
const objectId = { type: 'string', example: '65f1c2a9b3d4e5f6a7b8c9d0' };

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'IMOLE API',
    version: '1.0.0',
    description: [
      'Backend for IMOLE, a gamified life-skills platform for Nigerian children aged 8-16.',
      '',
      '**Three kinds of user, three kinds of login. Use the Authorize button (top right) to set the token(s) you need:**',
      '- **childToken**: returned once by `POST /children`. Children have no password; this token is their credential.',
      '- **parentJwt**: returned by `POST /parents/register` or `POST /parents/login`.',
      '- **adminJwt**: returned by `POST /admin/login`.',
      '',
      'Every response has a `success` boolean. Errors look like `{ "success": false, "message": "..." }`.',
    ].join('\n'),
  },
  // Relative URL: works on localhost and on Render without editing.
//   /api/v1
 servers: [
    {
      url: 'http://localhost:8000/api/v1',
      description: 'Local development server',
    },
    {
      url: 'https://imole-junction-backend.onrender.com/api/v1',
      description: 'Render production server',
    },
  ],
  tags: [
    { name: 'Skills', description: 'The 5 life skills. Public, no token needed.' },
    { name: 'Child', description: 'Everything a child does in the app. Uses the child token.' },
    { name: 'Parent', description: 'Parent accounts, linking to a child, and progress views.' },
    { name: 'Admin - Auth & Accounts', description: 'Admin login and managing admin accounts.' },
    { name: 'Admin - Challenges', description: 'Challenge library and Yoruba/Pidgin translations.' },
    { name: 'Admin - Analytics', description: 'Platform metrics and CSV export (super admin only).' },
  ],

  components: {
    securitySchemes: {
      childToken: {
        type: 'http',
        scheme: 'bearer',
        description: 'Opaque token returned by POST /children. Paste only the token.',
      },
      parentJwt: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      adminJwt: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },

    responses: {
      BadRequest: reply('Invalid input (missing or wrong fields, bad ID, etc.)', ref('Error')),
      Unauthorized: reply('Missing, invalid or expired token, or wrong credentials', ref('Error')),
      Forbidden: reply('Authenticated, but not allowed to do this', ref('Error')),
      NotFound: reply('The requested record does not exist', ref('Error')),
      Conflict: reply('The request conflicts with the current state (duplicate, already done, limit reached)', ref('Error')),
      TooManyRequests: reply('Rate limit hit, try again later', ref('Error')),
    },

    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Something went wrong' },
        },
      },
      Child: {
        type: 'object',
        properties: {
          _id: objectId,
          name: { type: 'string', example: 'Ada' },
          age: { type: 'integer', minimum: 8, maximum: 16, example: 10 },
          preferredLanguage: { type: 'string', enum: languages },
          anonymousUsername: { type: 'string', example: 'SwiftLeopard482' },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      ChildSummary: {
        type: 'object',
        properties: {
          _id: objectId,
          name: { type: 'string', example: 'Ada' },
          anonymousUsername: { type: 'string', example: 'SwiftLeopard482' },
          age: { type: 'integer', example: 10 },
        },
      },
      Skill: {
        type: 'object',
        properties: {
          _id: objectId,
          slug: { type: 'string', enum: skillSlugs },
          name: { type: 'string', example: 'Mental Math' },
        },
      },
      Translation: {
        type: 'object',
        required: ['language', 'prompt'],
        properties: {
          language: { type: 'string', enum: languages },
          prompt: { type: 'string', example: 'What is 12 + 15?' },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'Only for multiple_choice challenges',
            example: ['25', '27', '29', '31'],
          },
          correctAnswer: { type: 'string', description: 'Only for multiple_choice challenges', example: '27' },
        },
      },
      Challenge: {
        type: 'object',
        properties: {
          _id: objectId,
          skillId: objectId,
          type: { type: 'string', enum: ['text', 'multiple_choice'] },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          isActive: { type: 'boolean' },
          createdBy: objectId,
          translations: { type: 'array', items: ref('Translation') },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      TodayChallenge: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          assignmentId: objectId,
          locked: { type: 'boolean', description: 'true once the child has submitted today' },
          swapsRemaining: { type: 'integer', example: 2 },
          completedAt: { ...dateTime, nullable: true },
          challenge: {
            type: 'object',
            description: 'One language only, and never includes the correct answer',
            properties: {
              id: objectId,
              skillId: objectId,
              type: { type: 'string', enum: ['text', 'multiple_choice'] },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              language: { type: 'string', enum: languages },
              prompt: { type: 'string' },
              options: { type: 'array', items: { type: 'string' }, description: 'Empty for text challenges' },
            },
          },
        },
      },
      Streak: {
        type: 'object',
        properties: {
          _id: objectId,
          childId: objectId,
          currentStreak: { type: 'integer', example: 3 },
          bestStreak: { type: 'integer', example: 5 },
          lastActiveDate: { ...dateTime, nullable: true },
        },
      },
      Feedback: {
        type: 'object',
        properties: {
          encouragement: { type: 'string', example: 'Great job, you got it!' },
          educationalTip: { type: 'string', nullable: true, example: 'Tip: breaking a big number into smaller parts makes mental math faster.' },
          skillFeedback: { type: 'string', example: 'This was a Mental Math challenge. Every one you complete builds that skill.' },
        },
      },
      SubmitResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          submission: {
            type: 'object',
            properties: {
              _id: objectId,
              dailyAssignmentId: objectId,
              childId: objectId,
              responseText: { type: 'string' },
              selectedOption: { type: 'string' },
              isCorrect: { type: 'boolean', nullable: true },
              submittedAt: dateTime,
            },
          },
          isCorrect: { type: 'boolean', nullable: true, description: 'null for text challenges (not auto-graded)' },
          pointsEarned: { type: 'integer', description: '10 if correct, 5 otherwise', example: 10 },
          correctAnswer: { type: 'string', nullable: true, description: 'null for text challenges' },
          streak: ref('Streak'),
          feedback: ref('Feedback'),
        },
      },
      SkillScore: {
        type: 'object',
        properties: {
          skill: ref('Skill'),
          score: { type: 'integer', example: 40 },
          challengesCompleted: { type: 'integer', example: 6 },
        },
      },
      LeaderboardRow: {
        type: 'object',
        properties: {
          rank: { type: 'integer', example: 1 },
          anonymousUsername: { type: 'string', example: 'SwiftLeopard482' },
          points: { type: 'integer', example: 120 },
          currentStreak: { type: 'integer', example: 4 },
        },
      },
      Certificate: {
        type: 'object',
        properties: {
          _id: objectId,
          childId: objectId,
          skillId: ref('Skill'),
          title: { type: 'string', example: 'Mental Math Champion' },
          issuedAt: dateTime,
          fileUrl: { type: 'string', nullable: true, description: 'Not generated yet; the frontend renders the certificate from this data' },
        },
      },
      Admin: {
        type: 'object',
        properties: {
          id: objectId,
          name: { type: 'string', example: 'Product Manager' },
          email: { type: 'string', example: 'pm@example.com' },
          role: { type: 'string', enum: ['content_manager', 'super_admin'] },
          isActive: { type: 'boolean' },
          createdAt: dateTime,
        },
      },
      Metrics: {
        type: 'object',
        properties: {
          totalChildren: { type: 'integer' },
          dau: { type: 'integer', description: 'Children who submitted today' },
          mau: { type: 'integer', description: 'Children who submitted in the last 30 days' },
          todayAssignments: { type: 'integer' },
          todayCompletions: { type: 'integer' },
          completionRate: { type: 'number', example: 0.75 },
          averageCurrentStreak: { type: 'number' },
          longestStreak: { type: 'integer' },
        },
      },
    },
  },

  paths: {
    // ====================== SKILLS ======================
    '/skills': {
      get: {
        tags: ['Skills'],
        summary: 'List all skills',
        responses: {
          200: reply('The 5 skills', {
            type: 'object',
            properties: { success: { type: 'boolean' }, skills: { type: 'array', items: ref('Skill') } },
          }),
        },
      },
    },
    '/skills/{id}': {
      get: {
        tags: ['Skills'],
        summary: 'Get one skill by ID',
        parameters: [pathParam('id', 'Skill ID')],
        responses: {
          200: reply('The skill', {
            type: 'object',
            properties: { success: { type: 'boolean' }, skill: ref('Skill') },
          }),
          ...errors(400, 404),
        },
      },
    },

    // ====================== CHILD ======================
    '/children': {
      post: {
        tags: ['Child'],
        summary: 'Create a child profile (onboarding)',
        description:
          'No login needed. Returns a token ONCE. The app must store it and send it as a Bearer token on every other child request.',
        requestBody: body({
          type: 'object',
          required: ['name', 'age'],
          properties: {
            name: { type: 'string', example: 'Ada' },
            age: { type: 'integer', minimum: 8, maximum: 16, example: 10 },
            preferredLanguage: { type: 'string', enum: languages, default: 'en' },
          },
        }),
        responses: {
          201: reply('Profile created', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              childId: objectId,
              anonymousUsername: { type: 'string', example: 'SwiftLeopard482' },
              token: { type: 'string', description: 'Shown only this once' },
            },
          }),
          ...errors(400),
        },
      },
    },
    '/children/me': {
      get: {
        tags: ['Child'],
        summary: 'Get my profile',
        security: bearer('childToken'),
        responses: {
          200: reply('My profile', {
            type: 'object',
            properties: { success: { type: 'boolean' }, child: ref('Child') },
          }),
          ...errors(401, 404),
        },
      },
      patch: {
        tags: ['Child'],
        summary: 'Update my name or language',
        security: bearer('childToken'),
        requestBody: body({
          type: 'object',
          properties: {
            name: { type: 'string' },
            preferredLanguage: { type: 'string', enum: languages },
          },
        }),
        responses: {
          200: reply('Updated profile', {
            type: 'object',
            properties: { success: { type: 'boolean' }, child: ref('Child') },
          }),
          ...errors(400, 401, 404),
        },
      },
    },
    '/children/me/challenge/today': {
      get: {
        tags: ['Child'],
        summary: "Get today's challenge",
        description:
          'Creates today\'s challenge on first call and returns the same one for the rest of the day. The prompt is in the child\'s language (English if no translation exists). `type` tells the app what to show: option buttons for `multiple_choice`, a text box for `text`.',
        security: bearer('childToken'),
        responses: { 200: reply("Today's challenge", ref('TodayChallenge')), ...errors(401) },
      },
    },
    '/children/me/challenge/today/submit': {
      post: {
        tags: ['Child'],
        summary: "Submit an answer to today's challenge",
        description:
          'Send `selectedOption` for multiple_choice challenges, or `responseText` for text challenges. One submission per day. Text challenges are not auto-graded, so `isCorrect` and `correctAnswer` come back null.',
        security: bearer('childToken'),
        requestBody: body({
          type: 'object',
          properties: {
            selectedOption: { type: 'string', example: '27', description: 'Exact text of one of the options' },
            responseText: { type: 'string', maxLength: 2000, example: 'Reading helps you learn new words.' },
          },
        }),
        responses: {
          200: reply('Result, points, streak and feedback', ref('SubmitResult')),
          ...errors(400, 401, 409, 429),
        },
      },
    },
    '/children/me/challenge/today/swap': {
      post: {
        tags: ['Child'],
        summary: "Swap today's challenge for another one of the same skill",
        description:
          'Only before answering, and at most 2 swaps per day. Returns the new challenge in the same shape as GET /children/me/challenge/today.',
        security: bearer('childToken'),
        responses: { 200: reply('The new challenge', ref('TodayChallenge')), ...errors(401, 404, 409) },
      },
    },
    '/children/me/streak': {
      get: {
        tags: ['Child'],
        summary: 'Get my streak',
        security: bearer('childToken'),
        responses: {
          200: reply('Streak', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              currentStreak: { type: 'integer' },
              bestStreak: { type: 'integer' },
              lastActiveDate: { ...dateTime, nullable: true },
            },
          }),
          ...errors(401),
        },
      },
    },
    '/children/me/progress': {
      get: {
        tags: ['Child'],
        summary: 'Get my progress dashboard data',
        security: bearer('childToken'),
        responses: {
          200: reply('Progress', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              totalCompleted: { type: 'integer' },
              totalPoints: { type: 'integer' },
              skills: { type: 'array', items: ref('SkillScore') },
              recentSubmissions: {
                type: 'array',
                description: 'The 10 most recent',
                items: {
                  type: 'object',
                  properties: { submittedAt: dateTime, isCorrect: { type: 'boolean', nullable: true } },
                },
              },
            },
          }),
          ...errors(401),
        },
      },
    },
    '/children/me/link-code': {
      post: {
        tags: ['Child'],
        summary: 'Create a code a parent can use to link to this child',
        description: 'The 6-character code expires after 10 minutes and works once.',
        security: bearer('childToken'),
        responses: {
          201: reply('Link code', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              linkCode: { type: 'string', example: '7K3F9Q' },
              expiresInSeconds: { type: 'integer', example: 600 },
            },
          }),
          ...errors(401),
        },
      },
    },
    '/leaderboard': {
      get: {
        tags: ['Child'],
        summary: 'Anonymous leaderboard',
        description: 'Top 50 plus my own row. Refreshed every 5 minutes.',
        security: bearer('childToken'),
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: { type: 'string', enum: ['weekly', 'all_time'], default: 'weekly' },
          },
        ],
        responses: {
          200: reply('Leaderboard', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              period: { type: 'string', enum: ['weekly', 'all_time'] },
              top: { type: 'array', items: ref('LeaderboardRow') },
              me: { allOf: [ref('LeaderboardRow')], nullable: true },
            },
          }),
          ...errors(401),
        },
      },
    },

    // ====================== PARENT ======================
    '/parents/register': {
      post: {
        tags: ['Parent'],
        summary: 'Register a parent account',
        description: 'Provide an email, a phone number, or both.',
        requestBody: body({
          type: 'object',
          required: ['name', 'password'],
          properties: {
            name: { type: 'string', example: 'Mrs Okafor' },
            email: { type: 'string', example: 'parent@example.com' },
            phone: { type: 'string', example: '08012345678' },
            password: { type: 'string', minLength: 8 },
          },
        }),
        responses: {
          201: reply('Registered', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              parent: {
                type: 'object',
                properties: { id: objectId, name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } },
              },
              token: { type: 'string', description: 'Use as parentJwt' },
            },
          }),
          ...errors(400, 409),
        },
      },
    },
    '/parents/login': {
      post: {
        tags: ['Parent'],
        summary: 'Parent login',
        description: 'Log in with email or phone, plus password.',
        requestBody: body({
          type: 'object',
          required: ['password'],
          properties: {
            email: { type: 'string' },
            phone: { type: 'string' },
            password: { type: 'string' },
          },
        }),
        responses: {
          200: reply('Logged in', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              parent: { type: 'object', properties: { id: objectId, name: { type: 'string' } } },
              token: { type: 'string', description: 'Use as parentJwt' },
            },
          }),
          ...errors(400, 401),
        },
      },
    },
    '/parents/link-child': {
      post: {
        tags: ['Parent'],
        summary: "Link a child using the code from the child's device",
        security: bearer('parentJwt'),
        requestBody: body({
          type: 'object',
          required: ['linkCode'],
          properties: { linkCode: { type: 'string', example: '7K3F9Q' } },
        }),
        responses: {
          201: reply('Linked', {
            type: 'object',
            properties: { success: { type: 'boolean' }, child: ref('ChildSummary') },
          }),
          ...errors(400, 401),
        },
      },
    },
    '/parents/children': {
      get: {
        tags: ['Parent'],
        summary: 'List my linked children',
        security: bearer('parentJwt'),
        responses: {
          200: reply('Linked children', {
            type: 'object',
            properties: { success: { type: 'boolean' }, children: { type: 'array', items: ref('ChildSummary') } },
          }),
          ...errors(401),
        },
      },
    },
    '/parents/children/{childId}/progress': {
      get: {
        tags: ['Parent'],
        summary: "View a linked child's progress",
        security: bearer('parentJwt'),
        parameters: [pathParam('childId', 'Child ID')],
        responses: {
          200: reply('Progress summary', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              child: ref('Child'),
              streak: {
                type: 'object',
                properties: { current: { type: 'integer' }, best: { type: 'integer' } },
              },
              skills: { type: 'array', items: ref('SkillScore') },
              certificatesEarned: { type: 'integer' },
            },
          }),
          ...errors(400, 401, 403),
        },
      },
    },
    '/parents/children/{childId}/share-card': {
      get: {
        tags: ['Parent'],
        summary: 'Data for a shareable progress card',
        description: 'Structured data only. The frontend turns it into a shareable image.',
        security: bearer('parentJwt'),
        parameters: [pathParam('childId', 'Child ID')],
        responses: {
          200: reply('Share card data', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              card: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  currentStreak: { type: 'integer' },
                  bestStreak: { type: 'integer' },
                  totalCompleted: { type: 'integer' },
                  totalPoints: { type: 'integer' },
                  topSkill: { type: 'string', nullable: true },
                  certificatesEarned: { type: 'integer' },
                  generatedAt: dateTime,
                },
              },
            },
          }),
          ...errors(400, 401, 403),
        },
      },
    },
    '/parents/children/{childId}/certificates': {
      get: {
        tags: ['Parent'],
        summary: "List a linked child's certificates",
        security: bearer('parentJwt'),
        parameters: [pathParam('childId', 'Child ID')],
        responses: {
          200: reply('Certificates, newest first', {
            type: 'object',
            properties: { success: { type: 'boolean' }, certificates: { type: 'array', items: ref('Certificate') } },
          }),
          ...errors(400, 401, 403),
        },
      },
    },

    // ====================== ADMIN: AUTH & ACCOUNTS ======================
    '/admin/login': {
      post: {
        tags: ['Admin - Auth & Accounts'],
        summary: 'Admin login',
        description: 'Limited to 10 attempts per 15 minutes per IP.',
        requestBody: body({
          type: 'object',
          required: ['email', 'password'],
          properties: { email: { type: 'string', example: 'admin@imole.app' }, password: { type: 'string' } },
        }),
        responses: {
          200: reply('Logged in', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              admin: {
                type: 'object',
                properties: { id: objectId, name: { type: 'string' }, role: { type: 'string', enum: ['content_manager', 'super_admin'] } },
              },
              token: { type: 'string', description: 'Use as adminJwt' },
            },
          }),
          ...errors(400, 401, 429),
        },
      },
    },
    '/admin/me': {
      get: {
        tags: ['Admin - Auth & Accounts'],
        summary: 'Get my admin account',
        security: bearer('adminJwt'),
        responses: {
          200: reply('My account', {
            type: 'object',
            properties: { success: { type: 'boolean' }, admin: ref('Admin') },
          }),
          ...errors(401, 404),
        },
      },
    },
    '/admin/me/password': {
      patch: {
        tags: ['Admin - Auth & Accounts'],
        summary: 'Change my own password',
        security: bearer('adminJwt'),
        requestBody: body({
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        }),
        responses: {
          200: reply('Updated', {
            type: 'object',
            properties: { success: { type: 'boolean' }, message: { type: 'string', example: 'Password updated' } },
          }),
          ...errors(400, 401),
        },
      },
    },
    '/admin/admins': {
      get: {
        tags: ['Admin - Auth & Accounts'],
        summary: 'List all admins (super admin only)',
        security: bearer('adminJwt'),
        responses: {
          200: reply('Admins', {
            type: 'object',
            properties: { success: { type: 'boolean' }, admins: { type: 'array', items: ref('Admin') } },
          }),
          ...errors(401, 403),
        },
      },
      post: {
        tags: ['Admin - Auth & Accounts'],
        summary: 'Create an admin account (super admin only)',
        description:
          '`content_manager` can manage challenges and translations. `super_admin` can also see analytics and manage admins. Share the temporary password with the person, who should change it via PATCH /admin/me/password.',
        security: bearer('adminJwt'),
        requestBody: body({
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: { type: 'string', example: 'Product Manager' },
            email: { type: 'string', example: 'pm@example.com' },
            password: { type: 'string', minLength: 8 },
            role: { type: 'string', enum: ['content_manager', 'super_admin'] },
          },
        }),
        responses: {
          201: reply('Created', {
            type: 'object',
            properties: { success: { type: 'boolean' }, admin: ref('Admin') },
          }),
          ...errors(400, 401, 403, 409),
        },
      },
    },
    '/admin/admins/{id}': {
      patch: {
        tags: ['Admin - Auth & Accounts'],
        summary: 'Change an admin\'s role, deactivate them, or reset their password (super admin only)',
        description:
          'Send `isActive: false` to lock someone out immediately. You cannot change your own account here.',
        security: bearer('adminJwt'),
        parameters: [pathParam('id', 'Admin ID')],
        requestBody: body({
          type: 'object',
          description: 'At least one field is required',
          properties: {
            role: { type: 'string', enum: ['content_manager', 'super_admin'] },
            isActive: { type: 'boolean' },
            password: { type: 'string', minLength: 8, description: 'Sets a new password' },
          },
        }),
        responses: {
          200: reply('Updated', {
            type: 'object',
            properties: { success: { type: 'boolean' }, admin: ref('Admin') },
          }),
          ...errors(400, 401, 403, 404),
        },
      },
    },

    // ====================== ADMIN: CHALLENGES ======================
    '/admin/challenges': {
      get: {
        tags: ['Admin - Challenges'],
        summary: 'List challenges',
        description: 'Any admin. Includes correct answers.',
        security: bearer('adminJwt'),
        parameters: [
          { name: 'skillId', in: 'query', schema: { type: 'string' } },
          { name: 'difficulty', in: 'query', schema: { type: 'string', enum: ['easy', 'medium', 'hard'] } },
          { name: 'isActive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          200: reply('A page of challenges', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              items: { type: 'array', items: ref('Challenge') },
              total: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
            },
          }),
          ...errors(401),
        },
      },
      post: {
        tags: ['Admin - Challenges'],
        summary: 'Create a challenge',
        security: bearer('adminJwt'),
        requestBody: body({
          type: 'object',
          required: ['skillId', 'type', 'difficulty', 'translations'],
          properties: {
            skillId: { ...objectId, description: 'Get IDs from GET /skills' },
            type: { type: 'string', enum: ['text', 'multiple_choice'] },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            isActive: { type: 'boolean', default: true },
            translations: { type: 'array', minItems: 1, items: ref('Translation') },
          },
        }),
        responses: {
          201: reply('Created', {
            type: 'object',
            properties: { success: { type: 'boolean' }, challenge: ref('Challenge') },
          }),
          ...errors(400, 401),
        },
      },
    },
    '/admin/challenges/{id}': {
      get: {
        tags: ['Admin - Challenges'],
        summary: 'Get one challenge',
        security: bearer('adminJwt'),
        parameters: [pathParam('id', 'Challenge ID')],
        responses: {
          200: reply('The challenge', {
            type: 'object',
            properties: { success: { type: 'boolean' }, challenge: ref('Challenge') },
          }),
          ...errors(400, 401, 404),
        },
      },
      patch: {
        tags: ['Admin - Challenges'],
        summary: 'Update a challenge',
        description: 'To edit prompts or options, use the translations endpoints below.',
        security: bearer('adminJwt'),
        parameters: [pathParam('id', 'Challenge ID')],
        requestBody: body({
          type: 'object',
          properties: {
            skillId: { type: 'string' },
            type: { type: 'string', enum: ['text', 'multiple_choice'] },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            isActive: { type: 'boolean' },
          },
        }),
        responses: {
          200: reply('Updated', {
            type: 'object',
            properties: { success: { type: 'boolean' }, challenge: ref('Challenge') },
          }),
          ...errors(400, 401, 404),
        },
      },
      delete: {
        tags: ['Admin - Challenges'],
        summary: 'Deactivate a challenge',
        description: 'A soft delete: sets isActive to false so old submissions keep pointing at a real record.',
        security: bearer('adminJwt'),
        parameters: [pathParam('id', 'Challenge ID')],
        responses: {
          200: reply('Deactivated', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string', example: 'Challenge deactivated' },
              challenge: ref('Challenge'),
            },
          }),
          ...errors(400, 401, 404),
        },
      },
    },
    '/admin/challenges/{id}/translations': {
      get: {
        tags: ['Admin - Challenges'],
        summary: 'List a challenge\'s translations',
        security: bearer('adminJwt'),
        parameters: [pathParam('id', 'Challenge ID')],
        responses: {
          200: reply('Translations', {
            type: 'object',
            properties: { success: { type: 'boolean' }, translations: { type: 'array', items: ref('Translation') } },
          }),
          ...errors(400, 401, 404),
        },
      },
      post: {
        tags: ['Admin - Challenges'],
        summary: 'Add a translation (for example Yoruba or Pidgin)',
        security: bearer('adminJwt'),
        parameters: [pathParam('id', 'Challenge ID')],
        requestBody: body(ref('Translation')),
        responses: {
          201: reply('All translations after adding', {
            type: 'object',
            properties: { success: { type: 'boolean' }, translations: { type: 'array', items: ref('Translation') } },
          }),
          ...errors(400, 401, 404, 409),
        },
      },
    },
    '/admin/challenges/{id}/translations/{language}': {
      patch: {
        tags: ['Admin - Challenges'],
        summary: 'Edit one translation',
        security: bearer('adminJwt'),
        parameters: [
          pathParam('id', 'Challenge ID'),
          { name: 'language', in: 'path', required: true, schema: { type: 'string', enum: languages } },
        ],
        requestBody: body({
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            correctAnswer: { type: 'string' },
          },
        }),
        responses: {
          200: reply('All translations after editing', {
            type: 'object',
            properties: { success: { type: 'boolean' }, translations: { type: 'array', items: ref('Translation') } },
          }),
          ...errors(400, 401, 404),
        },
      },
    },

    // ====================== ADMIN: ANALYTICS (super admin only) ======================
    '/admin/metrics': {
      get: {
        tags: ['Admin - Analytics'],
        summary: 'Platform metrics (super admin only)',
        security: bearer('adminJwt'),
        responses: {
          200: reply('Metrics', {
            type: 'object',
            properties: { success: { type: 'boolean' }, metrics: ref('Metrics') },
          }),
          ...errors(401, 403),
        },
      },
    },
    '/admin/analytics/export': {
      get: {
        tags: ['Admin - Analytics'],
        summary: 'Start a CSV export (super admin only)',
        description: 'Runs in the background. Use the returned jobId with GET /admin/analytics/export/{jobId}.',
        security: bearer('adminJwt'),
        responses: {
          202: reply('Export started', {
            type: 'object',
            properties: { success: { type: 'boolean' }, jobId: { type: 'string', example: '1' } },
          }),
          ...errors(401, 403),
        },
      },
    },
    '/admin/analytics/export/{jobId}': {
      get: {
        tags: ['Admin - Analytics'],
        summary: 'Download the CSV once it is ready (super admin only)',
        description: 'While the job is still running, returns its state as JSON. Once completed, returns the CSV file.',
        security: bearer('adminJwt'),
        parameters: [pathParam('jobId', 'Job ID from the previous call')],
        responses: {
          200: {
            description: 'The CSV (when completed) or the job state (while running)',
            content: {
              'text/csv': { schema: { type: 'string' } },
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    state: { type: 'string', example: 'active' },
                  },
                },
              },
            },
          },
          ...errors(401, 403, 404),
        },
      },
    },
  },
};

module.exports = { swaggerSpec };