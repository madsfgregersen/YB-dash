import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore({ name: "yb-scores", consistency: "strong" });

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const data = {};
    await Promise.all(
      blobs.map(async ({ key }) => {
        const val = await store.get(key, { type: "json" });
        if (val !== null) data[key] = val;
      })
    );
    return Response.json(data);
  }

  if (req.method === "POST") {
    const { key, score, notes } = await req.json();
    await store.setJSON(key, { s: score, n: notes });
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/scores"
};
