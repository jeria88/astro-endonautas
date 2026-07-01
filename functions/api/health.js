const API_URL = "https://api.endonautas.cl";

export async function onRequestGet({ env }) {
  const apiKey = env.CONTENT_STUDIO_API_KEY;
  if (!apiKey) return Response.json({ error: "CONTENT_STUDIO_API_KEY no configurado" }, { status: 500 });

  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) return Response.json({ healthy: false, error: await res.text() }, { status: res.status });
  const data = await res.json();

  // Also fetch review data to compute summary stats
  const reviewRes = await fetch(`${API_URL}/api/review`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!reviewRes.ok) return Response.json({ ...data, healthy: true });

  const review = await reviewRes.json();
  const total = (review.scored?.length ?? 0) + (review.ready_review?.length ?? 0) + (review.errors?.length ?? 0);
  const by_status = {
    scored: review.scored?.length ?? 0,
    ready_to_publish: review.ready_review?.length ?? 0,
    generation_error: review.errors?.length ?? 0,
  };

  return Response.json({
    healthy: (review.errors?.length ?? 0) === 0,
    total,
    by_status,
    stuck: review.errors ?? [],
    errors: review.errors ?? [],
  }, { headers: { "Cache-Control": "no-store" } });
}
