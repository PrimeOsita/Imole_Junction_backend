const Certificate = require('../models/Certificate');
const Skill = require('../models/Skill');
const SkillProgress = require('../models/SkillProgress');


const CERTIFICATE_MILESTONE = 10;

async function issueCertificateIfEligible(childId, skillId) {
  const progress = await SkillProgress.findOne({ childId, skillId });
  if (!progress || progress.challengesCompleted < CERTIFICATE_MILESTONE) return null;

  const existing = await Certificate.findOne({ childId, skillId });
  if (existing) return existing;

  const skill = await Skill.findById(skillId);
  if (!skill) return null;

  return Certificate.create({
    childId,
    skillId,
    title: `${skill.name} Champion`,
  });
}

module.exports = { CERTIFICATE_MILESTONE, issueCertificateIfEligible };