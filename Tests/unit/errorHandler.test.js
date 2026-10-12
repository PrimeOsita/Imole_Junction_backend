const { ApiError, errorHandler } = require('../../src/middlewares/errorHandler');

// Minimal fake of Express's res so we can inspect what the handler sends.
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  test('uses the ApiError status and message', () => {
    const res = mockRes();
    errorHandler(new ApiError(409, 'Already submitted'), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Already submitted' });
  });

  test('turns a Mongo duplicate key error into a readable 400', () => {
    const res = mockRes();
    const err = Object.assign(new Error('dup'), { code: 11000, keyValue: { email: 'a@b.com' } });
    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'email "a@b.com" is already in use. Please use a different one.',
    });
  });

  test('turns a bad ObjectId CastError into a 400', () => {
    const res = mockRes();
    const err = Object.assign(new Error('cast'), { name: 'CastError', kind: 'ObjectId', value: 'abc', path: '_id' });
    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain('"abc" is not a valid ID for "_id"');
  });

  test('maps JWT errors to 401', () => {
    const res = mockRes();
    errorHandler(Object.assign(new Error('x'), { name: 'TokenExpiredError' }), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Your session has expired. Please log in again.' });
  });
});