const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

export async function onRequestPost({ request, env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  let slug, scheduled_at, reel_formats;
  try {
    const body = await request.json();
    slug = body.slug;
    scheduled_at = body.scheduled_at || null;
    reel_formats = body.reel_formats || null; // {"0":"reel","1":"story"}
    if (!slug) throw new Error("falta slug");
  } catch {
    return Response.json({ error: "Body inválido — se espera { slug }" }, { status: 400 });
  }

  const path = `pending/${slug}.json`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "endonautas-review",
    "Content-Type": "application/json",
  };

  const getRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`, { headers });
  if (!getRes.ok) return Response.json({ error: `No se encontró pending/${slug}.json` }, { status: 404 });
  const fileData = await getRes.json();

  const current = JSON.parse(atob(fileData.content.replace(/\n/g, "")));
  if (current.status !== "ready_for_review") {
    return Response.json({ error: `Status actual es '${current.status}', se espera 'ready_for_review'` }, { status: 409 });
  }

  current.status       = "approved";
  current.last_updated = new Date().toISOString();
  if (scheduled_at) current.scheduled_at = scheduled_at;
  if (reel_formats) current.reel_formats = reel_formats;
  delete current.last_error;

  const updated = btoa(unescape(encodeURIComponent(JSON.stringify(current, null, 2))));
  const putRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `content(social): visual approved — ${slug}`,
      content: updated,
      sha: fileData.sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    return Response.json({ error: `GitHub PUT falló: ${err}` }, { status: 502 });
  }

  return Response.json({ ok: true, slug, status: "approved", scheduled_at, reel_formats });
}
