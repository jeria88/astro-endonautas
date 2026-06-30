const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

export async function onRequestPost({ request, env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  let slug;
  try {
    ({ slug } = await request.json());
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

  return Response.json({ ok: true, slug, status: "approved" });
}
