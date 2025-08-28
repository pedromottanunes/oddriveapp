export async function api(path: string, token?: string, body?: any) {
  const isGet = !body;
  const res = await fetch(`/api/${path}`, {
    method: isGet ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(isGet ? {} : { body: JSON.stringify(body) })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}