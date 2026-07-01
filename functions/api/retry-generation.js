const API_URL = "https://api.endonautas.cl";

export async function onRequestPost({ request, env }) {
  const apiKey = env.CONTENT_STUDIO_API_KEY;
  if (!apiKey) return Response.json({ error: "CONTENT_STUDIO_API_KEY no configurado" }, { status: 500 });

  let slug;
  try {
    const body = await request.json();
    slug = body.slug;
    if (!slug) throw new Error("falta slug");
  } catch {
    return Response.json({ error: "Body inválido — se espera { slug }" }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/api/articles/${encodeURIComponent(slug)}/retry`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) return Response.json({ error: await res.text() }, { status: res.status });
  return Response.json(await res.json());
}
