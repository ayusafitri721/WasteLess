import * as verificationService from './verification.service.js';

export async function list(req, res) {
  const { items, pagination } = await verificationService.listVerifications(
    req.validated.query,
  );

  res.json({
    success: true,
    data: { items, pagination },
  });
}

export async function decide(req, res) {
  const verification = await verificationService.decideVerification({
    verificationId: req.validated.params.id,
    admin: req.user,
    decision: req.validated.body.decision,
    reviewNote: req.validated.body.reviewNote,
  });

  res.json({
    success: true,
    data: { verification },
  });
}
