export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  })
}

export function notFound(extraHeaders: Record<string, string> = {}): Response {
  return json({ error: "Not found" }, 404, extraHeaders)
}

export function badRequest(error: unknown, extraHeaders: Record<string, string> = {}): Response {
  return json({ error }, 400, extraHeaders)
}
