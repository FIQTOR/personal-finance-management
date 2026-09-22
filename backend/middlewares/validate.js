const AppError = require('../utils/AppError');

/**
 * Validate a request against a schema.
 *
 * Accepts any object with a `.parse` method (zod) but also works with a plain
 * function-based validator `(data) => { value, errors }`.
 *
 * @param {object|Function} schema
 * @param {'body'|'query'|'params'} [source='body']
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, source = 'body') => (req, res, next) => {
    try {
        if (typeof schema === 'function') {
            const result = schema(req[source]);
            if (result?.errors?.length) {
                throw new AppError('Validation failed', 400, {
                    code: 'VALIDATION_ERROR',
                    details: result.errors,
                });
            }
            if (result?.value !== undefined) req[source] = result.value;
            return next();
        }

        if (schema && typeof schema.parse === 'function') {
            req[source] = schema.parse(req[source]);
            return next();
        }

        return next();
    } catch (error) {
        if (error instanceof AppError) return next(error);

        // Zod errors expose `issues`.
        if (error?.issues) {
            return next(new AppError('Validation failed', 400, {
                code: 'VALIDATION_ERROR',
                details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
            }));
        }

        return next(error);
    }
};

module.exports = validate;
