import {
  getPlatformAnalytics,
  getProviderAnalytics,
  getReceiverAnalytics,
} from './analytics.service.js';

export async function provider(req, res, next) {
  try {
    const data = await getProviderAnalytics(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function receiver(req, res, next) {
  try {
    const data = await getReceiverAnalytics(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function platform(req, res, next) {
  try {
    const data = await getPlatformAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
