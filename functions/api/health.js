const GITHUB_REPO = "jeria88/astro-endonautas";
const GITHUB_API  = "https://api.github.com";

const STUCK_HOURS = {
  pending:             2,
  copy_pending_review: 48,
  copy_approved:       3,
  ready_for_review:    72,
  copy_error:          1,
  generation_error:    1,
};

function ageHours(ts) {
  if (!ts) return null;
  return (Date.now() - new Date(ts).getTime()) / 3_600_000;
}

export async function onRequestGet({ env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });

  const listRes = await fetch(
    `${GITHUB_API}/repos/${GITHUB_REPO}/contents/pending`,
    { headers: { Authorization: `Bearer ${token}`, "User-Agent": "endonautas-health" } }
  );
  if (!listRes.ok) return Response.json({ error: "No se pudo leer pending/" }, { status: 502 });

  const files = await listRes.json();
  const jsonFiles = files.filter(f => f.name.endsWith(".json"));

  const by_status = {};
  const stuck = [];
  const errors = [];

  for (const file of jsonFiles) {
    const res = await fetch(file.download_url);
    if (!res.ok) continue;
    const data = await res.json();

    const { slug, status, last_updated, last_error } = data;
    const hours = ageHours(last_updated);
    const threshold = STUCK_HOURS[status];
    const isStuck = threshold && hours !== null && hours > threshold;
    const hasError = last_error || status === "copy_error" || status === "generation_error";

    const entry = { slug, status, last_updated, age_hours: hours ? Math.round(hours * 10) / 10 : null, last_error: last_error || null };

    if (!by_status[status]) by_status[status] = [];
    by_status[status].push(entry);

    if (isStuck) stuck.push(entry);
    if (hasError) errors.push(entry);
  }

  const healthy = stuck.length === 0 && errors.length === 0;
  return Response.json(
    { healthy, total: jsonFiles.length, by_status, stuck, errors },
    { headers: { "Cache-Control": "no-store" } }
  );
}
