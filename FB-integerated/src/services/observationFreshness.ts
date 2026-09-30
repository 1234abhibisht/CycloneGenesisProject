export const LIVE_OBSERVATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isFreshLiveObservation(timestamp: string | undefined, now = Date.now()): boolean {
  if (!timestamp) return false;
  const observed = Date.parse(timestamp);
  return Number.isFinite(observed) && observed <= now + 60 * 60 * 1000 &&
    now - observed < LIVE_OBSERVATION_MAX_AGE_MS;
}
