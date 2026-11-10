jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'parent-token'),
}));
jest.mock('../../models/Parent', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../Mongoose connection/redis', () => ({
  redisClient: {},
}));

const bcrypt = require('bcryptjs');
const Parent = require('../../models/Parent');
const { loginParent } = require('../../services/parentService');

describe('parentService login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('normalizes email before looking up the parent account', async () => {
    const parent = {
      _id: 'parent-id',
      name: 'Parent',
      passwordHash: 'stored-hash',
      isEmailVerified: true,
    };
    Parent.findOne.mockResolvedValue(parent);
    bcrypt.compare.mockResolvedValue(true);

    await expect(
      loginParent({ email: '  Parent@Example.com ', password: 'password' })
    ).resolves.toMatchObject({
      parent: { id: 'parent-id', name: 'Parent' },
      token: 'parent-token',
    });

    expect(Parent.findOne).toHaveBeenCalledWith({
      email: 'parent@example.com',
    });
  });
});
