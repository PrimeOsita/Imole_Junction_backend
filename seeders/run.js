const bcrypt = require('bcryptjs');
const { env, assertRequiredEnv } = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const Skill = require('../models/Skill');
const Challenge = require('../models/Challenge');
const Admin = require('../models/Admin');
const { skills, challenges } = require('./data');

async function seedSkills() {
  const idBySlug = {};

  for (const skill of skills) {
    const doc = await Skill.findOneAndUpdate({ slug: skill.slug }, skill, { upsert: true, new: true });
    idBySlug[skill.slug] = doc._id;
  }

  console.log(`Skills ready: ${skills.length}`);
  return idBySlug;
}

async function seedChallenges(idBySlug) {
  let created = 0;

  for (const { skill, ...challenge } of challenges) {
    const enPrompt = challenge.translations[0].prompt;
    const exists = await Challenge.exists({ 'translations.prompt': enPrompt });
    if (exists) continue;

    await Challenge.create({ ...challenge, skillId: idBySlug[skill] });
    created += 1;
  }

  console.log(`Challenges created: ${created} (skipped ${challenges.length - created} already present)`);
}

async function seedAdmin() {
  if (!env.adminSeedEmail || !env.adminSeedPassword) {
    console.log('ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set — skipping admin creation');
    return;
  }

  const exists = await Admin.exists({ email: env.adminSeedEmail.toLowerCase() });
  if (exists) {
    console.log('Admin already exists — skipping');
    return;
  }

  await Admin.create({
    name: 'IMOLE Admin',
    email: env.adminSeedEmail,
    passwordHash: await bcrypt.hash(env.adminSeedPassword, 10),
    role: 'super_admin',
  });
  console.log(`Super admin created: ${env.adminSeedEmail}`);
}

async function run() {
  assertRequiredEnv();
  await connectDatabase();

  const idBySlug = await seedSkills();
  await seedChallenges(idBySlug);
  await seedAdmin();

  await disconnectDatabase();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});