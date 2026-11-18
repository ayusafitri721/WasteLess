import { ApiError } from '../utils/ApiError.js';

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        401,
        'UNAUTHENTICATED',
        'Autentikasi diperlukan untuk mengakses resource ini',
      );
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Anda tidak memiliki hak akses untuk aksi ini',
      );
    }

    next();
  };
}
