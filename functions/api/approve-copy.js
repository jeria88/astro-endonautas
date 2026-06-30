const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

export async function onRequestPost({ request, env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  let slug, approved_selections;
  try {
    const body = await request.json();
    slug = body.slug;
    // approved_selections: [{avatar, variant_index, carousel: bool, reel: bool, director: string}, ...]
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
  const avatarVariants = current.avatar_variants || {};

  const approved = [];
  for (const { avatar, variant_index, carousel, reel, director } of approved_selections) {
    const variant = avatarVariants[avatar]?.[variant_index];
    if (!variant) return Response.json({ error: `${avatar}[${variant_index}] no existe` }, { status: 400 });
    approved.push({
      avatar,
      variant_index,
      director: director || null,
      carousel: carousel !== false,   // default true
      reel:     reel    === true,      // default false — must be explicit
      carousel_copy: variant.carousel,
      reel_copy:     variant.reel,
      social_copy:   variant.social || null,
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
