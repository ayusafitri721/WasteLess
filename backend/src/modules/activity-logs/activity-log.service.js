import { ActivityLog } from './activity-log.model.js';

export async function logActivity(
  { actorId, action, resourceType, resourceId, metadata },
  session,
) {
  const [log] = await ActivityLog.create(
    [{ actorId, action, resourceType, resourceId, metadata }],
    session ? { session } : {},
  );

  return log;
}
