const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

export async function onRequestGet({ env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  const listRes = await fetch(
    `${GITHUB_API}/repos/${GITHUB_REPO}/contents/pending`,
    { headers: { Authorization: `Bearer ${token}`, "User-Agent": "endonautas-review" } }
  );
  if (!listRes.ok) return Response.json({ error: "No se pudo leer pending/" }, { status: 502 });

  const files = await listRes.json();
  const jsonFiles = files.filter(f => f.name.endsWith(".json"));

  const scored       = [];   // IA-filtered finalists → Franco reviews top picks
  const copy_pending = [];   // avatar_variants → Franco elige qué generar (legacy)
  const ready_review = [];   // r2_urls → Franco aprueba el output visual
  const errors       = [];   // generation_error → Franco reintenta

  for (const file of jsonFiles) {
    const res = await fetch(file.download_url);
    if (!res.ok) continue;
    const data = await res.json();

    if (data.status === "scored" && data.finalists?.length) {
      scored.push({
        slug:           data.slug,
        title:          data.title,
        article_path:   data.article_path,
        finalists:      data.finalists,
        viral_scores:   data.viral_scores   || {},
        avatar_variants: data.avatar_variants || {},
        captions:       data.captions       || {},
      });
    } else if (data.status === "copy_pending_review" && data.avatar_variants) {
      copy_pending.push({
        slug: data.slug,
        title: data.title,
        article_path: data.article_path,
        avatar_variants: data.avatar_variants,
      });
    } else if (data.status === "ready_to_publish" && data.r2_urls?.length) {
      ready_review.push({
        slug:     data.slug,
        title:    data.title,
        r2_urls:  data.r2_urls,
        approved: data.approved || [],
        captions: data.captions || {},
      });
    } else if (data.status === "generation_error") {
      errors.push({
        slug:         data.slug,
        title:        data.title,
        last_error:   data.last_error || "Error desconocido",
        last_updated: data.last_updated || null,
      });
    }
  }

  return Response.json({ scored, copy_pending, ready_review, errors }, {
    headers: { "Cache-Control": "no-store" }
  });
}
