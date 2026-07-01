const API_URL = "https://api.endonautas.cl";

export async function onRequestGet({ env }) {
  const apiKey = env.CONTENT_STUDIO_API_KEY;
  if (!apiKey) return Response.json({ error: "CONTENT_STUDIO_API_KEY no configurado" }, { status: 500 });

  const res = await fetch(`${API_URL}/api/review`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return Response.json({ error: await res.text() }, { status: res.status });
  return Response.json(await res.json(), { headers: { "Cache-Control": "no-store" } });
}
