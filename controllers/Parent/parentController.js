const parentService = require('../../services/parentService');

exports.register = async (req, res, next) => {
  try {
    const result = await parentService.registerParent(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await parentService.loginParent(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.linkChild = async (req, res, next) => {
  try {
    const result = await parentService.linkChild(req.parentId, req.body.linkCode);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.listChildren = async (req, res, next) => {
  try {
    const children = await parentService.listChildren(req.parentId);
    res.json({ success: true, children });
  } catch (err) {
    next(err);
  }
};

exports.getChildProgress = async (req, res, next) => {
  try {
    const progress = await parentService.getChildProgress(req.parentId, req.params.childId);
    res.json({ success: true, ...progress });
  } catch (err) {
    next(err);
  }
};

exports.getShareCard = async (req, res, next) => {
  try {
    const card = await parentService.getShareCard(req.parentId, req.params.childId);
    res.json({ success: true, card });
  } catch (err) {
    next(err);
  }
};

exports.getCertificates = async (req, res, next) => {
  try {
    const certificates = await parentService.getCertificates(req.parentId, req.params.childId);
    res.json({ success: true, certificates });
  } catch (err) {
    next(err);
  }
};