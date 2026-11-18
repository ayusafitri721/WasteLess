import { ApiError } from '../utils/ApiError.js';

export function validate(schemas) {
  return (req, res, next) => {
    const validated = {};

    for (const key of ['params', 'query', 'body']) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        throw new ApiError(
          422,
          'VALIDATION_ERROR',
          'Data permintaan tidak valid',
          details,
        );
      }

      validated[key] = result.data;
    }

    req.validated = validated;
    next();
  };
}
