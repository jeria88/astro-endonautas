const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

export async function onRequestPost({ request, env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  let slug, approved_selections;
  try {
    const body = await request.json();
    slug = body.slug;
    // approved_selections: [{director, variant_index, carousel: bool, reel: bool}, ...]
    approved_selections = body.approved_selections;
    if (!slug || !Array.isArray(approved_selections) || !approved_selections.length) {
      throw new Error("faltan campos");
    }
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
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
  const dirVariants = current.director_variants || {};

  const approved = [];
  for (const { director, variant_index, carousel, reel } of approved_selections) {
    const variant = dirVariants[director]?.[variant_index];
    if (!variant) return Response.json({ error: `${director}[${variant_index}] no existe` }, { status: 400 });
    approved.push({
      director,
      variant_index,
      carousel: carousel !== false,   // default true
      reel:     reel    === true,      // default false — must be explicit
      carousel_copy: variant.carousel,
      reel_copy:     variant.reel,
    });
  }

  current.approved = approved;
  current.status   = "copy_approved";

  const updated = btoa(unescape(encodeURIComponent(JSON.stringify(current, null, 2))));
  const putRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `content(social): ${approved.length} variant(s) approved — ${slug}`,
      content: updated,
      sha: fileData.sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    return Response.json({ error: `GitHub PUT falló: ${err}` }, { status: 502 });
  }

  return Response.json({ ok: true, slug, approved: approved.length });
}
