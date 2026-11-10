const {
  verifyParentEmailSchema,
  resendParentEmailOtpSchema,
} = require('../../validators/parentValidators');

describe('parent email verification validators', () => {
  test('accepts a valid email and 4-digit verification code', () => {
    expect(
      verifyParentEmailSchema.safeParse({
        email: ' Parent@Example.com ',
        otp: '4821',
      })
    ).toMatchObject({
      success: true,
      data: { email: 'Parent@Example.com', otp: '4821' },
    });
  });

  test('rejects malformed verification codes', () => {
    expect(
      verifyParentEmailSchema.safeParse({
        email: 'parent@example.com',
        otp: '12345',
      }).success
    ).toBe(false);
  });

  test('accepts a valid email for requesting a new verification code', () => {
    expect(
      resendParentEmailOtpSchema.safeParse({ email: 'parent@example.com' })
        .success
    ).toBe(true);
  });
});
