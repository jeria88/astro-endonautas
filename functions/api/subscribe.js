const LISTMONK_URL = "https://mail.endonautas.cl/api/public/subscription";
const LIST_UUID    = "431ebe70-b897-416b-9016-daea6acc030c";

export async function onRequestPost({ request }) {
  let email = "";
  try {
    const body = await request.json();
    email = (body.email || "").trim().toLowerCase();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  try {
    await fetch(LISTMONK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: "", list_uuids: [LIST_UUID] }),
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Error al procesar" }, { status: 500 });
  }
}
