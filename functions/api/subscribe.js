const LISTMONK_URL = "https://mail.146.181.39.4.sslip.io/api/public/subscription";

const LIST_UUIDS = {
  lanzamiento:  "431ebe70-b897-416b-9016-daea6acc030c",
  practicante:  "574f7450-0663-4848-95e5-8ebe4765a33a",
  "taller1-terapeutas": "af786bb5-cada-49a8-92fb-cb4ca441f689",
};

export async function onRequestPost({ request }) {
  let email = "";
  let list = "lanzamiento";
  try {
    const body = await request.json();
    email = (body.email || "").trim().toLowerCase();
    if (body.list && LIST_UUIDS[body.list]) list = body.list;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(LISTMONK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: "", list_uuids: [LIST_UUIDS[list]] }),
    });
    if (!res.ok) {
      return Response.json({ error: "Error al procesar" }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Error al procesar" }, { status: 500 });
  }
}
