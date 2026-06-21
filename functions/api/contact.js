export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, whatsapp, mensaje } = await request.json();

    if (!email || !mensaje) {
      return json({ error: 'Faltan campos requeridos' }, 400);
    }

    await env.DB.prepare(
      'INSERT INTO mensajes (email, whatsapp, mensaje) VALUES (?, ?, ?)'
    ).bind(email.trim(), whatsapp?.trim() || null, mensaje.trim()).run();

    return json({ ok: true });

  } catch (err) {
    console.error('contact error:', err);
    return json({ error: 'Error interno' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
