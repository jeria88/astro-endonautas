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

  const copy_pending = [];   // avatar_variants → Franco elige qué generar
  const ready_review = [];   // r2_urls → Franco aprueba el output visual

  for (const file of jsonFiles) {
    const res = await fetch(file.download_url);
    if (!res.ok) continue;
    const data = await res.json();

    if (data.status === "copy_pending_review" && data.avatar_variants) {
      copy_pending.push({
        slug: data.slug,
        title: data.title,
        article_path: data.article_path,
        avatar_variants: data.avatar_variants,
      });
    } else if (data.status === "ready_for_review" && data.r2_urls?.length) {
      ready_review.push({
        slug: data.slug,
        title: data.title,
        r2_urls: data.r2_urls,
        approved: data.approved || [],
      });
    }
  }

  return Response.json({ copy_pending, ready_review }, {
    headers: { "Cache-Control": "no-store" }
  });
}
