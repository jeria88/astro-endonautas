const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

export async function onRequestPost({ request, env }) {
  const webhookUrl = env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return Response.json({ error: "N8N_WEBHOOK_URL no configurado" }, { status: 500 });

  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  let slug, network;
  try {
    const body = await request.json();
    slug    = body.slug;
    network = body.network; // "instagram" | "facebook"
    if (!slug || !network) throw new Error("faltan campos");
  } catch {
    return Response.json({ error: "Body inválido — se espera { slug, network }" }, { status: 400 });
  }

  const path = `pending/${slug}.json`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "endonautas-review",
    "Content-Type": "application/json",
  };

  const getRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`, { headers });
  if (!getRes.ok) return Response.json({ error: `pending/${slug}.json no encontrado` }, { status: 404 });
  const fileData = await getRes.json();
  const raw = atob(fileData.content.replace(/\n/g, ""));
  const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(raw, c => c.charCodeAt(0))));

  const approved  = data.approved?.[0] || {};
  const caps      = approved.captions || data.captions || {};
  // Facebook usa el caption de Instagram como fallback (mismo texto suele funcionar)
  const caption   = caps[network] || caps.instagram || "";
  const r2_urls   = data.r2_urls || [];

  const n8nRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      network,
      caption,
      r2_urls,
      title:    data.title || slug,
      keywords: approved.carousel_copy?.keywords || [],
    }),
  });

  if (!n8nRes.ok) {
    const errText = await n8nRes.text().catch(() => n8nRes.status);
    return Response.json({ error: `N8N error: ${errText}` }, { status: 502 });
  }

  return Response.json({ ok: true, slug, network });
}
