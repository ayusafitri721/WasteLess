import { ApiError } from '../../utils/ApiError.js';
import { runInTransaction } from '../../utils/transaction.js';
import { logActivity } from '../activity-logs/activity-log.service.js';
import { User } from '../users/user.model.js';
import { Verification } from './verification.model.js';

export async function submitVerification(user, input) {
  if (user.verificationStatus === 'verified') {
    throw new ApiError(
      409,
      'ALREADY_VERIFIED',
      'Akun Anda sudah terverifikasi',
    );
  }

  if (user.verificationStatus === 'pending') {
    throw new ApiError(
      409,
      'VERIFICATION_PENDING',
      'Pengajuan verifikasi Anda masih diproses',
    );
  }

  return runInTransaction(async (session) => {
    let verification;

    try {
      [verification] = await Verification.create(
        [
          {
            userId: user.id,
            organizationName: input.organizationName,
            contactPhone: input.contactPhone,
            supportingDocumentUrl: input.supportingDocumentUrl,
            notes: input.notes,
          },
        ],
        { session },
      );
    } catch (err) {
      if (err?.code === 11000) {
        throw new ApiError(
          409,
          'VERIFICATION_PENDING',
          'Pengajuan verifikasi Anda masih diproses',
        );
      }
      throw err;
    }

    await User.updateOne(
      { _id: user.id },
      {
        $set: {
          verificationStatus: 'pending',
          organizationName: input.organizationName,
          phone: input.contactPhone,
        },
      },
      { session },
    );

    await logActivity(
      {
        actorId: user.id,
        action: 'verification.submitted',
        resourceType: 'Verification',
        resourceId: verification.id,
        metadata: { role: user.role },
      },
      session,
    );

    return verification;
  });
}

export async function listVerifications({ status, page, limit }) {
  const filter = status === 'all' ? {} : { status };

  const [items, total] = await Promise.all([
    Verification.find(filter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(
        'userId',
        'name email role organizationName phone verificationStatus',
      ),
    Verification.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function decideVerification({
  verificationId,
  admin,
  decision,
  reviewNote,
}) {
  return runInTransaction(async (session) => {
    const verification = await Verification.findOneAndUpdate(
      { _id: verificationId, status: 'pending' },
      {
        $set: {
          status: decision,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          reviewNote,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    );

    if (!verification) {
      const exists = await Verification.exists({ _id: verificationId }).session(
        session,
      );

      if (!exists) {
        throw new ApiError(
          404,
          'VERIFICATION_NOT_FOUND',
          'Pengajuan verifikasi tidak ditemukan',
        );
      }

      throw new ApiError(
        409,
        'VERIFICATION_ALREADY_PROCESSED',
        'Pengajuan verifikasi ini sudah diproses',
      );
    }

    await User.updateOne(
      { _id: verification.userId },
      {
        $set: {
          verificationStatus:
            decision === 'approved' ? 'verified' : 'rejected',
        },
      },
      { session },
    );

    await logActivity(
      {
        actorId: admin.id,
        action: `verification.${decision}`,
        resourceType: 'Verification',
        resourceId: verification.id,
        metadata: { userId: verification.userId.toString() },
      },
      session,
    );

    return verification;
  });
}
