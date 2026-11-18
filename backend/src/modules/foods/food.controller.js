import * as foodService from './food.service.js';

export async function create(req, res) {
  const listing = await foodService.createFoodListing(
    req.user,
    req.validated.body,
  );

  res.status(201).json({
    success: true,
    data: { listing },
  });
}

export async function list(req, res) {
  const { items, pagination } = await foodService.listAvailableFoods(
    req.validated.query,
  );

  res.json({
    success: true,
    data: { items, pagination },
  });
}

export async function listMine(req, res) {
  const { items, pagination } = await foodService.listOwnFoods(
    req.user.id,
    req.validated.query,
  );

  res.json({
    success: true,
    data: { items, pagination },
  });
}

export async function detail(req, res) {
  const listing = await foodService.getFoodListing(
    req.user,
    req.validated.params.id,
  );

  res.json({
    success: true,
    data: { listing },
  });
}

export async function update(req, res) {
  const listing = await foodService.updateFoodListing(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );

  res.json({
    success: true,
    data: { listing },
  });
}

export async function cancel(req, res) {
  const listing = await foodService.cancelFoodListing(
    req.user,
    req.validated.params.id,
  );

  res.json({
    success: true,
    data: { listing },
  });
}
