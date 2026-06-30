export async function onRequest({ request, next, env }) {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith('/review-social') && !pathname.startsWith('/api/')) {
    return next();
  }

  const auth = request.headers.get('Authorization') || '';
  const [scheme, encoded] = auth.split(' ');
  let ok = false;

  if (scheme === 'Basic' && encoded) {
    try {
      const decoded = atob(encoded);
      const sep  = decoded.indexOf(':');
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      ok = user === env.REVIEW_USERNAME && pass === env.REVIEW_PASSWORD;
    } catch (_) {}
  }

  if (!ok) {
    return new Response('Acceso restringido', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Endonautas", charset="UTF-8"' },
    });
  }

  return next();
}
