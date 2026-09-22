/**
 * URL / path sanitisation helpers.
 */

/**
 * Only allow safe internal relative paths to be used as redirect targets.
 * Rejects absolute URLs and protocol-relative URLs to prevent open redirects.
 *
 * @param {string} value
 * @param {string} [fallback='/']
 * @returns {string}
 */
const safeInternalPath = (value, fallback = '/') => {
    if (!value || typeof value !== 'string') return fallback;

    const trimmed = value.trim();

    // Must start with a single slash (internal path).
    if (!trimmed.startsWith('/')) return fallback;
    // Reject protocol-relative ("//evil.com") and backslash tricks.
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;
    // Reject anything containing a scheme.
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return fallback;

    return trimmed;
};

module.exports = { safeInternalPath };
