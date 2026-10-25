// Admin emails link to https://<site>/app/booking/<id> (Android App Link); the app's screen is /booking/<id>.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path, 'https://placeholder');
    if (url.pathname.startsWith('/app/')) return url.pathname.slice('/app'.length);
  } catch {
    // Not a URL; fall through unchanged.
  }
  return path;
}
