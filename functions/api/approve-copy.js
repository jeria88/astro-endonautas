const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

export async function onRequestPost({ request, env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  let slug, approved_selections;
  try {
    const body = await request.json();
    slug = body.slug;
    // approved_selections supports two schemas:
    //   legacy: [{avatar, variant_index, carousel, reel, director}]
    //   scored: [{finalist_id, carousel, reel, director, edited_captions}]
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
  const storedCaptions = current.captions || {};

  const approved = [];
  for (const sel of approved_selections) {
    // Resolve avatar + variant_index from finalist_id ("negocio_v0") or explicit fields
    let { avatar, variant_index, finalist_id, carousel, reel, director, edited_captions } = sel;
    if (!avatar && finalist_id) {
      const m = finalist_id.match(/^(.+)_v(\d+)$/);
      if (m) { avatar = m[1]; variant_index = parseInt(m[2], 10); }
    }
    const variant = avatarVariants[avatar]?.[variant_index];
    if (!variant) return Response.json({ error: `${avatar}[${variant_index}] no existe` }, { status: 400 });

    // Captions: prefer edited_captions from UI, fall back to stored captions for this finalist
    const resolvedFinalistId = finalist_id || `${avatar}_v${variant_index}`;
    const finalCaptions = edited_captions || storedCaptions[resolvedFinalistId] || null;

    approved.push({
      finalist_id:   resolvedFinalistId,
      avatar,
      variant_index,
      director:      director || null,
      carousel:      carousel !== false,
      reel:          reel === true,
      carousel_copy: variant.carousel,
      reel_copy:     variant.reel,
      captions:      finalCaptions,
    });
  }

  current.approved     = approved;
  current.status       = "copy_approved";
  current.last_updated = new Date().toISOString();
  delete current.last_error;

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
