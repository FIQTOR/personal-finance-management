const { object, string, boolean, oneOf, date } = require('./index');

/**
 * Numeric field spec (accepts number or numeric string, coerces to Number).
 * Local helper since the base primitives only cover string/boolean/enum.
 * When `allowNull` is set, `null`/empty values pass through untouched.
 */
const number = ({ required = false, min, positive = false, allowNull = false } = {}) => ({
    required,
    validate: (raw, key) => {
        if (raw === null) {
            if (allowNull) return { ok: true, value: null };
            return { ok: false, message: `${key} must be a number` };
        }
        const n = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isNaN(n)) return { ok: false, message: `${key} must be a number` };
        if (positive && n <= 0) return { ok: false, message: `${key} must be greater than 0` };
        if (typeof min === 'number' && n < min) {
            return { ok: false, message: `${key} must be at least ${min}` };
        }
        return { ok: true, value: n };
    },
});

/** Optional positive integer id that tolerates `null` (uncategorized/general). */
const optionalId = () => number({ allowNull: true });

/**
 * Array-of-items field spec that validates each element against `itemSpec`
 * (a `(data) => { value, errors }` object validator) and reports errors per row.
 */
const bulkItems = (itemSpec) => ({
    validate: (raw, key) => {
        if (!Array.isArray(raw)) {
            return { ok: false, message: `${key} must be an array of items` };
        }
        const errors = [];
        const value = raw.map((row, index) => {
            const result = itemSpec(row);
            if (result.errors.length) {
                errors.push(...result.errors.map((e) => `items[${index}].${e}`));
                return row;
            }
            return result.value;
        });
        if (errors.length) {
            return { ok: false, message: errors[0] };
        }
        return { ok: true, value };
    },
});

/**
 * Wrap an object validator with a cross-field check `(value) => error|null`.
 */
const withCheck = (schema, check) => (data) => {
    const result = schema(data);
    if (result.errors.length) return result;
    const error = check(result.value);
    return error ? { value: result.value, errors: [error] } : result;
};

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
        // Optional: `null`/omitted means "uncategorized" (matches DB allowNull).
        category_id: number({ allowNull: true }),
        amount: number({ required: true, positive: true }),
        currency: string({ min: 3, max: 10 }),
        type: oneOf(['income', 'expense'], { required: true }),
        date: date({ required: true }),
        notes: string({ max: 1000 }),
    }),

    budget: withCheck(object({
        // Optional: `null`/omitted means a general (category-less) budget.
        category_id: number({ allowNull: true }),
        limit_amount: number({ required: true, positive: true }),
        currency: string({ min: 3, max: 10 }),
        start_date: date({ required: true }),
        end_date: date({ required: true }),
    }), (value) => (
        value.start_date && value.end_date && value.end_date < value.start_date
            ? 'end_date must be on or after start_date'
            : null
    )),

    goal: object({
        name: string({ required: true, min: 1, max: 150 }),
        target_amount: number({ required: true, positive: true }),
        current_amount: number({ min: 0 }),
        currency: string({ min: 3, max: 10 }),
        // Required to match the NOT NULL `goals.deadline` column.
        deadline: date({ required: true }),
    }),

    // --- Bulk inserts: expect `{ items: [...] }` with per-item validation. ---
    categoryBulk: object({
        items: bulkItems(object({
            name: string({ required: true, min: 1, max: 100 }),
            type: oneOf(['income', 'expense'], { required: true }),
            icon: string({ max: 50 }),
            color: string({ max: 20 }),
        })),
    }),

    transactionBulk: object({
        items: bulkItems(object({
            category_id: optionalId(),
            amount: number({ required: true, positive: true }),
            currency: string({ min: 3, max: 10 }),
            type: oneOf(['income', 'expense'], { required: true }),
            date: date({ required: true }),
            notes: string({ max: 1000 }),
        })),
    }),

    budgetBulk: object({
        items: bulkItems(object({
            category_id: optionalId(),
            limit_amount: number({ required: true, positive: true }),
            currency: string({ min: 3, max: 10 }),
            start_date: date({ required: true }),
            end_date: date({ required: true }),
        })),
    }),

    goalBulk: object({
        items: bulkItems(object({
            name: string({ required: true, min: 1, max: 150 }),
            target_amount: number({ required: true, positive: true }),
            current_amount: number({ min: 0 }),
            currency: string({ min: 3, max: 10 }),
            deadline: date({ required: true }),
        })),
    }),
};

module.exports = { authSchemas, userSchemas, roleSchemas, financeSchemas, oneOf };
