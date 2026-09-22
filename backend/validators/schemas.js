const { object, string, boolean, oneOf } = require('./index');

/**
 * Numeric field spec (accepts number or numeric string, coerces to Number).
 * Local helper since the base primitives only cover string/boolean/enum.
 */
const number = ({ required = false, min, positive = false } = {}) => ({
    required,
    validate: (raw, key) => {
        const n = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isNaN(n)) return { ok: false, message: `${key} must be a number` };
        if (positive && n <= 0) return { ok: false, message: `${key} must be greater than 0` };
        if (typeof min === 'number' && n < min) {
            return { ok: false, message: `${key} must be at least ${min}` };
        }
        return { ok: true, value: n };
    },
});

/** Validation schemas for authentication endpoints. */
const authSchemas = {
    login: object({
        email: string({ required: true, email: true }),
        password: string({ required: true, min: 1 }),
        remember_me: boolean(),
    }),

    setup: object({
        name: string({ required: true, min: 2, max: 100 }),
        email: string({ required: true, email: true }),
        password: string({ required: true, min: 8, max: 128 }),
        currency: string({ min: 3, max: 10 }),
        language: string({ min: 2, max: 10 }),
    }),

    requestPasswordReset: object({
        email: string({ required: true, email: true }),
    }),

    resetPassword: object({
        token: string({ required: true, min: 10 }),
        newPassword: string({ required: true, min: 8, max: 128 }),
    }),
};

/** Validation schemas for user management endpoints. */
const userSchemas = {
    create: object({
        name: string({ required: true, min: 2, max: 100 }),
        email: string({ required: true, email: true }),
        password: string({ required: true, min: 8, max: 128 }),
        isBlocked: boolean(),
        isVerified: boolean(),
    }),

    update: object({
        name: string({ required: true, min: 2, max: 100 }),
        email: string({ required: true, email: true }),
        is_blocked: boolean(),
        is_verified: boolean(),
    }),

    updateProfile: object({
        name: string({ required: true, min: 2, max: 100 }),
    }),

    resetPassword: object({
        password: string({ required: true, min: 8, max: 128 }),
    }),
};

/** Validation schemas for role/permission endpoints. */
const roleSchemas = {
    create: object({
        name: string({ required: true, min: 2, max: 50 }),
        description: string({ required: true, min: 2, max: 255 }),
    }),
};

/** Validation schemas for finance endpoints. */
const financeSchemas = {
    category: object({
        name: string({ required: true, min: 1, max: 100 }),
        type: oneOf(['income', 'expense'], { required: true }),
        icon: string({ max: 50 }),
        color: string({ max: 20 }),
    }),

    transaction: object({
        category_id: number({ required: true }),
        amount: number({ required: true, positive: true }),
        currency: string({ min: 3, max: 10 }),
        type: oneOf(['income', 'expense'], { required: true }),
        date: string({ required: true, min: 8, max: 30 }),
        notes: string({ max: 1000 }),
    }),

    budget: object({
        category_id: number({ required: true }),
        limit_amount: number({ required: true, positive: true }),
        currency: string({ min: 3, max: 10 }),
        start_date: string({ required: true, min: 8, max: 30 }),
        end_date: string({ required: true, min: 8, max: 30 }),
    }),

    goal: object({
        name: string({ required: true, min: 1, max: 150 }),
        target_amount: number({ required: true, positive: true }),
        current_amount: number({ min: 0 }),
        currency: string({ min: 3, max: 10 }),
        deadline: string({ min: 8, max: 30 }),
    }),
};

module.exports = { authSchemas, userSchemas, roleSchemas, financeSchemas, oneOf };
