const crypto = require('crypto');
const { customAlphabet } = require('nanoid');


const linkCodeAlphabet = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);


function generateChildToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}


function generateLinkCode() {
  return linkCodeAlphabet();
}

module.exports = { generateChildToken, hashToken, generateLinkCode };