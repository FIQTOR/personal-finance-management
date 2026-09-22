/**
 * Unit tests for password utilities.
 * Run with: npm test
 */
const { hashPassword, comparePassword, assertStrongPassword } = require('../utils/password');
const AppError = require('../utils/AppError');

describe('utils/password', () => {
    it('hashes and verifies a password', async () => {
        const hash = await hashPassword('secret123');
        expect(hash).not.toBe('secret123');
        expect(await comparePassword('secret123', hash)).toBe(true);
        expect(await comparePassword('wrong', hash)).toBe(false);
    });

    it('rejects short passwords', () => {
        expect(() => assertStrongPassword('short')).toThrow(AppError);
    });

    it('accepts strong passwords', () => {
        expect(assertStrongPassword('longenough')).toBe(true);
    });
});
