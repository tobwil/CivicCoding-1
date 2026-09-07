// Netlify-only gate. Secrets are supplied by Netlify, never by client bundles.
declare const Netlify: { env: { get(name: string): string | undefined } };
type EdgeContext = { next(): Promise<Response> };

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

export default async function passwordGate(request: Request, context: EdgeContext) {
  const password = Netlify.env.get('COACH_SITE_PASSWORD');
  if (!password) return new Response('Zugangsschutz noch nicht eingerichtet.', { status: 503, headers: privateHeaders });

  const authorization = request.headers.get('authorization') ?? '';
  let credentials = '';
  if (/^Basic\s/i.test(authorization)) {
    try { credentials = atob(authorization.replace(/^Basic\s+/i, '')); } catch { /* malformed credentials fail closed */ }
  }
  const encode = new TextEncoder();
  const [provided, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encode.encode(credentials)),
    crypto.subtle.digest('SHA-256', encode.encode(`alba:${password}`)),
  ]);
  const a = new Uint8Array(provided), b = new Uint8Array(expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  if (difference !== 0) return new Response('Bitte mit Benutzername und Passwort anmelden.', {
    status: 401,
    headers: { ...privateHeaders, 'WWW-Authenticate': 'Basic realm="ALBAthek Coach", charset="UTF-8"' },
  });

  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(privateHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export const config = { path: '/*', onError: 'fail' };
