import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res, next) {
  next(
    new ApiError(
      404,
      'NOT_FOUND',
      `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
    ),
  );
}

function normalizeError(err) {
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }

  if (err?.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'Body request bukan JSON yang valid',
    };
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0];
    return {
      statusCode: 409,
      code: 'DUPLICATE_VALUE',
      message: field
        ? `Nilai untuk field ${field} sudah digunakan`
        : 'Data dengan nilai unik tersebut sudah ada',
      details: field ? [{ path: field, message: 'Harus unik' }] : undefined,
    };
  }

  if (err?.name === 'ValidationError') {
    return {
      statusCode: 422,
      code: 'DATABASE_VALIDATION_ERROR',
      message: 'Data tidak memenuhi aturan validasi',
      details: Object.values(err.errors ?? {}).map((item) => ({
        path: item.path,
        message: item.message,
      })),
    };
  }

  if (err?.name === 'CastError') {
    return {
      statusCode: 400,
      code: 'INVALID_IDENTIFIER',
      message: `Nilai ${err.value} tidak valid untuk field ${err.path}`,
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Terjadi kesalahan pada server',
  };
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500) {
    const stack = env.NODE_ENV === 'development' ? err.stack : undefined;
    console.error(`[error] ${req.method} ${req.originalUrl}`, err.message, stack ?? '');
  }

  const body = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
    },
  };

  if (normalized.details?.length) {
    body.error.details = normalized.details;
  }

  res.status(normalized.statusCode).json(body);
}
