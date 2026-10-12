const { generateChildToken, hashToken, generateLinkCode } = require('../../utils/tokenGenerator');

describe('tokenGenerator', () => {
  test('generateChildToken returns a 64-character hex string, different each time', () => {
    const a = generateChildToken();
    const b = generateChildToken();

    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  test('hashToken is deterministic and never equals the raw token', () => {
    const raw = generateChildToken();

    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(hashToken(raw)).not.toBe(raw);
  });

  test('generateLinkCode returns 6 easy-to-type uppercase characters', () => {
    expect(generateLinkCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});