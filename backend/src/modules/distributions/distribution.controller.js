import * as distributionService from './distribution.service.js';

export async function verifyPickup(req, res) {
  const distribution = await distributionService.verifyPickup(
    req.user,
    req.validated.params.id,
    req.validated.body.code,
  );

  res.json({
    success: true,
    data: { distribution },
  });
}

export async function complete(req, res) {
  const distribution = await distributionService.completeDistribution(
    req.user,
    req.validated.params.id,
  );

  res.json({
    success: true,
    data: { distribution },
  });
}

export async function history(req, res) {
  const { items, pagination } =
    await distributionService.listDistributionHistory(
      req.user,
      req.validated.query,
    );

  res.json({
    success: true,
    data: { items, pagination },
  });
}
