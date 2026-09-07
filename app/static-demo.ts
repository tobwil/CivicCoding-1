export const STATIC_HOST_NOTE = "auf here.now nur Demo-Modus";

export function isStaticDemoHost() {
  try {
    return import.meta.env.VITE_STATIC_HOST === "true";
  } catch {
    return false;
  }
}

export function isMissingCoachApi(error: unknown, status?: number) {
  if (status === 404 || status === 405) return true;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch|load failed|networkerror|404|not found|demo-modus/i.test(
    message,
  );
}
