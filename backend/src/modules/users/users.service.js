import { ApiError } from '../../utils/ApiError.js';
import { User } from './user.model.js';

export async function updateProfile(userId, updates) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { returnDocument: 'after', runValidators: true },
  );

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan');
  }

  return user;
}
