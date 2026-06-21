export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) {
    return new Response('401 — Acceso no autorizado', { status: 401 });
  }

  // marcar leído/nuevo via ?mark=ID&leido=0|1
  const markId   = url.searchParams.get('mark');
  const leidoVal = url.searchParams.get('leido');
  if (markId && leidoVal !== null) {
    await env.DB.prepare('UPDATE mensajes SET leido=? WHERE id=?')
      .bind(Number(leidoVal), Number(markId)).run();
    return Response.redirect(`${url.origin}/admin/mensajes?key=${env.ADMIN_KEY}`, 302);
  }

  const { results } = await env.DB.prepare(
    'SELECT * FROM mensajes ORDER BY created_at DESC'
  ).all();

  const rows = results.map(r => `
    <tr class="${r.leido ? 'leido' : 'nuevo'}">
      <td class="td-fecha">${new Date(r.created_at).toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</td>
      <td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td>
      <td>${r.whatsapp
        ? `<a href="https://wa.me/${r.whatsapp.replace(/\D/g,'')}">${esc(r.whatsapp)}</a>`
        : '<span class="dim">—</span>'}</td>
      <td class="td-msg">${esc(r.mensaje).replace(/\n/g, '<br>')}</td>
      <td><a class="mark-btn" href="/admin/mensajes?key=${env.ADMIN_KEY}&mark=${r.id}&leido=${r.leido ? 0 : 1}">${r.leido ? 'Nuevo' : 'Leído'}</a></td>
    </tr>`).join('');

  const total  = results.length;
  const nuevos = results.filter(r => !r.leido).length;

  return new Response(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Buzón · Endonautas</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #030306; color: rgba(255,255,255,.85); font-family: system-ui, sans-serif; font-size: .92rem; padding: 3rem 5%; }
  h1 { font-size: 1.4rem; font-weight: 600; color: #fff; margin-bottom: .4rem; }
  .meta { color: rgba(255,255,255,.4); font-size: .8rem; margin-bottom: 2rem; }
  .badge { display: inline-block; background: rgba(126,204,205,.15); color: #7ECCCD; border: 1px solid rgba(126,204,205,.3); border-radius: 20px; padding: .15rem .6rem; font-size: .72rem; font-weight: 700; margin-left: .6rem; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.3); padding: .6rem .8rem; border-bottom: 1px solid rgba(255,255,255,.07); }
  td { padding: .9rem .8rem; border-bottom: 1px solid rgba(255,255,255,.05); vertical-align: top; line-height: 1.6; }
  tr.nuevo td:first-child { border-left: 2px solid #7ECCCD; }
  tr.leido { opacity: .45; }
  .td-fecha { white-space: nowrap; color: rgba(255,255,255,.38); font-size: .78rem; min-width: 140px; }
  .td-msg { max-width: 500px; color: rgba(255,255,255,.75); }
  a { color: #7ECCCD; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .dim { color: rgba(255,255,255,.2); }
  .mark-btn { font-size: .75rem; color: rgba(255,255,255,.3); white-space: nowrap; }
  .mark-btn:hover { color: #fff; text-decoration: none; }
  .empty { text-align: center; padding: 5rem; color: rgba(255,255,255,.2); }
</style>
</head>
<body>
<h1>Buzón Endonautas${nuevos > 0 ? `<span class="badge">${nuevos} nuevo${nuevos > 1 ? 's' : ''}</span>` : ''}</h1>
<p class="meta">${total} mensaje${total !== 1 ? 's' : ''} en total</p>
${results.length === 0
  ? '<p class="empty">No hay mensajes todavía.</p>'
  : `<table>
  <thead><tr>
    <th>Fecha</th><th>Email</th><th>WhatsApp</th><th>Mensaje</th><th></th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`}
</body>
</html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
