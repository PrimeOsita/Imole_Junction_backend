const Skill = require('../models/Skill');
const { ApiError } = require('../middlewares/errorHandler');

async function listSkills() {
  return Skill.find().sort({ name: 1 });
}

async function getSkillById(id) {
  const skill = await Skill.findById(id);
  if (!skill) throw new ApiError(404, 'Skill not found');
  return skill;
}

module.exports = { listSkills, getSkillById };