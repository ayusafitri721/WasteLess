import * as verificationService from './verification.service.js';

export async function submit(req, res) {
  const verification = await verificationService.submitVerification(
    req.user,
    req.validated.body,
  );

  res.status(201).json({
    success: true,
    data: { verification },
  });
}
