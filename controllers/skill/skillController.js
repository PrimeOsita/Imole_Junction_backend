const skillService = require('../../services/skillService');

exports.listSkills = async (req, res, next) => {
  try {
    const skills = await skillService.listSkills();
    res.json({ success: true, skills });
  } catch (err) {
    next(err);
  }
};

exports.getSkillById = async (req, res, next) => {
  try {
    const skill = await skillService.getSkillById(req.params.id);
    res.json({ success: true, skill });
  } catch (err) {
    next(err);
  }
};