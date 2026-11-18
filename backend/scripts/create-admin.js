import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/modules/users/user.model.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Administrator';

if (!email || !password) {
  console.error(
    'ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi. Contoh: ADMIN_EMAIL=admin@wasteless.local ADMIN_PASSWORD=rahasia123 npm run create-admin',
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD minimal 8 karakter');
  process.exit(1);
}

try {
  await connectDatabase();

  const existing = await User.findOne({ email });

  if (existing && existing.role !== 'admin') {
    console.error(
      `Email ${email} sudah dipakai akun dengan role ${existing.role}`,
    );
    process.exitCode = 1;
  } else if (existing) {
    existing.passwordHash = await bcrypt.hash(password, 12);
    existing.name = name;
    await existing.save();
    console.log(`Admin ${email} diperbarui`);
  } else {
    await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
      verificationStatus: 'verified',
    });
    console.log(`Admin ${email} dibuat`);
  }
} catch (err) {
  console.error('Gagal membuat admin:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
