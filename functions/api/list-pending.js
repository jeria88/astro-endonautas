const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

export async function onRequestGet({ env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  // List files in pending/
  const listRes = await fetch(
    `${GITHUB_API}/repos/${GITHUB_REPO}/contents/pending`,
    { headers: { Authorization: `Bearer ${token}`, "User-Agent": "endonautas-review" } }
  );
  if (!listRes.ok) return Response.json({ error: "No se pudo leer pending/" }, { status: 502 });

  const files = await listRes.json();
  const jsonFiles = files.filter(f => f.name.endsWith(".json"));

  // Fetch each file and filter by status
  const pending = [];
  for (const file of jsonFiles) {
    const res = await fetch(file.download_url);
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === "copy_pending_review" && data.copy_variants?.length) {
      pending.push({ slug: data.slug, article_path: data.article_path, copy_variants: data.copy_variants });
    }
  }

  return Response.json({ pending }, {
    headers: { "Cache-Control": "no-store" }
  });
}
