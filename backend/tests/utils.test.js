/**
 * Unit tests for token hashing helpers.
 */
const { generateToken, hashToken } = require('../utils/tokenHash');
const { safeInternalPath } = require('../utils/sanitize');

describe('utils/tokenHash', () => {
    it('generates unique tokens and stable hashes', () => {
        const a = generateToken();
        const b = generateToken();
        expect(a).not.toBe(b);
        expect(hashToken(a)).toBe(hashToken(a));
        expect(hashToken(a)).not.toBe(hashToken(b));
    });
});

describe('utils/sanitize', () => {
    it('allows safe internal paths', () => {
        expect(safeInternalPath('/profile')).toBe('/profile');
    });

    it('rejects absolute / protocol-relative URLs (open redirect)', () => {
        expect(safeInternalPath('https://evil.com')).toBe('/');
        expect(safeInternalPath('//evil.com')).toBe('/');
    });
});
