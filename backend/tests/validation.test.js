/**
 * Smoke tests for the validation middleware and central error handler.
 */
const validate = require('../middlewares/validate');
const errorHandler = require('../middlewares/errorHandler');
const AppError = require('../utils/AppError');
const { authSchemas } = require('../validators/schemas');

/** Build a minimal mock Express response recorder. */
const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.body = null;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (payload) => {
        res.body = payload;
        return res;
    };
    return res;
};

describe('middlewares/validate', () => {
    it('passes valid bodies through and sanitises them', () => {
        const req = { body: { email: ' user@test.com ', password: 'x' } };
        const next = jest.fn();
        validate(authSchemas.login)(req, mockRes(), next);
        expect(next).toHaveBeenCalledWith();
        expect(req.body.email).toBe('user@test.com');
    });

    it('rejects invalid bodies with an AppError', () => {
        const req = { body: { email: 'not-an-email', password: '' } };
        const next = jest.fn();
        validate(authSchemas.login)(req, mockRes(), next);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
    });
});

describe('middlewares/errorHandler', () => {
    it('formats an AppError into the standard envelope', () => {
        const res = mockRes();
        errorHandler(new AppError('Nope', 400, { code: 'BAD' }), { method: 'GET', originalUrl: '/x' }, res, () => {});
        expect(res.statusCode).toBe(400);
        expect(res.body).toMatchObject({ success: false, message: 'Nope', data: null, code: 'BAD' });
    });

    it('masks unexpected errors as 500', () => {
        const res = mockRes();
        errorHandler(new Error('boom'), { method: 'GET', originalUrl: '/x' }, res, () => {});
        expect(res.statusCode).toBe(500);
        expect(res.body).toMatchObject({ success: false, message: 'Internal server error', data: null });
    });
});
