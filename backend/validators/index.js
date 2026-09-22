/**
 * Minimal validation primitives.
 *
 * A tiny, dependency-free alternative to zod/joi that returns
 * `{ value, errors }` and plugs into `middlewares/validate.js`.
 *
 * Example:
 *   validate(validators.object({
 *     email: validators.email(),
 *     password: validators.string({ min: 8 }),
 *   }))
 */

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const REQUIRED = Symbol('required');

/**
 * Build a field validator that emits a chainable spec.
 * @param {object} specs
 * @returns {(data: any) => { value: any, errors: string[] }}
 */
const object = (specs) => (data) => {
    const source = isPlainObject(data) ? data : {};
    // Start from the source so unspecified fields (e.g. numeric ids) pass through.
    const value = { ...source };
    const errors = [];

    for (const [key, spec] of Object.entries(specs)) {
        const raw = source[key];
        if (raw === undefined) {
            if (spec.required) errors.push(`${key} is required`);
            continue;
        }
        const { ok, message, value: parsed } = spec.validate(raw, key);
        if (!ok) {
            errors.push(message);
        } else {
            value[key] = parsed;
        }
    }

    return { value, errors };
};

/** Create a field spec: string with optional min/max/email/trim. */
const string = ({ min, max, email, required = false, trim = true, pattern, patternMessage } = {}) => ({
    required,
    validate: (raw, key) => {
        if (typeof raw !== 'string') {
            return { ok: false, message: `${key} must be a string` };
        }
        let v = trim ? raw.trim() : raw;
        if (min && v.length < min) {
            return { ok: false, message: `${key} must be at least ${min} characters` };
        }
        if (max && v.length > max) {
            return { ok: false, message: `${key} must be at most ${max} characters` };
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            return { ok: false, message: `${key} must be a valid email` };
        }
        if (pattern && !pattern.test(v)) {
            return { ok: false, message: patternMessage || `${key} is invalid` };
        }
        return { ok: true, value: v };
    },
});

/** Create a boolean field spec that accepts true/false/"true"/"false". */
const boolean = ({ required = false } = {}) => ({
    required,
    validate: (raw, key) => {
        if (raw === true || raw === 'true') return { ok: true, value: true };
        if (raw === false || raw === 'false') return { ok: true, value: false };
        return { ok: false, message: `${key} must be a boolean` };
    },
});

/** Create a field spec that accepts any of the provided enum values. */
const oneOf = (allowed, { required = false } = {}) => ({
    required,
    validate: (raw, key) => {
        if (!allowed.includes(raw)) {
            return { ok: false, message: `${key} must be one of: ${allowed.join(', ')}` };
        }
        return { ok: true, value: raw };
    },
});

module.exports = { object, string, boolean, oneOf, REQUIRED };
