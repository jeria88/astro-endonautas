export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, whatsapp, mensaje } = await request.json();

    if (!email || !mensaje) {
      return json({ error: 'Faltan campos requeridos' }, 400);
    }

    const wa = whatsapp ? `<p><strong>WhatsApp:</strong> ${esc(whatsapp)}</p>` : '';
    const html = `
      <p><strong>Email:</strong> ${esc(email)}</p>
      ${wa}
      <p><strong>Mensaje:</strong></p>
      <p style="white-space:pre-line">${esc(mensaje)}</p>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Endonautas <noreply@endonautas.cl>',
        to: ['hola@endonautas.cl'],
        reply_to: email,
        subject: `Mensaje de ${email}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return json({ error: 'No se pudo enviar el mensaje' }, 500);
    }

    return json({ ok: true });

  } catch (err) {
    console.error('contact fn error:', err);
    return json({ error: 'Error interno' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
