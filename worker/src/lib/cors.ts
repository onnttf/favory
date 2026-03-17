export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export function handleCors(request: Request, allowedOrigin: string): Response | null {
  const origin = request.headers.get("Origin") ?? ""
  const allowed = origin === allowedOrigin || allowedOrigin === "*"

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(allowed ? origin : allowedOrigin),
    })
  }

  return null
}
